/* Button — the component set in the file, one to one.
     tone = black | grey | white | blue
     size = 44 | 48 | 56
   Height, radius and side padding are the set's own numbers. A leading or
   trailing glyph sits 8 from the label, as the set spaces them. */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Icon } from './Icon';
import { IconName } from '../icons';
import { colour } from './tokens';
import { AnimatedPressable, useTap } from './motion';

export type ButtonTone = 'black' | 'grey' | 'white' | 'blue';
export type ButtonSize = 44 | 48 | 56;

const SIZES = {
  44: { height: 44, radius: 22, padding: 20, text: 14 },
  48: { height: 48, radius: 24, padding: 24, text: 16 },
  56: { height: 56, radius: 28, padding: 24, text: 16 },
} as const;

const TONES = {
  black: { fill: colour.ink, ink: colour.textInverse },
  grey: { fill: colour.surface2, ink: colour.ink },
  white: { fill: colour.surface, ink: colour.ink },
  blue: { fill: colour.accent, ink: colour.textInverse },
} as const;

export function Button({
  label,
  onPress,
  tone = 'black',
  size = 56,
  leading,
  trailing,
  full = true,
  style,
  disabled,
  badge = false,
}: {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  size?: ButtonSize;
  leading?: IconName;
  trailing?: IconName;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /* the share buttons on the receipts carry their glyph on a white disc */
  badge?: boolean;
}) {
  const s = SIZES[size];
  /* A button that cannot be pressed is not the same button faded. The frames
     draw it in the pale grey with grey letters, so it reads as a shape waiting
     to be filled rather than as something half there. */
  const t = disabled ? { fill: colour.surface2, ink: colour.textTertiary } : TONES[tone];
  /* It gives a little under the finger and springs back, so the press is
     answered before the screen it asks for arrives. */
  const tap = useTap();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={tap.onPressIn}
      onPressOut={tap.onPressOut}
      style={[
        styles.base,
        {
          height: s.height,
          borderRadius: s.radius,
          paddingHorizontal: s.padding,
          backgroundColor: t.fill,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        tone === 'white' && styles.hairline,
        disabled ? null : tap.style,
        style,
      ]}
    >
      {leading && badge ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: t.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={leading} size={18} colour={t.fill} />
        </View>
      ) : leading ? (
        <Icon name={leading} size={20} colour={t.ink} />
      ) : null}
      <Text style={{ fontSize: s.text, lineHeight: 24, fontWeight: '600', color: t.ink }}>{label}</Text>
      {trailing ? <Icon name={trailing} size={20} colour={t.ink} /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hairline: { borderWidth: 1, borderColor: colour.rule },
});
