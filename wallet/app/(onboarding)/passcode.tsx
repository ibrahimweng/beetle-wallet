/* A passcode. Six digits, typed twice. The first pass turns away runs, a
   repeated digit, a repeated pair, the year of birth on the record and the
   handful everybody picks; the second has to match the first. Then the
   account is opened and the session begins. */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Aside, washes } from '../../src/design';
import { DigitStep, type Note } from '../../src/features/onboarding/DigitStep';
import { FACE, NUMBER, WHO } from '../../src/features/onboarding/steps';
import { useApp } from '../../src/features/onboarding/store';
import { useStepGuard } from '../../src/features/onboarding/useGuard';
import { passcodeProblem, PASSCODE_WORDS } from '../../src/features/onboarding/validation';

export default function Passcode() {
  const router = useRouter();
  const app = useApp();
  const allowed = useStepGuard('passcode');
  const [first, setFirst] = useState<string | null>(null);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const birthYear = app.progress.identity?.record.birthYear;

  const typed = async (d: string) => {
    setDigits(d);
    setNote(null);
    if (d.length < 6) return;
    if (first === null) {
      const problem = passcodeProblem(d, { birthYear });
      if (problem) {
        setNote({ text: PASSCODE_WORDS[problem], tone: 'bad' });
        setShake(s => s + 1);
        setDigits('');
        return;
      }
      setFirst(d);
      setDigits('');
      return;
    }
    if (d !== first) {
      setNote({ text: 'They did not match. Start again.', tone: 'bad' });
      setShake(s => s + 1);
      setFirst(null);
      setDigits('');
      return;
    }
    setBusy(true);
    setNote({ text: 'Opening your account…' });
    try {
      /* opening the account starts the session, and the step guard sends
         the session on to the ready screen */
      await app.finish(d);
    } catch {
      setNote({ text: 'The account could not be opened. Check the network and try again.', tone: 'bad' });
      setFirst(null);
      setDigits('');
    } finally {
      setBusy(false);
    }
  };
  if (!allowed) return null;
  const again = first !== null;
  return (
    <DigitStep
      wash={washes.passcode}
      trail={[NUMBER, WHO, FACE]}
      icon="lock-filled"
      title={again ? 'Once more' : 'A passcode'}
      sub={again ? 'The same six, to be sure.' : 'Six digits. These are what send your money, so pick something nobody watching could guess.'}
      digits={digits}
      onDigits={typed}
      groups={[6]}
      max={6}
      note={note}
      busy={busy}
      shake={shake}
      secret
      footer={<Aside>Not your year of birth, and not 123456.</Aside>}
    />
  );
}
