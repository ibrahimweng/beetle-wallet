/* The black card at the top of home, and what it becomes.

   Closed, it holds the mark and the wallet's name, the balance with its
   reading in dollars, Send and Receive, and a grabber that says pull down.
   Pulled down, it grows to two thirds of the screen and turns into the chat:
   the balance glides up into the header, shrinking as it goes, the buttons
   and the grabber soften away, and a hairline and the conversation arrive
   from below. Pulled back up on its header, it runs the same movements the
   other way. Everything is drawn against one number, `open`, from 0 to 1,
   so a finger can scrub it and the spring can finish it. */
import React, { ReactNode, useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, interpolate, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Caption, Icon, Label, Swap, Tap, blurred, colour, dark, keys, motion, settle as settleCurve, useStill } from '../../design';
import { Frost } from './Frost';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MARK = require('../../../assets/wallet-mark.png');

/** The card's height when closed, as the frame draws it. */
export const CLOSED_H = 352;
/** The status bar's allowance at the top of the card. */
const TOP = 52;
const SIDE = 16;
const HEADER_H = 36;
/** the header band: top allowance, the row, and the gap under it */
export const HEAD_BAND = TOP + HEADER_H + 20;
/** the room the ask bar takes at the foot of the open card: gap, bar, padding */
export const FOOT_BAND = 20 + 48 + 20;
/** how far down the figure and the chip sit when closed */
const FIGURE_TOP = TOP + HEADER_H + 24 + 16 + 4;
/** where they go: the figure after the mark, the chip after the figure */
const FIGURE_LEFT = SIDE + 36 + 12 + 4;
/** the header's row, the figure's smaller line height centred in it */
const FIGURE_TOP_OPEN = TOP + (HEADER_H - 20) / 2;
const CHIP_TOP_OPEN = TOP + (HEADER_H - 24) / 2;
/** the drag has to travel this far before the card takes it */
const SLACK = 10;

export type CardProps = {
  open: SharedValue<number>;
  openH: SharedValue<number>;
  /** the page's scroll offset: the card only opens from the top */
  scrollY: SharedValue<number>;
  /** the card asks for its state to be kept: it has opened, or closed */
  onSettle: (opened: boolean) => void;
  whole: string;
  kobo: string;
  dollars: string;
  hint: string;
  onSend: () => void;
  onReceive: () => void;
  onDollars: () => void;
  chat: ReactNode;
  /** the ask bar, at the foot of the open card */
  foot: ReactNode;
};

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

export function WalletCard({ open, openH, scrollY, onSettle, whole, kobo, dollars, hint, onSend, onReceive, onDollars, chat, foot }: CardProps) {
  const { width: W } = useWindowDimensions();
  const still = useStill();
  const [opened, setOpened] = useState(false);
  /* the figure comes into focus rather than counting up */
  const focus = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    focus.value = withDelay(120, withTiming(1, { duration: motion.resolve, easing: settleCurve }));
  }, [still, focus]);
  const settle = (to: boolean) => {
    setOpened(to);
    onSettle(to);
  };

  /* the widths the glide is written against, measured off hidden twins */
  const w32 = useSharedValue(190);
  const w20 = useSharedValue(120);
  const measure = (into: SharedValue<number>) => (e: LayoutChangeEvent) => {
    into.value = e.nativeEvent.layout.width;
  };

  /* ---- the drag ---- */
  const startY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startOpen = useSharedValue(0);
  const drag = () =>
    Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown(e => {
        const t = e.allTouches[0];
        if (!t) return;
        startY.value = t.y;
        startX.value = t.x;
        startOpen.value = open.value;
      })
      .onTouchesMove((e, state) => {
        const t = e.allTouches[0];
        if (!t) return;
        const dy = t.y - startY.value;
        const dx = t.x - startX.value;
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy)) {
          state.fail();
          return;
        }
        if (startOpen.value < 0.5) {
          /* closed: a pull down from the top of the page opens it */
          if (scrollY.value > 2) state.fail();
          else if (dy > SLACK) state.activate();
          else if (dy < -SLACK) state.fail();
        } else if (dy < -SLACK) state.activate();
        else if (dy > SLACK) state.fail();
      })
      .onUpdate(e => {
        const travel = Math.max(1, openH.value - CLOSED_H);
        open.value = clamp(startOpen.value + e.translationY / travel, 0, 1);
      })
      .onEnd(e => {
        const v = e.velocityY;
        const opening = startOpen.value < 0.5;
        const to = v > 400 ? 1 : v < -400 ? 0 : open.value > (opening ? 0.35 : 0.65) ? 1 : 0;
        open.value = withSpring(to, keys);
        runOnJS(settle)(to === 1);
      })
      .onFinalize((_, success) => {
        if (!success && startOpen.value !== open.value) {
          open.value = withSpring(startOpen.value < 0.5 ? 0 : 1, keys);
        }
      });
  const headPan = React.useMemo(drag, []); // eslint-disable-line react-hooks/exhaustive-deps
  const bodyPan = React.useMemo(drag, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* keep the React side in step with a spring that was started elsewhere */
  const seen = useDerivedValue(() => open.value > 0.5);
  useEffect(() => {
    const id = setInterval(() => {
      if (seen.value !== opened) settle(seen.value);
    }, 120);
    return () => clearInterval(id);
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- what moves ---- */
  const card = useAnimatedStyle(() => ({ height: CLOSED_H + (openH.value - CLOSED_H) * open.value }));

  /* the closed pieces soften and lift away in the first half */
  const going = useAnimatedStyle(() => {
    const t = clamp(open.value / 0.45, 0, 1);
    return { opacity: 1 - t, transform: [{ translateY: -20 * t }], ...blurred(t * motion.blur) };
  });
  /* the open pieces arrive from below in the second half */
  const coming = useAnimatedStyle(() => {
    const t = clamp((open.value - 0.5) / 0.5, 0, 1);
    return { opacity: t, transform: [{ translateY: 20 * (1 - t) }], ...blurred((1 - t) * motion.blur) };
  });
  const wallet = useAnimatedStyle(() => ({ opacity: 1 - clamp((open.value - 0.2) / 0.3, 0, 1) }));
  /* the glass under the header only means anything once there is a conversation under it */
  const frost = useAnimatedStyle(() => ({ opacity: clamp((open.value - 0.4) / 0.4, 0, 1) }));
  /* the grabber and its words stay while the card only dips, and go once it is really opening */
  const goingLate = useAnimatedStyle(() => {
    const t = clamp((open.value - 0.3) / 0.3, 0, 1);
    return { opacity: 1 - t, ...blurred(t * motion.blur) };
  });

  /* the figure glides from the centre of the card into the header */
  const figure = useAnimatedStyle(() => {
    const t = open.value;
    const closedLeft = (W - w32.value) / 2;
    return {
      opacity: 0.3 + focus.value * 0.7,
      transform: [{ translateX: interpolate(t, [0, 1], [closedLeft, FIGURE_LEFT]) }, { translateY: interpolate(t, [0, 1], [FIGURE_TOP, FIGURE_TOP_OPEN]) }],
      ...blurred((1 - focus.value) * 8),
    };
  });
  const figureText = useAnimatedStyle(() => ({
    fontSize: interpolate(open.value, [0, 1], [32, 20]),
    lineHeight: interpolate(open.value, [0, 1], [40, 20]),
    letterSpacing: interpolate(open.value, [0, 1], [-1.06, -0.66]),
  }));
  const koboText = useAnimatedStyle(() => ({
    fontSize: interpolate(open.value, [0, 1], [20, 14]),
    lineHeight: interpolate(open.value, [0, 1], [24, 12]),
    marginTop: interpolate(open.value, [0, 1], [8, 4]),
  }));
  /* the chip in the header, after the figure, arriving with the rest of the
     open card — its place and its arrival in one style, since a later style's
     transform would replace an earlier one's */
  const chipOpen = useAnimatedStyle(() => {
    const t = clamp((open.value - 0.5) / 0.5, 0, 1);
    return {
      opacity: t,
      transform: [{ translateX: FIGURE_LEFT + w20.value + 8 }, { translateY: CHIP_TOP_OPEN + 20 * (1 - t) }],
      ...blurred((1 - t) * motion.blur),
    };
  });

  return (
    <Animated.View style={[s.card, card]} testID="card">
      {/* the open card: the conversation, running up under the header, and the bar at its foot */}
      <Animated.View style={[s.opened, coming]} pointerEvents={opened ? 'auto' : 'none'}>
        <View style={{ flex: 1 }}>{chat}</View>
        <View style={s.foot}>{foot}</View>
      </Animated.View>

      {/* the header band: frosted glass over the conversation, the mark, and the
          wallet's name until the figure takes its place */}
      <GestureDetector gesture={headPan}>
        <View style={s.head}>
          <Animated.View style={[StyleSheet.absoluteFill, frost]} pointerEvents="none">
            <Frost height={HEAD_BAND} />
          </Animated.View>
          <View style={s.headRow}>
            <Image source={MARK} style={{ width: 36, height: 36, borderRadius: 18 }} accessibilityLabel="Beetle" />
            <Animated.View style={wallet}>
              <Label style={{ color: '#ffffff' }}>Wallet</Label>
            </Animated.View>
          </View>
        </View>
      </GestureDetector>

      {/* the closed card, under the header */}
      <GestureDetector gesture={bodyPan}>
        <Animated.View style={[s.closed, going]} pointerEvents={opened ? 'none' : 'auto'}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Caption style={{ color: dark.chipText }}>Total balance</Caption>
            {/* the figure is drawn once, below, and travels; the chip has its place here */}
            <View style={{ height: 40 }} />
            <Tap accessibilityRole="button" accessibilityLabel="Your dollars" onPress={onDollars} style={s.chip}>
              <Caption style={[s.chipText, { color: dark.chipText }]}>{dollars}</Caption>
            </Tap>
          </View>
          <View style={s.actions}>
            <Tap accessibilityRole="button" accessibilityLabel="Send" onPress={onSend} style={s.action}>
              <View style={s.disc}>
                <Icon name="send" size={16} colour={colour.ink} />
              </View>
              <Label style={{ color: '#ffffff' }}>Send</Label>
            </Tap>
            <Tap accessibilityRole="button" accessibilityLabel="Receive" onPress={onReceive} style={s.action}>
              <View style={s.disc}>
                <Icon name="down" size={16} colour={colour.ink} />
              </View>
              <Label style={{ color: '#ffffff' }}>Receive</Label>
            </Tap>
          </View>
        </Animated.View>
      </GestureDetector>
      <Animated.View style={[s.grab, goingLate]} pointerEvents="none">
        <View style={s.grabber} />
        <Swap value={hint}>{h => <Caption style={{ color: '#ffffff' }}>{h}</Caption>}</Swap>
      </Animated.View>

      {/* the figure, in whichever place `open` says */}
      <Animated.View style={[s.figure, figure]} pointerEvents="none">
        <Animated.Text style={[s.figureText, figureText]} numberOfLines={1} testID="balance">
          {whole}
        </Animated.Text>
        <Animated.Text style={[s.koboText, koboText]} numberOfLines={1}>
          {kobo}
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[s.chipWrap, chipOpen]} pointerEvents={opened ? 'auto' : 'none'}>
        <Tap accessibilityRole="button" accessibilityLabel="Your dollars" onPress={onDollars} style={s.chip}>
          <Caption style={[s.chipText, { color: dark.chipTextOpen }]}>{dollars}</Caption>
        </Tap>
      </Animated.View>

      {/* the twins the glide is measured off, never seen */}
      <View style={s.twins} pointerEvents="none">
        <View style={s.twin} onLayout={measure(w32)}>
          <Animated.Text style={[s.figureText, { fontSize: 32, lineHeight: 40, letterSpacing: -1.06 }]}>{whole}</Animated.Text>
          <Animated.Text style={[s.koboText, { fontSize: 20, lineHeight: 24, marginTop: 8 }]}>{kobo}</Animated.Text>
        </View>
        <View style={s.twin} onLayout={measure(w20)}>
          <Animated.Text style={[s.figureText, { fontSize: 20, lineHeight: 20, letterSpacing: -0.66 }]}>{whole}</Animated.Text>
          <Animated.Text style={[s.koboText, { fontSize: 14, lineHeight: 12, marginTop: 4 }]}>{kobo}</Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: dark.card,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  head: { position: 'absolute', top: 0, left: 0, right: 0, height: HEAD_BAND, paddingTop: TOP, paddingHorizontal: SIDE, zIndex: 3, overflow: 'visible' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: HEADER_H },
  closed: { position: 'absolute', top: HEAD_BAND - 20 + 24, left: 0, right: 0, height: CLOSED_H - (HEAD_BAND - 20 + 24), paddingHorizontal: SIDE, alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, alignSelf: 'stretch', paddingTop: 12 },
  action: { alignItems: 'center', gap: 8 },
  disc: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  grab: { position: 'absolute', top: CLOSED_H - 20 - 32, left: 0, right: 0, alignItems: 'center', gap: 12, zIndex: 2 },
  grabber: { width: 27, height: 4, borderRadius: 2, backgroundColor: dark.grabber },
  opened: { position: 'absolute', top: 0, left: SIDE, right: SIDE, bottom: 0 },
  foot: { height: FOOT_BAND, paddingTop: 20, paddingBottom: 20 },
  figure: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'flex-start', zIndex: 4 },
  figureText: { color: '#ffffff', fontWeight: '700', fontSize: 32, lineHeight: 40, letterSpacing: -1.06 },
  koboText: { color: dark.kobo, fontWeight: '600', fontSize: 20, lineHeight: 24, marginTop: 8, marginLeft: 1 },
  chipWrap: { position: 'absolute', top: 0, left: 0, zIndex: 4 },
  chip: { height: 24, borderRadius: 12, backgroundColor: dark.chip, paddingHorizontal: 8, justifyContent: 'center' },
  chipText: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: -0.15 },
  twins: { position: 'absolute', top: -400, left: 0, opacity: 0, alignItems: 'flex-start' },
  /* each twin hugs its own words, or the narrow one reports the wide one's width */
  twin: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'flex-start' },
});
