/* The haze at the top and the foot of the open card. The conversation runs
   up under the header and down under the ask bar, and what has scrolled past
   shows through, softened and darkened — near solid at the card's edge, and
   thinning to nothing, so there is no line anywhere: a bubble on its way out
   simply dims and softens until it is gone. The top haze ends under the mark
   and the foot haze at the middle of the bar, so the conversation has the
   room in between, and the figure in the header keeps its contrast because
   the haze is still near solid behind it.

   The blur is stacked: four sheets of expo-blur, each reaching less far in
   than the last, and each masked by a gradient so its own end fades rather
   than stops. On the phone the mask is a MaskedView; on the web it is CSS.
   expo-blur and the mask are in the web, Expo Go, and any APK made after
   they were added; a build without them gets the darkening alone, no blur,
   rather than a crash. */
import React, { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type BlurModule = typeof import('expo-blur');
const blur: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();

type MaskModule = typeof import('@react-native-masked-view/masked-view');
const Masked: MaskModule['default'] | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@react-native-masked-view/masked-view') as MaskModule).default;
  } catch {
    return null;
  }
})();

export const hasBlur = blur !== null;

type Side = 'top' | 'bottom';

/** How far each sheet reaches in from the edge, and how much it softens. */
const SHEETS: [number, number][] = [
  [1, 10],
  [0.78, 14],
  [0.58, 18],
  [0.4, 24],
];

/** Where a sheet's own fade begins, as a share of its reach. */
const SHEET_SOLID = 0.5;

/** The darkening, from the edge in: near solid, then an eased fall to
    nothing. `solid` is how far in it stays near solid. */
export function tint(height: number, solid: number, glass: boolean): { colours: string[]; locations: number[] } {
  const s = Math.min(0.92, Math.max(0, solid / height));
  const ramp = (k: number) => s + (1 - s) * k;
  const top = glass ? 0.94 : 0.97;
  return {
    colours: [top, top - 0.04, 0.55, 0.22, 0.06, 0].map(a => `rgba(20, 20, 20, ${a})`),
    locations: [0, s, ramp(0.42), ramp(0.7), ramp(0.9), 1],
  };
}

const along = (side: Side) => ({
  start: { x: 0.5, y: side === 'top' ? 0 : 1 },
  end: { x: 0.5, y: side === 'top' ? 1 : 0 },
});

/* One sheet of blur, fading out at its own end. */
function Sheet({ side, height, children }: { side: Side; height: number; children?: ReactNode }) {
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  const box = [{ position: 'absolute' as const, left: 0, right: 0, height }, edge];
  if (Platform.OS === 'web')
    return (
      <WebMasked style={box} side={side} solid={SHEET_SOLID}>
        {children}
      </WebMasked>
    );
  if (Masked)
    return (
      <Masked style={box} maskElement={<LinearGradient colors={['#000', '#000', 'transparent']} locations={[0, SHEET_SOLID, 1]} {...along(side)} style={StyleSheet.absoluteFill} />}>
        {children}
      </Masked>
    );
  return <View style={box}>{children}</View>;
}

/* On the web the mask is a CSS gradient on the box itself, set on the node:
   a style the web renderer would not otherwise pass through. */
function WebMasked({ style, side, solid, children }: { style: object; side: Side; solid: number; children?: ReactNode }) {
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    const el = ref.current as unknown as { style?: Record<string, string> } | null;
    if (!el?.style) return;
    const mask = `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, #000 ${Math.round(solid * 100)}%, transparent 100%)`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
  }, [side, solid]);
  return (
    <View ref={ref} style={style}>
      {children}
    </View>
  );
}

export function Frost({
  height,
  side = 'top',
  solid = height * 0.5,
}: {
  height: number;
  side?: Side;
  /** how far in from the edge the haze stays near solid */
  solid?: number;
}) {
  const Blur = blur?.BlurView;
  const edge = side === 'top' ? { top: 0 } : { bottom: 0 };
  const t = tint(height, solid, !!Blur);
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, height }, edge]} testID={`haze-${side}`}>
      {Blur
        ? SHEETS.map(([share, intensity], i) => (
            <Sheet key={i} side={side} height={Math.round(height * share)}>
              <Blur intensity={intensity} tint="dark" experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} />
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
