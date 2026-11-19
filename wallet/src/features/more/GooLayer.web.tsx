/* The liquid under More, on the web (Round 44; see goo): the same disc and
   drops in an SVG, blurred and cut at half their alpha by a filter, the way
   the published Gooey (liquid-gooey) does it. The drops are moved by setting
   their attributes, so nothing is drawn again by React while they run. */
import React, { useCallback, useId, useRef } from 'react';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { FAB_R, GOO_BLUR, GOO_GAIN, GOO_SHIFT, dropAt } from './goo';
import type { GooProps, Spot } from './GooLayer';

function Drop({ fab, spot, shown, colour }: { fab: Spot; spot: Spot; shown: SharedValue<number>; colour: string }) {
  const ref = useRef<SVGCircleElement>(null);
  const place = useCallback((x: number, y: number, r: number) => {
    const c = ref.current;
    if (!c) return;
    c.setAttribute('cx', String(x));
    c.setAttribute('cy', String(y));
    c.setAttribute('r', String(Math.max(0, r)));
  }, []);
  useAnimatedReaction(
    () => dropAt(shown.value, fab, spot),
    d => {
      runOnJS(place)(d.x, d.y, d.r);
    },
    [fab.x, fab.y, spot.x, spot.y],
  );
  return <circle ref={ref} cx={fab.x} cy={fab.y} r={0} fill={colour} />;
}

export function GooLayer({ fab, spots, shown, colour }: GooProps) {
  const id = `goo-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} aria-hidden>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={GOO_BLUR} />
          <feColorMatrix values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_GAIN} ${-GOO_SHIFT}`} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <circle cx={fab.x} cy={fab.y} r={FAB_R} fill={colour} />
        {spots.map((spot, i) => (
          <Drop key={i} fab={fab} spot={spot} shown={shown[i]!} colour={colour} />
        ))}
      </g>
    </svg>
  );
}

export type { GooProps, Spot } from './GooLayer';
