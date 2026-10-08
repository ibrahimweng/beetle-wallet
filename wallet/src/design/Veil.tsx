/* The soft cover a thing opens over: the page under it blurred, and over
   that a gradient that is see-through at the top and solid at the foot.
   White over a light page, near black over the chat. More opens over the
   white one, as the owner's Actions frame draws it (white at 76% over a
   13 blur at the top) and as Fuse does, going solid towards the button;
   a receipt opens over whichever its page is; a line of Activities opens
   in place over the frost, the page under it soft all the way down. */
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type BlurModule = typeof import('expo-blur');
const blur: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();

export type VeilTone = 'light' | 'paper' | 'dark' | 'frost' | 'page';

/** The gradient's stops: the frame's 76% at the top, most of the way solid by the middle, solid at the foot.
    Paper is the white a receipt opens over: the same way down, but near solid from the top, so the
    page under it is a hint behind the receipt's own words rather than a smudge. */
const STOPS: Record<VeilTone, { colors: [string, string, string]; tint: 'light' | 'dark' }> = {
  light: { colors: ['rgba(250,250,249,0.76)', 'rgba(250,250,249,0.9)', 'rgba(250,250,249,1)'], tint: 'light' },
  paper: { colors: ['rgba(250,250,249,0.96)', 'rgba(250,250,249,0.99)', 'rgba(250,250,249,1)'], tint: 'light' },
  dark: { colors: ['rgba(19,12,7,0.74)', 'rgba(19,12,7,0.9)', 'rgba(19,12,7,0.98)'], tint: 'dark' },
  /* the same white all the way down, thin enough that the page shows through soft: what a line opens in place over (see Activities) */
  frost: { colors: ['rgba(243,242,239,0.8)', 'rgba(243,242,239,0.82)', 'rgba(243,242,239,0.86)'], tint: 'light' },
  /* the frost in the page's own white: laid round a line of Activities that opens in the list, so the line, on the
     page's white, sits on the same ground as the frost round it, with no edge between them (Round 17) */
  page: { colors: ['rgba(250,250,249,0.8)', 'rgba(250,250,249,0.82)', 'rgba(250,250,249,0.86)'], tint: 'light' },
};
const LOCATIONS: [number, number, number] = [0, 0.55, 1];

/** 65 is the blur the frame gives the scrim: 13 points. */
export const VEIL_BLUR = 65;

/* The blur, able to take its strength from a shared value on the phone. */
const AnimatedBlur = blur ? Animated.createAnimatedComponent(blur.BlurView) : null;

/** The web's blur at strength `k` of `intensity`, drawn the way expo-blur draws it there: a browser only blurs
    what is behind an element while nothing over it is see-through, so a fading blur has to thin itself
    rather than fade (Round 16: faded, it vanished at once and left the page sharp under the white). The light
    one leaves the colour as it is: expo-blur's lift of it, which nothing showed on a white page, turned the
    brand's paper yellow (Round 25). */
export function webFrost(k: number, intensity: number, tint: 'light' | 'dark'): ViewStyle {
  'worklet';
  const n = Math.min(intensity, 100);
  const f = `saturate(${(tint === 'dark' ? 1 + 0.8 * k : 1).toFixed(3)}) blur(${(k * n * 0.2).toFixed(2)}px)`;
  const ground = tint === 'dark' ? `rgba(26,19,13,${((k * n) / 100) * 0.78})` : `rgba(250,250,249,${((k * n) / 100) * 0.78})`;
  return { backdropFilter: f, WebkitBackdropFilter: f, backgroundColor: ground } as unknown as ViewStyle;
}

/** A blur's strength at `k` of `intensity`, in steps of three. The phone builds a blur's effect again each time its
    strength changes, so a blur that grows is told only every few points of it, not on every frame (Round 29). */
export function blurAt(k: number, intensity: number) {
  'worklet';
  return Math.round((Math.max(0, Math.min(1, k)) * intensity) / 3) * 3;
}

/** `t`, where given, brings the veil in and out: the blur grows in strength
    and the wash in opacity, on the phone and on the web alike, since a blur
    under a fading parent is drawn badly on both (on the phone it pops; on the
    web it is not drawn at all). Without `t` it is simply there. */
export function Veil({ tone = 'light', intensity = VEIL_BLUR, testID, t }: { tone?: VeilTone; intensity?: number; testID?: string; t?: SharedValue<number> }) {
  const s = STOPS[tone];
  const Blur = blur?.BlurView;
  const growing = !!t && Platform.OS !== 'web' && !!AnimatedBlur;
  const strength = useAnimatedProps(() => ({ intensity: blurAt(t ? t.value : 1, intensity) }), [intensity]);
  const wash = useAnimatedStyle(() => ({ opacity: t ? Math.max(0, Math.min(1, t.value)) : 1 }));
  const frosting = useAnimatedStyle(() => webFrost(Math.max(0, Math.min(1, t ? t.value : 1)), intensity, s.tint), [intensity, s.tint]);
  const blurStyle = useMemo(() => StyleSheet.absoluteFill, []);
  if (!t)
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={testID}>
        {Blur ? <Blur intensity={intensity} tint={s.tint} style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient colors={s.colors} locations={LOCATIONS} style={StyleSheet.absoluteFill} />
      </View>
    );
  if (Platform.OS === 'web')
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={testID}>
        <Animated.View style={[StyleSheet.absoluteFill, frosting]} />
        <Animated.View style={[StyleSheet.absoluteFill, wash]}>
          <LinearGradient colors={s.colors} locations={LOCATIONS} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    );
  return (
    <Animated.View style={[StyleSheet.absoluteFill, growing ? null : wash]} pointerEvents="none" testID={testID}>
      {growing && AnimatedBlur ? <AnimatedBlur animatedProps={strength} tint={s.tint} style={blurStyle} /> : Blur ? <Blur intensity={intensity} tint={s.tint} style={StyleSheet.absoluteFill} /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, growing ? wash : null]}>
        <LinearGradient colors={s.colors} locations={LOCATIONS} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </Animated.View>
  );
}

/** A plain blur with a flat wash over it, brought in by `t` the same way as
    a veil: the blur's strength grows and the wash fades in, on the phone and
    on the web. What a sheet or a peek opens over. */
export function GrowingBlur({ t, intensity, tint = 'light', wash }: { t: SharedValue<number>; intensity: number; tint?: 'light' | 'dark'; wash: string }) {
  const Blur = blur?.BlurView;
  const growing = Platform.OS !== 'web' && !!AnimatedBlur;
  const strength = useAnimatedProps(() => ({ intensity: blurAt(t.value, intensity) }), [intensity]);
  const fade = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, t.value)) }));
  const frosting = useAnimatedStyle(() => webFrost(Math.max(0, Math.min(1, t.value)), intensity, tint), [intensity, tint]);
  if (Platform.OS === 'web')
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, frosting]} />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: wash }, fade]} />
      </View>
    );
  if (growing && AnimatedBlur)
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedBlur animatedProps={strength} tint={tint} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: wash }, fade]} />
      </View>
    );
  return (
    <Animated.View style={[StyleSheet.absoluteFill, fade]} pointerEvents="none">
      {Blur ? <Blur intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: wash }]} />
    </Animated.View>
  );
}
