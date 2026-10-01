/* Borrow, made short. Someone here wants to borrow, so the amount comes
   first: the picker, the ruler stopping hard at what can be borrowed, the
   likely figures and the limit as chips, or the figure typed. Under it, on
   one tight card, what it comes to: the days as a plain "30 days" with a
   chevron — tapped, the three terms open in place — and as it changes the
   figures under it follow: what is paid back in all, the payments and the
   first of them, and where they are taken from. Then what happens if a
   payment is missed, said plainly before anything is taken, and the cost
   line by line behind a tap for whoever wants it. Labels at the left,
   figures at the right, the total the strongest line. Finishing setting up,
   where borrowing still waits on it, is at the foot. Slide to take beside
   Back; the slide leads to the passcode, and the money lands the way any
   money in does: on the card, in the day, and in a chat from Beetle with
   the receipt. Reached from Loan on the home grid and All services. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AmountPicker, Caption, Chevron, Icon, Label, Meta, PageHead, Row, Screen, Tap, colour, toast } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { useSetup } from '../setup';
import { SetupOffer } from '../setup/Offer';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { PasscodeSheet, lockedFor } from '../passcode';
import { naira } from '../../lib/format';
import { COLLECTED, LOAN, MISSED, TERMS, costOf, countWord, dayOf, type Term } from './loan';

export function Loan() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const balance = (account ? holdingsFor(account).everyday : 0) + balanceOf(moves);
  /* the frame opens on ₦150,000 for 90 days */
  const [amount, setAmount] = useState(150_000);
  const [days, setDays] = useState<Term>(90);
  /** what is open in place: the days, what happens if a payment is missed, the cost line by line */
  const [open, setOpen] = useState<null | 'days' | 'missed' | 'cost'>(null);
  const [guard, setGuard] = useState(false);
  const cost = useMemo(() => costOf(amount, days), [amount, days]);
  const toggle = (k: 'days' | 'missed' | 'cost') => setOpen(o => (o === k ? null : k));

  const slide = () => {
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${shut} seconds and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the money is in, with a line in the day and Beetle's word on it */
  const done = () => {
    if (!account) return;
    const at = clock();
    const move: Move = { name: 'Beetle Loans', detail: `Loan · ${days} days · ${at}`, amount, icon: 'loan', kind: 'in', reference: `Paid back over ${days} days` };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    const after = balance + amount;
    file({
      id: `loan-${row.id}`,
      startedBy: 'beetle',
      title: `${naira(amount)} borrowed`,
      detail: `From Beetle Loans · ${days} days`,
      time: at,
      day: 'today',
      turns: [
        turn.say(
          `${naira(amount)} from Beetle Loans is in your balance now: ${naira(after)}. The first of ${countWord(cost.payments).toLowerCase()} payments, ${naira(cost.each)}, goes on ${dayOf(cost.first)}; I tell you the day before.`,
        ),
        turn.receipt({ rowId: row.id, amount: naira(amount), line: 'From Beetle Loans', status: 'Received', time: at }),
      ],
      pending: null,
      unread: true,
    });
    setGuard(false);
    router.replace(`/receipt/${row.id}`);
  };

  useFoot({ kind: 'slide', label: 'Slide to take', amount: naira(amount), disabled: amount < LOAN.least || !setup.done, onSlide: slide, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  const payments = `${countWord(cost.payments)} payment${cost.payments === 1 ? '' : 's'} of`;
  return (
    <>
      <Screen head={<PageHead lead title="Borrow" sub={`Up to ${naira(LOAN.most)}, paid back monthly`} />}>
        <View style={s.card} testID="loan-card">
          {/* how much: the first thing, picked where it is */}
          <View style={s.picker} testID="loan-amount">
            <AmountPicker
              value={amount}
              onChange={setAmount}
              max={LOAN.most}
              note={amount && amount < LOAN.least ? `The least is ${naira(LOAN.least)}` : `${naira(LOAN.most)} is your limit`}
              warn={!!amount && amount < LOAN.least}
              chips={[50_000, 100_000]}
              all="Your limit"
            />
          </View>
          {/* what it comes to: tight, labels left and figures right, the total the strongest */}
          <View style={s.sheet} testID="facts">
            <Tap
              accessibilityRole="button"
              accessibilityLabel={`Pay back over ${days} days`}
              accessibilityState={{ expanded: open === 'days' }}
              onPress={() => toggle('days')}
              style={s.line}
              testID="terms"
            >
              <Meta tone="secondary">Pay back over</Meta>
              <View style={s.pick}>
                <Label>{`${days} days`}</Label>
                <Chevron dir={open === 'days' ? 'up' : 'down'} size={14} colour={colour.textSecondary} />
              </View>
            </Tap>
            {open === 'days' ? (
              <View style={s.choices} testID="term-list">
                {TERMS.map(t => (
                  <Tap
                    key={t}
                    accessibilityRole="button"
                    accessibilityLabel={`${t} days`}
                    accessibilityState={{ selected: t === days }}
                    onPress={() => {
                      setDays(t);
                      setOpen(null);
                    }}
                    style={s.choice}
                  >
                    <Label style={{ flex: 1 }}>{`${t} days`}</Label>
                    <Caption tone="secondary">{`${countWord(t / 30).toLowerCase()} payment${t === 30 ? '' : 's'} of ${naira(costOf(amount, t).each)}`}</Caption>
                    {t === days ? <Icon name="check" size={14} colour={colour.ink} /> : <View style={{ width: 14 }} />}
                  </Tap>
                ))}
              </View>
            ) : null}
            <View style={s.line}>
              <Row>You pay back</Row>
              <Row testID="loan-total">{naira(cost.total)}</Row>
            </View>
            <View style={s.line}>
              <Meta tone="secondary">{payments}</Meta>
              <Label>{naira(cost.each)}</Label>
            </View>
            <View style={s.line}>
              <Meta tone="secondary">First payment</Meta>
              <Label>{dayOf(cost.first)}</Label>
            </View>
            <View style={s.line}>
              <Meta tone="secondary">Taken</Meta>
              <Label>From Everyday, on the day</Label>
            </View>
            <View style={s.rule} />
            <More label="If a payment is missed" open={open === 'missed'} onPress={() => toggle('missed')} testID="loan-missed">
              {[MISSED.collateral, MISSED.fee, MISSED.collect, MISSED.bureau].map(w => (
                <Caption key={w} tone="secondary">{`· ${w}`}</Caption>
              ))}
            </More>
            <More label="The cost, line by line" open={open === 'cost'} onPress={() => toggle('cost')} testID="loan-cost">
              <Small label="You get today" value={naira(amount)} />
              <Small label={`Interest, ${Math.round(LOAN.monthly * 100)}% a month`} value={naira(cost.interest)} />
              <Small label="One off fee" value={naira(cost.fee)} />
              <Caption tone="tertiary">{COLLECTED}. Paying early costs nothing extra.</Caption>
            </More>
          </View>
        </View>
        <View style={s.lock} testID="lock-line">
          <View style={{ marginTop: 2 }}>
            <Icon name="lock" size={16} colour={colour.textTertiary} />
          </View>
          <Meta tone="secondary" style={{ flex: 1 }}>
            No collateral. Nothing comes in or goes out until you slide and enter your passcode.
          </Meta>
        </View>
        {/* borrowing is one of the things finishing setting up turns on: at the foot, not in the way */}
        {setup.done ? null : <SetupOffer sub="Two minutes, and you can borrow against your history" />}
      </Screen>
      {guard ? (
        <PasscodeSheet
          amount={naira(amount)}
          name="Beetle Loans"
          detail={`${days} days · ${countWord(cost.payments).toLowerCase()} payment${cost.payments === 1 ? '' : 's'} of ${naira(cost.each)}`}
          glyph="loan"
          rows={[
            { label: 'You get today', value: naira(amount) },
            { label: 'First payment', value: `${naira(cost.each)} on ${dayOf(cost.first)}` },
            { label: 'If one is missed', value: `${naira(LOAN.late)} a week` },
            { label: 'You pay back', value: naira(cost.total), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

/* A row that opens in place: its words, a chevron, and under it what it holds. */
function More({ label, open, onPress, children, testID }: { label: string; open: boolean; onPress: () => void; children: React.ReactNode; testID?: string }) {
  return (
    <View>
      <Tap accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open }} onPress={onPress} style={s.line} testID={testID}>
        <Meta tone="secondary">{label}</Meta>
        <Chevron dir={open ? 'up' : 'down'} size={14} colour={colour.textSecondary} />
      </Tap>
      {open ? <View style={s.more}>{children}</View> : null}
    </View>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.small}>
      <Caption tone="secondary">{label}</Caption>
      <Caption style={{ color: colour.ink }}>{value}</Caption>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 12, gap: 8 },
  /* the picker on its own white, as the amounts on the paying pages sit */
  picker: { backgroundColor: colour.surface, borderRadius: 20, paddingTop: 20, paddingBottom: 16 },
  /* the breakdown: one white card, rows 36 tall, nothing boxed */
  sheet: { backgroundColor: colour.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 36, borderRadius: 10 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  choices: { backgroundColor: colour.surface2, borderRadius: 14, paddingHorizontal: 12, marginBottom: 4 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, borderRadius: 10 },
  rule: { height: 1, backgroundColor: colour.rule, marginVertical: 4 },
  more: { gap: 4, paddingBottom: 8 },
  small: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: -6 },
});
