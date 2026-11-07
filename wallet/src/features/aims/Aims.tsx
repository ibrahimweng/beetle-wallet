/* What Beetle is for, changed in Settings (Round 41): the same list as on the
   way in, kept the moment a row is ticked. */
import React from 'react';
import { View } from 'react-native';
import { PageHead, Screen } from '../../design';
import { useFoot } from '../more/Foot';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { usePrefs } from '../settings/prefs';
import { AimPicker } from './AimPicker';
import { AIMS } from './aims';

/** The Settings row's value: the first aim picked, and how many more. */
export function aimsSummary(aims: readonly string[]): string {
  const first = AIMS.find(a => aims.includes(a.id));
  if (!first) return 'Not set';
  return aims.length > 1 ? `${first.label} +${aims.length - 1}` : first.label;
}

export function Aims() {
  const app = useApp();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  useFoot({ kind: 'back' });
  if (!ok || !account || !ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  return (
    <Screen head={<PageHead lead title="What Beetle is for" sub="Pick any. Beetle tailors its help to you." />}>
      <AimPicker picked={prefs.aims} onChange={aims => set({ aims })} />
    </Screen>
  );
}
