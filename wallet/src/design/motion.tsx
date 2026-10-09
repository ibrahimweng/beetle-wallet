/* How the app moves.

   One file for every duration and curve, the same way tokens.ts is one file
   for every colour and size. Nothing anywhere else picks a number.

   The rule the whole thing is built on: a thing arrives out of a blur and
   leaves back into one. Nothing slides in from the side. A screen that is
   going fades and softens in 280ms; the next one sharpens and fills in 520ms.
   A press dips in 90ms and springs back with a little overshoot. A marker
   lands beside a label 140ms after the label has changed. A number resolves
   from blur rather than counting up. All of it on one family of curves, so
   every movement in the app feels like the same hand made it.

   Reanimated runs these on the UI thread, so a screen still animates smoothly
   while JavaScript is busy putting the next one together. (No DOM animation
   library can be used here: on a phone there are no DOM nodes to animate.) */
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Platform, Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

export const motion = {
  /** A press landing. */
  press: 90,
  /** A press letting go, with the overshoot. */
  release: 360,
  /** A word changing to another word. */
  swap: 180,
  /** Content on its way out: quick, and gone before the next thing arrives. */
  leave: 280,
  /** Content arriving: long enough for the un-blur to read as one. */
  enter: 520,
  /** A marker settling beside something. */
  mark: 360,
  /** How long the marker waits, so the label changes first. */
  markWait: 140,
  /** A number resolving from blur. */
  resolve: 600,
  /** A wash receding while you type. */
  recede: 520,
  /** How soft a thing is before it has arrived, in pixels. */
  blur: 6,
  /** How much smaller a thing is before it has arrived. */
  shrink: 0.02,
  /** Between one thing arriving and the next, where a column staggers. */
  step: 30,
  /** The longest anything waits before it starts, however far down it is. */
  wait: 240,
  /** A screen's transition. Long enough to read as a movement. */
  screen: 340,
  /** How far something rises as it arrives, where it rises. */
  rise: 14,
} as const;

/* ---- the curves ---- */

/** Fast out, long settle. The one nearly everything uses. */
export const settle = Easing.bezier(0.22, 1, 0.36, 1);
/** Softer still, for a backdrop or a wash. */
export const soft = Easing.bezier(0.16, 1, 0.3, 1);
/** Content arriving from a blur. */
export const standard = Easing.bezier(0.4, 0, 0.2, 1);
/** Content leaving into one. */
export const away = Easing.bezier(0.4, 0, 0.6, 1);
/** A press letting go, a marker landing: past the mark and back. */
export const overshoot = Easing.bezier(0.34, 1.56, 0.64, 1);
/** A press landing: eases in and stops, nothing else. */
export const pressIn = Easing.bezier(0.4, 0, 1, 1);
export const ease = settle;

/* Springs, for the two things that are not a fade: the keypad coming up, and
   a sheet. Both are tools arriving rather than screens. */
export const arrive = { damping: 20, stiffness: 210, mass: 0.9 } as const;
export const bouncy = { damping: 11, stiffness: 190, mass: 0.85 } as const;
export const lift = { damping: 22, stiffness: 170, mass: 1 } as const;
export const keys = { damping: 26, stiffness: 260, mass: 0.9 } as const;

/* A screen drawn behind a sheet or the menu is scenery, not an arrival: it is
   already there. Everything inside this skips its entrance. */
export const Behind = React.createContext(false);

/** Somebody who has asked their phone to stop moving things gets no movement. */
export const useStill = () => {
  /* Both are read every time: a hook that is sometimes skipped is a hook that
     eventually reads the wrong thing. */
  const asked = useReducedMotion();
  const scenery = React.useContext(Behind);
  return asked || scenery;
};

export const Backdrop = ({ children }: { children: ReactNode }) => <Behind.Provider value={true}>{children}</Behind.Provider>;

/* The blur a thing wears before it has arrived, where the platform can draw
   one. iOS cannot blur a view's own contents, so there the fade and the small
   scale carry the arrival by themselves. */
const CAN_BLUR = Platform.OS !== 'ios';
export const blurred = (px: number) => {
  'worklet';
  return CAN_BLUR ? { filter: [{ blur: px }] } : {};
};

/* What a box that grows to what it holds holds, once the box has a height of
   its own: loose in it, out of its flow, along its top. The phone lays a
   column's content out within the column's height, so content measured in
   the flow of a box with a height could only ever measure as tall as the box
   already was, and a box growing from nothing stayed nothing (Round 19: the
   rows of an opened line never came in on the phone; a browser does not do
   this, so the web never showed it). Loose, it measures as tall as it is, and
   the box, its height following that, shows it. */
export const LOOSE = { position: 'absolute', top: 0, left: 0, right: 0 } as const;

/* ---- arriving and leaving ---- */

/* A pane of content. It arrives from a blur — transparent, six pixels soft
   and a touch small, then sharp, whole and in place — and when `leaving`
   turns on it goes back the same way, quicker. Whatever asked for the next
   screen waits for it: see useLeave. */
export function Pane({ children, style, leaving = false, delay = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; leaving?: boolean; delay?: number }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) {
      t.value = leaving ? 0 : 1;
      return;
    }
    /* in on settle: it starts moving at once and comes to rest slowly, which reads as smooth where an ease-in reads as a beat late */
    t.value = leaving ? withTiming(0, { duration: motion.leave, easing: away }) : withDelay(delay, withTiming(1, { duration: motion.enter, easing: settle }));
  }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: 1 - (1 - t.value) * motion.shrink }],
    ...blurred((1 - t.value) * motion.blur),
  }));
  return <Animated.View style={[style, moving]}>{children}</Animated.View>;
}

/* A screen on its way out. `leave(go)` turns the panes' `leaving` on, and
   goes once they have gone; `stay()` brings them back, for a screen that is
   returned to, or a step that could not be taken after all. */
export function useLeave() {
  const still = useStill();
  const [leaving, setLeaving] = useState(false);
  const leave = useCallback(
    (go: () => void | Promise<void>) => {
      if (still) {
        void go();
        return;
      }
      setLeaving(true);
      setTimeout(() => void go(), motion.leave);
    },
    [still],
  );
  const stay = useCallback(() => setLeaving(false), []);
  return { leaving, leave, stay };
}

/* One thing arriving, in a column that staggers. Kept for the few places that
   want a piece at a time rather than the whole pane. */
export function Reveal({ index = 0, children, style }: { index?: number; rise?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pane delay={Math.min(index * motion.step, motion.wait)} style={style}>
      {children}
    </Pane>
  );
}

/** Everything in a column, arriving one after another. */
export function RevealAll({ children, from = 0 }: { children: ReactNode; from?: number }) {
  return (
    <>
      {React.Children.toArray(children).map((child, i) => (
        <Reveal key={i} index={from + i}>
          {child}
        </Reveal>
      ))}
    </>
  );
}

/* ---- a word changing ---- */

/* A word changing to another word. The old one softens and fades, the new
   one arrives the same way, so a title, a note or a button label reads as
   the same thing saying something else rather than as a replacement. */
export function Swap({ value, children, style }: { value: string; children: (shown: string) => ReactNode; style?: StyleProp<ViewStyle> }) {
  const still = useStill();
  const [shown, setShown] = useState(value);
  const t = useSharedValue(1);
  /* what lands is what is asked for when the old words have gone, not when they began to go: a label that changes and
     changes back before then (Log in, Checking…, Log in) was left on the one in between (Round 30) */
  const latest = useRef(value);
  latest.current = value;
  const showing = useRef(shown);
  showing.current = shown;
  /* the old words have gone: the latest lands, or, where the label came back to the words that were going (Continue,
     Just a moment…, Continue, quicker than a frame), they come back in (Round 34, the owner's phone: the button was left
     blank, the fade out having begun after the words had already come back) */
  const land = () => {
    if (latest.current === showing.current) t.value = withTiming(1, { duration: motion.swap * 1.5, easing: settle });
    else setShown(latest.current);
  };
  useEffect(() => {
    if (value === shown) {
      /* back to what is showing before it had gone: it comes back, and the fade in flight is called off */
      if (!still) t.value = withTiming(1, { duration: motion.swap, easing: settle });
      return;
    }
    if (still) {
      setShown(value);
      return;
    }
    t.value = withTiming(0, { duration: motion.swap, easing: away }, finished => {
      if (finished) runOnJS(land)();
    });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!still && t.value < 1)
      t.value = withTiming(1, {
        duration: motion.swap * 1.5,
        easing: settle,
      });
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: t.value,
    ...blurred((1 - t.value) * 4),
  }));
  return <Animated.View style={[style, moving]}>{children(shown)}</Animated.View>;
}

/* ---- a marker landing ---- */

/* A marker landing beside something. The label changes first; 140ms later
   the mark grows from a third of its size and settles just past full. */
export function Pop({ children, delay = motion.markWait, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, withTiming(1, { duration: motion.mark, easing: overshoot }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 1.6),
    transform: [{ scale: 0.35 + t.value * 0.65 }],
  }));
  return <Animated.View style={[style, moving]}>{children}</Animated.View>;
}

/* ---- a number resolving ---- */

/* A figure resolving. It starts eight pixels soft and mostly there, and
   sharpens over 600ms, so a balance reads as coming into focus rather than
   as counting up. */
export function Resolve({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, withTiming(1, { duration: motion.resolve, easing: settle }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: 0.3 + t.value * 0.7,
    ...blurred((1 - t.value) * 8),
  }));
  return <Animated.View style={[style, moving]}>{children}</Animated.View>;
}

/* ---- a sheet coming up ---- */

/* The panel rises from below its own height and settles. The keypad uses it
   too, with the quicker spring: a tool arriving, not a screen. */
export function Rise({
  children,
  style,
  spring = lift,
  delay = 0,
  from = 460,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  spring?: { damping: number; stiffness: number; mass: number };
  delay?: number;
  from?: number;
}) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, withSpring(1, spring));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 2),
    transform: [{ translateY: (1 - t.value) * from }],
  }));
  return <Animated.View style={[style, moving]}>{children}</Animated.View>;
}

/** The screen behind a sheet, receding as the sheet arrives. `to` is how far
    back it goes. */
export function Scrim({ children, style, to = 0.35 }: { children?: ReactNode; style?: StyleProp<ViewStyle>; to?: number }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withTiming(1, { duration: motion.screen, easing: soft });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const fading = useAnimatedStyle(() => ({ opacity: 1 - t.value * (1 - to) }));
  return <Animated.View style={[style, fading]}>{children}</Animated.View>;
}

/* ---- answering a press ---- */

/* What a tappable thing does under a finger: it dips to 96% in 90ms, easing
   in and stopping, and on release springs back over 360ms with a little
   overshoot. Small on purpose: enough to feel the press land, not enough to
   look like a toy. */
export function useTap(scale = 0.96) {
  const still = useStill();
  const held = useSharedValue(0);
  const pressing = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - held.value * (1 - scale) }],
  }));
  const down = () => {
    if (!still) held.value = withTiming(1, { duration: motion.press, easing: pressIn });
  };
  const up = () => {
    if (!still)
      held.value = withTiming(0, {
        duration: motion.release,
        easing: overshoot,
      });
  };
  return { style: pressing, onPressIn: down, onPressOut: up };
}

export const Moving = Animated.View;

/* A Pressable that takes an animated style, so a press can be answered on the
   UI thread rather than through a re-render. */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* Anything you can tap. A drop-in for Pressable that dips under the finger
   and springs back, so the press is answered before whatever it asks for
   arrives. Use it wherever a tap leads somewhere. */
/* A sideways swipe that moves something (the pages, a card's strip) is not
   a tap on what the finger let go over. On a phone the swipe cancels the
   touch under it; the web does not, so a swipe says when it starts and
   ends, and a tap that lands during one, or just after, is let go. */
let swiping = false;
let swipeEnded = 0;
export const swipes = {
  start() {
    swiping = true;
  },
  end() {
    swiping = false;
    swipeEnded = Date.now();
  },
  /** a tap now would be the end of a swipe */
  blocking: () => swiping || Date.now() - swipeEnded < 250,
};

/* The same on the web for a drag that nothing takes: a phone lets a press go
   once the finger leaves it, the web presses whatever the pointer went down
   on however far it went. A click let go this far from where it went down is
   not a tap. A click from the keyboard has no place, and always counts. */
const DRIFT = 16;
type Spot = { x: number; y: number } | null;
const spotOf = (e: GestureResponderEvent): Spot => {
  const n = e?.nativeEvent as { pageX?: number; pageY?: number; detail?: number } | undefined;
  if (!n || !Number.isFinite(n.pageX) || !Number.isFinite(n.pageY)) return null;
  return { x: n.pageX!, y: n.pageY! };
};
const drifted = (from: Spot, e: GestureResponderEvent) => {
  if (Platform.OS !== 'web' || !from || (e?.nativeEvent as { detail?: number } | undefined)?.detail === 0) return false;
  const to = spotOf(e);
  return !!to && Math.hypot(to.x - from.x, to.y - from.y) > DRIFT;
};

export function Tap({ style, scale, children, ref, ...rest }: PressableProps & { scale?: number; style?: StyleProp<AnimatedStyle<ViewStyle>>; ref?: React.Ref<View> }) {
  const tap = useTap(scale);
  /** where the pointer went down, on the web */
  const from = useRef<Spot>(null);
  return (
    <AnimatedPressable
      ref={ref}
      {...rest}
      onPress={
        rest.onPress
          ? (e: GestureResponderEvent) => {
              if (swipes.blocking() || drifted(from.current, e)) return;
              rest.onPress?.(e);
            }
          : undefined
      }
      onPressIn={(e: GestureResponderEvent) => {
        from.current = spotOf(e);
        tap.onPressIn();
        rest.onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        tap.onPressOut();
        rest.onPressOut?.(e);
      }}
      style={[style, rest.disabled ? null : tap.style]}
    >
      {children as ReactNode}
    </AnimatedPressable>
  );
}
