/* Glass, where there used to be white (Round 13, the owner's word: "use a
   progressive blur not white").

   A soft blur at an edge: what scrolls under the top of a page, or under
   its foot, softens as it goes, with no white laid over it, so a white
   page reads as white and a card passing under reads as a card, blurred.
   It is stacked: four sheets of expo-blur, each reaching less far in than
   the last and each masked by a gradient so its own end fades rather than
   stops, which gives a blur that grows toward the edge with no line
   anywhere. On the phone the mask is a MaskedView; on the web it is CSS,
   on the same box as the blur: a browser only blurs what is behind a box
   while nothing round the box is masked, rounded or see-through, so masked
   from outside, the blur under a page's title was never drawn and what
   scrolled under the title stayed sharp (Round 18, the owner's word).

   Frosted white: a pill or a circle of blur with a little white in it, for
   the bar's glyphs and a page's Back, and the ground of a page that opens
   over home, so home shows through behind it, out of focus.

   expo-blur and the mask are in the web, Expo Go and any build made after
   they were added; without them the blur is simply not drawn, never a
   crash. */
import React, { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { blurAt, webFrost } from './Veil';

type BlurModule = typeof import('expo-blur');
export const blurModule: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();

type MaskModule = typeof import('@react-native-masked-view/masked-view');
const Masked: MaskModule['default'] | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@react-native-masked-view/masked-view') as MaskModule).default;
  } catch {
    return null;
  }
})();

/** A sheet's blur able to take its strength from a shared value on the phone. */
export const AnimatedBlur = blurModule ? Animated.createAnimatedComponent(blurModule.BlurView) : null;

/* No blur method is named: iOS and the web always blur, and Android blurs
   only through a view marked as what to blur (expo-blur's BlurTargetView),
   which this app does not have, so there the glass is its white alone, as
   it was. (The old way of naming it is deprecated, and said so every time a
   blur came up; the analysis after Round 21.) */

export type Side = 'top' | 'bottom';

/** How far each sheet reaches in from the edge, and how much it softens. */
export const SHEETS: [number, number][] = [
  [1, 10],
  [0.78, 14],
  [0.58, 18],
  [0.4, 24],
];

/** The stronger stack the top of a page uses, so what passes under a shrunk title is a smear and the title reads. */
export const STRONG_SHEETS: [number, number][] = [
  [1, 22],
  [0.8, 30],
  [0.6, 40],
  [0.42, 50],
];

/** The phone's stacks, half as many sheets (Round 29): each sheet is a blur in a mask of its own, the most costly thing
    the phone draws, and with the three pages, the foot and the chat there were seventeen of them up at once. Two
    sheets each, reaching as far and as strong at the edge. */
export const PHONE_SHEETS: [number, number][] = [
  [1, 12],
  [0.5, 22],
];
export const PHONE_STRONG_SHEETS: [number, number][] = [
  [1, 28],
  [0.5, 48],
];

/** Where a sheet's own fade begins, as a share of its reach. */
export const SHEET_SOLID = 0.5;

export const along = (side: Side) => ({
  start: { x: 0.5, y: side === 'top' ? 0 : 1 },
  end: { x: 0.5, y: side === 'top' ? 1 : 0 },
});

/** One sheet of blur, whole as far as `solid` of its reach and fading out after it, to its own end. */
export function Sheet({ side, height, solid = SHEET_SOLID, children }: { side: Side; height: number; solid?: number; children?: ReactNode }) {
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  const box = [{ position: 'absolute' as const, left: 0, right: 0, height }, edge];
  if (Platform.OS === 'web')
    return (
      <WebMasked style={box} side={side} solid={solid}>
        {children}
      </WebMasked>
    );
  if (Masked)
    return (
      <Masked style={box} maskElement={<LinearGradient colors={['#000', '#000', 'transparent']} locations={[0, solid, 1]} {...along(side)} style={StyleSheet.absoluteFill} />}>
        {children}
      </Masked>
    );
  return <View style={box}>{children}</View>;
}

/* On the web the mask is a CSS gradient on the box itself, set on the node:
   a style the web renderer would not otherwise pass through. */
function WebMasked({ style, side, solid, children }: { style: object; side: Side; solid: number; children?: ReactNode }) {
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    const el = ref.current as unknown as { style?: Record<string, string> } | null;
    if (!el?.style) return;
    const mask = `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 ${Math.round(solid * 100)}%, transparent 100%)`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
  }, [side, solid]);
  return (
    <View ref={ref} style={style}>
      {children}
    </View>
  );
}

/** A soft blur at the top or the foot of the screen, strongest at the edge
    and gone by `height` in, with no white in it. `k` brings it in and out:
    on the phone each sheet's blur grows with it, since a blur under a fading
    parent is drawn badly there; the web fades the whole, which it draws well.
    `hold` keeps it whole as far in as that, every sheet at its strongest,
    and only then fading, each sheet to its own end: the top of a page holds
    it past the shrunk title, so what passes under the title is a haze and
    the title reads alone (Round 18, the owner's word: the title drew over
    the lines, the blur already thinning where it stood). */
export function SoftBlur({ side, height, k, strong = false, hold, testID }: { side: Side; height: number; k?: SharedValue<number>; strong?: boolean; hold?: number; testID?: string }) {
  const Blur = blurModule?.BlurView;
  const native = Platform.OS !== 'web' && !!AnimatedBlur && !!k;
  /* on the phone the sheets' blur grows rather than the whole fading; once it has gone to nothing the stack is not
     drawn at all, since a blur at its least is still a blur being drawn (Round 29) */
  const whole = useAnimatedStyle(() => ({ opacity: !k ? 1 : native ? (k.value > 0.01 ? 1 : 0) : k.value }));
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  /* each sheet's reach, and how much of it is whole: half, or as far as `hold` */
  const table = Platform.OS === 'web' ? (strong ? STRONG_SHEETS : SHEETS) : strong ? PHONE_STRONG_SHEETS : PHONE_SHEETS;
  const sheets = table.map(([share, intensity]) => {
    const reach = hold == null ? Math.round(height * share) : Math.round(hold + (height - hold) * share);
    return { reach, intensity, solid: hold == null ? SHEET_SOLID : Math.min(0.96, hold / reach) };
  });
  /* the web: each sheet one box with its blur and its mask, `k` thinning its blur */
  if (Platform.OS === 'web')
    return (
      <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge]} testID={testID}>
        {sheets.map(({ reach, intensity, solid }, i) => (
          <WebSheet key={i} side={side} height={reach} solid={solid} intensity={intensity} k={k} />
        ))}
      </View>
    );
  if (!Blur) return null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge, whole]} testID={testID}>
      {sheets.map(({ reach, intensity, solid }, i) => (
        <Sheet key={i} side={side} height={reach} solid={solid}>
          {native && k ? <GrowingBlur k={k} intensity={intensity} /> : <Blur intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />}
        </Sheet>
      ))}
    </Animated.View>
  );
}

/** One sheet of the soft blur on the web: its blur and its mask on the one box (see the top of this file), the blur at
    `k` of its strength. */
function WebSheet({ side, height, solid, intensity, k }: { side: Side; height: number; solid: number; intensity: number; k?: SharedValue<number> }) {
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    const el = ref.current as unknown as { style?: Record<string, string> } | null;
    if (!el?.style) return;
    const mask = `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 ${Math.round(solid * 100)}%, transparent 100%)`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
  }, [side, solid]);
  const strength = useAnimatedStyle(() => webFrost(k ? Math.max(0, Math.min(1, k.value)) : 1, intensity, 'light'), [intensity]);
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  return <Animated.View ref={ref} pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge, strength]} />;
}

export function GrowingBlur({ k, intensity, tint = 'light' }: { k: SharedValue<number>; intensity: number; tint?: 'light' | 'dark' }) {
  const strength = useAnimatedProps(() => ({ intensity: blurAt(k.value, intensity) }), [intensity]);
  if (!AnimatedBlur) return null;
  return <AnimatedBlur animatedProps={strength} tint={tint} style={StyleSheet.absoluteFill} />;
}

/** How white frosted white is: enough to read as glass over a card, little
    enough that over the white page it is all but invisible (the owner's
    choice for the bar's pill). */
export const FROSTED = 'rgba(250, 250, 249, 0.55)';

/** A shape of frosted white glass: the bar's pill, a page's Back. Its
    corners are the caller's; it clips what it holds to them, and the blur
    takes them too: on the web a blur is not clipped by the box round it, so
    without its own corners the pill's blur showed as a square round it
    (Round 18, the owner's word). No outline. */
export function Glass({ style, children, testID }: { style?: StyleProp<ViewStyle>; children?: ReactNode; testID?: string }) {
  const Blur = blurModule?.BlurView;
  const round = StyleSheet.flatten(style)?.borderRadius;
  const corners = typeof round === 'number' ? { borderRadius: round } : null;
  return (
    <View style={[s.glass, style]} testID={testID}>
      {Blur ? <Blur intensity={40} tint="light" style={[StyleSheet.absoluteFill, corners]} /> : null}
      <View style={[StyleSheet.absoluteFill, corners, { backgroundColor: Blur ? FROSTED : 'rgba(250, 250, 249, 0.92)' }]} pointerEvents="none" />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  glass: { overflow: 'hidden' },
});
