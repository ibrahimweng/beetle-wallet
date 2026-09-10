/* The design tokens, the same values as src/tokens.css on the web build, which
   were read out of the Figma file rather than approximated. Type is expressed
   as size and line height in points because that is how the file sets it. */
import { Platform, TextStyle } from 'react-native';

export const colour = {
  ink: '#000000',
  surface: '#ffffff',
  surface2: '#f5f5f7',
  surface3: '#efeff1',
  surface4: '#fafafa',

  text: '#000000',
  textSecondary: '#8e8e93',
  textTertiary: '#a9a9ae',
  textInverse: '#ffffff',

  accent: '#213aca',
  accentDeep: '#1d33b2',
  accentWash: '#eff1fb',

  good: '#34c759',
  goodText: '#11823b',
  warn: '#f5a524',
  bad: '#cc2a20',
  badBright: '#ff3b30',
  violet: '#8b5cf6',
  cyan: '#22b8e8',

  rule: '#dedee3',
  ruleStrong: '#c4c4c9',
  scrim: 'rgba(120, 120, 124, 0.42)',
} as const;

/* San Francisco on iOS, Roboto on Android, whatever the browser has on web.
   The file is drawn in SF Pro Text. */
const family = Platform.select({ ios: undefined, android: 'sans-serif', default: undefined });

const face = (size: number, height: number, weight: TextStyle['fontWeight']): TextStyle => ({
  fontSize: size,
  lineHeight: height,
  fontWeight: weight,
  fontFamily: family,
  color: colour.text,
});

export const type = {
  display: face(32, 40, '700'),
  title: face(32, 40, '600'),
  head: face(20, 24, '600'),
  row: face(16, 24, '600'),
  body: face(16, 24, '400'),
  label: face(14, 20, '600'),
  meta: face(14, 20, '400'),
  caption: face(12, 16, '400'),
  key: face(22, 28, '400'),
} as const;

export const radius = { xs: 6, sm: 12, md: 16, lg: 20, card: 24, pill: 999 } as const;

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24 } as const;

/* What the frames are drawn at, and the paddings taken off them. */
export const frame = {
  width: 393,
  height: 852,
  sidePad: 20,
  topPad: 72,
  bottomPad: 124,
  columnGap: 20,
  cardPad: { vertical: 20, horizontal: 21 },
  buttonHeight: 56,
  dockPad: 24,
  askBarHeight: 48,
} as const;
