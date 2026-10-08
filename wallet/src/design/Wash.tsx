/* The colour at the top of a screen.

   Most of the way-in frames open with a soft blob of colour bleeding down from
   the top edge. It is a blurred ellipse in the file; the colours are the
   brand's since Round 25 — orange behind the mark, teal behind the number,
   lime behind the name, gold behind the face, sand behind the passcode. Here
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
import { useScheme } from './scheme';

/** How much of the colour is left, at each fraction of the way down. */
const DOWN = [1, 0.87, 0.39, 0.11, 0] as const;
const AT = [0, 0.36, 0.73, 0.91, 1] as const;

const mix = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export function Wash({ tone, height = 220 }: { tone: string; height?: number }) {
  /* on the way in's dark (Round 27) the colour is a glow, a little less of it, and the corners keep the dark */
  const dark = useScheme() === 'dark';
  const k = dark ? 0.72 : 1;
  const corner = dark ? '26,19,13' : '250,250,249';
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
      <LinearGradient
        colors={DOWN.map(a => mix(tone, a * k)) as unknown as readonly [string, string, ...string[]]}
        locations={AT as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      />
      {/* the ellipse is narrower than the phone, so the corners keep less colour */}
      <LinearGradient
        colors={[`rgba(${corner},0.34)`, `rgba(${corner},0)`, `rgba(${corner},0)`, `rgba(${corner},0.34)`]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
    </View>
  );
}

/** Which colour opens which screen, and how far down it reaches: the reach read off the frames, the colour the brand's. */
export const washes = {
  start: { tone: '#f04f22', height: 253 },
  signin: { tone: '#f04f22', height: 223 },
  signcode: { tone: '#f04f22', height: 200 },
  number: { tone: '#1fb5a3', height: 236 },
  code: { tone: '#1fb5a3', height: 232 },
  nin: { tone: '#afc437', height: 189 },
  who: { tone: '#afc437', height: 234 },
  nomatch: { tone: '#afc437', height: 175 },
  income: { tone: '#afc437', height: 157 },
  face: { tone: '#f6c445', height: 148 },
  idcard: { tone: '#f6c445', height: 162 },
  finish: { tone: '#f04f22', height: 109 },
  passcode: { tone: '#ccb8a4', height: 132 },
  newcode: { tone: '#ccb8a4', height: 132 },
} satisfies Record<string, { tone: string; height: number }>;
