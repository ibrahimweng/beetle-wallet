/* The logo and its name coming out of a blur that passes across them, left
   to right (Round 28, the owner's word: the real logo first, revealed with
   a progressive blur in the middle of the screen). Each shape of the logo
   and each letter of the name sharpens on its own, a little after the one
   before it, so the blur reads as a soft edge travelling across the mark.

   This is the reveal drawn with views: on the web, where a view can blur
   what it holds, and on a phone without Skia, where only the fade and the
   small rise carry it. The phone's own is in LogoReveal.tsx. */
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LOCKUP_H, LOCKUP_PIECES, LOCKUP_W } from './Lockup';
import { blurred } from './motion';

/** room round the logo for the blur to spread into */
export const REVEAL_PAD = 24;
/** how soft a shape is before it sharpens, and how far below it starts, in the frame's units */
export const REVEAL_BLUR = 7;
export const REVEAL_LIFT = 3;
/** how much of the reveal the sweep across takes: each shape has the rest */
const SPREAD = 1.4;

/** How far along one shape is when the reveal as a whole is at `t`, eased out. */
export function pieceAt(t: number, across: number) {
  'worklet';
  const p = Math.max(0, Math.min(1, t * (1 + SPREAD) - across * SPREAD));
  return 1 - Math.pow(1 - p, 3);
}

export type RevealProps = {
  /** the logo's width once revealed */
  width: number;
  /** 0 nothing, 1 the logo whole and sharp */
  t: SharedValue<number>;
  colour: string;
};

/** The box a reveal takes: the logo's, and the room for the blur round it. */
export const revealBox = (width: number) => ({ width: width + REVEAL_PAD * 2, height: (width * LOCKUP_H) / LOCKUP_W + REVEAL_PAD * 2 });

export function PlainReveal({ width, t, colour }: RevealProps) {
  const k = width / LOCKUP_W;
  const height = LOCKUP_H * k;
  return (
    <View style={revealBox(width)} pointerEvents="none" accessibilityLabel="Beetle" accessibilityRole="image" testID="logo-reveal">
      {LOCKUP_PIECES.map((piece, i) => (
        <PlainPiece key={i} piece={piece} t={t} width={width} height={height} k={k} colour={colour} />
      ))}
    </View>
  );
}

function PlainPiece({ piece, t, width, height, k, colour }: { piece: (typeof LOCKUP_PIECES)[number]; t: SharedValue<number>; width: number; height: number; k: number; colour: string }) {
  const across = piece.across;
  const style = useAnimatedStyle(() => {
    const p = pieceAt(t.value, across);
    return { opacity: p, transform: [{ translateY: (1 - p) * REVEAL_LIFT * k }], ...blurred((1 - p) * REVEAL_BLUR * k) };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: REVEAL_PAD, top: REVEAL_PAD, width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${LOCKUP_W} ${LOCKUP_H}`}>
        <G transform={`translate(${piece.dx} ${piece.dy})`}>
          <Path d={piece.d} fill={colour} />
        </G>
      </Svg>
    </Animated.View>
  );
}
