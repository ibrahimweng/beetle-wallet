/* Borrow, from its frame: Beetle's word that here is the whole cost, the
   figure with less and more either side of it and the bar under, the
   three terms, and the cost laid out row by row — what you get today, the
   interest, the fee, what it comes to, the payments and the first of them
   — with the word about paying late at the foot, and Slide to take beside
   Back. The slide leads to the passcode; the money then lands the way any
   money in does: on the card, in the day, and in a chat from Beetle with
   the receipt. Reached from Loan on All services and from "borrow" typed
   at home. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Display, Facts, Icon, Label, Meta, PageHead, Say, Screen, Tap, colour, toast } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { PasscodeSheet, lockedFor } from '../passcode';
import { naira } from '../../lib/format';
import { LOAN, TERMS, costOf, countWord, dayOf, held, type Term } from './loan';

export function Loan() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const { file } = useChats(account?.accountNumber, !!account?.demo);
  const balance = (account ? holdingsFor(account).everyday : 0) + balanceOf(moves);
  /* the frame opens on ₦150,000 for 90 days */
  const [amount, setAmount] = useState(150_000);
  const [days, setDays] = useState<Term>(90);
  const [guard, setGuard] = useState(false);
  const cost = useMemo(() => costOf(amount, days), [amount, days]);

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

  useFoot({ kind: 'slide', label: 'Slide to take', amount: naira(amount), onSlide: slide, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  /* the bar shows the figure against the limit, as the frame fills it */
  const share = amount / LOAN.most;
  return (
    <>
      <Screen head={<PageHead lead title="Borrow" sub="The whole cost, before you decide" />}>
        <Say testID="say">You asked what you could borrow. Here is the whole cost.</Say>
        {/* the frame runs the grey card 12 under the bubble */}
        <View style={s.card} testID="loan-card">
          <Body tone="secondary">How much you want</Body>
          <View style={s.figureRow}>
            <Tap
              accessibilityRole="button"
              accessibilityLabel="Less"
              onPress={() => setAmount(a => held(a - LOAN.step))}
              disabled={amount <= LOAN.least}
              style={[s.disc, amount <= LOAN.least ? { opacity: 0.4 } : null]}
              testID="less"
            >
              <Icon name="minus" size={20} colour={colour.ink} />
            </Tap>
            <Display style={{ flex: 1, textAlign: 'center' }} accessibilityLiveRegion="polite">
              {naira(amount)}
            </Display>
            <Tap
              accessibilityRole="button"
              accessibilityLabel="More"
              onPress={() => setAmount(a => held(a + LOAN.step))}
              disabled={amount >= LOAN.most}
              style={[s.disc, { marginRight: 4 }, amount >= LOAN.most ? { opacity: 0.4 } : null]}
              testID="more"
            >
              <Icon name="plus" size={20} colour={colour.ink} />
            </Tap>
          </View>
          <View style={{ marginTop: 12 }} testID="range">
            <View style={s.bar}>
              <View style={[s.fill, { width: `${Math.round(share * 1000) / 10}%` }]} />
            </View>
            {/* the frame boxes the two figures at 18, a line of 20 running over */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 18, marginTop: 8, overflow: 'visible' }}>
              <Meta tone="secondary">{naira(LOAN.least)}</Meta>
              <Meta tone="secondary">{`${naira(LOAN.most)} is your limit`}</Meta>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, height: 46, overflow: 'visible' }} testID="terms">
            {TERMS.map(t => (
              <Tap
                key={t}
                accessibilityRole="button"
                accessibilityLabel={`${t} days`}
                accessibilityState={{ selected: t === days }}
                onPress={() => setDays(t)}
                style={[s.term, t === days ? s.termOn : null]}
              >
                <Label tone={t === days ? 'inverse' : 'ink'}>{`${t} days`}</Label>
              </Tap>
            ))}
          </View>
        </View>
        <View style={{ marginTop: -8 }}>
          <Facts
            row={54}
            inset={10}
            testID="facts"
            rows={[
              { label: 'You get today', value: naira(amount) },
              { label: `Interest, ${Math.round(LOAN.monthly * 100)}% a month`, value: naira(cost.interest) },
              { label: 'One off fee', value: naira(cost.fee) },
              { label: 'You pay back in all', value: naira(cost.total), strong: true },
              { label: `${countWord(cost.payments)} payment${cost.payments === 1 ? '' : 's'} of`, value: naira(cost.each) },
              { label: 'First payment', value: dayOf(cost.first) },
            ]}
          />
        </View>
        <View style={s.lock} testID="lock-line">
          <View style={{ marginTop: 2 }}>
            <Icon name="lock" size={16} colour={colour.textTertiary} />
          </View>
          <Meta tone="secondary" style={{ flex: 1 }}>{`Pay late and it costs ${naira(LOAN.late)} a week on top, and I tell you before it does.`}</Meta>
        </View>
      </Screen>
      {guard ? (
        <PasscodeSheet
          amount={naira(amount)}
          name="Beetle Loans"
          detail={`${days} days · ${countWord(cost.payments).toLowerCase()} payments of ${naira(cost.each)}`}
          glyph="loan"
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  /* the frame boxes the bubble's row at 70 and runs the grey card 12 under that: 82 under the row's top, which the 80 bubble and no gap make here */
  card: { marginTop: -20, backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14 },
  figureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, height: 45 },
  disc: { width: 40, height: 40, borderRadius: 20, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colour.rule, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colour.accent },
  term: { flex: 1, height: 48, borderRadius: 24, backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule, alignItems: 'center', justifyContent: 'center' },
  termOn: { backgroundColor: colour.ink, borderColor: colour.ink },
  lock: { marginTop: -8, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
