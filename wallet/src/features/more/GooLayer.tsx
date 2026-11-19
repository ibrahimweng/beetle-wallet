/* The liquid under More, on the phone (Round 44; see goo): Skia draws the
   button's disc and the three drops into one layer, blurs it and cuts it at
   half its alpha, so where a drop leaves the button the two run together and
   pull apart. It sits under the actions and the button, and takes no touch.
   An installed build made before Skia has none, and More opens as it did. */
import React from 'react';
import { StyleSheet, TurboModuleRegistry } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { FAB_R, GOO_BLUR, GOO_GAIN, GOO_SHIFT, dropAt } from './goo';

type SkiaModule = typeof import('@shopify/react-native-skia');
const skia: SkiaModule | null = (() => {
  if (TurboModuleRegistry.get('RNSkiaModule') == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@shopify/react-native-skia') as SkiaModule;
  } catch {
    return null;
  }
})();

export type Spot = { x: number; y: number };
export type GooProps = { fab: Spot; spots: Spot[]; shown: SharedValue<number>[]; colour: string };

function Drop({ fab, spot, shown, colour }: { fab: Spot; spot: Spot; shown: SharedValue<number>; colour: string }) {
  const { Circle } = skia!;
  const x = useDerivedValue(() => dropAt(shown.value, fab, spot).x);
  const y = useDerivedValue(() => dropAt(shown.value, fab, spot).y);
  const r = useDerivedValue(() => dropAt(shown.value, fab, spot).r);
  return <Circle cx={x} cy={y} r={r} color={colour} />;
}

export function GooLayer({ fab, spots, shown, colour }: GooProps) {
  if (!skia) return null;
  const { Canvas, Group, Paint, Blur, ColorMatrix, Circle } = skia;
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group
        layer={
          <Paint>
            <Blur blur={GOO_BLUR} />
            <ColorMatrix matrix={[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, GOO_GAIN, -GOO_SHIFT]} />
          </Paint>
        }
      >
        <Circle cx={fab.x} cy={fab.y} r={FAB_R} color={colour} />
        {spots.map((spot, i) => (
          <Drop key={i} fab={fab} spot={spot} shown={shown[i]!} colour={colour} />
        ))}
      </Group>
    </Canvas>
  );
}
