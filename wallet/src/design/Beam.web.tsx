/* Light along an edge, on the web (Round 44): the published border-beam
   package from Libraries.dev (MIT), the same design the phone draws with
   Skia. What each kind is for is in Beam.tsx. With reduced motion there is
   no beam; the package's own pulse kinds also stand still under the
   browser's reduced-motion setting. */
import React from 'react';
import { View } from 'react-native';
import { BorderBeam } from 'border-beam';
import { useStill } from './motion';
import type { BeamProps } from './Beam';

export type { BeamKind, BeamProps } from './Beam';

export function Beam({ children, kind, active, radius, theme, strength = 1, duration, style, testID, onDeactivate }: BeamProps) {
  const still = useStill();
  return (
    <View style={style} testID={testID}>
      <BorderBeam
        size={kind}
        colorVariant="colorful"
        theme={theme}
        active={active && !still}
        borderRadius={radius}
        strength={strength}
        duration={duration}
        onDeactivate={onDeactivate}
        data-beetle-beam={kind}
        data-beetle-beam-on={active && !still ? 'true' : 'false'}
        style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      >
        {children}
      </BorderBeam>
    </View>
  );
}
