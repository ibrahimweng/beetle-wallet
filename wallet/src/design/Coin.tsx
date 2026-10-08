/* The brand's clay coin (Round 26): the punch-holed coin of the brand file,
   turning. One picture of its face; the turn is the picture swung round its
   upright, with the coin's edge drawn behind it as a band that widens as the
   face turns away, so at a quarter turn it is the edge that shows, as a coin
   does. Its box is the size it is asked for and nothing more, so it takes the
   place of a glyph without moving anything round it; `reach` lets it be drawn
   larger than its box, over what is next to it, the box unchanged.

     spin="once"   a turn and a half, slowing, landing face on (a confirmed transaction)
     spin="loop"   turning steadily until it is told otherwise (the opening screen)
     spin="still"  face on, not turning */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useStill } from './motion';

const FACE = require('../../assets/brand/coin-front.png');
/** The face's own proportions: the cut-out is a shade wider than tall. */
const ASPECT = 377 / 375;
/** How thick the coin is, as a share of its width, and the clay of its edge. */
const THICK = 0.17;
const EDGE = '#3b3430';

export type CoinSpin = 'once' | 'loop' | 'still';

export function Coin({
  size,
  reach = size,
  spin = 'once',
  delay = 0,
  duration = 1500,
  testID = 'coin',
}: {
  size: number;
  /** how big it is drawn, round the middle of its box */
  reach?: number;
  spin?: CoinSpin;
  /** how long before a spin of one starts, and how long it takes */
  delay?: number;
  duration?: number;
  testID?: string;
}) {
  const still = useStill();
  /* the turn, in degrees */
  const turn = useSharedValue(spin === 'once' && !still ? -540 : 0);
  useEffect(() => {
    if (still || spin === 'still') {
      cancelAnimation(turn);
      turn.value = 0;
      return;
    }
    if (spin === 'loop') {
      turn.value = 0;
      turn.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
      return () => cancelAnimation(turn);
    }
    turn.value = -540;
    const t = setTimeout(() => {
      turn.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
    }, delay);
    return () => clearTimeout(t);
  }, [spin, still, delay, duration, turn]);

  const w = reach;
  const h = reach / ASPECT;
  const face = useAnimatedStyle(() => ({ transform: [{ perspective: w * 6 }, { rotateY: `${turn.value}deg` }] }));
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: w * 6 }, { rotateY: `${turn.value + 180}deg` }] }));
  const edge = useAnimatedStyle(() => {
    const a = (turn.value * Math.PI) / 180;
    const s = Math.abs(Math.sin(a));
    const band = Math.max(0.001, w * THICK * s);
    /* only once the face is well turned: nearer face on, the band would show through the hole */
    return { width: band, left: (w - band) / 2, opacity: interpolate(s, [0.3, 0.6], [0, 1], 'clamp') };
  });
  const off = (reach - size) / 2;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[s.stage, { left: -off, top: (size - h) / 2, width: w, height: h }]}>
        <Animated.View style={[s.edge, { height: h * 0.9, borderRadius: w * 0.06, top: h * 0.05 }, edge]} />
        {/* sized outright: a picture given only its edges is drawn at its own size on the web */}
        <Animated.Image source={FACE} style={[s.face, { width: w, height: h }, face]} resizeMode="contain" />
        <Animated.Image source={FACE} style={[s.face, { width: w, height: h }, back]} resizeMode="contain" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  stage: { position: 'absolute' },
  edge: { position: 'absolute', backgroundColor: EDGE },
  face: { position: 'absolute', left: 0, top: 0, backfaceVisibility: 'hidden' },
});
