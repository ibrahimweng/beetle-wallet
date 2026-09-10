/* How the app moves.

   One file for every duration, spring and curve, the same way tokens.ts is one
   file for every colour and size. Nothing anywhere else picks a number.

   The rule the whole thing is built on: an arrival should be noticeable and
   over. Long enough that you see the screen assemble, short enough that you
   never wait for it. Everything below is a spring rather than a curve, because
   a spring keeps its momentum from whatever you just did — the tap starts the
   movement and the movement finishes the tap.

   Reanimated runs these on the UI thread, so a screen still animates smoothly
   while JavaScript is busy putting the next one together. (anime.js, and every
   other DOM animation library, cannot be used here: on a phone there are no
   DOM nodes to animate.) */
import React, { ReactNode, useEffect } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const motion = {
  /** A screen's transition. Long enough to read as a movement. */
  screen: 340,
  /** Between one thing arriving and the next. */
  step: 38,
  /** The longest anything waits before it starts, however far down it is. */
  wait: 300,
  /** A press answering you. */
  press: 90,
  /** How far something rises as it arrives. */
  rise: 14,
} as const;

/* Arriving: settles quickly, with just enough overshoot to read as movement
   rather than as a fade. */
export const arrive = { damping: 20, stiffness: 210, mass: 0.9 } as const;

/* The menu: the same spring loosened, so the buttons overshoot and settle. */
export const bouncy = { damping: 11, stiffness: 190, mass: 0.85 } as const;

/* A sheet coming up from the bottom: heavier, so it reads as weight. */
export const lift = { damping: 22, stiffness: 170, mass: 1 } as const;

/* A keyboard: quicker and flatter than a sheet, because it is a tool arriving
   rather than a screen. */
export const keys = { damping: 26, stiffness: 260, mass: 0.9 } as const;

export const ease = Easing.bezier(0.22, 1, 0.36, 1);

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

export const Backdrop = ({ children }: { children: ReactNode }) => (
  <Behind.Provider value={true}>{children}</Behind.Provider>
);

/* ---- arriving ---- */

/* One thing arriving. `index` is its place in the column, which is what turns
   a screenful of these into a sequence rather than a flash. */
export function Reveal({
  index = 0,
  rise = motion.rise,
  children,
  style,
}: {
  index?: number;
  rise?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(Math.min(index * motion.step, motion.wait), withSpring(1, arrive));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value * 1.4),
    transform: [{ translateY: (1 - t.value) * rise }],
  }));
  return <Animated.View style={[style, moving]}>{children}</Animated.View>;
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

/* ---- a sheet coming up ---- */

/* The panel rises from below its own height and settles. The scrim behind it
   fades in over the same time, so the screen it covers recedes as it arrives. */
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
    back it goes, and the animated opacity has to carry it rather than sit
    beside it — the last style wins. */
export function Scrim({
  children,
  style,
  to = 0.35,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  to?: number;
}) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withTiming(1, { duration: motion.screen, easing: ease });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const fading = useAnimatedStyle(() => ({ opacity: 1 - t.value * (1 - to) }));
  return <Animated.View style={[style, fading]}>{children}</Animated.View>;
}

/* ---- answering a press ---- */

/* What a tappable thing does under a finger. The scale is small on purpose:
   enough to feel the press land, not enough to look like a toy. */
export function useTap(scale = 0.97) {
  const still = useStill();
  const held = useSharedValue(0);
  const pressing = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - held.value * (1 - scale) }],
    opacity: 1 - held.value * 0.22,
  }));
  const down = () => {
    if (!still) held.value = withTiming(1, { duration: motion.press, easing: ease });
  };
  const up = () => {
    if (!still) held.value = withSpring(0, arrive);
  };
  return { style: pressing, onPressIn: down, onPressOut: up };
}

export const Moving = Animated.View;

/* A Pressable that takes an animated style, so a press can be answered on the
   UI thread rather than through a re-render. */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* Anything you can tap. A drop-in for Pressable that gives under the finger
   and springs back, so the press is answered before whatever it asks for
   arrives. Use it wherever a tap leads somewhere. */
export function Tap({
  style,
  scale,
  children,
  ...rest
}: PressableProps & { scale?: number; style?: StyleProp<ViewStyle> }) {
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
