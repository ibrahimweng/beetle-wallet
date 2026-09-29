/* The frosted band the header sits on when the card is open. The chat runs
   up under it, so what has scrolled past shows through, softened and
   darkened, and the figure reads over it: the conversation has the whole
   card, and the top of it is air rather than a wall.

   The blur itself comes from expo-blur where the build carries it — the
   web, Expo Go, and any APK made after it was added. A build without it
   gets the same band in plain dark glass, no blur, rather than a crash. */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dark } from '../../design';

type BlurModule = typeof import('expo-blur');
const blur: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();

export const hasBlur = blur !== null;

/** How far below the band the content keeps dissolving. */
export const FROST_FADE = 28;

export function Frost({ height }: { height: number }) {
  const Blur = blur?.BlurView;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: height + FROST_FADE }]}>
      {Blur ? <Blur intensity={48} tint="dark" experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={[StyleSheet.absoluteFill, { height }]} /> : null}
      {/* the glass: dark enough to read over, thin enough to see through */}
      <View style={[StyleSheet.absoluteFill, { height, backgroundColor: Blur ? 'rgba(20, 20, 20, 0.58)' : 'rgba(20, 20, 20, 0.9)' }]} />
      <View style={{ position: 'absolute', top: height - 1, left: 16, right: 16, height: 1, backgroundColor: dark.divider }} />
      <LinearGradient colors={['rgba(20, 20, 20, 0.7)', 'rgba(20, 20, 20, 0)']} style={{ position: 'absolute', top: height, left: 0, right: 0, height: FROST_FADE }} />
    </View>
  );
}
