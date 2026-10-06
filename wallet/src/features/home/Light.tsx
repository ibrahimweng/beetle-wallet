/* The light at the card's edge, on the phone (Round 21; what it draws is
   glow's). Skia draws the shader over the card, fed straight from the
   card's own numbers where they move, so it keeps up with the finger and
   the pulse runs whole whatever the chat is busy with. Outside a pull, a
   pulse or a closing it draws nothing and is not shown.

   An installed build made before the light has no Skia in it: there it
   draws nothing, and the card opens as it did. */
import React from 'react';
import { StyleSheet, TurboModuleRegistry } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { SKSL, lit, type GlowUniforms } from './glow';

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
const effect = skia ? skia.Skia.RuntimeEffect.Make(SKSL) : null;

export type LightProps = {
  /** the card's width, and the most it can be tall */
  width: number;
  height: number;
  /** what the shader is handed, kept up to date where the card moves */
  uniforms: SharedValue<GlowUniforms>;
};

export function Light({ width, height, uniforms }: LightProps) {
  const shown = useAnimatedStyle(() => ({ opacity: lit(uniforms.value) ? 1 : 0 }));
  if (!skia || !effect) return null;
  const { Canvas, Fill, Shader } = skia;
  return (
    <Animated.View pointerEvents="none" style={[s.layer, { width, height }, shown]} testID="card-light">
      <Canvas style={{ width, height }}>
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, zIndex: 6 },
});
