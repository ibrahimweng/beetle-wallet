/* Light or dark (Round 27). The way in and the opening are on the brand's
   very dark brown, the owner's frame for the first screen; the app after it
   stays on the white. A screen says which with <Scheme value="dark">, and
   the pieces that draw words, glyphs, buttons, cards and keys take their
   colours from it, so a step keeps every size and space it had. */
import React, { createContext, useContext, type ReactNode } from 'react';
import { colour } from './tokens';

export type SchemeName = 'light' | 'dark';

/** The dark the way in is drawn on, read off the owner's frame (1463:14533). */
export const night = {
  ground: '#1a130d',
  ink: '#ffffff',
  secondary: '#99826e',
  tertiary: '#7a6756',
  /** a card on the ground, and a field or a key a step up from it */
  panel: '#241a13',
  panel2: '#2e231a',
  rule: '#3a2d22',
  ruleStrong: '#5a4a3d',
  /** a link on the dark: the brand's orange, lifted */
  accent: '#ff9466',
  good: '#5ad07a',
  bad: '#ff7a6b',
  /** the logo and its name, as the frame sets them */
  lockup: '#c9b9a6',
} as const;

const SchemeContext = createContext<SchemeName>('light');

export function Scheme({ value, children }: { value: SchemeName; children: ReactNode }) {
  return <SchemeContext.Provider value={value}>{children}</SchemeContext.Provider>;
}

export const useScheme = () => useContext(SchemeContext);

/** The colours a piece draws with, in the scheme it is in. */
export function usePalette() {
  return useScheme() === 'dark' ? DARK : LIGHT;
}

type Palette = {
  ground: string;
  ink: string;
  secondary: string;
  tertiary: string;
  card: string;
  field: string;
  rule: string;
  ruleStrong: string;
  accent: string;
  good: string;
  bad: string;
  inverse: string;
};

const LIGHT: Palette = {
  ground: colour.surface,
  ink: colour.ink,
  secondary: colour.textSecondary,
  tertiary: colour.textTertiary,
  card: colour.surface,
  field: colour.surface2,
  rule: colour.rule,
  ruleStrong: colour.ruleStrong,
  accent: colour.accentDeep,
  good: colour.goodText,
  bad: colour.bad,
  inverse: colour.textInverse,
};

const DARK: Palette = {
  ground: night.ground,
  ink: night.ink,
  secondary: night.secondary,
  tertiary: night.tertiary,
  card: night.panel,
  field: night.panel2,
  rule: night.rule,
  ruleStrong: night.ruleStrong,
  accent: night.accent,
  good: night.good,
  bad: night.bad,
  inverse: night.ground,
};
