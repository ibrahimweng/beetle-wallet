/* Continuity between screens.

   Fuse hardly ever pushes a page: the thing you tapped stays where it is,
   the rest recedes, and the next thing grows out of it. Where Beetle does
   need a page, this keeps the thread. The thing you tapped lights and stays
   lit; the screen it is on recedes — soft, dim, a touch smaller — and the
   next screen's head arrives from the tapped thing's own place, carrying
   its words up and growing into the title, with the body following out of
   a blur a beat later. On the way back the screen comes forward again and
   the thing you left from pulses once, so the eye finds where it was.

   A departure records where it started (`setOrigin`); the screen arriving
   next takes that (`useArrival`) and starts its head there; the screen
   left behind pulses the thing by its id (`useDeparture`). An origin older
   than a few seconds is stale: that screen was opened some other way, and
   its head simply fades in. */
import React, { ReactNode, RefObject, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { SharedValue, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { away, blurred, lift, motion, standard, useStill } from './motion';

export type Rect = { x: number; y: number; w: number; h: number };
export type Origin = Rect & { id: string; words?: string; at: number };

let origin: Origin | null = null;
/** How long an origin stays fresh: a screen opened any later came some other way. */
const FRESH = 3000;

export function setOrigin(o: Origin) {
  origin = o;
}

/** The origin the screen arriving now came from, or null when it came some other way. */
export function takeOrigin(): Origin | null {
  return origin && Date.now() - origin.at < FRESH ? origin : null;
}

/** Whether the thing with this id is the one last departed from; true once, then forgotten. */
export function pulseFor(id: string): boolean {
  if (!origin || origin.id !== id || Date.now() - origin.at < 400) return false;
  origin = null;
  return true;
}

/** Where a view is on the window. */
export function measure(ref: RefObject<View | null>): Promise<Rect> {
  return new Promise(done => {
    const node = ref.current;
    if (!node) return done({ x: 0, y: 0, w: 0, h: 0 });
    node.measureInWindow((x, y, w, h) => done({ x, y, w, h }));
  });
}

/* ---- the screen receding, and coming forward again ---- */

type Journey = { recede: () => Promise<void>; t: SharedValue<number> };
const Ctx = createContext<Journey | null>(null);
/** The journey of the screen with focus, for things outside any screen — the foot — that lead away from it. */
let current: Journey | null = null;
export const recedeCurrent = () => current?.recede() ?? Promise.resolve();

export function JourneyProvider({ children }: { children: ReactNode }) {
  const parent = useContext(Ctx);
  const still = useStill();
  const t = useSharedValue(0);
  const recede = useCallback(
    () =>
      new Promise<void>(done => {
        if (still) return done();
        t.value = withTiming(1, { duration: motion.leave, easing: away });
        setTimeout(done, motion.leave - 60);
      }),
    [still, t],
  );
  /* back here: forward again, out of the soft */
  useFocusEffect(
    useCallback(() => {
      if (t.value > 0) t.value = still ? 0 : withTiming(0, { duration: motion.enter, easing: standard });
    }, [still, t]),
  );
  const value = useMemo(() => ({ recede, t }), [recede, t]);
  /* the screen with focus is the one the foot recedes */
  useFocusEffect(
    useCallback(() => {
      if (parent) return undefined;
      current = value;
      return () => {
        if (current === value) current = null;
      };
    }, [parent, value]),
  );
  /* one journey per screen: a provider inside another leaves it to the outer */
  if (parent) return <>{children}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The style a screen's content wears as it recedes: dimmer, softer, a touch smaller. */
export function useRecession() {
  const t = useContext(Ctx)?.t;
  return useAnimatedStyle(() => {
    const v = t ? t.value : 0;
    return { opacity: 1 - v * 0.55, transform: [{ scale: 1 - v * 0.03 }], ...blurred(v * 6) };
  });
}

/* ---- leaving from a thing ---- */

const WASH_OFF = 'rgba(0, 0, 0, 0)';
const WASH_ON = 'rgba(0, 0, 0, 0.05)';

/** A thing that leads to a screen. Put `ref` and `onPress` on the tappable
    and `style` on it too: pressed, it lights and stays lit while the screen
    recedes, then the screen it leads to is pushed; when that screen is
    left, it pulses once. With no `to` it only pulses. */
export function useDeparture({ id, to, words, replace = false, anchor }: { id: string; to?: string; words?: string; replace?: boolean; anchor?: RefObject<View | null> }) {
  const ref = useRef<View>(null);
  const router = useRouter();
  const still = useStill();
  const journey = useContext(Ctx);
  const lit = useSharedValue(0);
  useFocusEffect(
    useCallback(() => {
      if (!pulseFor(id) || still) return;
      lit.value = 1;
      lit.value = withDelay(160, withTiming(0, { duration: 700, easing: away }));
    }, [id, still, lit]),
  );
  const style = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(lit.value, [0, 1], [WASH_OFF, WASH_ON]) }));
  const onPress = useCallback(async () => {
    if (!to) return;
    const rect = await measure(anchor ?? ref);
    setOrigin({ id, ...rect, words, at: Date.now() });
    if (!still) lit.value = withTiming(1, { duration: motion.press });
    await (journey ? journey.recede() : recedeCurrent());
    if (replace) router.replace(to as never);
    else router.push(to as never);
  }, [to, id, words, replace, still, lit, journey, router, anchor]);
  return { ref, onPress, style };
}

/* ---- arriving as a thing ---- */

/** The head of a screen. Put `ref`, `onLayout` and `style` on the view that
    carries it: opened from a thing, it starts at that thing's place and
    size and settles into its own on the lift spring; opened any other way,
    it fades in with the rest. */
export function useArrival(carry = true) {
  const still = useStill();
  const [from] = useState<Origin | null>(() => (still || !carry ? null : takeOrigin()));
  const t = useSharedValue(still ? 1 : 0);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const sc = useSharedValue(1);
  const ref = useRef<View>(null);
  const started = useRef(false);
  const onLayout = useCallback(() => {
    if (started.current || still) return;
    started.current = true;
    if (!from) {
      t.value = withTiming(1, { duration: motion.enter, easing: standard });
      return;
    }
    void measure(ref).then(here => {
      dx.value = from.x - here.x;
      dy.value = from.y - here.y;
      sc.value = from.words && here.h ? Math.max(0.4, Math.min(1.6, from.h / here.h)) : 1;
      t.value = withSpring(1, lift);
    });
  }, [from, still, t, dx, dy, sc]);
  const style = useAnimatedStyle(() => ({
    opacity: from ? (t.value === 0 ? 0 : 1) : t.value,
    transform: [{ translateX: dx.value * (1 - t.value) }, { translateY: dy.value * (1 - t.value) }, { scale: sc.value + (1 - sc.value) * t.value }],
  }));
  return { ref, onLayout, style: [{ transformOrigin: 'top left' }, style] as StyleProp<ViewStyle>, from };
}

/** A view that arrives as the head of its screen. */
export function Arrive({ children, style, carry = true, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; carry?: boolean; testID?: string }) {
  const a = useArrival(carry);
  return (
    <Animated.View ref={a.ref} onLayout={a.onLayout} style={[style, a.style]} testID={testID}>
      {children}
    </Animated.View>
  );
}
