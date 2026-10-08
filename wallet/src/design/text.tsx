/* The type scale. Every piece of text in the app goes through one of these so
   sizes and line heights stay the ones the design sets. */
import React from 'react';
import { Text, TextProps } from 'react-native';
import { type as t, colour } from './tokens';
import { night, useScheme } from './scheme';

type Props = TextProps & { tone?: 'ink' | 'secondary' | 'tertiary' | 'accent' | 'good' | 'bad' | 'inverse' };

const tones = {
  ink: colour.text,
  secondary: colour.textSecondary,
  tertiary: colour.textTertiary,
  accent: colour.accentDeep,
  good: colour.goodText,
  bad: colour.bad,
  inverse: colour.textInverse,
} as const;

/* the same tones on the way in's dark (Round 27) */
const darkTones: Record<keyof typeof tones, string> = {
  ink: night.ink,
  secondary: night.secondary,
  tertiary: night.tertiary,
  accent: night.accent,
  good: night.good,
  bad: night.bad,
  inverse: night.ground,
};

const make = (name: string, base: object) => {
  const Face = ({ tone = 'ink', style, ...rest }: Props) => {
    const dark = useScheme() === 'dark';
    return <Text {...rest} style={[base, { color: (dark ? darkTones : tones)[tone] }, style]} />;
  };
  Face.displayName = name;
  return Face;
};

export const Display = make('Display', t.display);
export const Title = make('Title', t.title);
export const Head = make('Head', t.head);
export const Row = make('Row', t.row);
export const Body = make('Body', t.body);
export const Label = make('Label', t.label);
export const Meta = make('Meta', t.meta);
export const Caption = make('Caption', t.caption);
export const Small = make('Small', t.small);
export const Fine = make('Fine', t.fine);
export const Key = make('Key', t.key);
