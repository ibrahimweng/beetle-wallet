/* The black card at the top of home, and what it becomes.

   Closed, it holds the balance with its reading in dollars, Send and
   Receive as two white pills, what Beetle has to offer, and a grabber
   (Round 14, the owner's frame: no word Wallet over it and no words under
   the grabber; Round 15: the offers moved in from the page, 36 under the
   pills, the grabber 24 under them and 16 over the card's edge). The card
   keeps that shape when the × puts the offers away: the empty card stands
   in their place (Round 16, the owner's word).
   Pulled down, it grows to two thirds of the screen and turns into the chat:
   the balance glides up into the header, shrinking as it goes, the buttons
   and the grabber soften away, and the conversation arrives from below,
   running under a haze at the head and the foot. Pulled back up on its header, it runs the same movements the
   other way. Everything is drawn against one number, `open`, from 0 to 1,
   so a finger can scrub it and the spring can finish it.
   As it is pulled, light gathers along its edge, and once it is pulled far
   enough the card goes on by itself and the light pulses through it
   (Round 21, the owner's word, after Apple's NameDrop: see glow and Light);
   closing, a quieter glow rises along the edge. */
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Caption, Drawing, Icon, Label, Swap, Tap, blurred, colour, dark, feel, font, keys, motion, settle as settleCurve, soft, swipes, useStill } from '../../design';
import { useDeparture } from '../../design/journey';
import { Frost } from './Frost';
import { GATHER, PULSE, closingGlow, gathered, knocks, uniformsOf } from './glow';
import { Light } from './Light';

/** The card's height when closed, as the frame draws it, the offers in it (Round 15: the owner's frame, 392). */
export const CLOSED_H = 392;
/** The grabber's foot, this far over the card's edge. */
const GRAB_FOOT = 16;
/** The status bar's allowance at the top of the card, as the frame draws it. */
const TOP = 52;
const SIDE = 16;
const HEADER_H = 36;
/** Where Total balance starts when closed: 28 under the status bar's allowance, the frame's 80. */
const BALANCE_TOP = TOP + 28;
/** the header band: top allowance, the row, and the gap under it */
export const HEAD_BAND = TOP + HEADER_H + 20;
/** the chips over the ask bar: their height, and the gap down to the bar */
export const CHIPS_H = 32;
export const CHIPS_GAP = 10;
/** the room the foot of the open card takes: the gap over the chips, the chips, the gap, the bar, and the padding under it */
export const FOOT_BAND = 16 + CHIPS_H + CHIPS_GAP + 48 + 20;
/** how far past its line a haze still thins, so its end is never seen */
const HAZE_FEATHER = 12;
/** the foot haze: the card's edge up to the middle of the chips, and the feather */
export const FOOT_HAZE = 20 + 48 + CHIPS_GAP + CHIPS_H / 2 + HAZE_FEATHER;
/** where the figure goes as the card opens: the left of the header */
const FIGURE_LEFT = SIDE;
/** the drag has to travel this far before the card takes it */
const SLACK = 10;

/** The light at the card's border, as a drag that opens the card sees it:
    told while a pull is gathering it, and told to swell where the card goes
    on by itself (see glow). */
export type CardLight = { pulling: SharedValue<boolean>; fire: (held: number) => void };

/** The drag that opens and closes the card, for whoever holds it: the card's
    own header and body, the chat once it has scrolled to its end, and the
    day below the open card. A downward pull from the top of the page opens;
    an upward push closes; a sideways move is somebody else's. A pull that
    gets as far as the card opening on its own lets go of the finger there:
    the card goes on by itself and the light pulses. */
export function useCardDrag({
  open,
  openH,
  closedH,
  scrollY,
  settle,
  gate,
  only,
  light,
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
  /** the light at the edge, for a drag that opens the card */
  light?: CardLight;
}): PanGesture {
  const startY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startOpen = useSharedValue(0);
  /* the pull has gone far enough and the card has gone on by itself: the finger is let go of */
  const fired = useSharedValue(false);
  /* the knocks the pull has had, so each comes once */
  const knocked = useSharedValue(0);
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
          fired.value = false;
          knocked.value = 0;
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
          if (fired.value) return;
          const travel = Math.max(1, openH.value - closedH);
          const p = clamp(startOpen.value + e.translationY / travel, 0, 1);
          open.value = p;
          if (!light || startOpen.value >= 0.5) return;
          /* the light gathers as the card is pulled, and the phone answers it a step at a time */
          light.pulling.value = true;
          const k = knocks(p);
          if (k > knocked.value) runOnJS(feel.gather)(k);
          knocked.value = k;
          if (p >= GATHER) {
            /* far enough: the border swells and the card goes on by itself, finger down or not */
            fired.value = true;
            light.fire(gathered(p));
            open.value = withSpring(1, keys);
            runOnJS(feel.pulse)();
            runOnJS(settle)(true);
          }
        })
        .onEnd(e => {
          if (fired.value) return;
          const v = e.velocityY;
          const opening = startOpen.value < 0.5;
          const to = v > 400 ? 1 : v < -400 ? 0 : open.value > (opening ? GATHER : 0.65) ? 1 : 0;
          if (light && opening && to === 1) {
            /* flung open before it got that far: the border swells all the same */
            fired.value = true;
            light.fire(gathered(open.value));
            runOnJS(feel.pulse)();
          }
          open.value = withSpring(to, keys);
          runOnJS(settle)(to === 1);
          runOnJS(swipes.end)();
        })
        .onFinalize((_, success) => {
          if (fired.value) {
            runOnJS(swipes.end)();
            return;
          }
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
  /** what Beetle has to offer, under Send and Receive, or the empty card in their place (see Promos) */
  offers?: ReactNode;
  /** how far the chats drawer is in: the chat steps back behind it */
  recede?: SharedValue<number>;
};

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

export function WalletCard({ open, openH, scrollY, onSettle, whole, kobo, dollars, onReceive, onDollars, chipLabel, onNew, chat, foot, over, offers, flash, recede }: CardProps) {
  /* Send is the way to the Send money page. Settings is the gear on the bar, not the card */
  const send = useDeparture({ id: 'card:send', to: '/send', words: 'Send' });
  const { width: W, height: H } = useWindowDimensions();
  const still = useStill();
  const { top, extra, headBand, closedH, haze, hazeSolid } = useCardTop();
  /* how far down the figure and the chip sit when closed, and where they go in the header */
  const figureTop = BALANCE_TOP + extra + 16 + 4;
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

  /* ---- the light at the border (see glow) ---- */
  /* the swell's clock, in seconds since it fired, -1 when there is none; the light gathered then */
  const pulseT = useSharedValue(-1);
  const pulseHeld = useSharedValue(0);
  /* a finger is pulling the closed card down; the card has been open, so what closes it now draws the quiet glow */
  const pulling = useSharedValue(false);
  const wasOpen = useSharedValue(false);
  const light = useMemo<CardLight>(
    () => ({
      pulling,
      fire: (held: number) => {
        'worklet';
        pulseHeld.value = held;
        pulling.value = false;
        pulseT.value = 0;
        pulseT.value = withTiming(PULSE, { duration: PULSE * 1000, easing: Easing.linear }, done => {
          if (done) pulseT.value = -1;
        });
      },
    }),
    [pulling, pulseHeld, pulseT],
  );
  useAnimatedReaction(
    () => [open.value, pulseT.value] as const,
    ([p, t]) => {
      if (p > 0.98 && t < 0) wasOpen.value = true;
      else if (p < 0.002) {
        wasOpen.value = false;
        if (t < 0) pulling.value = false;
      }
    },
  );
  const uniforms = useDerivedValue(() => {
    const p = open.value;
    const t = pulseT.value;
    return uniformsOf({
      width: W,
      edge: closedH + (openH.value - closedH) * p,
      a: t >= 0 ? pulseHeld.value : pulling.value ? gathered(p) : 0,
      t,
      g: wasOpen.value && t < 0 ? closingGlow(p) : 0,
    });
  });

  /* ---- the drag ---- */
  const settleRef = React.useRef(settle);
  settleRef.current = settle;
  const settled = React.useCallback((to: boolean) => settleRef.current(to), []);
  const headPan = useCardDrag({ open, openH, closedH, scrollY, settle: settled, light });
  const bodyPan = useCardDrag({ open, openH, closedH, scrollY, settle: settled, light });
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

  /* the closed pieces soften and lift away in the first half, drawn out a little toward the light gathering at the edge */
  const going = useAnimatedStyle(() => {
    const t = clamp(open.value / 0.45, 0, 1);
    const lean = clamp(open.value / GATHER, 0, 1);
    return {
      opacity: 1 - t,
      transform: [{ translateY: -20 * t }, { scaleY: 1 + 0.05 * lean }, { scaleX: 1 - 0.015 * lean }],
      ...blurred(t * motion.blur),
    };
  });
  /* the open pieces arrive from below in the second half */
  const coming = useAnimatedStyle(() => {
    const t = clamp((open.value - 0.5) / 0.5, 0, 1);
    return { opacity: t, transform: [{ translateY: 20 * (1 - t) }], ...blurred((1 - t) * motion.blur) };
  });
  /* the glass under the header only means anything once there is a conversation under it */
  const frost = useAnimatedStyle(() => ({ opacity: clamp((open.value - 0.4) / 0.4, 0, 1) }));
  /* the chat and the bar recede while something sits over them */
  const veil = useSharedValue(over ? 1 : 0);
  useEffect(() => {
    veil.value = still ? (over ? 1 : 0) : withTiming(over ? 1 : 0, { duration: motion.screen, easing: soft });
  }, [!!over]); // eslint-disable-line react-hooks/exhaustive-deps
  /* behind the drawer the chat steps to the right, dims and softens a little; behind what sits over it, it recedes further */
  const receding = useAnimatedStyle(() => {
    const d = recede ? recede.value : 0;
    return {
      opacity: (1 - veil.value * 0.78) * (1 - 0.55 * d),
      transform: [{ translateX: 28 * d }, { scale: 1 - veil.value * 0.02 }],
      ...blurred(veil.value * motion.blur + d * 3),
    };
  });
  const fading = useAnimatedStyle(() => ({ opacity: 1 - veil.value }));
  /* the grabber stays while the card only dips, and goes once it is really opening */
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
      {/* a wing's veins in the paper, faint, across the card's top corner, as the brand lays them on its dark cards (Round 26) */}
      <Drawing name="wing" width={210} opacity={0.1} tint={dark.paper} turn={-8} style={{ top: 18, right: -58 }} />
      {/* the open card: the conversation, running up under the header and down
          under the bar, and the bar at its foot on its own haze */}
      {/* closed, the chat and its foot are not there for a finger or a screen reader: the card's own Send and Receive are */}
      <Animated.View style={[s.opened, coming]} pointerEvents={opened && !over ? 'auto' : 'none'} aria-hidden={!opened}>
        <Animated.View style={[{ flex: 1 }, receding]}>
          <CardGesturesContext.Provider value={gestures}>{chat}</CardGesturesContext.Provider>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[s.foot, coming]} pointerEvents={opened && !over ? 'box-none' : 'none'} aria-hidden={!opened}>
        <Frost height={FOOT_HAZE} side="bottom" solid={20} />
        <Animated.View style={[s.bar, fading]}>{foot}</Animated.View>
      </Animated.View>
      {/* what sits over the chat, under the header: the passcode, the details */}
      <View style={[s.over, { top: haze }]} pointerEvents={over ? 'auto' : 'none'}>
        {over}
      </View>

      {/* the header band: frosted glass over the conversation, which the figure comes up into */}
      <GestureDetector gesture={headPan}>
        <View style={[s.head, { height: headBand, paddingTop: top }]}>
          <Animated.View style={[StyleSheet.absoluteFill, frost]} pointerEvents="none">
            <Frost height={haze} solid={hazeSolid} />
          </Animated.View>
          <View style={s.headRow}>
            <View style={{ flex: 1 }} />
            {/* New, at the top right once the card is the chat, where a screen gives one: home keeps it in the chats drawer */}
            {onNew ? (
              <Animated.View style={coming} pointerEvents={opened ? 'auto' : 'none'}>
                <Tap accessibilityRole="button" accessibilityLabel="New chat" onPress={onNew} style={s.newChat} testID="new">
                  <Icon name="plus" size={16} colour={dark.paper} />
                  <Label style={{ color: dark.paper }}>New</Label>
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
          {/* Send and Receive: white pills, the glyph in a 36 square and the word after it (Round 14, the owner's frame) */}
          <View style={s.actions}>
            <Tap ref={send.ref} accessibilityRole="button" accessibilityLabel="Send" onPress={send.onPress} style={s.pill} testID="send-pill">
              {send.wash}
              <View style={s.pillGlyph} testID="send-disc">
                <Icon name="send" size={16} colour={colour.ink} />
              </View>
              <Label>Send</Label>
            </Tap>
            <Tap accessibilityRole="button" accessibilityLabel="Receive" onPress={onReceive} style={s.pill} testID="receive-pill">
              <View style={s.pillGlyph} testID="receive-disc">
                <Icon name="down" size={16} colour={colour.ink} />
              </View>
              <Label>Receive</Label>
            </Tap>
          </View>
          {/* the offers, or the empty card in their place, 36 under the pills and the card's full width less 24 a side; a pull down on them is the card's */}
          {offers ? <View style={s.offers}>{offers}</View> : null}
        </Animated.View>
      </GestureDetector>
      <Animated.View style={[s.grab, { top: s.grab.top + extra }, goingLate]} pointerEvents="none">
        <View style={s.grabber} testID="grabber" />
      </Animated.View>
      {/* VoiceOver cannot pull the card down: the grabber is a button there,
          and a double tap opens the chat (the analysis after Round 21) */}
      <View
        style={[s.grabSpot, { top: s.grab.top + extra - 12 }]}
        pointerEvents="none"
        accessible={!opened}
        accessibilityElementsHidden={opened}
        importantForAccessibility={opened ? 'no-hide-descendants' : 'yes'}
        accessibilityRole="button"
        accessibilityLabel="Talk to Beetle"
        accessibilityHint="Opens the chat, as pulling the card down does"
        onAccessibilityTap={() => {
          open.value = withSpring(1, keys);
          settle(true);
        }}
      />

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

      {/* the light at the edge, over all of it; none for somebody who has asked their phone to keep still */}
      {still ? null : <Light width={W} height={H} uniforms={uniforms} />}

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
  /* the balance from the frame's 80, then 24 down to the pills and 36 to the offers; it runs to the card's edge, so a pull on the grabber, or under it, is the card's */
  closed: { position: 'absolute', top: BALANCE_TOP, left: 0, right: 0, height: CLOSED_H - BALANCE_TOP, alignItems: 'center', gap: 24, transformOrigin: 'top' },
  offers: { alignSelf: 'stretch', marginTop: 36 - 24 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, alignSelf: 'stretch' },
  /* 100 wide whatever the word, so the two are one size; 12 clear after the word */
  pill: { width: 100, height: 36, borderRadius: 18, backgroundColor: dark.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingRight: 12 },
  pillGlyph: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  /* the grabber alone, 16 above the card's edge */
  grab: { position: 'absolute', top: CLOSED_H - GRAB_FOOT - 4, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  grabber: { width: 27, height: 4, borderRadius: 2, backgroundColor: dark.grabber },
  grabSpot: { position: 'absolute', left: 0, right: 0, height: 28 },
  opened: { position: 'absolute', top: 0, left: SIDE, right: SIDE, bottom: 0 },
  over: { position: 'absolute', left: SIDE, right: SIDE, bottom: 0, zIndex: 5 },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FOOT_BAND },
  bar: { position: 'absolute', left: SIDE, right: SIDE, bottom: 20 },
  figure: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'flex-start', zIndex: 4 },
  figureText: { color: dark.paper, ...font('700'), fontSize: 32, lineHeight: 40, letterSpacing: -1.06 },
  koboText: { color: dark.kobo, ...font('600'), fontSize: 20, lineHeight: 24, marginTop: 8, marginLeft: 1 },
  chipWrap: { position: 'absolute', top: 0, left: 0, zIndex: 4 },
  chip: { height: 24, borderRadius: 12, backgroundColor: dark.chip, paddingHorizontal: 8, justifyContent: 'center' },
  chipText: { fontSize: 14, lineHeight: 20, ...font('600'), letterSpacing: -0.15 },
  twins: { position: 'absolute', top: -400, left: 0, opacity: 0, alignItems: 'flex-start' },
  /* each twin hugs its own words, or the narrow one reports the wide one's width */
  twin: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'flex-start' },
});
