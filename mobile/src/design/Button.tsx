/* Button — the component set in the file, one to one.
     tone = black | grey | white | blue
     size = 44 | 48 | 56
   Height, radius and side padding are the set's own numbers. A leading or
   trailing glyph sits 8 from the label, as the set spaces them. */
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { Icon } from './Icon';
import { IconName } from '../icons';
import { colour } from './tokens';

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
}) {
  const s = SIZES[size];
  const t = TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          borderRadius: s.radius,
          paddingHorizontal: s.padding,
          backgroundColor: t.fill,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.4 : pressed ? 0.9 : 1,
        },
        tone === 'white' && styles.hairline,
        style,
      ]}
    >
      {leading ? <Icon name={leading} size={20} colour={t.ink} /> : null}
      <Text style={{ fontSize: s.text, lineHeight: 24, fontWeight: '600', color: t.ink }}>{label}</Text>
      {trailing ? <Icon name={trailing} size={20} colour={t.ink} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hairline: { borderWidth: 1, borderColor: colour.rule },
});
