/* The soft cover a thing opens over: the page under it blurred, and over
   that a gradient that is see-through at the top and solid at the foot.
   White over a light page, near black over the chat. More opens over the
   white one, as the owner's Actions frame draws it (white at 76% over a
   13 blur at the top) and as Fuse does, going solid towards the button;
   a receipt opens over whichever its page is; a line of Activities opens
   in place over the frost, the page under it soft all the way down. */
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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

export type VeilTone = 'light' | 'paper' | 'dark' | 'frost';

/** The gradient's stops: the frame's 76% at the top, most of the way solid by the middle, solid at the foot.
    Paper is the white a receipt opens over: the same way down, but near solid from the top, so the
    page under it is a hint behind the receipt's own words rather than a smudge. */
const STOPS: Record<VeilTone, { colors: [string, string, string]; tint: 'light' | 'dark' }> = {
  light: { colors: ['rgba(255,255,255,0.76)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)'], tint: 'light' },
  paper: { colors: ['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.99)', 'rgba(255,255,255,1)'], tint: 'light' },
  dark: { colors: ['rgba(14,14,16,0.74)', 'rgba(14,14,16,0.9)', 'rgba(14,14,16,0.98)'], tint: 'dark' },
  /* the same white all the way down, thin enough that the page shows through soft: what a line opens in place over (see Activities) */
  frost: { colors: ['rgba(247,247,249,0.8)', 'rgba(247,247,249,0.82)', 'rgba(247,247,249,0.86)'], tint: 'light' },
};
const LOCATIONS: [number, number, number] = [0, 0.55, 1];

/** 65 is the blur the frame gives the scrim: 13 points. */
export const VEIL_BLUR = 65;

/* The blur, able to take its strength from a shared value on the phone. */
const AnimatedBlur = blur ? Animated.createAnimatedComponent(blur.BlurView) : null;

/** `t`, where given, brings the veil in and out: on the phone the blur grows
    in strength and the wash in opacity, since a blur under a fading parent is
    drawn badly there (it pops, and reads as a jerk); the web fades it whole,
    which it draws well. Without `t` it is simply there. */
export function Veil({ tone = 'light', intensity = VEIL_BLUR, testID, t }: { tone?: VeilTone; intensity?: number; testID?: string; t?: SharedValue<number> }) {
  const s = STOPS[tone];
  const Blur = blur?.BlurView;
  const growing = !!t && Platform.OS !== 'web' && !!AnimatedBlur;
  const strength = useAnimatedProps(() => ({ intensity: Math.max(0, Math.min(1, t ? t.value : 1)) * intensity }), [intensity]);
  const wash = useAnimatedStyle(() => ({ opacity: t ? Math.max(0, Math.min(1, t.value)) : 1 }));
  const blurStyle = useMemo(() => StyleSheet.absoluteFill, []);
  if (!t)
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={testID}>
        {Blur ? <Blur intensity={intensity} tint={s.tint} experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient colors={s.colors} locations={LOCATIONS} style={StyleSheet.absoluteFill} />
      </View>
    );
  return (
    <Animated.View style={[StyleSheet.absoluteFill, growing ? null : wash]} pointerEvents="none" testID={testID}>
      {growing && AnimatedBlur ? (
        <AnimatedBlur animatedProps={strength} tint={s.tint} experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={blurStyle} />
      ) : Blur ? (
        <Blur intensity={intensity} tint={s.tint} experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} />
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, growing ? wash : null]}>
        <LinearGradient colors={s.colors} locations={LOCATIONS} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </Animated.View>
  );
}

/** A plain blur with a flat wash over it, brought in by `t` the same way as
    a veil: the blur's strength grows on the phone, the whole fades on the web.
    What a sheet or a peek opens over. */
export function GrowingBlur({ t, intensity, tint = 'light', wash }: { t: SharedValue<number>; intensity: number; tint?: 'light' | 'dark'; wash: string }) {
  const Blur = blur?.BlurView;
  const growing = Platform.OS !== 'web' && !!AnimatedBlur;
  const strength = useAnimatedProps(() => ({ intensity: Math.max(0, Math.min(1, t.value)) * intensity }), [intensity]);
  const fade = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, t.value)) }));
  if (growing && AnimatedBlur)
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <AnimatedBlur animatedProps={strength} tint={tint} experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} />
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
