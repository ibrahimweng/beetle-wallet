/* The dark over the way into home, on the phone (Round 28): Skia draws it
   with an oval cut from its middle, so the oval can open onto home while the
   dark itself swells, blurs and fades. A build made before Skia fades the
   dark without the oval. */
import React from 'react';
import { StyleSheet, TurboModuleRegistry } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { night } from '../../design';
import { burst, cover } from './arrival';
import { OVAL, ovalAt, reachOf, darkAt } from './coverShape';

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

export function Cover({ width, height }: { width: number; height: number }) {
  return skia ? <SkiaCover width={width} height={height} /> : <PlainCover />;
}

/* the dark drawn whole into a layer of its own, the oval cleared out of it, and the layer laid down through the blur */
function SkiaCover({ width, height }: { width: number; height: number }) {
  const { Canvas, Group, Rect, Oval, Paint, Blur } = skia as SkiaModule;
  const cx = width / 2;
  const cy = height / 2;
  const reach = reachOf(width, height);
  const rx = useDerivedValue(() => reach * ovalAt(burst.value));
  const ox = useDerivedValue(() => cx - rx.value);
  const oy = useDerivedValue(() => cy - rx.value * OVAL);
  const ow = useDerivedValue(() => rx.value * 2);
  const oh = useDerivedValue(() => rx.value * 2 * OVAL);
  const blur = useDerivedValue(() => burst.value * 18);
  const opacity = useDerivedValue(() => cover.value * darkAt(burst.value));
  const transform = useDerivedValue(() => [{ scale: 1 + 0.08 * burst.value }]);
  return (
    <Canvas style={StyleSheet.absoluteFill} testID="cover">
      <Group
        opacity={opacity}
        transform={transform}
        origin={{ x: cx, y: cy }}
        layer={
          <Paint>
            <Blur blur={blur} />
          </Paint>
        }
      >
        {/* well past the screen, so neither the swell nor the blur brings an edge in */}
        <Rect x={-width} y={-height} width={width * 3} height={height * 3} color={night.ground} />
        <Oval x={ox} y={oy} width={ow} height={oh} color="black" blendMode="clear" />
      </Group>
    </Canvas>
  );
}

function PlainCover() {
  const style = useAnimatedStyle(() => ({ opacity: cover.value * darkAt(burst.value), transform: [{ scale: 1 + 0.08 * burst.value }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: night.ground }, style]} testID="cover" />;
}
