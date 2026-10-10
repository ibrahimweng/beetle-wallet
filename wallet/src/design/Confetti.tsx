/* A little confetti, once (Round 37, the owner's word: something that feels
   like a celebration when money has moved, and stays minimal and clean so it
   never breaks the brand). Eighteen thin strips in the brand's own colours
   go up and out from behind what they surround, turn as they fall, and are
   gone in under two seconds. Nothing with motion reduced. The pieces are
   laid out from a fixed seed, so every receipt throws the same handful. */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useStill } from './motion';

const COLOURS = ['#f04f22', '#f5a524', '#34c759', '#2b2721', '#c0643a', '#fde8df'];
const PIECES = 18;
const LIFE = 1700;

type Piece = { vx: number; vy: number; spin: number; w: number; h: number; colour: string; delay: number };

/** A fixed handful: the same spread each time, from a seed. */
function pieces(): Piece[] {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: PIECES }, (_, i) => {
    const angle = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.1;
    const speed = 150 + rnd() * 120;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (rnd() - 0.5) * 720,
      w: 4 + Math.round(rnd() * 2),
      h: 9 + Math.round(rnd() * 5),
      colour: COLOURS[i % COLOURS.length]!,
      delay: Math.round(rnd() * 120),
    };
  });
}

export function Confetti({ play, testID = 'confetti' }: { play: boolean; testID?: string }) {
  const still = useStill();
  const all = useMemo(pieces, []);
  if (!play || still) return null;
  return (
    <View pointerEvents="none" style={s.box} testID={testID}>
      {all.map((p, i) => (
        <Bit key={i} piece={p} />
      ))}
    </View>
  );
}

function Bit({ piece }: { piece: Piece }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(piece.delay, withTiming(1, { duration: LIFE, easing: Easing.out(Easing.quad) }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useMoving(t, piece);
  return <Animated.View style={[s.bit, { width: piece.w, height: piece.h, backgroundColor: piece.colour }, style]} />;
}

function useMoving(t: SharedValue<number>, p: Piece) {
  return useAnimatedStyle(() => {
    const k = t.value;
    const secs = k * (LIFE / 1000);
    /* thrown, then falling, slowed by the air */
    const x = p.vx * secs * 0.9;
    const y = p.vy * secs + 260 * secs * secs;
    return {
      opacity: k < 0.05 ? k * 20 : Math.max(0, 1 - Math.pow((k - 0.05) / 0.95, 2.2)),
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p.spin * k}deg` }, { rotateX: `${p.spin * 0.6 * k}deg` }],
    };
  });
}

const s = StyleSheet.create({
  /* from the middle of what it surrounds */
  box: { position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, overflow: 'visible' },
  bit: { position: 'absolute', left: -3, top: -6, borderRadius: 1.5 },
});
