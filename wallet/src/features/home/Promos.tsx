/* What Beetle has to offer, on one card the width of the page, directly
   under the black card and over the four cards (Round 13, the owner's
   word: "promo cards ... above the four cards in the home screen, directly
   under the hero part", one card at a time with dots, the owner's choice).

   Each card is one of Beetle's own things, picked for the account: finish
   setting up while it is not done, start a goal (or save into the one
   there is), borrow once borrowing is open, pay light and TV. A swipe
   across it brings the next, small dots under it say which is showing, and
   a tap opens what it offers, sliding in over home. A swipe that starts on
   it is the card's, not the pages'. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { Caption, Icon, Row, Tap, colour, swipes, useTap } from '../../design';
import type { IconName } from '../../icons';
import { naira } from '../../lib/format';
import { LOAN } from '../loan/loan';
import { settleOn, usePagerSwipe } from '../tabs';

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

/** How tall the card is, and how much a pull past either end gives. */
export const PROMO_H = 84;
const SIDE = 20;
const SETTLE = { damping: 30, stiffness: 300, mass: 0.8, overshootClamping: true } as const;
const GIVE = 1 / 3;

export function Promos({ width, promos }: { width: number; promos: Promo[] }) {
  const router = useRouter();
  const swipe = usePagerSwipe();
  const w = width - 2 * SIDE;
  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const [shown, setShown] = useState(0);
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
  const press = useTap();
  if (!count) return null;
  const promo = promos[Math.min(shown, count - 1)]!;
  return (
    <View style={s.wrap} testID="promos">
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.window, { width: w }, press.style]}>
          <Animated.View style={[s.strip, { width: w * count }, strip]}>
            {promos.map(p => (
              <View key={p.id} style={[s.card, { width: w, backgroundColor: wash(p.tone) }]} testID={`promo-${p.id}`}>
                <View style={[s.glyph, { backgroundColor: p.tone }]}>
                  <Icon name={p.glyph} size={20} colour="#ffffff" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row numberOfLines={1}>{p.title}</Row>
                  <Caption tone="secondary" numberOfLines={2}>
                    {p.sub}
                  </Caption>
                </View>
                <Icon name="chevron" size={16} colour={colour.textTertiary} />
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
        </Animated.View>
      </GestureDetector>
      {count > 1 ? (
        <View style={s.dots} pointerEvents="none" testID="promo-dots">
          {promos.map((p, i) => (
            <Dot key={p.id} i={i} x={x} step={w} />
          ))}
        </View>
      ) : null}
    </View>
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
  wrap: { paddingHorizontal: SIDE, gap: 8 },
  window: { height: PROMO_H, borderRadius: 20, overflow: 'hidden' },
  strip: { flexDirection: 'row', height: PROMO_H },
  card: { height: PROMO_H, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyph: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, height: 5 },
  dot: { height: 5, borderRadius: 2.5 },
});
