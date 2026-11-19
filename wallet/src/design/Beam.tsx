/* Light along an edge (Round 44): Border beam, from Libraries.dev
   (vendor/border-beam-native, MIT), drawn with Skia over or around what it
   wraps. Used sparingly, for one meaning each:

   - pulse-inner: a card where money is about to move, once it is ready
     (every Slide to);
   - pulse-outside: a receipt that has just gone through, breathing out from
     its coin;
   - line, then pulse-inner: the card's own edge as it is pulled into the
     chat, and the swell as it opens.

   The palette is the colourful one, the brand's oil-slick light. With
   reduced motion there is no beam at all (motion is the only thing it adds).
   An installed build made before Skia draws nothing and the card is as it
   was. The web has its own file, on the published border-beam package. */
import React, { type ReactNode } from 'react';
import { TurboModuleRegistry, View, type StyleProp, type ViewStyle } from 'react-native';
import { useStill } from './motion';

/* the port's own props, as far as this file hands them; the port is type-checked on its own (vendor/tsconfig.json) */
type NativeBeamProps = { children?: ReactNode; size: BeamKind; colorVariant: 'colorful'; theme: 'light' | 'dark'; active: boolean; borderRadius: number; strength: number; duration?: number; onDeactivate?: () => void };
type BeamModule = { BorderBeam: React.ComponentType<NativeBeamProps> };
const native: BeamModule | null = (() => {
  if (TurboModuleRegistry.get('RNSkiaModule') == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../vendor/border-beam-native') as BeamModule;
  } catch {
    return null;
  }
})();

export type BeamKind = 'pulse-inner' | 'pulse-outside' | 'line' | 'md';

export type BeamProps = {
  children?: ReactNode;
  kind: BeamKind;
  /** the light runs while this is true; it fades in (0.6 s) and out (0.5 s) */
  active: boolean;
  /** the corner radius of what it wraps (the beam does not read it) */
  radius: number;
  /** the surface it sits on */
  theme: 'light' | 'dark';
  /** how strong the light is, 0 to 1; never dims what it wraps */
  strength?: number;
  /** seconds for a breath (pulse) or a lap (line, md) */
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onDeactivate?: () => void;
};

export function Beam({ children, kind, active, radius, theme, strength = 1, duration, style, testID, onDeactivate }: BeamProps) {
  const still = useStill();
  if (!native || still) {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }
  const { BorderBeam } = native;
  return (
    <View style={style} testID={testID}>
      <BorderBeam size={kind} colorVariant="colorful" theme={theme} active={active} borderRadius={radius} strength={strength} duration={duration} onDeactivate={onDeactivate}>
        {children}
      </BorderBeam>
    </View>
  );
}
