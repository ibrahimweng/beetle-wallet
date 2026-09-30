/* Holiday, from its frame: how far along the goal is on a ring with what is
   put aside under it, Beetle's word on the pace, what is feeding it row by
   row, Add money and Feed it more, the line that nothing is locked, and the
   question of what happens when money gets tight. While things are tight
   (the switch on the Rules page) the goal is Paused: the feeds wait, the
   date moves, and Start again lifts it. An account with no goal sees Goals
   with Start a goal. Savings pot on All services opens it; so does
   "my goal" typed at home. */
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Display, Head, Icon, Label, Meta, PageHead, Progress, Row, Say, Screen, Tap, colour, toast } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { usePrefs } from '../settings/prefs';
import { PasscodeSheet, lockedFor } from '../passcode';
import { LAB } from '../../lab/enabled';
import { clock } from '../../lib/clock';
import { naira } from '../../lib/format';
import { FEEDS, GOAL, feedRow, goalLine, standing, type FeedId } from './goal';
import { goalDraft } from './hand';
import { FeedSheet } from './FeedSheet';

export function Goal() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ feed?: string; paused?: string }>();
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const [feeding, setFeeding] = useState(LAB && asked.feed === '1');
  const [amount, setAmount] = useState(0);
  const [guard, setGuard] = useState(false);

  const on: Record<FeedId, boolean> = { payday: prefs.rules.payday, roundups: prefs.feeds.roundups, cashback: prefs.feeds.cashback };
  /* what was put in by hand on this phone counts, less what was taken back */
  const { has, paused, sums, aside, pct, state } = standing({ demo: !!account?.demo, goal: !!account && prefs.goal, tight: prefs.tight || (LAB && asked.paused === '1'), moves });

  /* back in front: the figure the keypad handed back goes to the passcode */
  useFocusEffect(
    useCallback(() => {
      const d = goalDraft.take();
      if (!d?.amount) return;
      if (d.amount > balance) {
        router.push(`/short?asked=${d.amount}`);
        return;
      }
      const shut = lockedFor();
      if (shut) {
        toast(`That was three wrong tries. Give it ${shut} seconds and try again.`);
        return;
      }
      setAmount(d.amount);
      setGuard(true);
    }, [balance, router]),
  );
  /* the passcode landed: the line goes into the day, and its receipt opens */
  const done = () => {
    if (!account) return;
    const at = clock();
    const move: Move = { name: GOAL.name, detail: `Put away · ${at}`, amount: -amount, icon: 'pot', kind: 'saving' };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    if (!prefs.goal && !account.demo) set({ goal: true });
    router.push(`/receipt/${row.id}`);
  };
  const start = () => {
    set({ goal: true });
    toast(`Holiday it is: ${naira(GOAL.target)} by ${GOAL.by}. Add money, or let a rule feed it.`);
  };
  const again = () => {
    set({ tight: false });
    toast(`Moving again. Your date goes back to ${GOAL.by}.`);
  };

  useFoot({
    kind: 'ask',
    placeholder: has ? 'Ask about this goal' : 'Ask about saving',
    onAsk: q => askHome(router, q, has ? `${GOAL.name}, ${naira(aside)} of ${naira(GOAL.target)}` : undefined),
    onScan: () => router.push('/scan'),
    more: true,
    veil: guard || feeding ? 'away' : undefined,
  });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );
  const rows = FEEDS.map(f => feedRow(f, on[f.id], paused, sums[f.id]));
  return (
    <>
      <Screen head={<PageHead lead title={has ? GOAL.name : 'Goals'} sub={!has ? 'Nothing put aside yet' : paused ? 'Paused while things are tight' : `${naira(GOAL.target)} by ${GOAL.by}`} />}>
        {has ? (
          <View style={[s.card, { marginTop: 6 }]} testID="goal-card">
            <Progress size={180} pct={pct} testID="goal-ring">
              <Display>{`${pct}%`}</Display>
              <Meta tone="secondary" style={{ marginTop: 7 }}>
                of the way
              </Meta>
            </Progress>
            <View style={{ marginTop: 16, alignItems: 'center' }} testID="goal-sum">
              <Display>{naira(aside)}</Display>
              <Meta tone="secondary" style={{ marginTop: 12 }}>
                {paused ? `of ${naira(GOAL.target)}, holding steady` : `of ${naira(GOAL.target)} put aside`}
              </Meta>
            </View>
          </View>
        ) : null}
        <View style={has ? null : { marginTop: 6 }}>
          <Say testID="say">{goalLine(state)}</Say>
        </View>
        {has ? (
          <View style={{ marginTop: -11 }} testID="feeds-block">
            <Head>{paused ? 'Waiting for you' : 'What is feeding it'}</Head>
            <View style={{ marginTop: 12 }} testID="feeds">
              {rows.map(r => (
                <View key={r.id} style={s.row} testID="feed">
                  <View style={s.box}>
                    <Icon name={r.glyph} size={20} colour={colour.ink} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Row>{r.title}</Row>
                    <Meta tone="secondary">{r.sub}</Meta>
                  </View>
                  <Row style={{ color: r.tone === 'accent' ? colour.accent : colour.textTertiary }}>{r.value}</Row>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {/* the frame boxes the buttons at 52 and lets the 56 buttons stand 2 proud */}
        <View style={[s.buttons, { marginTop: has ? 2 : 12 }]} testID="buttons">
          {has ? (
            <>
              <Button label={paused ? 'Add money anyway' : 'Add money'} size={56} to="/amend?to=goal" style={{ flex: 1 }} />
              {paused ? (
                <Button label="Start again" tone="grey" size={56} onPress={again} style={{ flex: 1 }} />
              ) : (
                <Button label="Feed it more" tone="grey" size={56} onPress={() => setFeeding(true)} style={{ flex: 1 }} />
              )}
            </>
          ) : (
            <>
              <Button label="Start a goal" size={56} onPress={start} style={{ flex: 1 }} />
              <Button label="Set it up" tone="grey" size={56} onPress={() => setFeeding(true)} style={{ flex: 1 }} />
            </>
          )}
        </View>
        <View style={s.lock} testID="lock-line">
          <Icon name="lock" size={16} colour={colour.textTertiary} />
          <Meta tone="secondary" style={{ flex: 1 }}>
            {paused ? 'I will not ask you about this again until you tell me to.' : 'Nothing here is locked. Take it back whenever you need it.'}
          </Meta>
        </View>
        {!paused ? (
          <Tap
            accessibilityRole="button"
            accessibilityLabel={has ? 'What happens if money gets tight?' : 'What should I be saving for?'}
            onPress={() => askHome(router, has ? 'What happens if money gets tight?' : 'What should I be saving for?')}
            style={s.link}
            testID="link"
          >
            <Label tone="accent">{has ? 'What happens if money gets tight?' : 'What should I be saving for?'}</Label>
            <Icon name="chevron" size={12} colour={colour.accent} />
          </Tap>
        ) : null}
      </Screen>
      {feeding ? (
        <FeedSheet
          on={on}
          onChange={(id, v) => {
            if (id === 'payday') set({ rules: { ...prefs.rules, payday: v } });
            else set({ feeds: { ...prefs.feeds, [id]: v } });
            if (v && !has) set({ goal: true });
          }}
          onFixed={() => {
            setFeeding(false);
            router.push('/amend?to=goal');
          }}
          onDismiss={() => setFeeding(false)}
        />
      ) : null}
      {guard ? <PasscodeSheet amount={naira(amount)} name={GOAL.name} detail="Put away, from Everyday" glyph="pot" verify={app.checkPasscode} onDone={done} onCancel={() => setGuard(false)} /> : null}
    </>
  );
}

const s = StyleSheet.create({
  /* the frame's card: 20 around the ring, the figure 16 under it, and a column 5 shorter than its words */
  card: { backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 20, paddingBottom: 15, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 68 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: 8, height: 56, marginBottom: -2 },
  lock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  /* the frame's link: 40 tall, centred, the chevron 8 after the words */
  link: { marginTop: -4, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
