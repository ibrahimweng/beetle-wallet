/* The black card at the top of home, and what it becomes.

   Closed, it holds the wallet's name, the balance with its
   reading in dollars, Send and Receive, and a grabber that says pull down.
   Pulled down, it grows to two thirds of the screen and turns into the chat:
   the balance glides up into the header, shrinking as it goes, the buttons
   and the grabber soften away, and the conversation arrives from below,
   running under a haze at the head and the foot. Pulled back up on its header, it runs the same movements the
   other way. Everything is drawn against one number, `open`, from 0 to 1,
   so a finger can scrub it and the spring can finish it. */
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import Animated, { SharedValue, interpolate, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Caption, Icon, Label, Swap, Tap, blurred, colour, dark, keys, motion, settle as settleCurve, soft, swipes, useStill } from '../../design';
import { useDeparture } from '../../design/journey';
import { Frost } from './Frost';

/** The card's height when closed, as the frame draws it. */
export const CLOSED_H = 352;
/** The status bar's allowance at the top of the card, as the frame draws it. */
const TOP = 52;
const SIDE = 16;
const HEADER_H = 36;
/** the header band: top allowance, the row, and the gap under it */
export const HEAD_BAND = TOP + HEADER_H + 20;
/** the room the ask bar takes at the foot of the open card: gap, bar, padding */
export const FOOT_BAND = 20 + 48 + 20;
/** how far past its line a haze still thins, so its end is never seen */
const HAZE_FEATHER = 12;
/** the foot haze: the card's edge up to the middle of the bar, and the feather */
export const FOOT_HAZE = 20 + 24 + HAZE_FEATHER;
/** where the figure goes: the word Wallet's place at the left of the header, which it takes as the card opens */
const FIGURE_LEFT = SIDE;
/** the drag has to travel this far before the card takes it */
const SLACK = 10;

/** The drag that opens and closes the card, for whoever holds it: the card's
    own header and body, the chat once it has scrolled to its end, and the
    day below the open card. A downward pull from the top of the page opens;
    an upward push closes; a sideways move is somebody else's. */
export function useCardDrag({
  open,
  openH,
  closedH,
  scrollY,
  settle,
  gate,
  only,
}: {
  open: SharedValue<number>;
  openH: SharedValue<number>;
  closedH: number;
  /** the page's scroll offset: the card only opens from the top */
  scrollY?: SharedValue<number>;
  settle: (opened: boolean) => void;
  /** takes the drag only while this is true — the chat at its end */
  gate?: SharedValue<boolean>;
  /** only ever closes: the day below the open card */
  only?: 'close';
}): PanGesture {
  const startY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startOpen = useSharedValue(0);
  return useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown(e => {
          const t = e.allTouches[0];
          if (!t) return;
          startY.value = t.y;
          startX.value = t.x;
          startOpen.value = only === 'close' ? 1 : open.value;
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
            if (scrollY && scrollY.value > 2) state.fail();
            else if (dy > SLACK) state.activate();
            else if (dy < -SLACK) state.fail();
          } else if (gate && !gate.value) state.fail();
          else if (dy < -SLACK) state.activate();
          else if (dy > SLACK) state.fail();
        })
        /* the drag is not a tap on whatever it ends over */
        .onStart(() => {
          runOnJS(swipes.start)();
        })
        .onUpdate(e => {
          const travel = Math.max(1, openH.value - closedH);
          open.value = clamp(startOpen.value + e.translationY / travel, 0, 1);
        })
        .onEnd(e => {
          const v = e.velocityY;
          const opening = startOpen.value < 0.5;
          const to = v > 400 ? 1 : v < -400 ? 0 : open.value > (opening ? 0.35 : 0.65) ? 1 : 0;
          open.value = withSpring(to, keys);
          runOnJS(settle)(to === 1);
          runOnJS(swipes.end)();
        })
        .onFinalize((_, success) => {
          if (!success && startOpen.value !== open.value) {
            open.value = withSpring(startOpen.value < 0.5 ? 0 : 1, keys);
          }
        }),
    [closedH, only], // eslint-disable-line react-hooks/exhaustive-deps
  );
}

/** What the chat inside the card is handed: the drag that closes the card
    once the chat has scrolled to its end, and the flag it keeps for that. */
export type CardGestures = { pan: PanGesture; atEnd: SharedValue<boolean> };
export const CardGesturesContext = React.createContext<CardGestures | null>(null);

/** The frame allows 52 for the status bar. A phone whose bar is taller —
    one with the island — pushes the card's top down by the difference, and
    everything in the card with it, so the header clears it. */
export function useCardTop() {
  const insets = useSafeAreaInsets();
  const top = Math.max(TOP, Math.round(insets.top) + 2);
  const extra = top - TOP;
  /* the top haze: the card's edge down to under the header row, and the feather;
     near solid as far as the figure reaches, so the figure keeps its contrast */
  return { top, extra, headBand: HEAD_BAND + extra, closedH: CLOSED_H + extra, haze: top + HEADER_H + HAZE_FEATHER, hazeSolid: top + 26 };
}

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
  /** New, at the top right of the open card: this chat filed, a fresh one. Home keeps New in the chats drawer instead. */
  onNew?: () => void;
  hint: string;
  onReceive: () => void;
  onDollars: () => void;
  /** what the chip is called when it is not the dollars: New account, until setting up is done */
  chipLabel?: string;
  chat: ReactNode;
  /** the ask bar, at the foot of the open card */
  foot: ReactNode;
  /** money that just arrived: the figure comes back into focus and the words
      take the caption's place for a moment */
  flash?: { text: string; at: number };
  /** what sits over the chat when something has to: the passcode before
      money moves, the account's own details. The chat recedes behind it. */
  over?: ReactNode;
};

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

export function WalletCard({ open, openH, scrollY, onSettle, whole, kobo, dollars, hint, onReceive, onDollars, chipLabel, onNew, chat, foot, over, flash }: CardProps) {
  /* Send is the way to the Send money page: its title arrives from the button. Settings is the gear on the bar, not the card */
  const send = useDeparture({ id: 'card:send', to: '/send', words: 'Send' });
  const { width: W } = useWindowDimensions();
  const still = useStill();
  const { top, extra, headBand, closedH, haze, hazeSolid } = useCardTop();
  /* how far down the figure and the chip sit when closed, and where they go in the header */
  const figureTop = top + HEADER_H + 24 + 16 + 4;
  const figureTopOpen = top + (HEADER_H - 20) / 2;
  const chipTopOpen = top + (HEADER_H - 24) / 2;
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
  /* money arriving: the figure resolves again, and the caption says what came */
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    setLine(flash.text);
    if (!still) {
      focus.value = 0.4;
      focus.value = withTiming(1, { duration: motion.resolve, easing: settleCurve });
    }
    const t = setTimeout(() => setLine(null), 3600);
    return () => clearTimeout(t);
  }, [flash?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the widths the glide is written against, measured off hidden twins */
  const w32 = useSharedValue(190);
  const w20 = useSharedValue(120);
  const measure = (into: SharedValue<number>) => (e: LayoutChangeEvent) => {
    into.value = e.nativeEvent.layout.width;
  };

  /* ---- the drag ---- */
  const settleRef = React.useRef(settle);
  settleRef.current = settle;
  const settled = React.useCallback((to: boolean) => settleRef.current(to), []);
  const headPan = useCardDrag({ open, openH, closedH, scrollY, settle: settled });
  const bodyPan = useCardDrag({ open, openH, closedH, scrollY, settle: settled });
  /* the chat closes the card too, once it has scrolled to its end */
  const atEnd = useSharedValue(true);
  const chatPan = useCardDrag({ open, openH, closedH, settle: settled, gate: atEnd });
  const gestures = useMemo(() => ({ pan: chatPan, atEnd }), [chatPan, atEnd]);

  /* keep the React side in step with a spring that was started elsewhere */
  const seen = useDerivedValue(() => open.value > 0.5);
  useEffect(() => {
    const id = setInterval(() => {
      if (seen.value !== opened) settle(seen.value);
    }, 120);
    return () => clearInterval(id);
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- what moves ---- */
  const card = useAnimatedStyle(() => ({ height: closedH + (openH.value - closedH) * open.value }));

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
  /* the chat and the bar recede while something sits over them */
  const veil = useSharedValue(over ? 1 : 0);
  useEffect(() => {
    veil.value = still ? (over ? 1 : 0) : withTiming(over ? 1 : 0, { duration: motion.screen, easing: soft });
  }, [!!over]); // eslint-disable-line react-hooks/exhaustive-deps
  const receding = useAnimatedStyle(() => ({ opacity: 1 - veil.value * 0.78, transform: [{ scale: 1 - veil.value * 0.02 }], ...blurred(veil.value * motion.blur) }));
  const fading = useAnimatedStyle(() => ({ opacity: 1 - veil.value }));
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
      transform: [{ translateX: interpolate(t, [0, 1], [closedLeft, FIGURE_LEFT]) }, { translateY: interpolate(t, [0, 1], [figureTop, figureTopOpen]) }],
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
      transform: [{ translateX: FIGURE_LEFT + w20.value + 8 }, { translateY: chipTopOpen + 20 * (1 - t) }],
      ...blurred((1 - t) * motion.blur),
    };
  });

  return (
    <Animated.View style={[s.card, card]} testID="card">
      {/* the open card: the conversation, running up under the header and down
          under the bar, and the bar at its foot on its own haze */}
      <Animated.View style={[s.opened, coming]} pointerEvents={opened && !over ? 'auto' : 'none'}>
        <Animated.View style={[{ flex: 1 }, receding]}>
          <CardGesturesContext.Provider value={gestures}>{chat}</CardGesturesContext.Provider>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[s.foot, coming]} pointerEvents={opened && !over ? 'box-none' : 'none'}>
        <Frost height={FOOT_HAZE} side="bottom" solid={20} />
        <Animated.View style={[s.bar, fading]}>{foot}</Animated.View>
      </Animated.View>
      {/* what sits over the chat, under the header: the passcode, the details */}
      <View style={[s.over, { top: haze }]} pointerEvents={over ? 'auto' : 'none'}>
        {over}
      </View>

      {/* the header band: frosted glass over the conversation, and the wallet's
          name at the left until the figure takes its place */}
      <GestureDetector gesture={headPan}>
        <View style={[s.head, { height: headBand, paddingTop: top }]}>
          <Animated.View style={[StyleSheet.absoluteFill, frost]} pointerEvents="none">
            <Frost height={haze} solid={hazeSolid} />
          </Animated.View>
          <View style={s.headRow}>
            <Animated.View style={wallet} testID="wallet">
              <Label style={{ color: '#ffffff' }}>Wallet</Label>
            </Animated.View>
            <View style={{ flex: 1 }} />
            {/* New, at the top right once the card is the chat, where a screen gives one: home keeps it in the chats drawer */}
            {onNew ? (
              <Animated.View style={coming} pointerEvents={opened ? 'auto' : 'none'}>
                <Tap accessibilityRole="button" accessibilityLabel="New chat" onPress={onNew} style={s.newChat} testID="new">
                  <Icon name="plus" size={16} colour="#ffffff" />
                  <Label style={{ color: '#ffffff' }}>New</Label>
                </Tap>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </GestureDetector>

      {/* the closed card, under the header */}
      <GestureDetector gesture={bodyPan}>
        <Animated.View style={[s.closed, { top: s.closed.top + extra }, going]} pointerEvents={opened ? 'none' : 'auto'}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Swap value={line ?? 'Total balance'}>{w => <Caption style={{ color: line ? colour.good : dark.chipText }}>{w}</Caption>}</Swap>
            {/* the figure is drawn once, below, and travels; the chip has its place here */}
            <View style={{ height: 40 }} />
            <Tap accessibilityRole="button" accessibilityLabel={chipLabel ?? 'Your dollars'} onPress={onDollars} style={s.chip} testID="chip">
              <Caption style={[s.chipText, { color: dark.chipText }]}>{dollars}</Caption>
            </Tap>
          </View>
          <View style={s.actions}>
            <Tap ref={send.ref} accessibilityRole="button" accessibilityLabel="Send" onPress={send.onPress} style={[s.action, send.style]}>
              <View style={s.disc} testID="send-disc">
                <Icon name="send" size={16} colour={colour.ink} />
              </View>
              <Label style={{ color: '#ffffff' }}>Send</Label>
            </Tap>
            <Tap accessibilityRole="button" accessibilityLabel="Receive" onPress={onReceive} style={s.action}>
              <View style={s.disc} testID="receive-disc">
                <Icon name="down" size={16} colour={colour.ink} />
              </View>
              <Label style={{ color: '#ffffff' }}>Receive</Label>
            </Tap>
          </View>
        </Animated.View>
      </GestureDetector>
      <Animated.View style={[s.grab, { top: s.grab.top + extra }, goingLate]} pointerEvents="none">
        <View style={s.grabber} testID="grabber" />
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
        <Tap accessibilityRole="button" accessibilityLabel="Your dollars" onPress={onDollars} style={s.chip} testID="chip-open">
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
  head: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: SIDE, zIndex: 3, overflow: 'visible' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: HEADER_H },
  newChat: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 4 },
  closed: { position: 'absolute', top: HEAD_BAND - 20 + 24, left: 0, right: 0, height: CLOSED_H - (HEAD_BAND - 20 + 24), paddingHorizontal: SIDE, alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, alignSelf: 'stretch' },
  action: { alignItems: 'center', gap: 8 },
  disc: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  grab: { position: 'absolute', top: CLOSED_H - 20 - 32, left: 0, right: 0, alignItems: 'center', gap: 12, zIndex: 2 },
  grabber: { width: 27, height: 4, borderRadius: 2, backgroundColor: dark.grabber },
  opened: { position: 'absolute', top: 0, left: SIDE, right: SIDE, bottom: 0 },
  over: { position: 'absolute', left: SIDE, right: SIDE, bottom: 0, zIndex: 5 },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FOOT_BAND },
  bar: { position: 'absolute', left: SIDE, right: SIDE, bottom: 20, height: 48 },
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
