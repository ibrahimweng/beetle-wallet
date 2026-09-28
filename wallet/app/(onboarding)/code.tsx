/* The six digits from the text. They are checked the moment the sixth lands.
   Ones that do not match shake and say how many tries are left; after three
   a fresh code is sent on its own. "I did not get it" sends another, once
   the half minute the first one is given has passed. */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Caption, More, washes } from '../../src/design';
import { DigitStep, type Note } from '../../src/features/onboarding/DigitStep';
import { useApp } from '../../src/features/onboarding/store';
import { useStepGuard } from '../../src/features/onboarding/useGuard';
import { auth, MOCK, MOCK_CODE } from '../../src/services';
import { groupPhone } from '../../src/lib/format';

const TRIES = 3;

export function CodeStep({ phone, onVerified, icon, title, sub, onBack, wash }: { phone: string; onVerified: (token: string) => Promise<void> | void; icon: 'phone-filled' | 'mark'; title: string; sub: string; onBack: () => void; wash: { tone: string; height?: number } }) {
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wait, setWait] = useState(30);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = async (why?: string) => {
    setBusy(true);
    setNote({ text: why ?? 'Sending another…' });
    try {
      const r = await auth.requestCode(phone);
      setWait(r.resendAfterSeconds);
      setWrong(0);
      setDigits('');
      setNote({ text: `Another six digits are on their way to ${groupPhone(phone)}.` });
    } catch {
      setNote({ text: 'It could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      setBusy(false);
    }
  };

  const typed = async (d: string) => {
    setDigits(d);
    if (d.length < 6) {
      setNote(null);
      return;
    }
    setBusy(true);
    setNote({ text: 'Checking…' });
    try {
      const r = await auth.verifyCode(phone, d);
      if (r.ok) {
        setNote({ text: 'That is the one.', tone: 'accent' });
        await onVerified(r.token);
        return;
      }
      setShake(s => s + 1);
      setDigits('');
      if (r.reason === 'expired') setNote({ text: 'Those six have expired. Ask for another.', tone: 'bad' });
      else if (r.reason === 'too-many') await resend('Too many tries. A fresh code is on its way.');
      else {
        const n = wrong + 1;
        setWrong(n);
        if (n >= TRIES) await resend('Three that did not match. A fresh code is on its way.');
        else setNote({ text: `Those six did not match. ${TRIES - n === 1 ? 'One more try' : `${TRIES - n} more tries`} before I send another.`, tone: 'bad' });
      }
    } catch {
      setNote({ text: 'I could not check them. Check the network and try again.', tone: 'bad' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DigitStep
      wash={wash}
      icon={icon}
      title={title}
      sub={sub}
      digits={digits}
      onDigits={typed}
      groups={[6]}
      max={6}
      note={note}
      busy={busy}
      shake={shake}
      onBack={onBack}
      footer={
        <>
          {wait > 0 ? <Caption tone="tertiary">Send it again in {wait}s</Caption> : <More label="I did not get it" onPress={() => resend()} />}
          {MOCK ? <Caption tone="tertiary">This build accepts {MOCK_CODE}. Nothing is texted.</Caption> : null}
        </>
      }
    />
  );
}

export default function Code() {
  const router = useRouter();
  const app = useApp();
  const allowed = useStepGuard('code');
  const phone = app.progress.phone ?? '';
  if (!allowed || !phone) return null;
  return (
    <CodeStep
      phone={phone}
      icon="phone-filled"
      title="Your number"
      sub={`Six digits, sent to ${groupPhone(phone)} a moment ago.`}
      wash={washes.code}
      onBack={() => router.back()}
      onVerified={async () => {
        await app.markVerified();
        router.push('/identity');
      }}
    />
  );
}
