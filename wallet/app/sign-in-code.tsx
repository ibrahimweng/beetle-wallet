/* Six digits, on the way back in. */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { washes } from '../src/design';
import { CodeStep } from './(onboarding)/code';
import { useApp } from '../src/features/onboarding/store';
import { auth } from '../src/services';
import { groupPhone } from '../src/lib/format';

export default function SignInCode() {
  const router = useRouter();
  const app = useApp();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  if (!phone) return null;
  return (
    <CodeStep
      phone={phone}
      icon="mark"
      title="Six digits"
      sub={`Sent to ${groupPhone(phone)} a moment ago. On a phone I already know, your passcode alone would have been enough.`}
      wash={washes.signcode}
      onBack={() => router.back()}
      onVerified={async token => {
        const s = await auth.signIn(phone, token);
        if (!s) {
          router.replace('/sign-in');
          return;
        }
        await app.signIn(s);
        router.replace('/home');
      }}
    />
  );
}
