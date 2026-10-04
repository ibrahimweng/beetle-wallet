/* Continuity between screens.

   Pages come and go with the phone's own sliding page movement (the stack
   in app/(app)/_layout.tsx), and that slide is the whole of it: nothing
   here moves a page any more. The thing tapped is not lit and the screen
   it is on does not recede (Round 13, at the owner's word: "just use the
   regular page sliding animation for the pages"). What stays is the
   bookkeeping a few screens read: where a departure started (`setOrigin`,
   `takeOrigin`), and where a view is on the window (`measure`). The hooks
   keep their shapes so the screens that call them need not change. */
import React, { ReactNode, RefObject, createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

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
  const t = useSharedValue(0);
  /* the slide is the movement: nothing recedes */
  const recede = useCallback(() => Promise.resolve(), []);
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

/** What a screen's content wore as it receded. Nothing now: the page slides away whole. */
export function useRecession(): StyleProp<ViewStyle> {
  return null;
}

/* ---- leaving from a thing ---- */

/** A thing that leads to a screen. Put `ref` and `onPress` on the tappable,
    and `wash` as its first child. Pressed, the screen it leads to slides in
    at once; the thing's own press is all the answer the tap gets (Round 13:
    no wash that stays lit, no pulse on the way back). With no `to` it does
    nothing. `lit` is the wash's style, for a thing that draws its wash
    itself; it stays clear. */
export function useDeparture({ id, to, words, replace = false, anchor }: { id: string; to?: string; words?: string; replace?: boolean; anchor?: RefObject<View | null> }) {
  const ref = useRef<View>(null);
  const router = useRouter();
  /* testID "wash": the Figma check steps over it when it walks into a row's children */
  const wash = <View pointerEvents="none" testID="wash" style={WASH} />;
  const onPress = useCallback(() => {
    if (!to) return;
    /* where it started, for a screen that says where it came from; measured after the push so the tap is never held up */
    setOrigin({ id, x: 0, y: 0, w: 0, h: 0, words, at: Date.now() });
    if (replace) router.replace(to as never);
    else router.push(to as never);
    void measure(anchor ?? ref).then(rect => {
      if (origin?.id === id) origin = { ...origin, ...rect };
    });
  }, [to, id, words, replace, router, anchor]);
  return { ref, onPress, wash, lit: null as StyleProp<ViewStyle> };
}

/** The wash: 8 wider than the thing either side and 2 above and below, its corners round. */
const WASH = { position: 'absolute' as const, top: -2, bottom: -2, left: -8, right: -8, borderRadius: 14 };

/* ---- arriving ---- */

/** The head of a screen. It is simply there when the page slides in: no
    blur, no growing. `ref` and `onLayout` stay for the views that carry them. */
export function useArrival(_carry = true) {
  const ref = useRef<View>(null);
  const onLayout = useCallback(() => undefined, []);
  return { ref, onLayout, style: null as StyleProp<ViewStyle>, from: null as Origin | null };
}

/** A view that is the head of its screen. */
export function Arrive({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; carry?: boolean; testID?: string }) {
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  );
}
