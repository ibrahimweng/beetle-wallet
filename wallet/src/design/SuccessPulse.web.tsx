/* The pulse of a payment that went through, on the web (Round 44): the same
   two rings of the beam's light as the phone draws (SuccessPulse.tsx), here a
   conic gradient masked to a ring and softened, grown out from the coin's
   rim. */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useStill } from './motion';
import { PULSE, PULSE_LIGHT, pulseBox, ringAlpha } from './pulse';
import type { SuccessPulseProps } from './SuccessPulse';

/* one ring: its glow and its line, each a conic gradient of the beam's light masked to a band at the ring's edge */
const band = (w: number) => `radial-gradient(farthest-side, transparent calc(100% - ${w}px), #000 calc(100% - ${w}px))`;
function Layer({ width, blur, radius }: { width: number; blur: number; radius: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: -width / 2,
        top: -width / 2,
        width: radius * 2 + width,
        height: radius * 2 + width,
        borderRadius: '50%',
        background: `conic-gradient(from 90deg, ${PULSE_LIGHT.join(', ')})`,
        WebkitMaskImage: band(width),
        maskImage: band(width),
        filter: `blur(${blur}px)`,
      }}
    />
  );
}
function Ring({ k, radius }: { k: SharedValue<number>; radius: number }) {
  const grow = (radius + PULSE.reach) / radius;
  const line = useAnimatedStyle(() => ({ opacity: ringAlpha(k.value), transform: [{ scale: 1 + (grow - 1) * k.value }] }));
  const glow = useAnimatedStyle(() => ({ opacity: ringAlpha(k.value) * PULSE.glow, transform: [{ scale: 1 + (grow - 1) * k.value }] }));
  return (
    <>
      <Animated.View style={[{ position: 'absolute', width: radius * 2, height: radius * 2 }, glow]} pointerEvents="none">
        <Layer width={PULSE.glowWidth} blur={PULSE.glowBlur} radius={radius} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: radius * 2, height: radius * 2 }, line]} pointerEvents="none">
        <Layer width={PULSE.width} blur={PULSE.blur} radius={radius} />
      </Animated.View>
    </>
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
  if (!play || still) return null;
  const size = pulseBox(radius);
  return (
    <View pointerEvents="none" style={[s.box, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }]} testID={testID}>
      <Ring k={a} radius={radius} />
      <Ring k={b} radius={radius} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { position: 'absolute', left: '50%', top: 0, alignItems: 'center', justifyContent: 'center' },
});
