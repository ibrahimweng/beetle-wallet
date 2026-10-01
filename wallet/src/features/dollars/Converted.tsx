/* Converted, from its frame: the tick, what came across and from where, the
   rate you got, the fee and what the dollars come to now, Beetle's offer to
   move some across every payday with Set it up under it, See your dollars,
   and the way to say something is wrong; Back beside the ask bar at the
   foot. It takes Convert's place once the passcode lands, and a line in
   the day opens it again. */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Display, Facts, Head, Icon, Label, Meta, PageHead, Say, Screen, Tap, colour, toast, useDeparture } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor, type LedgerRow } from '../home/account';
import { useMoves } from '../home/moves';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { dollarsOf, rateLine, usdFull } from './dollars';

/** The frame's conversion, for the lab. */
const DEMO: LedgerRow = {
  id: 'demo',
  day: 'today',
  time: '09:41',
  icon: 'swap',
  name: 'Dollars',
  detail: '$100.00 at ₦1,552 to $1 · 09:41',
  amount: -155_200,
  status: 'done',
  kind: 'convert',
  usd: 100,
};

export function Converted({ id }: { id: string }) {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, ready } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const row = moves.find(r => r.id === id) ?? (LAB && id === 'demo' ? DEMO : null);
  const rate = h?.rate ?? 1_552;
  /* the dollars once this one had landed: everything up to and including it */
  const dollarsNow = useMemo(() => {
    if (!row) return 0;
    const at = moves.findIndex(r => r.id === row.id);
    const since = at >= 0 ? moves.slice(0, at) : [];
    return dollarsOf(h?.dollars ?? 0, moves.filter(r => !since.includes(r)).concat(row.id === 'demo' ? [row] : []));
  }, [moves, row, h]);
  const usd = row?.usd ?? 0;
  const intoDollars = usd > 0;
  const setUp = useDeparture({ id: 'converted:rule', to: '/rule?offer=dollars', words: 'Set it up' });
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  if (!ready && !row)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  if (!row)
    return (
      <Screen head={<PageHead title="Converted" sub="Nothing to show" />}>
        <Body tone="secondary">The conversion this page was for is not in this day.</Body>
      </Screen>
    );
  return (
    <Screen head={<PageHead title="Converted" sub={intoDollars ? 'It is in your dollars already' : 'It is in Everyday already'} />}>
      <View style={{ gap: 16 }} testID="status">
        <View style={s.disc} testID="done-disc">
          <Icon name="check" size={24} colour={colour.textInverse} />
        </View>
        <View style={{ gap: 8 }}>
          <Display>{intoDollars ? usdFull(usd) : naira(row.amount)}</Display>
          <Meta tone="secondary">{intoDollars ? `From ${naira(row.amount)} in Everyday` : `From ${usdFull(usd)} in Dollars`}</Meta>
        </View>
      </View>
      <View style={{ marginTop: -4 }}>
        <Facts
          inset={8}
          testID="facts"
          rows={[
            { label: 'Rate you got', value: rateLine(rate) },
            { label: 'Fee', value: row.fee ? naira(row.fee) : 'Free', tone: row.fee ? undefined : colour.goodText },
            { label: 'Dollars now', value: usdFull(dollarsNow) },
          ]}
        />
      </View>
      {/* the frame's offer: Beetle's word on a card, with Set it up under it */}
      <View style={s.offer} testID="offer">
        <Say>Dollars sitting still do nothing. Move ₦20,000 across on payday and you never have to think about it again.</Say>
        {/* the frame boxes the bubble's row 11 shorter than the bubble and sets the button 12 under the box */}
        <View style={{ marginTop: 1 }}>
          <Button label="Set it up" tone="grey" size={48} trailing="chevron" to="/rule?offer=dollars" />
        </View>
      </View>
      <Link label="See your dollars" to="/dollars" testID="see-dollars" />
      <Link label="Something wrong with this?" onPress={() => toast('What went wrong comes with round 7.')} testID="wrong" />
    </Screen>
  );
}

/* A line that leads somewhere, centred, with a small chevron after it. */
function Link({ label, to, onPress, testID }: { label: string; to?: string; onPress?: () => void; testID?: string }) {
  const j = useDeparture({ id: `link:${label}`, to, words: label });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={label} onPress={to ? j.onPress : onPress} style={[s.link]} testID={testID}>
      {j.wash}
      <Label tone="accent">{label}</Label>
      <Icon name="chevron" size={12} colour={colour.accent} />
    </Tap>
  );
}

const s = StyleSheet.create({
  disc: { width: 56, height: 56, borderRadius: 28, backgroundColor: colour.good, alignItems: 'center', justifyContent: 'center' },
  offer: { marginTop: -4, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 24, padding: 16 },
  /* the frame's links: 44 tall, 16 apart, centred */
  link: { marginTop: -4, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
