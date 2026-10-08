/* The logo's reveal on the phone (Round 28): Skia draws each shape of the
   logo and each letter of the name through a blur of its own, so the blur
   passing across the mark is a real one on an iPhone too, which cannot blur
   a view's contents. What each shape does is revealPieces.tsx's; a build
   made before Skia gets the views' reveal, the fade and the rise without
   the blur. */
import React from 'react';
import { TurboModuleRegistry, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { SkPath } from '@shopify/react-native-skia';
import { LOCKUP_PIECES, LOCKUP_W } from './Lockup';
import { PlainReveal, REVEAL_BLUR, REVEAL_LIFT, REVEAL_PAD, pieceAt, revealBox, type RevealProps } from './revealPieces';

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
const PATHS: (SkPath | null)[] = skia ? LOCKUP_PIECES.map(p => skia.Skia.Path.MakeFromSVGString(p.d)) : [];
const drawable = !!skia && PATHS.length > 0 && PATHS.every(p => p !== null);

export function LogoReveal(props: RevealProps) {
  if (!skia || !drawable) return <PlainReveal {...props} />;
  const { width, t, colour } = props;
  const { Canvas, Group } = skia;
  const k = width / LOCKUP_W;
  return (
    <View style={revealBox(width)} pointerEvents="none" accessibilityLabel="Beetle" accessibilityRole="image" testID="logo-reveal">
      <Canvas style={{ flex: 1 }}>
        <Group transform={[{ translateX: REVEAL_PAD }, { translateY: REVEAL_PAD }, { scale: k }]}>
          {LOCKUP_PIECES.map((piece, i) => (
            <SkiaPiece key={i} path={PATHS[i] as SkPath} dx={piece.dx} dy={piece.dy} across={piece.across} t={t} colour={colour} />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

function SkiaPiece({ path, dx, dy, across, t, colour }: { path: SkPath; dx: number; dy: number; across: number; t: SharedValue<number>; colour: string }) {
  const { Group, Path, Blur } = skia as SkiaModule;
  const opacity = useDerivedValue(() => pieceAt(t.value, across));
  const blur = useDerivedValue(() => (1 - pieceAt(t.value, across)) * REVEAL_BLUR);
  const transform = useDerivedValue(() => [{ translateX: dx }, { translateY: dy + (1 - pieceAt(t.value, across)) * REVEAL_LIFT }]);
  return (
    <Group opacity={opacity} transform={transform}>
      <Path path={path} color={colour}>
        <Blur blur={blur} />
      </Path>
    </Group>
  );
}
