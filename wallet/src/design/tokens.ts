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
  goodTint: '#e7f7ec',
  warn: '#f5a524',
  bad: '#cc2a20',
  /* the brighter red the frames put on a status glyph, where nothing has to be read */
  alert: '#ff3b30',
  badBright: '#ff3b30',
  violet: '#8b5cf6',
  cyan: '#22b8e8',

  rule: '#dedee3',
  /* the track a switch sits in when it is off */
  rail: '#e4e4e8',
  ruleStrong: '#c4c4c9',
  scrim: 'rgba(120, 120, 124, 0.42)',
} as const;

/* The dark card at the top of home, and the chat inside it, read off the
   home frame: near-black behind everything, a step lighter for what you
   said and for a panel's head, and grey text that is never quite white
   except a figure. */
export const dark = {
  card: '#141414',
  chip: '#3f3f3f',
  chipText: '#8e8e93',
  chipTextOpen: '#ececec',
  kobo: '#c4c4c9',
  bubble: '#2d2d2d',
  text: '#c8c8c8',
  textSoft: '#a3a3a3',
  label: '#8e8e93',
  panel: '#1c1c1e',
  /* the accent, lifted to read as a link on the dark (a receipt opened in the chat, Round 20) */
  link: '#8e9bff',
  /* the chats drawer's ground: a step lighter than the chat's own dark, so
     it reads as a layer over it (Round 20, the owner's word) */
  drawer: '#222224',
  edge: '#2c2c2e',
  edgeStrong: '#3a3a3c',
  pillText: '#e5e5ea',
  grabber: '#cdcdcd',
  divider: '#2c2c2e',
  /* the quiet card that stands in the card when there is nothing to offer
     (Round 15, the owner's frame): a ring rather than a ground, a grey tile */
  quietRing: 'rgba(255, 255, 255, 0.2)',
  quietTile: '#8e8e93',
  quietGlyph: '#cacaca',
  quietTitle: '#dedee3',
} as const;

/* An offer on the black card (Round 15): its second line and the dots that
   are not showing, in a soft and a deep shade of the offer's own colour.
   The frame draws the green one; the others keep the green's strength and
   come out as bright as it, so each reads as well on its own ground. */
export const offerShade: Record<string, { soft: string; deep: string }> = {
  [colour.good]: { soft: '#5a9960', deep: '#008825' },
  [colour.accent]: { soft: '#8189b5', deep: '#4964ff' },
  [colour.violet]: { soft: '#9283b6', deep: '#854fff' },
  [colour.warn]: { soft: '#a1875f', deep: '#a66700' },
};

/* The file is drawn in SF Pro Text. iOS has it, so it asks for nothing and
   gets it; Android has Roboto. On the web "whatever the browser has" is not
   good enough — the default on a bare Linux is DejaVu Sans, which runs about
   four per cent wider than SF Pro and wraps lines the design does not — so the
   web asks for SF Pro first and falls back through the faces that are near it
   in width, ending at Arial, which Liberation Sans matches metric for metric. */
const family = Platform.select({
  ios: undefined,
  android: 'sans-serif',
  default: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
});

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
  /* smaller than a caption, where the owner's home frame sets them (Round 14): the promo's line, and the foot line of home's four cards */
  small: face(11, 16, '400'),
  fine: face(10, 16, '400'),
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
