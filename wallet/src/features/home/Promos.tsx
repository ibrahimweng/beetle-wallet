/* What Beetle has to offer, on one card the width of the page, directly
   under the black card and over the four cards (Round 13, the owner's
   word: "promo cards ... above the four cards in the home screen, directly
   under the hero part", one card at a time with dots, the owner's choice).

   Each card is one of Beetle's own things, picked for the account: finish
   setting up while it is not done, start a goal (or save into the one
   there is), borrow once borrowing is open, pay light and TV. A swipe
   across it brings the next, and a tap opens what it offers. A swipe that
   starts on it is the card's, not the pages'.

   Round 14, the owner's home frame: the words are smaller (14 over 11), the
   small dots that say which is showing sit inside the card at its bottom
   right, and a small × at its top right puts the promos away, the card
   folding up and the four cards rising into its place, until Beetle next
   opens (the owner's choice: they come back the next time it opens). */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { Icon, Label, Small, Tap, colour, motion, settle, swipes, useStill, useTap } from '../../design';
import type { IconName } from '../../icons';
import { naira } from '../../lib/format';
import { LOAN } from '../loan/loan';
import { settleOn, usePagerSwipe } from '../tabs';
import { GRID_SIDE } from './Grid';

export type Promo = { id: string; glyph: IconName; tone: string; title: string; sub: string; to: string };

/** The promos for an account, most useful first. */
export function promosFor({ setUp, goal }: { setUp: boolean; goal: string | null }): Promo[] {
  const list: Promo[] = [];
  if (!setUp)
    list.push({
      id: 'setup',
      glyph: 'shield-filled',
      tone: colour.accent,
      title: 'Finish setting up',
      sub: `Send up to ${naira(1_000_000)} a day, and borrow when you need to`,
      to: '/way-in?setup=1',
    });
  list.push(
    goal
      ? { id: 'save', glyph: 'pot', tone: colour.good, title: 'Save in four taps', sub: `Add money to ${goal} from home, whenever you like`, to: '/goal' }
      : { id: 'goal', glyph: 'pot', tone: colour.good, title: 'Start a goal in three taps', sub: 'Rent, school fees or a trip: put money away as it comes', to: '/goal?new=1' },
  );
  if (setUp) list.push({ id: 'loan', glyph: 'loan', tone: colour.violet, title: `Borrow up to ${naira(LOAN.most)}`, sub: 'In a minute, paid back monthly', to: '/loan' });
  list.push({ id: 'bills', glyph: 'power', tone: colour.warn, title: 'Pay light and TV in two taps', sub: 'Your meters are kept, so it is the amount and done', to: '/bills' });
  return list;
}

/** How tall the card is. */
export const PROMO_H = 84;
/** Between the promo card and the four cards; it folds away with the card. */
export const PROMO_GAP = 16;
/** The page's sides, the four cards' own. */
const SIDE = GRID_SIDE;
/** The × and the dots: 16 in from the card's right, 17 from its top and its bottom, level with the words. */
const CORNER = 16;
const EDGE = 17;
/** How the strip settles, and how much a pull past either end gives. */
const SETTLE = { damping: 30, stiffness: 300, mass: 0.8, overshootClamping: true } as const;
const GIVE = 1 / 3;
/** The frame's ×: two thin strokes in the pale grey, 12 across. */
const CLOSE = `<svg viewBox="0 0 12 12" fill="none"><path d="M1.6 1.6L10.4 10.4M10.4 1.6L1.6 10.4" stroke="${colour.ruleStrong}" stroke-width="1.2" stroke-linecap="round"/></svg>`;

/** Put away by the ×, for the rest of this run of Beetle: the next time it opens they are back. */
let away = false;

export function Promos({ width, promos }: { width: number; promos: Promo[] }) {
  const router = useRouter();
  const still = useStill();
  const swipe = usePagerSwipe();
  const w = width - 2 * SIDE;
  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(away);
  const fold = useSharedValue(away ? 0 : 1);
  const count = promos.length;
  const pan = useMemo(() => {
    const g = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onStart(() => {
        cancelAnimation(x);
        from.value = x.value;
        runOnJS(swipes.start)();
      })
      .onUpdate(e => {
        const max = (count - 1) * w;
        const nx = from.value - e.translationX;
        x.value = nx < 0 ? nx * GIVE : nx > max ? max + (nx - max) * GIVE : nx;
      })
      .onEnd(e => {
        const start = Math.max(0, Math.min(count - 1, Math.round(from.value / w)));
        const to = settleOn(start, e.translationX, e.velocityX, w, count);
        x.value = withSpring(to * w, { ...SETTLE, velocity: -e.velocityX });
        runOnJS(setShown)(to);
        runOnJS(swipes.end)();
      });
    /* the pages wait for this one: a sideways swipe that starts on the card moves the card */
    return swipe ? g.blocksExternalGesture(swipe) : g;
  }, [swipe, w, count]); // eslint-disable-line react-hooks/exhaustive-deps
  const strip = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));
  /* the card and the gap under it fold away together, so the four cards rise into the place */
  const folding = useAnimatedStyle(() => ({ height: fold.value * (PROMO_H + PROMO_GAP), opacity: fold.value }));
  const press = useTap();
  if (!count || gone) return null;
  const promo = promos[Math.min(shown, count - 1)]!;
  /* the dots' room at the right of every card, so the words never run under them or the × */
  const dotsW = count > 1 ? 12 + (count - 1) * 9 : 12;
  const close = () => {
    away = true;
    if (still) {
      setGone(true);
      return;
    }
    fold.value = withTiming(0, { duration: motion.leave, easing: settle }, done => {
      if (done) runOnJS(setGone)(true);
    });
  };
  return (
    <Animated.View style={[s.fold, folding]} testID="promos">
      <View style={s.wrap}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[s.window, { width: w }, press.style]}>
            <Animated.View style={[s.strip, { width: w * count }, strip]}>
              {promos.map(p => (
                <View key={p.id} style={[s.card, { width: w, backgroundColor: wash(p.tone) }]} testID={`promo-${p.id}`}>
                  <View style={[s.glyph, { backgroundColor: p.tone }]}>
                    <Icon name={p.glyph} size={20} colour="#ffffff" />
                  </View>
                  <View style={s.words}>
                    <Label numberOfLines={1} style={s.title}>
                      {p.title}
                    </Label>
                    <Small tone="secondary" numberOfLines={2}>
                      {p.sub}
                    </Small>
                  </View>
                  <View style={{ width: dotsW }} />
                </View>
              ))}
            </Animated.View>
            {/* the one showing takes the tap, anywhere on the card */}
            <Tap
              accessibilityRole="button"
              accessibilityLabel={promo.title}
              accessibilityHint={count > 1 ? 'Swipe for the others' : undefined}
              onPress={() => router.push(promo.to as never)}
              onPressIn={press.onPressIn}
              onPressOut={press.onPressOut}
              scale={1}
              style={StyleSheet.absoluteFill}
              testID="promo-card"
            />
            {/* which is showing: inside the card, at its bottom right, staying put while the strip moves */}
            {count > 1 ? (
              <View style={s.dots} pointerEvents="none" testID="promo-dots">
                {promos.map((p, i) => (
                  <Dot key={p.id} i={i} x={x} step={w} />
                ))}
              </View>
            ) : null}
            <Tap accessibilityRole="button" accessibilityLabel="Hide the offers" onPress={close} hitSlop={14} scale={0.9} style={s.close} testID="promo-close">
              <SvgXml xml={CLOSE} width={12} height={12} />
            </Tap>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

/** A promo's ground: its own colour, very faint, so the card reads as an offer and not as one of the four. */
const wash = (tone: string) => `${tone}14`;

function Dot({ i, x, step }: { i: number; x: SharedValue<number>; step: number }) {
  const style = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(x.value / step - i));
    return { width: interpolate(near, [0, 1], [5, 12]), backgroundColor: interpolateColor(near, [0, 1], [colour.ruleStrong, colour.ink]) };
  });
  return <Animated.View style={[s.dot, style]} />;
}

const s = StyleSheet.create({
  fold: { overflow: 'hidden' },
  wrap: { paddingHorizontal: SIDE, paddingBottom: PROMO_GAP },
  window: { height: PROMO_H, borderRadius: 20, overflow: 'hidden' },
  strip: { flexDirection: 'row', height: PROMO_H },
  card: { height: PROMO_H, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyph: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, gap: 2 },
  /* the frame sets the title 14 on a line of 16 */
  title: { lineHeight: 16 },
  dots: { position: 'absolute', right: CORNER, bottom: EDGE, flexDirection: 'row', alignItems: 'center', gap: 4, height: 5 },
  dot: { height: 5, borderRadius: 2.5 },
  close: { position: 'absolute', right: CORNER, top: EDGE, width: 12, height: 12 },
});
