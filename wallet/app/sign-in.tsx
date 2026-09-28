/* Welcome back. Your number, and then six digits from a text. */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { More, washes } from '../src/design';
import { DigitStep, type Note } from '../src/features/onboarding/DigitStep';
import { checkPhone } from '../src/features/onboarding/validation';
import { useApp } from '../src/features/onboarding/store';
import { landing, routeOf } from '../src/features/onboarding/machine';
import { auth } from '../src/services';

export default function SignIn() {
  const router = useRouter();
  const { ready, session, progress } = useApp();
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [unknown, setUnknown] = useState(false);
  useEffect(() => {
    if (ready && session) router.replace(routeOf[landing(progress)]);
  }, [ready, session, progress, router]);

  const typed = async (d: string) => {
    setDigits(d);
    setNote(null);
    setUnknown(false);
    if (d.length < 11) return;
    const check = checkPhone(d);
    if (!check.ok) {
      setNote({ text: 'That is not a Nigerian mobile number.', tone: 'bad' });
      setShake(s => s + 1);
      return;
    }
    setBusy(true);
    setNote({ text: 'Looking for the account…' });
    try {
      if (!(await auth.knownPhone(check.phone))) {
        setNote({ text: 'I do not know this number yet.', tone: 'bad' });
        setUnknown(true);
        return;
      }
      await auth.requestCode(check.phone);
      router.push({ pathname: '/sign-in-code', params: { phone: check.phone } });
    } catch {
      setNote({ text: 'The text could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <DigitStep
      wash={washes.signin}
      icon="mark"
      title="Welcome back"
      sub="Your number, and then six digits from a text. Nothing else, because the account is already yours."
      digits={digits}
      onDigits={typed}
      groups={[4, 3, 4]}
      max={11}
      note={note}
      busy={busy}
      shake={shake}
      onBack={() => router.back()}
      footer={unknown ? <More label="Open an account with it" onPress={() => router.replace('/phone')} /> : undefined}
    />
  );
}
