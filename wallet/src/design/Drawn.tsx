/* The brand's drawings (Round 26): the ladybird drawn in line, and a wing's
   veins, the rough, see-through lines the brand lays over its pictures. They
   are light on a page and never a thing to read or press: drawn behind what
   is there, out of the way of the words, outside the layout, so a screen with
   one keeps every size and space it had. The pictures are cut from the brand
   file for now; the owner's own, at full size, take their place later. */
import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const DRAWINGS = {
  /** a wing's veins, its tip down and to the left, as the brand file lays one across a corner */
  wing: { source: require('../../assets/brand/wing.png'), aspect: 727 / 648 },
  /** the ladybird drawn in line, as the brand file sets it at a page's edge */
  beetle: { source: require('../../assets/brand/beetle-sketch.png'), aspect: 412 / 394 },
};

export type DrawingName = keyof typeof DRAWINGS;

/** One of the drawings, `width` across, placed by `style` (its box is absolute), at `opacity`, its lines in `tint` where given. */
export function Drawing({ name, width, style, tint, opacity = 0.5, turn = 0 }: { name: DrawingName; width: number; style?: StyleProp<ViewStyle>; tint?: string; opacity?: number; turn?: number }) {
  const d = DRAWINGS[name];
  const height = width / d.aspect;
  /* clipped to what it is laid on: a drawing over the edge would otherwise widen the web's page, which then scrolls sideways */
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <View style={[{ position: 'absolute', width, height, opacity, transform: turn ? [{ rotate: `${turn}deg` }] : undefined }, style]} testID={`drawn-${name}`}>
        <Image source={d.source} style={{ width, height, tintColor: tint }} resizeMode="contain" />
      </View>
    </View>
  );
}
