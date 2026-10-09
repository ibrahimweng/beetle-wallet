/* Convert, from its frame: from Everyday into Dollars with what each holds
   and a swap between them, the amount with what it comes to in the other
   money under it, the rate, the fee and what you get, Beetle's word
   on the rate this week, the line that the rate is held once you slide,
   and Slide to convert beside Back. The amount is picked where it is:
   the ruler in naira or in dollars, whichever it leaves from, stopping hard
   at what that holds, or the figure typed. The slide leads to the passcode, the
   line goes into the day, the dollars change hands, and its receipt comes
   up over the page as the sheet every payment ends on (Round 19; the
   Converted page is the lab's, for its frame). Convert on Dollars opens it. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Body, Caption, Facts, Icon, Meta, PageHead, Row, Screen, Tap, colour, toast, useStill } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { clock } from '../../lib/clock';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { LAB } from '../../lab/enabled';
import { useSetup } from '../setup';
import { SetupOffer } from '../setup/Offer';
import { naira } from '../../lib/format';
import { RATE_MOVE, convertedToday, dollarsOf, feeForUsd, nairaOf, rateLine, usdFull, usdIn } from './dollars';

export function Convert() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  /* holding dollars is one of the things setting up turns on, however Convert was reached (the analysis after Round 34:
     typed "convert" opened it before) */
  const { setup } = useSetup(account?.accountNumber, !!account?.demo);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  /* naira into dollars, or, swapped, dollars back into naira */
  const [toDollars, setToDollars] = useState(true);
  const [digits, setDigits] = useState(demo ? '155200' : '');
  const [guard, setGuard] = useState(false);
  const amount = Number(digits || 0);
  const usd = toDollars ? usdIn(amount, rate) : amount;
  const fee = feeForUsd(usd, convertedToday(moves));
  /* the fee comes out of the dollars going across, both ways: into dollars there are fewer of them, back to naira
     there is less naira (the analysis after Round 21: back to naira showed the fee and took none) */
  const nairaAmount = toDollars ? amount : nairaOf(Math.max(0, usd - fee), rate);
  const gets = toDollars ? usdFull(Math.max(0, usd - fee)) : naira(nairaAmount);

  const slide = () => {
    if (!amount) return;
    if (!setup.done) {
      toast('Finish setting up first, and you can hold dollars. It takes two minutes.');
      return;
    }
    if (toDollars && amount > balance) {
      router.push(`/short?asked=${amount}&for=convert`);
      return;
    }
    if (toDollars && usd < 1) {
      toast('The least that can go across is a dollar.');
      return;
    }
    if (!toDollars && usd > dollars) {
      toast(`That is more than the ${usdFull(dollars)} you hold.`);
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${waitWords(shut)} and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the line goes into the day, the dollars change hands, and the receipt comes up */
  const done = () => {
    if (!account) return;
    const at = clock();
    const move: Move = toDollars
      ? {
          name: 'Dollars',
          detail: `${usdFull(usd - fee)} at ${rateLine(rate)} · ${at}`,
          amount: -amount,
          icon: 'swap',
          kind: 'convert',
          usd: Math.round((usd - fee) * 100) / 100,
          fee: fee ? nairaOf(fee, rate) : undefined,
        }
      : {
          name: 'Everyday',
          detail: `From ${usdFull(usd)} at ${rateLine(rate)} · ${at}`,
          amount: nairaAmount,
          icon: 'swap',
          kind: 'convert',
          usd: -usd,
          fee: fee ? nairaOf(fee, rate) : undefined,
        };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    /* its receipt comes up over this page as the sheet every payment ends on (Round 19); Done goes back past it */
    router.push(`/receipt/${row.id}?paid=1`);
  };
  const swap = () => {
    setToDollars(v => !v);
    setDigits('');
  };

  useFoot({ kind: 'slide', label: 'Slide to convert', amount: '', disabled: !amount, onSlide: slide, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  const from = toDollars ? { label: 'From', name: 'Everyday', there: `${naira(balance)} there` } : { label: 'From', name: 'Dollars', there: `${usdFull(dollars)} there` };
  const to = toDollars ? { label: 'To', name: 'Dollars', there: `${usdFull(dollars)} there` } : { label: 'To', name: 'Everyday', there: `${naira(balance)} there` };
  return (
    <>
      <Screen head={<PageHead lead title="Convert" sub={toDollars ? 'Naira into dollars, at the rate on this screen' : 'Dollars into naira, at the rate on this screen'} />}>
        {setup.done ? null : <SetupOffer sub="Two minutes, and you can hold dollars" />}
        <View style={s.card} testID="convert-card">
          <View style={s.place} testID="convert-from">
            <View style={{ gap: 4, marginTop: 8 }}>
              <Caption tone="secondary">{from.label}</Caption>
              <Row>{from.name}</Row>
            </View>
            <Meta tone="secondary">{from.there}</Meta>
          </View>
          <View style={s.place} testID="convert-to">
            <View style={{ gap: 4, marginTop: 8 }}>
              <Caption tone="secondary">{to.label}</Caption>
              <Row>{to.name}</Row>
            </View>
            <Meta tone="secondary">{to.there}</Meta>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Swap" onPress={swap} style={s.swap} testID="swap">
            <Icon name="swap" size={18} colour={colour.ink} />
          </Tap>
        </View>
        {/* the amount, picked where it is: in naira or in dollars, whichever it leaves from, stopping hard at what that holds */}
        <View style={s.figure} testID="convert-amount">
          <Meta tone="secondary" style={{ textAlign: 'center', marginBottom: 12 }}>
            You are converting
          </Meta>
          <View style={s.picker}>
            <AmountPicker
              unit={toDollars ? 'naira' : 'dollars'}
              value={amount}
              onChange={v => setDigits(v ? String(v) : '')}
              max={toDollars ? Math.max(0, Math.floor(balance)) : dollars}
              note={`You get about ${gets}`}
              chips={toDollars ? [50_000, 150_000] : [50, 100]}
              all="All of it"
            />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: -4 }}>
          <Facts
            inset={10}
            row={44}
            testID="facts"
            rows={[
              { label: `Rate · up ₦${RATE_MOVE} this week`, value: rateLine(rate) },
              { label: 'Our fee', value: fee ? `${usdFull(fee)}, one percent` : 'Free under $500', tone: fee ? undefined : colour.goodText },
              { label: 'You get', value: gets },
            ]}
          />
        </View>
        <View style={s.lock} testID="lock-line">
          <Icon name="lock" size={16} colour={colour.textTertiary} />
          <Meta tone="secondary">The rate is held for sixty seconds once you slide.</Meta>
        </View>
      </Screen>
      {guard ? (
        <PasscodeSheet
          amount={toDollars ? usdFull(usd - fee) : naira(nairaAmount)}
          name={toDollars ? 'Dollars' : 'Everyday'}
          detail={toDollars ? `From Everyday at ${rateLine(rate)}` : `From your dollars at ${rateLine(rate)}`}
          glyph="swap"
          rows={[
            { label: 'Rate', value: rateLine(rate) },
            { label: 'Our fee', value: fee ? usdFull(fee) : 'Free' },
            { label: 'You get', value: gets },
            toDollars ? { label: 'Leaves Everyday', value: naira(amount), strong: true } : { label: 'Leaves Dollars', value: usdFull(usd), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 2 },
  /* the frame's two places: 62 a row, the words 11 down, the other holding's figure across from them */
  place: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swap: { position: 'absolute', right: 16, top: 46, width: 36, height: 36, borderRadius: 18, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  figure: { marginTop: -4, backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 14, paddingHorizontal: 12, paddingBottom: 12 },
  /* the picker on its own white inside the grey, as the amounts on the paying pages sit */
  picker: { backgroundColor: colour.surface, borderRadius: 20, paddingTop: 20, paddingBottom: 16 },
  /* no bubble over the lock line: the rate's move this week is said on the rate's own row */
  lock: { marginTop: -8, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
