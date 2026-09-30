/* Change the amount, from its frame: what was read where something was
   read, the figure as it stands, a keypad with 000 on it, Beetle's word
   that nothing moves until the face and the passcode, and Use it — in the
   foot beside Back, where every page keeps its one button; the frame draws
   it under the bubble. What if it is more than I have? shows Not enough
   where it is, and says so where it is not. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Caption, Display, Keypad, Label, PageHead, Say, Screen, Tap, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { naira } from '../../lib/format';
import { draft } from './hand';

/** ₦99,999,999 at most: eight digits. */
const MOST = 8;

export function Amend() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ amount?: string; read?: string }>();
  const account = app.session?.account;
  const { moves } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + moves.reduce((a, r) => a + r.amount, 0);
  const read = Number(asked.read ?? 0) || 0;
  const [digits, setDigits] = useState(() => String(Number(asked.amount ?? 0) || '').replace(/^0$/, ''));
  const amount = Number(digits || 0);
  const key = (k: string) => setDigits(d => (k === 'del' ? d.slice(0, -1) : (d + k).replace(/^0+/, '').slice(0, MOST)));
  const use = () => {
    draft.put({ amount, amountNote: 'You typed it' });
    router.back();
  };
  const more = () => {
    if (amount > balance) router.push(`/short?asked=${amount}`);
    else toast(`It is not. Everyday has ${naira(balance)}.`);
  };
  useFoot({ kind: 'button', label: `Use ${naira(amount)}`, disabled: !amount, onPress: use });
  if (!ok) return null;
  return (
    <Screen head={<PageHead title="Change the amount" sub="Nothing has been sent" />}>
      {/* the frame: what was read 8 under its word, the figure 6 under that, the keypad 17 under the figure */}
      <View style={{ alignItems: 'center', gap: 8, marginTop: -2 }} testID="amount">
        <Caption tone="secondary">{read ? 'I read' : 'The amount'}</Caption>
        {read ? <Body tone="secondary">{naira(read)}</Body> : null}
        <Display tone={amount ? 'ink' : 'tertiary'} style={{ marginTop: -2 }} accessibilityLiveRegion="polite">
          {naira(amount)}
        </Display>
      </View>
      <View style={{ marginTop: -3 }}>
        <Keypad zeros onKey={key} />
      </View>
      <View style={{ marginTop: -8 }}>
        <Say testID="say">Change it as many times as you like. It moves after your face and your passcode, not before.</Say>
      </View>
      <Tap
        accessibilityRole="button"
        accessibilityLabel="What if it is more than I have?"
        onPress={more}
        style={{ alignSelf: 'center', height: 28, justifyContent: 'center', marginTop: -10 }}
        hitSlop={10}
      >
        <Label tone="accent">What if it is more than I have?</Label>
      </Tap>
    </Screen>
  );
}
