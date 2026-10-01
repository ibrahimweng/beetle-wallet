/* Money health, from its frame: the score on a ring with how it moved, Beetle's
   word on what holds it down, the five habits that move it with where each
   stands, the offer to hold ₦5,000 back on payday with Set it up under it,
   and the note that this is not a credit score and never leaves the phone.
   The Money health row on home opens it. This page runs 16 between its
   blocks where most pages run 20. */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Caption, Display, Head, Icon, Label, Meta, NoteCard, PageHead, Progress, Row, Say, Screen, colour } from '../../design';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { usePrefs } from '../settings/prefs';
import { healthLine, healthRows } from './health';

export function Health() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves } = useMoves(account?.accountNumber);
  const { prefs } = usePrefs(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const score = h?.health ?? null;
  const rows = useMemo(() => healthRows(prefs, moves.filter(r => r.kind === 'transfer').length), [prefs, moves]);
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  return (
    <Screen head={<PageHead lead title="Money health" sub="One number for how you are handling it" />}>
      <View style={s.card} testID="score-card">
        <Progress size={180} pct={score ?? 0} testID="score-ring">
          <Display>{score === null ? '—' : String(score)}</Display>
          <Meta tone="secondary" style={{ marginTop: 4 }}>
            out of 100
          </Meta>
        </Progress>
        <View style={s.move} testID="score-move">
          <Icon name="up" size={16} colour={colour.goodText} />
          <Label tone="good">{score === null ? 'Nothing to score yet' : h?.healthMove}</Label>
        </View>
      </View>
      <View style={s.tight}>
        <Say testID="say">{healthLine(score)}</Say>
      </View>
      <View style={{ marginTop: 10 }} testID="moves-block">
        <Head>What moves it</Head>
        <View style={s.grey} testID="moves">
          {rows.map(r => (
            <View key={r.id} style={s.row} testID="habit">
              <View style={s.box}>
                <Icon name={r.glyph} size={20} colour={colour.ink} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Row>{r.title}</Row>
                <Caption tone="secondary" style={r.id === 'watch' ? { maxWidth: 170 } : null}>
                  {r.sub}
                </Caption>
              </View>
              <Meta style={{ color: r.tone === 'warn' ? colour.warn : colour.textSecondary }}>{r.value}</Meta>
            </View>
          ))}
        </View>
      </View>
      {score !== null ? (
        <View style={s.offer} testID="offer">
          <Say>Holding ₦5,000 back on payday would take this to 76 by October. Want me to set it up?</Say>
          <View style={{ marginTop: 2 }}>
            <Button label="Set it up" tone="grey" size={48} trailing="chevron" to="/rule?offer=budget" />
          </View>
        </View>
      ) : null}
      <View style={s.tight}>
        <NoteCard
          height={112}
          title="This is not a credit score"
          body="It never leaves this phone. No lender sees it, no bank is sent it, and it changes nothing about what you can borrow. It is here so you can watch your own habits, and for no other reason."
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  /* the frame runs 16 between blocks; the screen's column runs 20 */
  tight: { marginTop: -4 },
  card: { backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  move: { marginTop: 12, height: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  grey: { marginTop: 12, backgroundColor: colour.surface2, borderRadius: 24, paddingHorizontal: 16, paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 72 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  offer: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, borderRadius: 24, padding: 16 },
});
