/* Your number. Eleven digits; the moment they make a Nigerian mobile number a
   code is asked for and the next step opens. Digits that do not make one say
   so under the field instead. */
import React, { useState } from 'react';
import { washes } from '../../src/design';
import { DigitStep, type Note } from '../../src/features/onboarding/DigitStep';
import { checkPhone } from '../../src/features/onboarding/validation';
import { useApp } from '../../src/features/onboarding/store';
import { useStepGuard } from '../../src/features/onboarding/useGuard';
import { useGo } from '../../src/features/onboarding/useGo';
import { auth } from '../../src/services';

export default function Phone() {
  const go = useGo();
  const app = useApp();
  const allowed = useStepGuard('phone');
  const [digits, setDigits] = useState(app.progress.phone ?? '');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const typed = async (d: string) => {
    setDigits(d);
    setNote(null);
    if (d.length < 11) return;
    const check = checkPhone(d);
    if (!check.ok) {
      setNote({
        text: 'That is not a Nigerian mobile number. They start 070, 080, 081, 090 or 091.',
        tone: 'bad',
      });
      setShake(s => s + 1);
      return;
    }
    setBusy(true);
    setNote({ text: 'Sending the six digits…' });
    try {
      await app.setPhone(check.phone);
      await auth.requestCode(check.phone);
      go.push('/code');
    } catch {
      setNote({
        text: 'The text could not be sent. Check the network and try again.',
        tone: 'bad',
      });
    } finally {
      setBusy(false);
    }
  };
  if (!allowed) return null;
  return (
    <DigitStep
      wash={washes.number}
      icon="phone-filled"
      title="Your number"
      sub="I will text you six digits to check the number is yours."
      digits={digits}
      onDigits={typed}
      groups={[4, 3, 4]}
      max={11}
      note={note}
      busy={busy}
      shake={shake}
      leaving={go.leaving}
      onBack={go.back}
    />
  );
}
