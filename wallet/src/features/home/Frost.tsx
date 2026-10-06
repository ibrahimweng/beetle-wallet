/* The haze at the top and the foot of the open card. The conversation runs
   up under the header and down under the ask bar, and what has scrolled past
   shows through, softened and darkened — near solid at the card's edge, and
   thinning to nothing, so there is no line anywhere: a bubble on its way out
   simply dims and softens until it is gone. The top haze ends under the mark
   and the foot haze at the middle of the bar, so the conversation has the
   room in between, and the figure in the header keeps its contrast because
   the haze is still near solid behind it.

   The blur is the design's stacked, masked sheets (design/Glass.tsx), dark
   here, under the darkening. A build without expo-blur gets the darkening
   alone, no blur, rather than a crash. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHEETS, Sheet, along, blurMethod, blurModule, type Side } from '../../design/Glass';

export const hasBlur = blurModule !== null;

/** The darkening, from the edge in: near solid, then an eased fall to
    nothing. `solid` is how far in it stays near solid; `rgb` is the dark
    itself, the card's unless said (the chats drawer's is a step lighter). */
export function tint(height: number, solid: number, glass: boolean, rgb = '20, 20, 20'): { colours: string[]; locations: number[] } {
  const s = Math.min(0.92, Math.max(0, solid / height));
  const ramp = (k: number) => s + (1 - s) * k;
  const top = glass ? 0.94 : 0.97;
  return {
    colours: [top, top - 0.04, 0.55, 0.22, 0.06, 0].map(a => `rgba(${rgb}, ${a})`),
    locations: [0, s, ramp(0.42), ramp(0.7), ramp(0.9), 1],
  };
}

export function Frost({
  height,
  side = 'top',
  solid = height * 0.5,
  rgb,
}: {
  height: number;
  side?: Side;
  /** how far in from the edge the haze stays near solid */
  solid?: number;
  /** the dark, as `r, g, b`: the card's unless said */
  rgb?: string;
}) {
  const Blur = blurModule?.BlurView;
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  const t = tint(height, solid, !!Blur, rgb);
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge]} testID={`haze-${side}`}>
      {Blur
        ? SHEETS.map(([share, intensity], i) => (
            <Sheet key={i} side={side} height={Math.round(height * share)}>
              <Blur intensity={intensity} tint="dark" experimentalBlurMethod={blurMethod} style={StyleSheet.absoluteFill} />
            </Sheet>
          ))
        : null}
      <LinearGradient
        colors={t.colours as unknown as readonly [string, string, ...string[]]}
        locations={t.locations as unknown as readonly [number, number, ...number[]]}
        {...along(side)}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
