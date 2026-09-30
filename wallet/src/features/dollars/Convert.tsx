/* Convert, from its frame: from Everyday into Dollars with what each holds
   and a swap between them, the figure typed with what it comes to in the
   other money under it, the rate, the fee and what you get, Beetle's word
   on the rate this week, the line that the rate is held once you slide,
   and Slide to convert beside Back. The slide leads to the passcode, the
   line goes into the day, the dollars change hands, and Converted takes
   the page's place. Convert on Dollars opens it. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Body, Caption, Display, Facts, Icon, Meta, PageHead, Row, Say, Screen, Tap, colour, toast, useStill } from '../../design';
import type { Move } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { clock } from '../../lib/clock';
import { PasscodeSheet, lockedFor } from '../passcode';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { RATE_MOVE, dollarsOf, feeForUsd, nairaOf, rateLine, usdFull, usdOf } from './dollars';

export function Convert() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rate = h?.rate ?? 1_552;
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  /* naira into dollars, or, swapped, dollars back into naira */
  const [toDollars, setToDollars] = useState(true);
  const [digits, setDigits] = useState(demo ? '155200' : '');
  const [guard, setGuard] = useState(false);
  const input = useRef<TextInput>(null);
  const amount = Number(digits || 0);
  const usd = toDollars ? usdOf(amount, rate) : amount;
  const nairaAmount = toDollars ? amount : nairaOf(amount, rate);
  const fee = feeForUsd(usd);
  const gets = toDollars ? usdFull(Math.max(0, usd - fee)) : naira(nairaAmount);

  const slide = () => {
    if (!amount) return;
    if (toDollars && amount > balance) {
      router.push(`/short?asked=${amount}`);
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
      toast(`That was three wrong tries. Give it ${shut} seconds and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the line goes into the day, the dollars change hands, and Converted opens */
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
      : { name: 'Everyday', detail: `From ${usdFull(usd)} at ${rateLine(rate)} · ${at}`, amount: nairaAmount, icon: 'swap', kind: 'convert', usd: -usd };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    router.replace(`/converted/${row.id}`);
  };
  const swap = () => {
    setToDollars(v => !v);
    setDigits('');
    setTimeout(() => input.current?.focus(), 200);
  };

  useFoot({ kind: 'slide', label: 'Slide to convert', amount: '', disabled: !amount, onSlide: slide, veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  const from = toDollars ? { label: 'From', name: 'Everyday', there: `${naira(balance)} there` } : { label: 'From', name: 'Dollars', there: `${usdFull(dollars)} there` };
  const to = toDollars ? { label: 'To', name: 'Dollars', there: `${usdFull(dollars)} there` } : { label: 'To', name: 'Everyday', there: `${naira(balance)} there` };
  return (
    <>
      <Screen head={<PageHead lead title="Convert" sub={toDollars ? 'Naira into dollars, at the rate on this screen' : 'Dollars into naira, at the rate on this screen'} />}>
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
        {/* the figure, typed: the phone's keyboard comes up with the input the page keeps behind it */}
        <Tap accessibilityRole="button" accessibilityLabel="The amount" onPress={() => input.current?.focus()} style={s.figure} testID="convert-amount">
          <Meta tone="secondary">You are converting</Meta>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', height: 45, marginTop: 8 }}>
            <View style={{ marginTop: -3 }}>
              <Display tone={amount ? 'ink' : 'tertiary'}>{toDollars ? naira(amount) : usdFull(amount)}</Display>
            </View>
            <Caret />
          </View>
          <Body tone="secondary" style={{ marginTop: 8 }}>{`You get about ${gets}`}</Body>
          <TextInput
            ref={input}
            accessibilityLabel="Amount to convert"
            value={digits}
            onChangeText={v => setDigits(v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9))}
            keyboardType="number-pad"
            caretHidden
            autoFocus={!demo}
            style={s.hidden}
          />
        </Tap>
        <View style={{ paddingHorizontal: 16, marginTop: -4 }}>
          <Facts
            inset={10}
            testID="facts"
            rows={[
              { label: 'Rate', value: rateLine(rate) },
              { label: 'Our fee', value: fee ? `${usdFull(fee)}, one percent` : 'Free under $500', tone: fee ? undefined : colour.goodText },
              { label: 'You get', value: gets },
            ]}
          />
        </View>
        <Say testID="say">{`The rate moved ₦${RATE_MOVE} your way this week. If you were waiting for a better day, this is one of them.`}</Say>
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
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

/* The frame's caret: 2 wide, 34 tall, in the accent, blinking. */
function Caret() {
  const still = useStill();
  const on = useSharedValue(1);
  useEffect(() => {
    if (!still) on.value = withRepeat(withTiming(0, { duration: 530 }), -1, true);
  }, [still, on]);
  const blink = useAnimatedStyle(() => ({ opacity: on.value }));
  return <Animated.View style={[s.caret, blink]} testID="caret" />;
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 2 },
  /* the frame's two places: 62 a row, the words 11 down, the other holding's figure across from them */
  place: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swap: { position: 'absolute', right: 16, top: 46, width: 36, height: 36, borderRadius: 18, backgroundColor: colour.surface, alignItems: 'center', justifyContent: 'center' },
  figure: { marginTop: -4, backgroundColor: colour.surface2, borderRadius: 24, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 13 },
  caret: { width: 2, height: 34, marginLeft: 26, marginTop: 3, backgroundColor: colour.accent, borderRadius: 1 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, left: 0, top: 0 },
  /* the frame boxes the bubble's row 10 shorter than the bubble and sets the lock line 16 under the box */
  lock: { marginTop: -14, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
