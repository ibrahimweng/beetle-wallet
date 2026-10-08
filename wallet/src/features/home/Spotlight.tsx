/* The tour's dark, with the place it is showing cut out of it (Round 28).
   On the phone Skia draws it, a rounded hole in one shape, so the hole can
   glide from one place to the next; a build made before Skia lays four
   strips of the dark round a square hole instead. */
import React from 'react';
import { StyleSheet, TurboModuleRegistry } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SCRIM, type Hole } from './spotDark';

type SkiaModule = typeof import('@shopify/react-native-skia');
const skia: SkiaModule | null = (() => {
  if (TurboModuleRegistry.get('RNSkiaModule') == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@shopify/react-native-skia') as SkiaModule;
  } catch {
    return null;
  }
})();

export { SCRIM, type Hole };

export function Spotlight({ hole, width, height }: { hole: Hole; width: number; height: number }) {
  return skia ? <SkiaSpot hole={hole} width={width} height={height} /> : <PlainSpot hole={hole} />;
}

/* the dark, and the hole cleared out of it: the canvas holds nothing else, so clearing leaves the page showing */
function SkiaSpot({ hole, width, height }: { hole: Hole; width: number; height: number }) {
  const { Canvas, Rect, RoundedRect } = skia as SkiaModule;
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height} color={SCRIM} />
      <RoundedRect x={hole.x} y={hole.y} width={hole.w} height={hole.h} r={hole.r} color="black" blendMode="clear" />
    </Canvas>
  );
}

function PlainSpot({ hole }: { hole: Hole }) {
  const top = useAnimatedStyle(() => ({ top: 0, left: 0, right: 0, height: Math.max(0, hole.y.value) }));
  const bottom = useAnimatedStyle(() => ({ top: hole.y.value + hole.h.value, left: 0, right: 0, bottom: 0 }));
  const left = useAnimatedStyle(() => ({ top: hole.y.value, height: hole.h.value, left: 0, width: Math.max(0, hole.x.value) }));
  const right = useAnimatedStyle(() => ({ top: hole.y.value, height: hole.h.value, left: hole.x.value + hole.w.value, right: 0 }));
  return (
    <>
      {[top, bottom, left, right].map((strip, i) => (
        <Animated.View key={i} pointerEvents="none" style={[s.strip, strip]} />
      ))}
    </>
  );
}

const s = StyleSheet.create({ strip: { position: 'absolute', backgroundColor: SCRIM } });
