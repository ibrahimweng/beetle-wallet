/* Spending limits, from its frame: where today stands against the day's
   cap, the three caps, what happens at the line, and the day it takes to
   raise one. The figure is the day's own: what has left today, out of the
   lines and what moved on this phone. */
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Aside, Button, Card, CapRow, Dock, Head, Label, Meta, NoteRow, PageHead, Screen, Usage } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { naira } from '../../lib/format';
import { askHome } from '../more/More';
import { s } from './Lock';

export const CAPS = { transfer: 50000, day: 100000, month: 900000 } as const;

export function Limits() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  if (!ok || !account) return null;
  const dock = <Dock placeholder="Ask me to change a limit" onBack={() => router.back()} onAsk={q => askHome(router, q)} onScan={() => router.push('/scan')} />;
  if (!ready)
    return (
      <Screen dock={dock} still>
        <View />
      </Screen>
    );
  const out = [...moves, ...holdingsFor(account).ledger].filter(r => r.day === 'today' && r.status === 'done' && r.amount < 0 && r.kind !== 'saving').reduce((a, r) => a - r.amount, 0);
  const left = Math.max(0, CAPS.day - out);
  const cap = (what: string) => () => askHome(router, `Change the cap for ${what}`);
  return (
    <Screen dock={dock}>
      <PageHead lead title="Spending limits" sub="What you set, and where today stands" />
      <Card style={{ paddingVertical: 16, paddingHorizontal: 16 }} testID="usage">
        <Usage out={naira(out)} of={naira(CAPS.day)} pct={(out / CAPS.day) * 100} note={`${naira(left)} left before I stop and ask you twice.`} />
      </Card>
      {/* the frame puts 16 under the first card, not the column's 20 */}
      <View style={{ gap: 12, marginTop: -4 }}>
        <Head>Your caps</Head>
        <Card style={s.group} testID="caps">
          <CapRow title="One transfer" sub="The most that can leave in a single go" value={naira(CAPS.transfer)} onPress={cap('one transfer')} />
          <CapRow title="One day" sub="Midnight to midnight" value={naira(CAPS.day)} onPress={cap('one day')} />
          <CapRow title="One month" sub="Resets on the first" value={naira(CAPS.month)} onPress={cap('one month')} />
        </Card>
      </View>
      {/* the frame runs the two lines and the sentence 8 apart, the rest 12 */}
      <Card outline style={{ paddingVertical: 15, paddingHorizontal: 15, gap: 12 }} testID="at-the-line">
        <Label>What happens at the line</Label>
        <View style={{ gap: 8 }}>
          <NoteRow glyph="shield">Your passcode. Not your face, because a face can be held up to a phone.</NoteRow>
          <NoteRow glyph="list">
            Then you type <Label>Confirm this transaction</Label> in full. Three words, spelled out.
          </NoteRow>
          <Meta tone="secondary">Two deliberate things, so a bad minute cannot carry you past a line you drew on a good one.</Meta>
        </View>
        <Button label="Show me what that looks like" tone="grey" size={48} trailing="chevron" onPress={() => router.push('/limitstop')} />
      </Card>
      <View style={{ marginTop: -4 }}>
        <Aside glyph="clock">Raising a cap takes a day to come into force. Lowering one is immediate. That way nobody talks you into a bigger number in the moment.</Aside>
      </View>
    </Screen>
  );
}
