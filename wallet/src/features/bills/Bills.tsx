/* Bills, from its frame: everything that repeats each month — Beetle's
   word on what the month comes to and how much of it is spoken for, five
   marks for the five bills with how many are covered, and the month's rows:
   the light due Thursday that a standing instruction pays, the television
   and the internet with nothing behind them yet, the waste and Mum's data
   already paid. A row opens the page that pays it; Add a bill sits beside
   Back at the foot. Reached from the Bills shortcut under the open chat,
   and from Services. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Caption, Icon, Meta, PageHead, Row, Say, Screen, Tap, colour, toast, useDeparture } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { usePrefs } from '../settings/prefs';
import { naira } from '../../lib/format';
import { DEMO_MONTH, monthOf, type MonthBill } from './billers';

const WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];

export function Bills() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs } = usePrefs(account?.accountNumber);
  useFoot({
    kind: 'button',
    label: 'Add a bill',
    tone: 'grey',
    leading: 'plus',
    size: 48,
    onPress: () => toast('Adding a bill is not drawn yet. Point the camera at one and I pay it from What I found.'),
  });
  if (!ok || !account) return null;
  /* the light is covered while its standing instruction is on */
  const bills: MonthBill[] = account.demo ? DEMO_MONTH.map(b => (b.biller === 'ikeja' ? { ...b, covered: prefs.rules.ikeja ? 'rule' : 'none' } : b)) : [];
  const m = monthOf(bills);
  return (
    <Screen head={<PageHead lead title="Bills" sub="Everything that repeats each month" />}>
      <View style={s.card} testID="month">
        <Say testID="month-say">
          {bills.length
            ? `${naira(m.total)} of bills this month. ${WORDS[m.covered]?.replace(/^./, c => c.toUpperCase())} of the ${WORDS[m.count]} are covered.`
            : 'Nothing repeats yet. The first bill you pay, I keep here.'}
        </Say>
        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 4 }} testID="marks">
            {bills.map(b => (
              <View key={b.id} style={[s.mark, b.covered !== 'none' ? { backgroundColor: colour.accent } : null]} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Caption tone="accent" style={{ fontWeight: '600' }}>{`${m.covered} of ${m.count} covered`}</Caption>
            <Caption tone="secondary">{m.open ? `${m.open} still to sort` : 'All sorted'}</Caption>
          </View>
        </View>
      </View>
      <View style={{ marginTop: -8 }} testID="month-list">
        <Body tone="secondary">This month</Body>
        <View style={{ marginTop: 18 }} testID="bills">
          {bills.map(b => (
            <BillRow key={b.id} bill={b} onPress={() => router.push(b.to as never)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

/* A bill's row, 70 tall: its glyph on a grey square, the name over when it
   is due and what stands behind it, the figure at the end; a paid one greyed. */
function BillRow({ bill, onPress }: { bill: MonthBill; onPress: () => void }) {
  const j = useDeparture({ id: `bill:${bill.id}`, to: bill.to, words: bill.name });
  const paid = bill.covered === 'paid';
  const tone = paid ? colour.textTertiary : colour.ink;
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={bill.name} onPress={j.onPress} style={[s.row]} testID="bill">
      {j.wash}
      <View style={s.box}>
        <Icon name={bill.glyph as IconName} size={20} colour={tone} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row style={{ color: tone }}>{bill.name}</Row>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Meta tone="secondary">{bill.when}</Meta>
          {bill.covered === 'rule' ? (
            <Caption tone="accent" style={{ fontWeight: '600' }}>
              · I pay it
            </Caption>
          ) : bill.covered === 'none' ? (
            <Caption tone="bad" style={{ fontWeight: '600' }}>
              · Not covered
            </Caption>
          ) : null}
        </View>
      </View>
      <Row style={{ color: tone }}>{naira(bill.amount)}</Row>
    </Tap>
  );
}

const s = StyleSheet.create({
  /* the frame's 16 around includes its hairline; 14 under the caption row makes the 153 */
  card: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 24, paddingTop: 15, paddingHorizontal: 15, paddingBottom: 14 },
  mark: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colour.rule },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 70 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
