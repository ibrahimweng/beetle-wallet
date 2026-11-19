/* The pulse of a payment that went through (Round 44, the owner's word; it
   takes the confetti's place). Two rings of the beam's own light breathe out
   from the coin's rim, one after the other, and are gone: the coin is never
   covered, and nothing stays moving. It is drawn over the receipt where the
   coin is, so it is not in the picture a receipt is shared as.

   It plays once, on a receipt that has just gone through. A line that did not
   go, is on its way or came back has no pulse; a receipt opened again later
   has none either. With reduced motion there is none. An installed build made
   before Skia draws nothing. The web has its own file. */
import React, { useEffect } from 'react';
import { StyleSheet, TurboModuleRegistry, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useStill } from './motion';
import { PULSE, PULSE_LIGHT, pulseBox, ringAlpha } from './pulse';

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

export type SuccessPulseProps = {
  /** the coin's radius: the rings start at its rim */
  radius: number;
  /** plays when this turns true; nothing is drawn before */
  play: boolean;
  testID?: string;
};

function Ring({ k, radius, size }: { k: SharedValue<number>; radius: number; size: number }) {
  const { Circle, SweepGradient, BlurMask, Group, vec } = skia!;
  const r = useDerivedValue(() => radius + PULSE.reach * k.value);
  const opacity = useDerivedValue(() => ringAlpha(k.value));
  const glowOpacity = useDerivedValue(() => ringAlpha(k.value) * PULSE.glow);
  const width = useDerivedValue(() => PULSE.width * (1 - 0.5 * k.value));
  const glowWidth = useDerivedValue(() => PULSE.glowWidth * (1 - 0.3 * k.value));
  const c = vec(size / 2, size / 2);
  return (
    <Group>
      {/* the glow round the line, then the line itself */}
      <Circle cx={size / 2} cy={size / 2} r={r} style="stroke" strokeWidth={glowWidth} opacity={glowOpacity}>
        <SweepGradient c={c} colors={PULSE_LIGHT} />
        <BlurMask blur={PULSE.glowBlur} style="normal" />
      </Circle>
      <Circle cx={size / 2} cy={size / 2} r={r} style="stroke" strokeWidth={width} opacity={opacity}>
        <SweepGradient c={c} colors={PULSE_LIGHT} />
        <BlurMask blur={PULSE.blur} style="normal" />
      </Circle>
    </Group>
  );
}

export function SuccessPulse({ radius, play, testID }: SuccessPulseProps) {
  const still = useStill();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  useEffect(() => {
    if (!play || still) return;
    const ring = { duration: PULSE.ring, easing: Easing.out(Easing.cubic) };
    a.value = withDelay(PULSE.delay, withTiming(1, ring));
    b.value = withDelay(PULSE.delay + PULSE.gap, withTiming(1, ring));
  }, [play, still]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!skia || !play || still) return null;
  const { Canvas } = skia;
  const size = pulseBox(radius);
  return (
    <View pointerEvents="none" style={[s.box, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }]} testID={testID}>
      <Canvas style={{ width: size, height: size }}>
        <Ring k={a} radius={radius} size={size} />
        <Ring k={b} radius={radius} size={size} />
      </Canvas>
    </View>
  );
}

const s = StyleSheet.create({
  box: { position: 'absolute', left: '50%', top: 0 },
});
