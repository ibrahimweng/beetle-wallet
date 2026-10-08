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
   small × at its top right puts the offers away until Beetle next opens
   (the owner's choice, Round 14), and the empty card takes their place, so
   the black card keeps its shape (Round 16, the owner's word): a ring, a
   grey tile, No promos, and a next step that is true for the account (the
   owner's words, fitted). With nothing to offer at all it is there too. */
import React, { memo, useEffect, useMemo, useState } from 'react';
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
  const title = 'No promos';
  if (!goal) return { title, sub: 'Start a savings goal with your first deposit', to: '/goal?new=1' };
  if (goal.aside > 0) return { title, sub: `Add to ${goal.name} whenever you like`, to: '/goal' };
  return { title, sub: `Start your ${goal.name} savings with your first deposit`, to: '/goal' };
}

/** How tall the card is. */
export const PROMO_H = 84;
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

/** Drawn again only when what it is given changes (Round 29). */
export const Promos = memo(PromosView);
function PromosView({ width, promos, quiet }: { width: number; promos: Promo[]; quiet: Quiet }) {
  const router = useRouter();
  const still = useStill();
  const swipe = usePagerSwipe();
  const w = width - 2 * SIDE;
  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(away);
  /* the × fades the offers out over the empty card, which fades in under them where they were */
  const [leaving, setLeaving] = useState(false);
  const fold = useSharedValue(1);
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
  const folding = useAnimatedStyle(() => ({ opacity: fold.value, transform: [{ scale: 0.98 + 0.02 * fold.value }] }));
  const press = useTap();
  /* the dots not showing, in the deep shade of whichever offer is, blending as the strip moves */
  const deeps = promos.map(p => shadeOf(p.tone).deep);
  /* the empty card: where the offers were once the × has put them away, or when there are none; drawn first, so the
     offers lie over it while they go, and kept as it is when they have gone */
  const empty = !count || gone || leaving ? <QuietCard width={w} quiet={quiet} arrive={leaving} /> : null;
  if (!count || gone) return <View>{empty}</View>;
  const promo = promos[Math.min(shown, count - 1)]!;
  /* the dots' room at the right of every card, so the words never run under them or the × */
  const dotsW = count > 1 ? 12 + (count - 1) * 9 : 12;
  const close = () => {
    away = true;
    if (still) return setGone(true);
    setLeaving(true);
    fold.value = withTiming(0, { duration: motion.leave - 80, easing: settle }, done => {
      if (done) runOnJS(setGone)(true);
    });
  };
  return (
    <View>
      {empty}
      {/* nothing said about touches unless they are leaving: said, it would outrank the black card's own none while it is open, on the web */}
      <Animated.View style={[leaving ? StyleSheet.absoluteFill : null, folding]} pointerEvents={leaving ? 'none' : undefined} testID="promos">
        <View style={s.wrap}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[s.window, { width: w }, press.style]}>
              <Animated.View style={[s.strip, { width: w * count }, strip]}>
                {promos.map(p => (
                  <View key={p.id} style={[s.card, { width: w, backgroundColor: wash(p.tone) }]} testID={`promo-${p.id}`}>
                    <View style={[s.glyph, { backgroundColor: p.tone }]}>
                      <Icon name={p.glyph} size={20} colour={dark.paper} />
                    </View>
                    <View style={s.words}>
                      <Caption numberOfLines={1} style={{ color: dark.paper }}>
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
    </View>
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
    const deep = deeps.length > 1 ? interpolateColor(at, places, deeps) : (deeps[0] ?? dark.paper);
    return { width: interpolate(near, [0, 1], [5, 12]), backgroundColor: interpolateColor(near, [0, 1], [deep, dark.paper]) };
  });
  return <Animated.View style={[s.dot, style]} />;
}

/** The empty card, where the offers were: a ring on the black, a grey tile,
    the owner's No promos over a next step that is true for the account,
    which a tap takes. No × and no dots: there is nothing to put away or to
    swipe to. Put in place by the ×, it fades in as the offers fade out. */
function QuietCard({ width, quiet, arrive }: { width: number; quiet: Quiet; arrive: boolean }) {
  const router = useRouter();
  const still = useStill();
  const k = useSharedValue(arrive && !still ? 0 : 1);
  useEffect(() => {
    if (k.value < 1) k.value = withTiming(1, { duration: motion.leave, easing: settle });
  }, [k]);
  const coming = useAnimatedStyle(() => ({ opacity: k.value, transform: [{ scale: 0.98 + 0.02 * k.value }] }));
  return (
    <Animated.View style={[s.wrap, coming]}>
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
    </Animated.View>
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
