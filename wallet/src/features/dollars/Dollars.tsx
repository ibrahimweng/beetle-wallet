/* Dollars, from its frame: what is held and what it is worth today, Convert
   and Send, the rate and how it moved, Beetle's word on holding them,
   where each dollar came from, the note on whose hands they are in, and
   the line that nothing is locked. The dollars chip on the card opens it,
   as does Dollars on All services and "what about dollars" typed at home. */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Display, Head, Icon, Label, Meta, NoteCard, PageHead, Row, Say, Screen, Tap, colour, toast } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { useSetup } from '../setup';
import { SetupOffer } from '../setup/Offer';
import { naira } from '../../lib/format';
import { TEST_MONEY, hasTestMoney } from '../home/account';
import { DEMO_SOURCES, RATE_MOVE, dollarsOf, heldLine, nairaOf, sourcesOf, usdFull, type DollarSource } from './dollars';

export function Dollars() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves } = useMoves(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  const sources: DollarSource[] = useMemo(
    () => [
      ...sourcesOf(moves, rate),
      ...(account?.demo
        ? DEMO_SOURCES
        : account && hasTestMoney(account)
          ? [{ id: 'test', glyph: 'gift' as const, title: 'Test dollars from Beetle', sub: 'When the account was opened', usd: TEST_MONEY.usd }]
          : []),
    ],
    [moves, rate, account],
  );
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  return (
    <Screen head={<PageHead lead title="Dollars" sub="Steady when the naira is not, and yours to turn back" />}>
      {/* holding dollars is one of the things finishing setting up turns on */}
      {setup.done ? null : <SetupOffer sub="Two minutes, and you can hold dollars" />}
      <View style={s.card} testID="dollars-card">
        <View>
          <Display>{usdFull(dollars)}</Display>
          <Body tone="secondary" style={{ marginTop: 8 }}>{`${naira(nairaOf(dollars, rate))} at today’s rate`}</Body>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, height: 50, alignItems: 'flex-start' }}>
          <Button
            label="Convert"
            size={48}
            to={setup.done ? '/convert' : undefined}
            onPress={setup.done ? undefined : () => toast('Finish setting up first, and you can hold dollars. It takes two minutes.')}
            style={{ flex: 1 }}
          />
          <Button
            label="Send"
            size={48}
            tone="white"
            to={dollars > 0 ? '/send?from=dollars' : undefined}
            onPress={dollars > 0 ? undefined : () => toast('Nothing to send from yet. Convert some naira first.')}
            style={[{ flex: 1 }, s.outlined]}
          />
        </View>
      </View>
      {/* the frame's rate line: a chart glyph, the rate, and how it moved this week */}
      <Tap
        accessibilityRole="button"
        accessibilityLabel="The rate"
        onPress={() => toast('Beetle keeps no history of the rate yet. This build runs at one rate all day.')}
        style={s.rate}
        testID="rate-row"
      >
        <Icon name="chart" size={16} colour={colour.textSecondary} />
        <Meta tone="secondary" style={{ flex: 1 }}>{`₦${rate.toLocaleString('en-NG')} to the dollar today`}</Meta>
        <Label tone="good">{`Up ₦${RATE_MOVE}`}</Label>
      </Tap>
      <Say testID="line">{heldLine(dollars, rate, !!account.demo)}</Say>
      {sources.length ? (
        <View testID="sources-block">
          <Head>Where they came from</Head>
          <View style={{ marginTop: 12 }} testID="sources">
            {sources.map(src => (
              <View key={src.id} style={s.row} testID="source">
                <View style={s.box}>
                  <Icon name={src.glyph} size={20} colour={colour.ink} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Row>{src.title}</Row>
                  <Meta tone="secondary">{src.sub}</Meta>
                </View>
                <Row tone="good">{`+${usdFull(src.usd)}`}</Row>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <NoteCard
        height={112}
        title="Nobody here holds a key"
        body="Your dollars sit in a domiciliary account at our partner bank, under CBN rules. Beetle moves them when you say so and cannot move them when you do not."
      />
      <View style={s.lock} testID="lock-line">
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Turn any of it back to naira the same day. There is no notice and no lock.
        </Meta>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 16 },
  outlined: { borderWidth: 1, borderColor: colour.rule },
  /* the frame's rate line: 44 tall, 16 under the card, 16 over the bubble */
  rate: { marginTop: -4, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: -4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 70 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  lock: { marginTop: -4, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
