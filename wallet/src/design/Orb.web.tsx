/* Beetle thinking, as dots on an orb, on the web (Round 44): the published
   thinking-orbs package from Libraries.dev (MIT), the same engine the phone
   draws with Skia. What it is for is in Orb.tsx. */
import React from 'react';
import { View } from 'react-native';
import { ThinkingOrb } from 'thinking-orbs';
import { useStill } from './motion';
import type { OrbProps } from './Orb';

export type { OrbProps, OrbState } from './Orb';

export function Orb({ state, size = 20, displaySize, theme, label, paused = false, style, testID }: OrbProps) {
  const still = useStill();
  const box = displaySize ?? size;
  return (
    <View style={[{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }, style]} testID={testID} pointerEvents="none">
      <div style={{ width: box, height: box, transform: displaySize ? `scale(${box / size})` : undefined, transformOrigin: 'center' }}>
        <ThinkingOrb state={state} size={size} theme={theme} paused={paused || still} aria-label={label} />
      </div>
    </View>
  );
}
