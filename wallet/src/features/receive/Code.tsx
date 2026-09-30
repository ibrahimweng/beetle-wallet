/* The code, drawn: the modules as one black path, and the three eyes as
   rounded squares the way the frame rounds its corners — a ring with a
   square inside, which every reader still sees as an eye, since the dark
   and light bands keep their one-one-three-one-one through the middle. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colour } from '../../design';
import { codeFor, modulesPath, type Code as CodeMatrix } from './qr';

export function Code({ text, size = 190, ink = colour.ink, testID = 'code' }: { text: string; size?: number; ink?: string; testID?: string }) {
  const code = useMemo(() => codeFor(text), [text]);
  const cell = size / code.size;
  const d = useMemo(() => modulesPath(code, cell), [code, cell]);
  return (
    <View style={{ width: size, height: size }} testID={testID} accessibilityLabel="Your code" accessibilityRole="image">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path d={d} fill={ink} />
        {eyes(code).map(e => (
          <React.Fragment key={e.key}>
            {/* the ring: a stroke one module wide, run down the middle of the outer band */}
            <Rect x={(e.c + 0.5) * cell} y={(e.r + 0.5) * cell} width={6 * cell} height={6 * cell} rx={1.6 * cell} fill="none" stroke={ink} strokeWidth={cell} />
            {/* the pupil: the three by three in the middle */}
            <Rect x={(e.c + 2) * cell} y={(e.r + 2) * cell} width={3 * cell} height={3 * cell} rx={0.8 * cell} fill={ink} />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

/* where each eye's top left module is */
function eyes(code: CodeMatrix) {
  const n = code.size;
  return [
    { key: 'tl', r: 0, c: 0 },
    { key: 'tr', r: 0, c: n - 7 },
    { key: 'bl', r: n - 7, c: 0 },
  ];
}
