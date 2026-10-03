/* Three cards the chat's chips put up that are not forms of fields.

   Receive: the account's own details, to be paid into — the name, Beetle as
   the bank, the account number and the $tag — each with Copy beside it, and
   Share details to hand them all on at once. Nothing on it can take money
   out, and it says so.

   Loan: what can be borrowed, picked on the dark picker; the days a plain
   "30 days ▾" that opens a short list in place; then what it comes to — paid
   back in all, the payments and the first of them — and what happens if a
   payment is missed, said plainly before anything is taken. Borrow goes to
   the passcode, and the money lands the way any money in does.

   Save: the goals as pills, the first picked (or the one the words named),
   the dark picker stopping at what Everyday holds, what the goal has so
   far, and Put ₦X into the goal, through the passcode. With no goal yet,
   its button starts one on the goal page. */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AmountPicker, Caption, Chevron, Icon, Label, Meta, Row, Swap, Tap, dark } from '../../design';
import type { Account } from '../../services';
import { naira } from '../../lib/format';
import { detailsOf } from '../receive/details';
import { copyDetail, shareDetails } from '../receive/share';
import { COLLECTED, LOAN, MISSED, TERMS, costOf, countWord, dayOf, type Term } from '../loan/loan';
import type { Standing } from '../goal/goals';

/* ---- receive ---- */

export function ReceiveCard({ account, tag }: { account: Account; tag: string }) {
  const { name, number, all } = detailsOf(account, tag);
  const copy = (what: string, words: string) => copyDetail(what, words, 'card');
  const share = () => shareDetails(all, 'card');
  return (
    <View style={s.panel} testID="receive-card">
      <Head glyph="receive-filled" title="Your account" pill="Receive" />
      <View style={s.body}>
        <Line label="Name" value={name} />
        <Line label="Bank" value="Beetle" />
        <Line label="Account number" value={number} onCopy={() => void copy(account.accountNumber, number)} testID="receive-number" />
        <Line label="Beetle tag" value={`$${tag}`} onCopy={() => void copy(`$${tag}`, `$${tag}`)} testID="receive-tag" />
        <View style={s.noteRow}>
          <Icon name="lock" size={14} colour={dark.label} />
          <Caption style={{ color: dark.textSoft, flex: 1 }}>From another bank, the number. From Beetle, the tag: free, and there at once. Neither can take anything out.</Caption>
        </View>
      </View>
      <View style={{ paddingHorizontal: 12 }}>
        <Tap accessibilityRole="button" accessibilityLabel="Share details" onPress={() => void share()} style={[s.action, s.actionReady]} testID="receive-share">
          <Row style={{ color: '#000000' }}>Share details</Row>
        </Tap>
      </View>
    </View>
  );
}

/* ---- loan ---- */

export function LoanCard({
  state,
  taken,
  canBorrow,
  onSetUp,
  onBorrow,
}: {
  state: 'open' | 'done';
  taken?: { amount: number; days: number };
  /** borrowing is one of the things finishing setting up turns on */
  canBorrow: boolean;
  onSetUp: () => void;
  onBorrow: (amount: number, days: Term) => void;
}) {
  const [amount, setAmount] = useState(taken?.amount ?? 50_000);
  const [days, setDays] = useState<Term>((taken?.days as Term) ?? 30);
  const [choosing, setChoosing] = useState(false);
  const [more, setMore] = useState(false);
  const cost = costOf(amount, days);
  const open = state === 'open';
  return (
    <View style={s.panel} testID="loan-card">
      <Head glyph="loan" title="Beetle Loans" pill={open ? (canBorrow ? 'Ready' : 'Needs setting up') : 'Taken'} />
      <View style={[s.body, !open && { opacity: 0.72 }]} pointerEvents={open ? 'auto' : 'none'}>
        <View style={{ marginHorizontal: -4 }}>
          <AmountPicker
            tone="dark"
            value={amount}
            onChange={v => setAmount(Math.max(0, v))}
            max={LOAN.most}
            note={amount && amount < LOAN.least ? `The least is ${naira(LOAN.least)}` : `${naira(LOAN.most)} is your limit`}
            warn={!!amount && amount < LOAN.least}
            chips={[20_000, 50_000, 100_000]}
            testID="loan-picker"
          />
        </View>
        {/* the days: a plain row with a dropdown, no box */}
        <Tap
          accessibilityRole="button"
          accessibilityLabel={`Pay back over ${days} days`}
          accessibilityState={{ expanded: choosing }}
          onPress={() => setChoosing(c => !c)}
          style={s.line}
          testID="loan-days"
        >
          <Meta style={{ color: dark.label }}>Pay back over</Meta>
          <View style={s.days}>
            <Label style={{ color: '#ffffff' }}>{`${days} days`}</Label>
            <Chevron dir={choosing ? 'up' : 'down'} size={14} colour={dark.textSoft} />
          </View>
        </Tap>
        {choosing ? (
          <View style={s.choices} testID="loan-day-list">
            {TERMS.map(t => (
              <Tap
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`${t} days`}
                accessibilityState={{ selected: t === days }}
                onPress={() => {
                  setDays(t);
                  setChoosing(false);
                }}
                style={s.choice}
              >
                <Label style={{ color: '#ffffff', flex: 1 }}>{`${t} days`}</Label>
                <Caption style={{ color: dark.textSoft }}>{`${countWord(t / 30).toLowerCase()} payment${t === 30 ? '' : 's'}`}</Caption>
                {t === days ? <Icon name="check" size={14} colour="#ffffff" /> : <View style={{ width: 14 }} />}
              </Tap>
            ))}
          </View>
        ) : null}
        <Line label="You pay back" value={naira(cost.total)} strong />
        <Line label={`${countWord(cost.payments)} payment${cost.payments === 1 ? '' : 's'} of`} value={naira(cost.each)} />
        <Line label="First payment" value={dayOf(cost.first)} />
        <Line label="Taken" value="From Everyday" />
        <Tap accessibilityRole="button" accessibilityLabel="If a payment is missed" accessibilityState={{ expanded: more }} onPress={() => setMore(m => !m)} style={s.line} testID="loan-missed">
          <Meta style={{ color: dark.label }}>If a payment is missed</Meta>
          <Chevron dir={more ? 'up' : 'down'} size={14} colour={dark.textSoft} />
        </Tap>
        {more ? (
          <View style={{ gap: 4, paddingBottom: 4 }} testID="loan-missed-words">
            {[MISSED.collateral, MISSED.fee, MISSED.collect, MISSED.bureau].map(w => (
              <Caption key={w} style={{ color: dark.textSoft }}>{`· ${w}`}</Caption>
            ))}
            <Caption style={{ color: dark.label }}>{COLLECTED}</Caption>
          </View>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 12 }}>
        {canBorrow || !open ? (
          <Tap
            accessibilityRole="button"
            accessibilityLabel={open ? `Borrow ${naira(amount)}` : 'Taken'}
            disabled={!open || amount < LOAN.least}
            onPress={() => onBorrow(amount, days)}
            style={[s.action, open && amount >= LOAN.least ? s.actionReady : null, open && amount < LOAN.least && { opacity: 0.55 }]}
            testID="loan-borrow"
          >
            <Swap value={open ? `Borrow ${naira(amount)}` : `Borrowed ${naira(taken?.amount ?? amount)}`}>
              {label => <Row style={{ color: open && amount >= LOAN.least ? '#000000' : '#ffffff' }}>{label}</Row>}
            </Swap>
          </Tap>
        ) : (
          <Tap accessibilityRole="button" accessibilityLabel="Finish setting up to borrow" onPress={onSetUp} style={s.action} testID="loan-setup">
            <Row style={{ color: '#ffffff' }}>Finish setting up to borrow</Row>
          </Tap>
        )}
      </View>
    </View>
  );
}

/* ---- save ---- */

export function SaveCard({
  state,
  saved,
  goals,
  balance,
  start,
  onSave,
  onStart,
}: {
  state: 'open' | 'done';
  saved?: { amount: number; goalId: string; name: string };
  /** each goal and what it holds, the one the feeds go to first */
  goals: Standing[];
  /** what Everyday holds: the picker stops there */
  balance: number;
  /** what the words said: how much, and which goal */
  start?: { amount?: number; goalId?: string };
  onSave: (goalId: string, amount: number) => void;
  /** no goal yet: start one */
  onStart: () => void;
}) {
  const cap = Math.max(0, Math.floor(balance));
  const [goalId, setGoalId] = useState(saved?.goalId ?? start?.goalId ?? goals[0]?.goal.id);
  const [amount, setAmount] = useState(saved?.amount ?? Math.min(start?.amount ?? 10_000, cap));
  const open = state === 'open';
  const pick = goals.find(g => g.goal.id === goalId) ?? goals[0];
  if (open && !pick)
    return (
      <View style={s.panel} testID="save-card">
        <Head glyph="pot" title="Put money away" pill="No goal yet" />
        <View style={s.body}>
          <Caption style={{ color: dark.textSoft }}>Give it a name, how much and by when, and I keep count here. It is filled in for you: three taps.</Caption>
        </View>
        <View style={{ paddingHorizontal: 12 }}>
          <Tap accessibilityRole="button" accessibilityLabel="Start a goal" onPress={onStart} style={[s.action, s.actionReady]} testID="save-start">
            <Row style={{ color: '#000000' }}>Start a goal</Row>
          </Tap>
        </View>
      </View>
    );
  const name = saved?.name ?? pick?.goal.name ?? '';
  const ready = open && amount > 0 && amount <= cap;
  return (
    <View style={s.panel} testID="save-card">
      <Head glyph="pot" title="Put money away" pill={open ? 'Ready' : 'Put away'} />
      <View style={[s.body, !open && { opacity: 0.72 }]} pointerEvents={open ? 'auto' : 'none'}>
        {open && goals.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 4 }} testID="save-goals">
            {goals.map(g => {
              const on = g.goal.id === pick?.goal.id;
              return (
                <Tap
                  key={g.goal.id}
                  accessibilityRole="button"
                  accessibilityLabel={g.goal.name}
                  accessibilityState={{ selected: on }}
                  onPress={() => setGoalId(g.goal.id)}
                  scale={0.94}
                  style={[s.goal, on && s.goalOn]}
                  testID="save-goal"
                >
                  <Label style={{ color: on ? '#000000' : '#ffffff' }}>{g.goal.name}</Label>
                </Tap>
              );
            })}
          </ScrollView>
        ) : null}
        <View style={{ marginHorizontal: -4 }}>
          <AmountPicker tone="dark" value={amount} onChange={v => setAmount(Math.max(0, v))} max={cap} note={`Everyday has ${naira(balance)}`} chips={[5_000, 10_000, 20_000]} testID="save-picker" />
        </View>
        {pick ? <Line label={`In ${pick.goal.name}`} value={`${naira(pick.aside)} of ${naira(pick.goal.target)}`} /> : null}
      </View>
      <View style={{ paddingHorizontal: 12 }}>
        <Tap
          accessibilityRole="button"
          accessibilityLabel={open ? `Put ${naira(amount)} into ${name}` : `Put ${naira(saved?.amount ?? amount)} into ${name}`}
          disabled={!ready}
          onPress={() => pick && onSave(pick.goal.id, amount)}
          style={[s.action, ready ? s.actionReady : null, open && !ready && { opacity: 0.55 }]}
          testID="save-put"
        >
          <Swap value={open ? (amount ? `Put ${naira(amount)} into ${name}` : 'Pick how much') : `Put ${naira(saved?.amount ?? amount)} into ${name}`}>
            {label => <Row style={{ color: ready ? '#000000' : '#ffffff' }}>{label}</Row>}
          </Swap>
        </Tap>
      </View>
    </View>
  );
}

/* ---- the pieces ---- */

function Head({ glyph, title, pill }: { glyph: import('../../icons').IconName; title: string; pill: string }) {
  return (
    <View style={s.head}>
      <View style={s.icon}>
        <Icon name={glyph} size={16} colour="#ffffff" />
      </View>
      <Label style={{ flex: 1, color: '#ffffff' }}>{title}</Label>
      <View style={s.pill}>
        <View style={[s.dot, { backgroundColor: '#34c759' }]} />
        <Swap value={pill}>{w => <Caption style={{ color: dark.pillText, fontWeight: '600' }}>{w}</Caption>}</Swap>
      </View>
    </View>
  );
}

/** A label at the left and its figure at the right; Copy beside it where it is one to hand on. */
function Line({ label, value, strong = false, onCopy, testID }: { label: string; value: string; strong?: boolean; onCopy?: () => void; testID?: string }) {
  return (
    <View style={s.line} testID={testID}>
      <Meta style={{ color: dark.label }}>{label}</Meta>
      <View style={s.value}>
        {strong ? <Row style={{ color: '#ffffff' }}>{value}</Row> : <Label style={{ color: '#ffffff' }}>{value}</Label>}
        {onCopy ? (
          <Tap accessibilityRole="button" accessibilityLabel={`Copy ${label.toLowerCase()}`} onPress={onCopy} hitSlop={8} style={s.copy}>
            <Icon name="copy" size={14} colour={dark.textSoft} />
          </Tap>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, overflow: 'hidden', paddingBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: dark.edge, borderBottomWidth: 1, borderBottomColor: dark.edgeStrong },
  icon: { width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  dot: { width: 6, height: 6, borderRadius: 3 },
  body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  copy: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: dark.edge },
  days: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  choices: { borderRadius: 14, backgroundColor: dark.edge, paddingHorizontal: 12, marginBottom: 4 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, borderRadius: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 8 },
  action: { height: 52, borderRadius: 26, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  actionReady: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  goal: { height: 32, borderRadius: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  goalOn: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
});
