/* The tour's dark on the web (Round 28): one shape, the screen with the
   rounded hole cut from it, drawn as an SVG and redrawn as the hole glides
   from one place to the next. */
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { SCRIM, type Hole } from './spotDark';

export { SCRIM, type Hole };

/** the screen, and inside it the hole, as one path the even-odd rule leaves the hole out of */
function shape(width: number, height: number, x: number, y: number, w: number, h: number, radius: number) {
  'worklet';
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const f = (n: number) => n.toFixed(1);
  const hole =
    w > 0 && h > 0
      ? ` M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
      : '';
  return `M0 0H${width}V${height}H0Z${hole}`;
}

export function Spotlight({ hole, width, height }: { hole: Hole; width: number; height: number }) {
  const [d, setD] = useState(() => shape(width, height, hole.x.value, hole.y.value, hole.w.value, hole.h.value, hole.r.value));
  useAnimatedReaction(
    () => [hole.x.value, hole.y.value, hole.w.value, hole.h.value, hole.r.value],
    ([x, y, w, h, r]) => {
      runOnJS(setD)(shape(width, height, x!, y!, w!, h!, r!));
    },
    [width, height],
  );
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={d} fill={SCRIM} fillRule="evenodd" />
    </Svg>
  );
}
