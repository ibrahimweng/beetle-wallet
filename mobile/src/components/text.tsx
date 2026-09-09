/* The type scale. Every piece of text in the app goes through one of these so
   sizes and line heights stay the ones the design sets. */
import React from 'react';
import { Text, TextProps } from 'react-native';
import { type as t, colour } from '../theme';

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

const make = (base: object) => ({ tone = 'ink', style, ...rest }: Props) =>
  <Text {...rest} style={[base, { color: tones[tone] }, style]} />;

export const Display = make(t.display);
export const Title = make(t.title);
export const Head = make(t.head);
export const Row = make(t.row);
export const Body = make(t.body);
export const Label = make(t.label);
export const Meta = make(t.meta);
export const Caption = make(t.caption);
export const Key = make(t.key);
