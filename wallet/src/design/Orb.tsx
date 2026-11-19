/* Beetle thinking, as dots on an orb (Round 44): Thinking orbs, from
   Libraries.dev (vendor/thinking-orbs-native, MIT), drawn with Skia. Two
   tuned sizes, 20 beside a line of words and 64 alone; each state is its own
   hand-tuned motion. Used where there is a real wait or a real presence:
   beside the words while the way in checks something, and on the card where
   Beetle is.

   The orb is a picture, not a word: what is happening is always said in
   words beside it. With reduced motion it holds one still frame. An installed
   build made before Skia draws an empty square of the same size, so nothing
   moves around it. The web has its own file, on the published package. */
import React from 'react';
import { TurboModuleRegistry, View, type StyleProp, type ViewStyle } from 'react-native';
import { useStill } from './motion';

/* the port's own props, as far as this file hands them; the port is type-checked on its own (vendor/tsconfig.json) */
type NativeOrbProps = { state: OrbState; size: 20 | 64; displaySize?: number; theme: 'light' | 'dark'; paused: boolean; accessibilityLabel?: string };
type OrbModule = { ThinkingOrb: React.ComponentType<NativeOrbProps> };
const native: OrbModule | null = (() => {
  if (TurboModuleRegistry.get('RNSkiaModule') == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../vendor/thinking-orbs-native') as OrbModule;
  } catch {
    return null;
  }
})();

export type OrbState = 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping';

export type OrbProps = {
  state: OrbState;
  /** the tuned design: 20 for a line of words, 64 alone */
  size?: 20 | 64;
  /** draw that design at this many points instead */
  displaySize?: number;
  /** the surface it sits on */
  theme: 'light' | 'dark';
  /** said instead of the state's own word; the words beside it say what is happening */
  label?: string;
  paused?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Orb({ state, size = 20, displaySize, theme, label, paused = false, style, testID }: OrbProps) {
  const still = useStill();
  const box = displaySize ?? size;
  if (!native) return <View style={[{ width: box, height: box }, style]} testID={testID} />;
  const { ThinkingOrb } = native;
  return (
    <View style={style} testID={testID} pointerEvents="none">
      <ThinkingOrb state={state} size={size} displaySize={displaySize} theme={theme} paused={paused || still} accessibilityLabel={label} />
    </View>
  );
}
