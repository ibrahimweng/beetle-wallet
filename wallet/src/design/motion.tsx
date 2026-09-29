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
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { GestureResponderEvent, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

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
    t.value = leaving ? withTiming(0, { duration: motion.leave, easing: away }) : withDelay(delay, withTiming(1, { duration: motion.enter, easing: standard }));
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
  useEffect(() => {
    if (value === shown) return;
    if (still) {
      setShown(value);
      return;
    }
    t.value = withTiming(0, { duration: motion.swap, easing: away }, finished => {
      if (finished) runOnJS(setShown)(value);
    });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!still && t.value < 1)
      t.value = withTiming(1, {
        duration: motion.swap * 1.5,
        easing: standard,
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
export function Tap({ style, scale, children, ...rest }: PressableProps & { scale?: number; style?: StyleProp<ViewStyle> }) {
  const tap = useTap(scale);
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
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
