/* The soft cover a thing opens over: the page under it blurred, and over
   that a gradient that is see-through at the top and solid at the foot.
   White over a light page, near black over the chat. More opens over the
   white one, as the owner's Actions frame draws it (white at 76% over a
   13 blur at the top) and as Fuse does, going solid towards the button;
   a receipt opens over whichever its page is; a line of Activities opens
   in place over the frost, the page under it soft all the way down. */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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

export function Veil({ tone = 'light', intensity = VEIL_BLUR, testID }: { tone?: VeilTone; intensity?: number; testID?: string }) {
  const s = STOPS[tone];
  const Blur = blur?.BlurView;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={testID}>
      {Blur ? <Blur intensity={intensity} tint={s.tint} experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient colors={s.colors} locations={LOCATIONS} style={StyleSheet.absoluteFill} />
    </View>
  );
}
