/* Frosted glass at the top and the foot of the open card. The conversation
   runs up under the header and down under the bar, and what has scrolled
   past shows through, softened and darkened — thickest at the edge, thinning
   towards the chat, so there is no line, only the figure and the bar reading
   over a haze. The card keeps its silhouette: the glass is near solid at the
   very edge.

   The blur itself is stacked: four sheets of expo-blur, each reaching less
   far in than the last, add up to a blur that fades. expo-blur is in the
   web, Expo Go, and any APK made after it was added; a build without it
   gets the darkening alone, no blur, rather than a crash. */
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

export const hasBlur = blur !== null;

/** How far each sheet reaches in from the edge, and how much it softens. */
const SHEETS: [number, number][] = [
  [1, 12],
  [0.72, 14],
  [0.5, 16],
  [0.3, 20],
];

const GLASS = ['rgba(20, 20, 20, 0.94)', 'rgba(20, 20, 20, 0.6)', 'rgba(20, 20, 20, 0)'];
const PLAIN = ['rgba(20, 20, 20, 0.97)', 'rgba(20, 20, 20, 0.8)', 'rgba(20, 20, 20, 0)'];

export function Frost({ height, side = 'top' }: { height: number; side?: 'top' | 'bottom' }) {
  const Blur = blur?.BlurView;
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge]}>
      {Blur
        ? SHEETS.map(([share, intensity], i) => (
            <Blur
              key={i}
              intensity={intensity}
              tint="dark"
              experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
              style={[{ position: 'absolute', left: 0, right: 0, height: Math.round(height * share) }, edge]}
            />
          ))
        : null}
      <LinearGradient
        colors={(Blur ? GLASS : PLAIN) as unknown as readonly [string, string, ...string[]]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: side === 'top' ? 0 : 1 }}
        end={{ x: 0.5, y: side === 'top' ? 1 : 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
