/* The colour at the top of a screen.

   Most of the way-in frames open with a soft blob of colour bleeding down from
   the top edge — cyan behind the number, purple behind the name, orange behind
   the address, blue behind the mark. It is a blurred ellipse in the file. Here
   it is two gradients: one down the screen carrying the colour away, and one
   across it lightening the corners, which is what the blur does to an ellipse
   narrower than the phone.

   The stops are read off the frames. Down the middle of Sign in the colour is
   still whole at the top edge, is an eighth gone by 80, three fifths gone by
   160, and finished by 220 — a slow start and a fast finish, the shape of a
   blur, not of a ramp. */
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** How much of the colour is left, at each fraction of the way down. */
const DOWN = [1, 0.87, 0.39, 0.11, 0] as const;
const AT = [0, 0.36, 0.73, 0.91, 1] as const;

const mix = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export function Wash({ tone, height = 220 }: { tone: string; height?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
      <LinearGradient
        colors={DOWN.map(a => mix(tone, a)) as unknown as readonly [string, string, ...string[]]}
        locations={AT as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      />
      {/* the ellipse is narrower than the phone, so the corners keep less colour */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.34)',
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.34)',
        ]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
    </View>
  );
}

/** Which colour opens which screen, and how far down it reaches. Read off the frames. */
export const washes = {
  start: { tone: '#243dcb', height: 253 },
  signin: { tone: '#243dcb', height: 223 },
  signcode: { tone: '#243dcb', height: 200 },
  number: { tone: '#25b9e8', height: 236 },
  code: { tone: '#25b9e8', height: 232 },
  nin: { tone: '#8d5ef6', height: 189 },
  who: { tone: '#8d5ef6', height: 234 },
  nomatch: { tone: '#8d5ef6', height: 175 },
  income: { tone: '#8d5ef6', height: 157 },
  face: { tone: '#ff3e90', height: 148 },
  idcard: { tone: '#ff3e90', height: 162 },
  finish: { tone: '#ff8c4e', height: 109 },
  passcode: { tone: '#f5a627', height: 132 },
  newcode: { tone: '#f5a627', height: 132 },
} satisfies Record<string, { tone: string; height: number }>;
