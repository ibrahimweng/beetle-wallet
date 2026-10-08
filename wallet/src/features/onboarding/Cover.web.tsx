/* The dark over the way into home, on the web (Round 28): the oval is a
   radial mask on the dark, soft at its edge and softer as it opens, and the
   browser blurs the dark itself. */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { night } from '../../design';
import { burst, cover } from './arrival';
import { OVAL, darkAt, ovalAt, reachOf } from './coverShape';

/** how far into the oval the dark has gone altogether, once it is open: the soft edge lies past the screen's corners */
const CLEAR = 0.6;

export function Cover({ width, height }: { width: number; height: number }) {
  const reach = reachOf(width, height) / CLEAR;
  const style = useAnimatedStyle(() => {
    const b = burst.value;
    const rx = reach * ovalAt(b);
    const mask =
      rx > 0.5
        ? `radial-gradient(${rx.toFixed(1)}px ${(rx * OVAL).toFixed(1)}px at 50% 50%, transparent 0%, transparent ${((CLEAR + (1 - CLEAR) * (1 - b) * 0.75) * 100).toFixed(1)}%, #000 100%)`
        : 'none';
    return {
      opacity: cover.value * darkAt(b),
      transform: [{ scale: 1 + 0.08 * b }],
      maskImage: mask,
      WebkitMaskImage: mask,
      filter: `blur(${(b * 18).toFixed(1)}px)`,
    } as unknown as ViewStyle;
  });
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: night.ground }, style]} testID="cover" />;
}
