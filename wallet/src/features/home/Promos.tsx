/* What Beetle has to offer, one card at a time with dots (Round 13, the
   owner's word and choice), inside the black card under Send and Receive
   (Round 15, the owner's frame: the promo moved into the card).

   Each card is one of Beetle's own things, picked for the account: finish
   setting up while it is not done, start a goal (or save into the one
   there is), borrow once borrowing is open, pay light and TV. A swipe
   across it brings the next, and a tap opens what it offers. A swipe that
   starts on it is the card's, not the pages', and a pull down on it is the
   black card's.

   On the black card an offer is a faint wash of its own colour, its title
   white and its second line in a soft shade of that colour, both 12 on 16;
   the dot showing is white and the others a deep shade (the frame draws
   the green one; the owner's choice: each offer keeps its own colour). The
   small × at its top right folds the offers away, the black card getting
   shorter by their room and the four cards rising, until Beetle next opens
   (the owner's choice, Round 14 and again in Round 15). With nothing to
   offer at all, a quiet card stands in their place: a ring, a grey tile,
   No promo, and a next step that is true for the account (the owner's
   words, fitted). */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { Caption, Icon, Label, Small, Tap, colour, dark, motion, offerShade, settle, swipes, useStill, useTap } from '../../design';
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

/** What the quiet card says when there is nothing to offer: the owner's
    words, the line under them true for the account, and where a tap goes. */
export type Quiet = { title: string; sub: string; to: string };
export function quietFor(goal: { name: string; aside: number } | null): Quiet {
  const title = 'No promo';
  if (!goal) return { title, sub: 'Start a savings goal with your first deposit', to: '/goal?new=1' };
  if (goal.aside > 0) return { title, sub: `Add to ${goal.name} whenever you like`, to: '/goal' };
  return { title, sub: `Start your ${goal.name} savings with your first deposit`, to: '/goal' };
}

/** How tall the card is. */
export const PROMO_H = 84;
/** The room the offers take in the black card: the card and the 24 under it,
    down to the grabber. The × folds it away, and the black card with it. */
export const OFFERS_ROOM = PROMO_H + 24;
/** The page's sides, the four cards' own. */
const SIDE = GRID_SIDE;
/** The × and the dots: 16 in from the card's right, 17 from its top and its bottom, level with the words. */
const CORNER = 16;
const EDGE = 17;
/** How the strip settles, and how much a pull past either end gives. */
const SETTLE = { damping: 30, stiffness: 300, mass: 0.8, overshootClamping: true } as const;
const GIVE = 1 / 3;
/** The frame's ×: two thin strokes in the pale grey, 8 across in a box of 12. */
const CLOSE = `<svg viewBox="0 0 12 12" fill="none"><path d="M2.4 2.4L9.6 9.6M9.6 2.4L2.4 9.6" stroke="${colour.ruleStrong}" stroke-width="1.13" stroke-linecap="round"/></svg>`;

/** Put away by the ×, for the rest of this run of Beetle: the next time it opens they are back. */
let away = false;
export const offersAway = () => away;

/** `slot` is the offers' room in the black card, 1 while they are there and
    0 once the × has folded them away; the black card's height follows it. */
export function Promos({ width, promos, quiet, slot }: { width: number; promos: Promo[]; quiet: Quiet; slot: SharedValue<number> }) {
  const router = useRouter();
  const still = useStill();
  const swipe = usePagerSwipe();
  const w = width - 2 * SIDE;
  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(away);
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
  /* folding away: the black card's edge rises over it as it fades */
  const folding = useAnimatedStyle(() => ({ opacity: slot.value }));
  const press = useTap();
  /* the dots not showing, in the deep shade of whichever offer is, blending as the strip moves */
  const deeps = promos.map(p => shadeOf(p.tone).deep);
  if (!count) return <QuietCard width={w} quiet={quiet} />;
  if (gone) return null;
  const promo = promos[Math.min(shown, count - 1)]!;
  /* the dots' room at the right of every card, so the words never run under them or the × */
  const dotsW = count > 1 ? 12 + (count - 1) * 9 : 12;
  const close = () => {
    away = true;
    if (still) {
      slot.value = 0;
      setGone(true);
      return;
    }
    slot.value = withTiming(0, { duration: motion.leave, easing: settle }, done => {
      if (done) runOnJS(setGone)(true);
    });
  };
  return (
    <Animated.View style={folding} testID="promos">
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
                    <Caption numberOfLines={1} style={{ color: '#ffffff' }}>
                      {p.title}
                    </Caption>
                    <Caption numberOfLines={2} style={{ color: shadeOf(p.tone).soft }}>
                      {p.sub}
                    </Caption>
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
                  <Dot key={p.id} i={i} x={x} step={w} deeps={deeps} />
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

/** A promo's ground: its own colour, very faint, so the card reads as an offer on the black. */
const wash = (tone: string) => `${tone}14`;
/** An offer's soft and deep shades; one with a colour of its own not in the table takes the green's. */
const shadeOf = (tone: string) => offerShade[tone] ?? offerShade[colour.good]!;

function Dot({ i, x, step, deeps }: { i: number; x: SharedValue<number>; step: number; deeps: string[] }) {
  const places = deeps.map((_, k) => k);
  const style = useAnimatedStyle(() => {
    const at = x.value / step;
    const near = Math.max(0, 1 - Math.abs(at - i));
    const deep = deeps.length > 1 ? interpolateColor(at, places, deeps) : (deeps[0] ?? '#ffffff');
    return { width: interpolate(near, [0, 1], [5, 12]), backgroundColor: interpolateColor(near, [0, 1], [deep, '#ffffff']) };
  });
  return <Animated.View style={[s.dot, style]} />;
}

/** With nothing to offer: a ring on the black, a grey tile, the owner's No
    promo over a next step that is true for the account, which a tap takes.
    No × and no dots: there is nothing to put away or to swipe to. */
function QuietCard({ width, quiet }: { width: number; quiet: Quiet }) {
  const router = useRouter();
  return (
    <View style={s.wrap}>
      <Tap accessibilityRole="button" accessibilityLabel={quiet.sub} onPress={() => router.push(quiet.to as never)} style={[s.quiet, { width }]} testID="promo-quiet">
        <View style={s.quietTile} testID="promo-quiet-tile">
          <Icon name="freeze" size={20} colour={dark.quietGlyph} />
        </View>
        <View style={s.words}>
          <Label numberOfLines={1} style={s.quietTitle}>
            {quiet.title}
          </Label>
          <Small numberOfLines={2} style={{ color: dark.label }}>
            {quiet.sub}
          </Small>
        </View>
      </Tap>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: SIDE },
  window: { height: PROMO_H, borderRadius: 20, overflow: 'hidden' },
  strip: { flexDirection: 'row', height: PROMO_H },
  card: { height: PROMO_H, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyph: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, gap: 2 },
  /* the quiet card: a ring inside its edge, so the tile sits 17 in, as the frame has it */
  quiet: { height: PROMO_H, borderRadius: 20, borderWidth: 1, borderColor: dark.quietRing, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quietTile: { width: 44, height: 44, borderRadius: 14, backgroundColor: dark.quietTile, alignItems: 'center', justifyContent: 'center' },
  /* the frame sets the quiet title 14 on a line of 16 */
  quietTitle: { lineHeight: 16, color: dark.quietTitle },
  dots: { position: 'absolute', right: CORNER, bottom: EDGE, flexDirection: 'row', alignItems: 'center', gap: 4, height: 5 },
  dot: { height: 5, borderRadius: 2.5 },
  close: { position: 'absolute', right: CORNER, top: EDGE, width: 12, height: 12 },
});
