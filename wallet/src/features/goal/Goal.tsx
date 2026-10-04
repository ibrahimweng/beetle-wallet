/* The goals, on one page. Savings on home opens it on the first goal; Savings
   pot on All services and "my goal" typed at home do too. Under the head the
   goals sit as pills with + New goal at the end, a tap switching in place;
   then the ring and what is put aside, from the Holiday frame; Add money and
   Take out straight under it, so money goes in on the fourth tap from home,
   the passcode counted; Beetle's line, with Start again in it while the goal
   is paused; what feeds it as one row that opens the Feed sheet; and the line
   that nothing is locked. The ··· at the top right edits the goal, pauses it
   or starts it again, and ends it. Money in and out goes through the amount
   picker and the passcode, and its receipt opens after. A new goal comes
   filled (see GoalSheet), so it is the third tap from home. An account with
   no goal sees Goals with Start a goal, as its frame draws it. While money is
   tight (the switch on the Rules page) every goal waits, as the Paused frame
   draws it. */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountSheet, Button, Caption, ConfirmSheet, Display, Icon, Label, Meta, MoreButton, PageHead, Progress, Row, Say, SayCard, Screen, Tap, colour, toast, type MenuItem } from '../../design';
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
import { FEEDS, GOAL, NO_GOAL_LINE, type FeedId } from './goal';
import { HOLIDAY_ID, dayWords, dueIn, freeName, lineFor, nextIdea, standingOf, type Goal as GoalT, type Standing } from './goals';
import { useGoals } from './store';
import { FeedSheet } from './FeedSheet';
import { GoalSheet, type GoalDraft } from './GoalSheet';

type Open = 'feed' | 'add' | 'take' | 'new' | 'edit' | 'end' | null;
/** money waiting on the passcode: put in, taken out, or all of it back as the goal ends */
type Guard = { kind: 'add' | 'take' | 'end'; amount: number; goal: GoalT };

const newId = () => `g${Date.now().toString(36)}`;

export function Goal() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ feed?: string; paused?: string; new?: string; name?: string; goal?: string; two?: string; open?: string }>();
  const account = app.session?.account;
  const demo = !!account?.demo;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const { prefs, ready, set } = usePrefs(account?.accountNumber);
  const store = useGoals(account?.accountNumber, { demo, started: prefs.goal });
  const goals = store.goals;
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const [picked, setPicked] = useState<string | undefined>(asked.goal);
  const [open, setOpen] = useState<Open>(LAB && asked.feed === '1' ? 'feed' : asked.new === '1' ? 'new' : LAB && (asked.open === 'take' || asked.open === 'edit') ? asked.open : null);
  const [guard, setGuard] = useState<Guard | null>(null);
  /* what the words said a new goal is for, once */
  const [named, setNamed] = useState(asked.name);

  const tight = prefs.tight || (LAB && asked.paused === '1');
  const all = goals.map(g => standingOf(g, { goals, demo, tight, moves }));
  const st: Standing | undefined = all.find(x => x.goal.id === picked) ?? all[0];
  const goal = st?.goal;
  const on: Record<FeedId, boolean> = { payday: prefs.rules.payday, roundups: prefs.feeds.roundups, cashback: prefs.feeds.cashback };

  /* the lab's place with a second goal beside Holiday */
  useEffect(() => {
    if (!LAB || asked.two !== '1' || !store.ready || !ready || goals.length !== 1) return;
    store.add({ id: 'rent', name: 'Rent', target: 600_000, due: dueIn(12) });
  }, [asked.two, store.ready, ready, goals.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the gate shut after three wrong tries: say how long, and move nothing */
  const gate = (then: () => void) => {
    const shut = lockedFor();
    if (shut) toast(`That was three wrong tries. Give it ${shut} seconds and try again.`);
    else then();
  };
  const putIn = (amount: number) => {
    setOpen(null);
    if (goal) gate(() => setGuard({ kind: 'add', amount, goal }));
  };
  const takeOut = (amount: number) => {
    setOpen(null);
    if (goal) gate(() => setGuard({ kind: 'take', amount, goal }));
  };
  /* ending: with money in it the passcode says it all; empty, the sheet that asks first */
  const end = () => {
    if (!st) return;
    if (st.aside > 0) gate(() => setGuard({ kind: 'end', amount: st.aside, goal: st.goal }));
    else setOpen('end');
  };
  const ended = (g: GoalT) => {
    const next = goals.find(x => x.id !== g.id);
    store.remove(g.id);
    setPicked(undefined);
    return next;
  };

  /* the passcode landed: the line goes into the day, and its receipt opens */
  const landed = () => {
    if (!account || !guard) return;
    const { kind, amount, goal: g } = guard;
    const at = clock();
    setGuard(null);
    const move: Move =
      kind === 'add'
        ? { name: g.name, detail: `Put away · ${at}`, amount: -amount, icon: 'pot', kind: 'saving', goal: g.id }
        : { name: g.name, detail: `${kind === 'end' ? 'Goal ended' : 'Taken back'} · ${at}`, amount, icon: 'pot', kind: 'saving', goal: g.id };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    if (kind === 'end') {
      const fed = goals[0]?.id === g.id;
      const next = ended(g);
      toast(fed && next ? `${g.name} has ended. What fed it goes to ${next.name} now.` : `${g.name} has ended, and ${naira(amount)} is back in Everyday.`);
    }
    router.push(`/receipt/${row.id}`);
  };

  const started = (d: GoalDraft) => {
    setOpen(null);
    setNamed(undefined);
    const g: GoalT = { id: newId(), name: freeName(d.name, goals), target: d.target, due: d.due };
    store.add(g);
    setPicked(g.id);
    toast(`${g.name}: ${naira(g.target)} by ${dayWords(g.due)}. Add money whenever you like.`);
  };
  const changed = (d: GoalDraft) => {
    setOpen(null);
    if (!goal) return;
    store.update(goal.id, { name: freeName(d.name, goals, goal.id), target: d.target, due: d.due });
    toast('Saved. What is in it has not moved.');
  };
  const pause = () => {
    if (!goal) return;
    store.update(goal.id, { paused: true });
    toast(`${goal.name} is paused. Nothing goes in on its own until you start it again.`);
  };
  const again = () => {
    if (!goal) return;
    if (prefs.tight) set({ tight: false });
    if (goal.paused) store.update(goal.id, { paused: false });
    toast(prefs.tight && goal.id === HOLIDAY_ID ? `Moving again. Your date goes back to ${GOAL.by}.` : `${goal.name} is moving again.`);
  };

  useFoot({ kind: 'back', veil: guard || open ? 'away' : undefined });
  if (!ok || !account) return null;
  if (!ready || !store.ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );

  const items: MenuItem[] = st
    ? [
        { glyph: 'gear', label: 'Edit goal', onPress: () => setOpen('edit') },
        st.paused ? { glyph: 'clock', label: 'Start again', onPress: again } : { glyph: 'clock', label: 'Pause goal', onPress: pause },
        { glyph: 'close', label: 'End goal', onPress: end, tone: 'bad' },
      ]
    : [];
  const sub = !st ? 'Nothing put aside yet' : tight ? 'Paused while things are tight' : st.paused ? 'Paused for now' : `${naira(st.goal.target)} by ${dayWords(st.goal.due)}`;
  const head = (
    <View style={s.head} pointerEvents="box-none">
      <View style={{ flex: 1 }}>
        <PageHead lead title={st ? st.goal.name : 'Goals'} sub={sub} />
      </View>
      {st ? (
        <View style={{ marginTop: -7 }}>
          <MoreButton items={items} testID="goal-more" />
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <Screen head={head}>
        {st ? <Pills goals={goals} picked={st.goal.id} onPick={setPicked} onNew={() => setOpen('new')} /> : null}
        {st ? (
          <View style={s.card} testID="goal-card">
            <Progress size={180} pct={st.pct} testID="goal-ring">
              <Display>{`${st.pct}%`}</Display>
              <Meta tone="secondary" style={{ marginTop: 7 }}>
                of the way
              </Meta>
            </Progress>
            <View style={{ marginTop: 16, alignItems: 'center' }} testID="goal-sum">
              <Display>{naira(st.aside)}</Display>
              <Meta tone="secondary" style={{ marginTop: 12 }}>
                {st.paused ? `of ${naira(st.goal.target)}, holding steady` : `of ${naira(st.goal.target)} put aside`}
              </Meta>
            </View>
          </View>
        ) : null}
        {/* with no goal, the frame's order: Beetle's line, then the two buttons */}
        {st ? null : (
          <View style={{ marginTop: 6 }}>
            <Say testID="line">{NO_GOAL_LINE}</Say>
          </View>
        )}
        <View style={[s.buttons, st ? null : { marginTop: 12 }]} testID="buttons">
          {st ? (
            <>
              <Button label={st.paused ? 'Add money anyway' : 'Add money'} size={56} onPress={() => setOpen('add')} style={{ flex: 1 }} />
              <Button label="Take out" tone="grey" size={56} disabled={!st.aside} onPress={() => setOpen('take')} style={{ flex: 1 }} />
            </>
          ) : (
            <>
              <Button label="Start a goal" size={56} onPress={() => setOpen('new')} style={{ flex: 1 }} />
              <Button label="Set it up" tone="grey" size={56} onPress={() => setOpen('feed')} style={{ flex: 1 }} />
            </>
          )}
        </View>
        {!st ? null : st.paused ? (
          <SayCard action="Start again" onAction={again} testID="line">
            {lineFor(st, { tight })}
          </SayCard>
        ) : (
          <Say testID="line">{lineFor(st, { tight })}</Say>
        )}
        {st ? <Feeds st={st} on={on} first={goals[0]?.name ?? ''} onOpen={() => setOpen('feed')} /> : null}
        <View style={s.lock} testID="lock-line">
          <Icon name="lock" size={16} colour={colour.textTertiary} />
          <Meta tone="secondary" style={{ flex: 1 }}>
            {tight ? 'I will not ask you about this again until you tell me to.' : 'Nothing here is locked. Take it back whenever you need it.'}
          </Meta>
        </View>
        {!st?.paused ? (
          <Tap
            accessibilityRole="button"
            accessibilityLabel={st ? 'What happens if money gets tight?' : 'What should I be saving for?'}
            onPress={() => askHome(router, st ? 'What happens if money gets tight?' : 'What should I be saving for?')}
            style={s.link}
            testID="link"
          >
            <Label tone="accent">{st ? 'What happens if money gets tight?' : 'What should I be saving for?'}</Label>
            <Icon name="chevron" size={12} colour={colour.accent} />
          </Tap>
        ) : null}
      </Screen>
      {open === 'feed' ? (
        <FeedSheet
          name={goals[0]?.name ?? nextIdea([]).name}
          on={on}
          onChange={(id, v) => {
            if (id === 'payday') set({ rules: { ...prefs.rules, payday: v } });
            else set({ feeds: { ...prefs.feeds, [id]: v } });
            /* something to feed: with no goal yet, the first idea becomes one */
            if (v && !goals.length) {
              const i = nextIdea([]);
              store.add({ id: newId(), name: i.name, target: i.target, due: dueIn(i.months) });
            }
          }}
          onFixed={() => setOpen(goals.length ? 'add' : 'new')}
          onDismiss={() => setOpen(null)}
        />
      ) : null}
      {open === 'add' && st ? (
        <AmountSheet
          title={`Into ${st.goal.name}`}
          sub="From Everyday. Nothing here is locked; take it out whenever you need it."
          start={Math.min(10_000, Math.floor(balance))}
          max={Math.max(0, Math.floor(balance))}
          note={`Everyday has ${naira(balance)}`}
          chips={[5_000, 10_000, 20_000]}
          action={v => (v ? `Put ${naira(v)} away` : 'Pick an amount')}
          onDone={putIn}
          onDismiss={() => setOpen(null)}
          testID="goal-amount"
        />
      ) : null}
      {open === 'take' && st ? (
        <AmountSheet
          title={`Out of ${st.goal.name}`}
          sub="Back into Everyday at once, and free."
          start={Math.min(10_000, Math.floor(st.aside))}
          max={Math.floor(st.aside)}
          note={`${st.goal.name} holds ${naira(st.aside)}`}
          chips={[5_000, 10_000, 20_000]}
          all="All of it"
          action={v => (v ? `Take ${naira(v)} out` : 'Pick an amount')}
          onDone={takeOut}
          onDismiss={() => setOpen(null)}
          testID="goal-take"
        />
      ) : null}
      {open === 'new' ? (
        <GoalSheet
          goals={goals}
          named={named}
          onDone={started}
          onDismiss={() => {
            setOpen(null);
            setNamed(undefined);
          }}
        />
      ) : null}
      {open === 'edit' && st ? <GoalSheet goal={st.goal} goals={goals} onDone={changed} onDismiss={() => setOpen(null)} /> : null}
      {open === 'end' && st ? (
        <ConfirmSheet
          title={`End ${st.goal.name}?`}
          body="Nothing is in it, so nothing moves. It goes from your goals."
          action="End goal"
          onConfirm={() => {
            setOpen(null);
            const g = st.goal;
            ended(g);
            toast(`${g.name} has ended.`);
          }}
          onCancel={() => setOpen(null)}
          testID="goal-end"
        />
      ) : null}
      {guard ? (
        <PasscodeSheet
          amount={naira(guard.amount)}
          name={guard.goal.name}
          detail={guard.kind === 'add' ? 'Put away, from Everyday' : guard.kind === 'take' ? 'Taken out, into Everyday' : 'The goal ends, and all of it comes back'}
          glyph="pot"
          rows={
            guard.kind === 'add'
              ? [
                  { label: 'Into', value: `${guard.goal.name}, toward ${naira(guard.goal.target)}` },
                  { label: 'Taken out', value: 'Whenever you want, free' },
                  { label: 'Leaves Everyday', value: naira(guard.amount), strong: true },
                ]
              : [
                  { label: 'From', value: guard.kind === 'end' ? `${guard.goal.name}, which ends` : guard.goal.name },
                  { label: 'Fee', value: 'Free' },
                  { label: 'Into Everyday', value: naira(guard.amount), strong: true },
                ]
          }
          verify={app.checkPasscode}
          onDone={landed}
          onCancel={() => setGuard(null)}
        />
      ) : null}
    </>
  );
}

/* The goals as pills, the one showing in ink, and + New goal at the end. */
function Pills({ goals, picked, onPick, onNew }: { goals: GoalT[]; picked: string; onPick: (id: string) => void; onNew: () => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }} style={{ marginHorizontal: -20, marginTop: 6 }} testID="goal-pills">
      {goals.map(g => {
        const on = g.id === picked;
        return (
          <Tap
            key={g.id}
            accessibilityRole="button"
            accessibilityLabel={g.name}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(g.id)}
            scale={0.94}
            style={[s.pill, on && s.pillOn]}
            testID="goal-pill"
          >
            <Label tone={on ? 'inverse' : 'ink'}>{g.name}</Label>
          </Tap>
        );
      })}
      <Tap accessibilityRole="button" accessibilityLabel="New goal" onPress={onNew} scale={0.94} style={[s.pill, s.pillNew]} testID="goal-new">
        <Icon name="plus" size={14} colour={colour.ink} />
        <Label>New goal</Label>
      </Tap>
    </ScrollView>
  );
}

const FEED_WORD: Record<FeedId, string> = { payday: 'Payday', roundups: 'round ups', cashback: 'cash back' };
const listed = (w: string[]) => w.join(', ');

/* What feeds the goal, as one row: on the first goal, what runs into it and
   what that brings in a month, opening the Feed sheet; on any other, that it
   is fed by hand and where the feeds go. */
function Feeds({ st, on, first, onOpen }: { st: Standing; on: Record<FeedId, boolean>; first: string; onOpen: () => void }) {
  if (!st.fed)
    return (
      <View style={s.row} testID="feeds">
        <View style={s.box}>
          <Icon name="plus" size={20} colour={colour.ink} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Row>Fed by hand</Row>
          <Meta tone="secondary">{`What runs on its own feeds ${first}`}</Meta>
        </View>
      </View>
    );
  const running = FEEDS.filter(f => on[f.id]);
  const words = running.map(f => FEED_WORD[f.id]);
  const monthly = running.reduce((a, f) => a + f.monthly, 0);
  const quiet = st.paused || !running.length;
  return (
    <Tap accessibilityRole="button" accessibilityLabel="What is feeding it" onPress={onOpen} style={s.row} testID="feeds">
      <View style={s.box}>
        <Icon name="gift" size={20} colour={colour.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row>What is feeding it</Row>
        <Meta tone="secondary">{st.paused ? 'Waiting while it is paused' : running.length ? listed(words).replace(/^./, c => c.toUpperCase()) : 'Nothing yet'}</Meta>
      </View>
      {/* what it brings in a month, the figure over its words */}
      <View style={{ alignItems: 'flex-end' }}>
        <Label style={{ color: quiet ? colour.textTertiary : colour.accent }}>{st.paused ? 'Paused' : running.length ? naira(monthly) : 'Set it up'}</Label>
        {quiet ? null : <Caption tone="secondary">a month</Caption>}
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  /* the frame's card: 20 around the ring, the figure 16 under it, and a column 5 shorter than its words */
  card: { backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 20, paddingBottom: 15, alignItems: 'center' },
  pill: { height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colour.ink },
  pillNew: { flexDirection: 'row', gap: 6, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.ruleStrong },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 68 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: 8, height: 56 },
  lock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  /* the frame's link: 40 tall, centred, the chevron 8 after the words */
  link: { marginTop: -4, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
