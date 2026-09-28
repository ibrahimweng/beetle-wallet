/* The type scale. Every piece of text in the app goes through one of these so
   sizes and line heights stay the ones the design sets. */
import React from 'react';
import { Text, TextProps } from 'react-native';
import { type as t, colour } from './tokens';

type Props = TextProps & { tone?: 'ink' | 'secondary' | 'tertiary' | 'accent' | 'good' | 'bad' | 'inverse' };

const tones = {
  ink: colour.text,
  secondary: colour.textSecondary,
  tertiary: colour.textTertiary,
  accent: colour.accent,
  good: colour.goodText,
  bad: colour.bad,
  inverse: colour.textInverse,
} as const;

const make = (name: string, base: object) => {
  const Face = ({ tone = 'ink', style, ...rest }: Props) => (
    <Text {...rest} style={[base, { color: tones[tone] }, style]} />
  );
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
export const Key = make('Key', t.key);
