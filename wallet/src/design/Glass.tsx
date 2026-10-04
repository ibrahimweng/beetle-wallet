/* Glass, where there used to be white (Round 13, the owner's word: "use a
   progressive blur not white").

   A soft blur at an edge: what scrolls under the top of a page, or under
   its foot, softens as it goes, with no white laid over it, so a white
   page reads as white and a card passing under reads as a card, blurred.
   It is stacked: four sheets of expo-blur, each reaching less far in than
   the last and each masked by a gradient so its own end fades rather than
   stops, which gives a blur that grows toward the edge with no line
   anywhere. On the phone the mask is a MaskedView; on the web it is CSS.

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

/** Android draws a real blur only with this method; iOS and the web always do. */
export const blurMethod = Platform.OS === 'android' ? ('dimezisBlurView' as const) : ('none' as const);

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

/** Where a sheet's own fade begins, as a share of its reach. */
export const SHEET_SOLID = 0.5;

export const along = (side: Side) => ({
  start: { x: 0.5, y: side === 'top' ? 0 : 1 },
  end: { x: 0.5, y: side === 'top' ? 1 : 0 },
});

/** One sheet of blur, fading out at its own end. */
export function Sheet({ side, height, children }: { side: Side; height: number; children?: ReactNode }) {
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  const box = [{ position: 'absolute' as const, left: 0, right: 0, height }, edge];
  if (Platform.OS === 'web')
    return (
      <WebMasked style={box} side={side} solid={SHEET_SOLID}>
        {children}
      </WebMasked>
    );
  if (Masked)
    return (
      <Masked style={box} maskElement={<LinearGradient colors={['#000', '#000', 'transparent']} locations={[0, SHEET_SOLID, 1]} {...along(side)} style={StyleSheet.absoluteFill} />}>
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
    parent is drawn badly there; the web fades the whole, which it draws well. */
export function SoftBlur({ side, height, k, strong = false, testID }: { side: Side; height: number; k?: SharedValue<number>; strong?: boolean; testID?: string }) {
  const Blur = blurModule?.BlurView;
  const native = Platform.OS !== 'web' && !!AnimatedBlur && !!k;
  const whole = useAnimatedStyle(() => ({ opacity: native || !k ? 1 : k.value }));
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  if (!Blur) return null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge, whole]} testID={testID}>
      {(strong ? STRONG_SHEETS : SHEETS).map(([share, intensity], i) => (
        <Sheet key={i} side={side} height={Math.round(height * share)}>
          {native && k ? <GrowingBlur k={k} intensity={intensity} /> : <Blur intensity={intensity} tint="light" experimentalBlurMethod={blurMethod} style={StyleSheet.absoluteFill} />}
        </Sheet>
      ))}
    </Animated.View>
  );
}

export function GrowingBlur({ k, intensity, tint = 'light' }: { k: SharedValue<number>; intensity: number; tint?: 'light' | 'dark' }) {
  const strength = useAnimatedProps(() => ({ intensity: Math.max(0, Math.min(1, k.value)) * intensity }), [intensity]);
  if (!AnimatedBlur) return null;
  return <AnimatedBlur animatedProps={strength} tint={tint} experimentalBlurMethod={blurMethod} style={StyleSheet.absoluteFill} />;
}

/** How white frosted white is: enough to read as glass over a card, little
    enough that over the white page it is all but invisible (the owner's
    choice for the bar's pill). */
const FROSTED = 'rgba(255, 255, 255, 0.55)';

/** A shape of frosted white glass: the bar's pill, a page's Back. Its
    corners are the caller's; it clips what it holds to them. No outline. */
export function Glass({ style, children, testID }: { style?: StyleProp<ViewStyle>; children?: ReactNode; testID?: string }) {
  const Blur = blurModule?.BlurView;
  return (
    <View style={[s.glass, style]} testID={testID}>
      {Blur ? <Blur intensity={40} tint="light" experimentalBlurMethod={blurMethod} style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Blur ? FROSTED : 'rgba(255, 255, 255, 0.92)' }]} pointerEvents="none" />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  glass: { overflow: 'hidden' },
});
