/* Button — the component set in the file, one to one.
     tone = black | grey | white | blue
     size = 44 | 48 | 56
   Height, radius and side padding are the set's own numbers. A leading or
   trailing glyph sits 8 from the label, as the set spaces them. */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Icon } from './Icon';
import { IconName } from '../icons';
import { colour, font } from './tokens';
import { night, useScheme } from './scheme';
import { AnimatedPressable, Swap, useTap } from './motion';
import { useDeparture } from './journey';

export type ButtonTone = 'black' | 'grey' | 'white' | 'blue' | 'red';
export type ButtonSize = 40 | 44 | 48 | 56;

/* `disc` is the white circle a leading glyph sits on where the frames give it
   one: it comes down with the button rather than staying 32 at every size. */
const SIZES = {
  40: { height: 40, radius: 20, padding: 34, text: 16, disc: 26 },
  44: { height: 44, radius: 22, padding: 20, text: 14, disc: 28 },
  48: { height: 48, radius: 24, padding: 24, text: 16, disc: 32 },
  56: { height: 56, radius: 28, padding: 24, text: 16, disc: 32 },
} as const;

const TONES = {
  black: { fill: colour.ink, ink: colour.textInverse },
  grey: { fill: colour.surface2, ink: colour.ink },
  white: { fill: colour.surface, ink: colour.ink },
  blue: { fill: colour.accent, ink: colour.textInverse },
  /* what takes something away: signing out, signing other phones out */
  red: { fill: colour.bad, ink: colour.textInverse },
} as const;

/* the same tones on the way in's dark (Round 27): the frame's button is white with the dark's own brown on it */
const DARK_TONES: Record<ButtonTone, { fill: string; ink: string }> = {
  black: { fill: night.ink, ink: night.ground },
  grey: { fill: night.panel2, ink: night.ink },
  white: { fill: night.ink, ink: night.ground },
  blue: { fill: colour.accent, ink: night.ink },
  red: { fill: colour.bad, ink: night.ink },
};

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
  to,
}: {
  label: string;
  onPress?: () => void;
  /** the page the button leads to: the screen recedes and the page arrives */
  to?: string;
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
  const dark = useScheme() === 'dark';
  const t = disabled ? (dark ? { fill: night.panel2, ink: night.tertiary } : { fill: colour.surface2, ink: colour.textTertiary }) : (dark ? DARK_TONES : TONES)[tone];
  /* It gives a little under the finger and springs back, so the press is
     answered before the screen it asks for arrives. */
  const tap = useTap();
  const j = useDeparture({ id: `button:${label}`, to, words: label });
  return (
    <AnimatedPressable
      ref={j.ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={to ? j.onPress : onPress}
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
        tone === 'white' && !dark && styles.hairline,
        disabled ? null : tap.style,
        style,
      ]}
    >
      {leading && badge ? (
        <View
          style={{
            width: s.disc,
            height: s.disc,
            borderRadius: s.disc / 2,
            backgroundColor: t.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={leading} size={Math.round(s.disc * 0.56)} colour={t.fill} />
        </View>
      ) : leading ? (
        <Icon name={leading} size={20} colour={t.ink} />
      ) : null}
      <Swap value={label}>
        {shown => (
          <Text
            style={{
              fontSize: s.text,
              lineHeight: 24,
              ...font('600'),
              color: t.ink,
            }}
          >
            {shown}
          </Text>
        )}
      </Swap>
      {trailing ? <Icon name={trailing} size={20} colour={t.ink} /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hairline: { borderWidth: 1, borderColor: colour.rule },
});
