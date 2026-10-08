/* Home's four cards, two by two under the black card, laid out the way
   Fuse lays out its own: pale grey, rounded 20, a 32 glyph at the top left,
   and at the foot a small grey word and a bold figure. Measured off Fuse's
   home (167 × 150 on a 393 screen, 24 in and 10 apart); here 24 in (the
   owner's home frame, Round 14) and 24 apart both ways (Round 15, the
   owner's frame), 152 tall. The line at the foot is 10, the frame's.

   Savings says the most, with care: the goal's ring, what is put aside and
   the target, how it is going — ahead, or Paused while money is tight, or
   nothing in it yet — and Start a goal where there is none. With several
   goals it says how many and how far along they are together. Loan is what
   could be borrowed. Card is the virtual card by its last four, or Frozen.
   Services is laid out like the other three — a glyph at the top left, a
   word and a figure at the foot — and shows All services until it is
   swiped, then Bills, Airtime and Data: the glyph and the name slide
   together, four small dots at the top right say which is showing, a tap
   anywhere on it opens that one, and a tap on the word Services opens All
   services. A swipe that starts on it is the card's, not the pages'. Each
   card leads to its page, which comes up over home as a sheet. */
import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { Fine, Icon, Meta, Progress, Row, Tap, colour, font, swipes, useDeparture, useTap } from '../../design';
import type { IconName } from '../../icons';
import { naira } from '../../lib/format';
import { standingOf, together, useGoals, type Standing } from '../goal';
import { LOAN } from '../loan/loan';
import { CARD, lastFour } from '../settings/card';
import { usePrefs } from '../settings/prefs';
import { settleOn, usePagerSwipe } from '../tabs';
import type { LedgerRow } from './account';

export const GRID_SIDE = 24;
export const GRID_GAP = 24;
export const TILE_H = 152;
/** How far in from a card's edge its pieces sit. */
const PAD = 16;
/** The glyph at a card's top left, and the ring that stands in for it on Savings. */
const GLYPH = 32;

/** Drawn again only when what it is given changes, not with every word the chat above it streams in (Round 29). */
export const Grid = memo(GridView);
function GridView({ width, accountNumber, demo, moves, borrowing }: { width: number; accountNumber: string; demo: boolean; moves: LedgerRow[]; borrowing: boolean }) {
  const { prefs } = usePrefs(accountNumber);
  const w = Math.floor((width - 2 * GRID_SIDE - GRID_GAP) / 2);
  const { goals } = useGoals(accountNumber, { demo, started: prefs.goal });
  const list = goals.map(g => standingOf(g, { goals, demo, tight: prefs.tight, moves }));
  return (
    <View style={s.grid} testID="grid">
      <View style={s.row}>
        <Savings w={w} list={list} />
        <GridCard
          id="loan"
          to="/loan"
          w={w}
          lead={<Glyph glyph="loan" tone={colour.warn} />}
          label={borrowing ? 'Borrow up to' : 'Loan'}
          figure={borrowing ? naira(LOAN.most) : 'Not yet'}
          sub={borrowing ? 'Over 30 to 90 days' : 'Finish setting up'}
        />
      </View>
      <View style={s.row}>
        <GridCard
          id="card"
          to="/card"
          w={w}
          lead={<Glyph glyph="card" tone={colour.ink} />}
          label="Virtual card"
          figure={`•••• ${lastFour()}`}
          sub={prefs.cardFrozen ? 'Frozen' : `${naira(CARD.ceiling - CARD.spent + (prefs.cardLoaded ?? 0))} to spend`}
          subTone={prefs.cardFrozen ? colour.cyan : undefined}
        />
        <Services w={w} />
      </View>
    </View>
  );
}

/* A glyph on its own colour, 32 and rounded, the way an app's icon sits. */
function Glyph({ glyph, tone }: { glyph: IconName; tone: string }) {
  return (
    <View style={[s.glyph, { backgroundColor: tone }]}>
      <Icon name={glyph} size={18} colour={colour.textInverse} />
    </View>
  );
}

/* One card: the glyph at the top, the word and the figure at the foot. It
   leads to its page, lighting while the page comes out of it. */
function GridCard({
  id,
  to,
  w,
  lead,
  label,
  figure,
  sub,
  subTone,
  words,
}: {
  id: string;
  to: string;
  w: number;
  lead: React.ReactNode;
  label: string;
  figure: string;
  sub?: string;
  subTone?: string;
  /** what the page's title arrives as, where it is not the word on the card */
  words?: string;
}) {
  const j = useDeparture({ id: `grid:${id}`, to, words: words ?? label });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={`${label} ${figure}`} onPress={j.onPress} style={[s.card, { width: w }]} testID={`grid-${id}`}>
      <Animated.View style={[StyleSheet.absoluteFill, s.lit, j.lit]} pointerEvents="none" />
      {lead}
      <View style={s.foot}>
        <Meta tone="secondary" numberOfLines={1}>
          {label}
        </Meta>
        <Row style={s.figure} numberOfLines={1}>
          {figure}
        </Row>
        {sub ? (
          <Fine tone="tertiary" numberOfLines={1} style={subTone ? { color: subTone } : undefined}>
            {sub}
          </Fine>
        ) : null}
      </View>
    </Tap>
  );
}

/* Savings, the one that says the most. The ring is the goals' own, in green
   while they move and grey while they wait; the pot sits in it. Under, the
   goal's name and how far along (or how many goals, and how far along
   together), what is put aside, and how the first is going: a fortnight
   ahead, so much a month to get there, paused, there already. With no goal,
   the card asks for one. */
function Savings({ w, list }: { w: number; list: Standing[] }) {
  const first = list[0];
  const all = together(list);
  const paused = !!first && list.every(s => s.paused);
  const ring = (
    <Progress size={GLYPH} width={3.5} pct={all.pct} tone={paused ? colour.textTertiary : colour.good} testID="savings-ring">
      <Icon name="pot" size={15} colour={paused ? colour.textTertiary : colour.goodText} />
    </Progress>
  );
  /* each short enough for the card on any phone: the goal's page says the rest */
  const sub = !first
    ? 'A little at a time'
    : paused
      ? 'Paused for now'
      : first.state === 'reached'
        ? 'There already'
        : first.state === 'empty'
          ? `Aiming for ${naira(first.goal.target)}`
          : first.sums.payday
            ? 'A fortnight ahead'
            : `${naira(first.goal.target - first.aside)} to go`;
  return (
    <GridCard
      id="savings"
      to="/goal"
      w={w}
      lead={ring}
      label={!first ? 'Savings' : list.length > 1 ? `${list.length} goals · ${all.pct}%` : `${first.goal.name} · ${first.pct}%`}
      figure={!first ? 'Start a goal' : naira(all.aside)}
      sub={sub}
      subTone={paused ? colour.warn : first && first.state !== 'empty' ? colour.goodText : undefined}
      words={!first ? 'Goals' : first.goal.name}
    />
  );
}

/* ---- Services: All services first, then three to swipe through inside the card ---- */

type Item = { glyph: IconName; tone: string; label: string; sub: string; to: string };
/** All services is what the card shows until it is swiped (the owner's word,
    Round 13); then Bills, Airtime and Data, in the owner's order. */
const ITEMS: Item[] = [
  { glyph: 'grid', tone: colour.ink, label: 'All services', sub: 'Bills, airtime, data and more', to: '/services' },
  { glyph: 'power', tone: colour.warn, label: 'Bills', sub: 'Light, TV and more', to: '/bills' },
  { glyph: 'airtime', tone: colour.accent, label: 'Airtime', sub: 'For any network', to: '/buy?kind=airtime' },
  { glyph: 'data', tone: colour.violet, label: 'Data', sub: 'A plan for any line', to: '/buy' },
];
/** How the three settle, and how much a pull past either end gives. */
const SETTLE = { damping: 30, stiffness: 300, mass: 0.8, overshootClamping: true } as const;
const GIVE = 1 / 3;

function Services({ w }: { w: number }) {
  const router = useRouter();
  const swipe = usePagerSwipe();
  const inner = w - 2 * PAD;
  const x = useSharedValue(0);
  const from = useSharedValue(0);
  const [shown, setShown] = useState(0);
  const ended = (to: number) => setShown(to);
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
        const max = (ITEMS.length - 1) * inner;
        const nx = from.value - e.translationX;
        x.value = nx < 0 ? nx * GIVE : nx > max ? max + (nx - max) * GIVE : nx;
      })
      .onEnd(e => {
        const start = Math.max(0, Math.min(ITEMS.length - 1, Math.round(from.value / inner)));
        const to = settleOn(start, e.translationX, e.velocityX, inner, ITEMS.length);
        x.value = withSpring(to * inner, { ...SETTLE, velocity: -e.velocityX });
        runOnJS(ended)(to);
        runOnJS(swipes.end)();
      });
    /* the pages wait for this one: a sideways swipe that starts on the card moves the card */
    return swipe ? g.blocksExternalGesture(swipe) : g;
  }, [swipe, inner]); // eslint-disable-line react-hooks/exhaustive-deps
  const strip = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));
  const all = useDeparture({ id: 'grid:services', to: '/services', words: 'All services' });
  /* the whole card dips under the finger, as the other three do, though what takes the tap lies under its words */
  const press = useTap();
  const item = ITEMS[shown]!;
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[s.card, { width: w }, press.style]} testID="grid-services">
        {/* the one showing, anywhere on the card */}
        <Tap
          accessibilityRole="button"
          accessibilityLabel={item.to === '/services' ? 'All services' : `Services: ${item.label}`}
          accessibilityHint="Swipe for the others"
          onPress={() => router.push(item.to as never)}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          scale={1}
          style={StyleSheet.absoluteFill}
          testID="services-strip"
        />
        {/* the glyphs, sliding with the names */}
        <View style={[s.window, { width: inner, height: GLYPH }]} pointerEvents="none">
          <Animated.View style={[s.strip, { width: inner * ITEMS.length }, strip]}>
            {ITEMS.map(it => (
              <View key={it.label} style={{ width: inner }} testID={`service-${it.label.toLowerCase()}`}>
                <Glyph glyph={it.glyph} tone={it.tone} />
              </View>
            ))}
          </Animated.View>
        </View>
        <Dots x={x} step={inner} />
        <View style={s.foot} pointerEvents="box-none">
          <Tap ref={all.ref} accessibilityRole="button" accessibilityLabel="All services" onPress={all.onPress} hitSlop={8} style={s.servicesHead} testID="services-all">
            <Meta tone="secondary">Services</Meta>
            <Icon name="chevron" size={12} colour={colour.textTertiary} />
          </Tap>
          <View style={[s.window, { width: inner }]} pointerEvents="none">
            <Animated.View style={[s.strip, { width: inner * ITEMS.length }, strip]}>
              {ITEMS.map(it => (
                <View key={it.label} style={{ width: inner }}>
                  <Row style={s.figure} numberOfLines={1}>
                    {it.label}
                  </Row>
                  <Fine tone="tertiary" numberOfLines={1}>
                    {it.sub}
                  </Fine>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

/* The four small dots at the top right, level with the glyph: the one
   showing long and dark, the others round and pale, following the strip as
   it moves. */
function Dots({ x, step }: { x: SharedValue<number>; step: number }) {
  return (
    <View style={s.dots} pointerEvents="none" testID="services-dots">
      {ITEMS.map((it, i) => (
        <Dot key={it.label} i={i} x={x} step={step} />
      ))}
    </View>
  );
}

function Dot({ i, x, step }: { i: number; x: SharedValue<number>; step: number }) {
  const style = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(x.value / step - i));
    return { width: interpolate(near, [0, 1], [5, 12]), backgroundColor: interpolateColor(near, [0, 1], [colour.ruleStrong, colour.ink]) };
  });
  return <Animated.View style={[s.dot, style]} />;
}

const s = StyleSheet.create({
  grid: { paddingHorizontal: GRID_SIDE, gap: GRID_GAP },
  row: { flexDirection: 'row', gap: GRID_GAP },
  card: { height: TILE_H, borderRadius: 20, backgroundColor: colour.surface2, padding: PAD, overflow: 'hidden' },
  lit: { borderRadius: 20 },
  glyph: { width: GLYPH, height: GLYPH, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  foot: { position: 'absolute', left: PAD, right: PAD, bottom: PAD - 2 },
  figure: { fontSize: 18, lineHeight: 24, ...font('700'), letterSpacing: -0.3 },
  servicesHead: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  window: { overflow: 'hidden' },
  strip: { flexDirection: 'row' },
  dots: { position: 'absolute', right: PAD, top: PAD + GLYPH / 2 - 2.5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { height: 5, borderRadius: 2.5 },
});
