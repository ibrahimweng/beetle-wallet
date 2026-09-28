/* Who you are. Eleven digits from a NIN or a BVN go to the register and a
   name comes back, or nothing does. */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { washes } from '../../src/design';
import { DigitStep, type Note } from '../../src/features/onboarding/DigitStep';
import { NUMBER } from '../../src/features/onboarding/steps';
import { useApp } from '../../src/features/onboarding/store';
import { useStepGuard } from '../../src/features/onboarding/useGuard';
import { identity } from '../../src/services';

export default function Identity() {
  const router = useRouter();
  const app = useApp();
  const allowed = useStepGuard('identity');
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);

  const typed = async (d: string) => {
    setDigits(d);
    setNote(null);
    if (d.length < 11) return;
    setBusy(true);
    setNote({ text: 'Asking the register…' });
    try {
      const r = await identity.lookup(d);
      if (r.found) {
        await app.setIdentity(d, r.record);
        router.push('/confirm');
      } else {
        router.push({ pathname: '/no-match', params: { number: d } });
        setDigits('');
        setNote(null);
      }
    } catch {
      setNote({ text: 'The register did not answer. Try again in a moment.', tone: 'bad' });
    } finally {
      setBusy(false);
    }
  };
  if (!allowed) return null;
  return (
    <DigitStep
      wash={washes.nin}
      trail={[NUMBER]}
      icon="id-filled"
      title="Who you are"
      sub="Eleven digits from your NIN or your BVN, whichever you know. Your name comes back with them."
      digits={digits}
      onDigits={typed}
      groups={[4, 4, 3]}
      max={11}
      note={note}
      busy={busy}
      onBack={() => router.back()}
    />
  );
}
