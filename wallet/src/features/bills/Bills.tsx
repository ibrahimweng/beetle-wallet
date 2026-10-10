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
import { Body, Caption, Icon, Logo, Meta, PageHead, Row, Say, Screen, Tap, colour, font, logoOf, useDeparture } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { usePrefs } from '../settings/prefs';
import { naira } from '../../lib/format';
import { DEMO_MONTH, monthOf, paidBills, type MonthBill } from './billers';
import { useMoves } from '../home/moves';

const WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six'];
/** A count in words, and past six as the figure (the analysis after Round 34: seven bills said "undefined"). */
const inWords = (n: number) => WORDS[n] ?? String(n);

export function Bills() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { prefs } = usePrefs(account?.accountNumber);
  const { moves } = useMoves(account?.accountNumber);
  /* Add a bill: every biller Beetle pays, on All services (Round 33: it only said to point the camera at one) */
  useFoot({
    kind: 'button',
    label: 'Add a bill',
    tone: 'grey',
    leading: 'plus',
    size: 48,
    onPress: () => router.push('/services'),
  });
  if (!ok || !account) return null;
  /* the light is covered while its standing instruction is on; a bill paid on this phone is kept after the frame's */
  const month: MonthBill[] = account.demo ? DEMO_MONTH.map(b => (b.biller === 'ikeja' ? { ...b, covered: prefs.rules.ikeja ? 'rule' : 'none' } : b)) : [];
  const bills = [...month, ...paidBills(moves, month)];
  const m = monthOf(bills);
  return (
    <Screen head={<PageHead lead title="Bills" sub="Everything that repeats each month" />}>
      <View style={s.card} testID="month">
        <Say tone="ink" testID="month-line">
          {bills.length
            ? `${naira(m.total)} of bills this month. ${inWords(m.covered).replace(/^./, c => c.toUpperCase())} of the ${inWords(m.count)} are covered.`
            : 'Nothing repeats yet. The first bill you pay, I keep here.'}
        </Say>
        <View style={{ marginTop: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 4 }} testID="marks">
            {bills.map(b => (
              <View key={b.id} style={[s.mark, b.covered !== 'none' ? { backgroundColor: colour.accent } : null]} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Caption tone="accent" style={{ ...font('600') }}>{`${m.covered} of ${m.count} covered`}</Caption>
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

/* A bill's row, 70 tall: whose bill it is (the company's logo, Round 38; its
   glyph on a grey square where a company has none), the name over when it
   is due and what stands behind it, the figure at the end; a paid one greyed. */
function BillRow({ bill, onPress }: { bill: MonthBill; onPress: () => void }) {
  const j = useDeparture({ id: `bill:${bill.id}`, to: bill.to, words: bill.name });
  const paid = bill.covered === 'paid';
  const tone = paid ? colour.textTertiary : colour.ink;
  /* said whole, as the row draws it: the name, the figure, when, and what stands behind it (the analysis after Round 34: only the name was said) */
  const behind = bill.covered === 'rule' ? 'covered, Beetle pays it' : paid ? 'covered' : 'not covered';
  const logo = logoOf(bill.biller) ?? logoOf(bill.name);
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={`${bill.name}, ${naira(bill.amount)}, ${bill.when}, ${behind}`} onPress={j.onPress} style={[s.row]} testID="bill">
      {j.wash}
      {logo ? (
        <Logo name={logo} size={40} radius={12} faded={paid} />
      ) : (
        <View style={s.box}>
          <Icon name={bill.glyph as IconName} size={20} colour={tone} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Row style={{ color: tone }}>{bill.name}</Row>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Meta tone="secondary">{bill.when}</Meta>
          {bill.covered === 'rule' ? (
            <Caption tone="accent" style={{ ...font('600') }}>
              · I pay it
            </Caption>
          ) : bill.covered === 'none' ? (
            <Caption tone="bad" style={{ ...font('600') }}>
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
