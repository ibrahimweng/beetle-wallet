/* The design tokens. Sizes were read out of the Figma file rather than
   approximated; colours and faces are the brand's since Round 25 (DESIGN.md,
   The brand). Type is expressed as size and line height in points because
   that is how the file sets it. */
import { Platform, TextStyle } from 'react-native';

export const colour = {
  /* Round 25, the brand: a warm near-black for what was black, and a neutral
     white for the page, only just off pure, so the screens read clean rather
     than moody (the owner's word); its tiles and fields a step down. */
  ink: '#2b2721',
  surface: '#fafaf9',
  surface2: '#f1f0ed',
  surface3: '#e8e6e2',
  surface4: '#fcfcfb',

  text: '#2b2721',
  textSecondary: '#77726b',
  textTertiary: '#a7a29b',
  textInverse: '#fafaf9',

  /* the brand's one loud colour; words in it take the deeper shade, which
     reads on the page where the bright one does not */
  accent: '#f04f22',
  accentDeep: '#b8390f',
  accentWash: '#fde8df',

  good: '#34c759',
  goodText: '#0f7535',
  goodTint: '#e6f4e6',
  warn: '#f5a524',
  /* a red that stays apart from the orange */
  bad: '#b42318',
  /* the brighter red the frames put on a status glyph, where nothing has to be read */
  alert: '#e5352b',
  badBright: '#e5352b',
  violet: '#8b5cf6',
  cyan: '#22b8e8',

  rule: '#e5e3de',
  /* the track a switch sits in when it is off */
  rail: '#e6e4e0',
  ruleStrong: '#cdc9c2',
  scrim: 'rgba(43, 39, 33, 0.32)',
} as const;

/* The dark card at the top of home, and the chat inside it: the way in's
   very dark brown behind everything (Round 28, the owner's word: the card on
   the first page's dark; every step lighter moved down with it), a step
   lighter for what you said and for a panel's head, and cream text that is
   never quite paper except a figure. */
export const dark = {
  card: '#1a130d',
  chip: '#392f27',
  chipText: '#a89b8a',
  chipTextOpen: '#efe3cb',
  /* the brand's clay: the mark on the dark, and the kobo after the balance */
  kobo: '#bcaa97',
  bubble: '#2c221c',
  text: '#ddd0ba',
  textSoft: '#b3a693',
  label: '#998c7b',
  panel: '#251c16',
  /* the accent, lifted to read as a link on the dark (a receipt opened in the chat, Round 20) */
  link: '#ff9466',
  /* the chats drawer's ground: a step lighter than the chat's own dark, so
     it reads as a layer over it (Round 20, the owner's word) */
  drawer: '#231a14',
  edge: '#2c221c',
  edgeStrong: '#3c322a',
  pillText: '#efe3cb',
  grabber: '#bcaa97',
  divider: '#2c221c',
  /* the quiet card that stands in the card when there is nothing to offer
     (Round 15, the owner's frame): a ring rather than a ground, a clay tile */
  quietRing: 'rgba(239, 227, 203, 0.2)',
  quietTile: '#998c7b',
  quietGlyph: '#d9ccb6',
  quietTitle: '#e8dcc4',
  /* what was white on the black: the brand's paper, and its cream */
  paper: '#fbefe3',
  cream: '#efe3cb',
} as const;

/* An offer on the black card (Round 15): its second line and the dots that
   are not showing, in a soft and a deep shade of the offer's own colour.
   The frame draws the green one; the others keep the green's strength and
   come out as bright as it, so each reads as well on its own ground. */
export const offerShade: Record<string, { soft: string; deep: string }> = {
  [colour.good]: { soft: '#5a9960', deep: '#008825' },
  [colour.accent]: { soft: '#b5806b', deep: '#ff6a3d' },
  [colour.violet]: { soft: '#9283b6', deep: '#854fff' },
  [colour.warn]: { soft: '#a1875f', deep: '#a66700' },
};

/* The brand's faces: Geist and Sentient, and nothing else (Round 27, the
   owner's word). Sentient, the serif, is only ever a page's main title;
   everything else, body, subtitles and the figures, is Geist. Geist is
   bundled as "Beetle Sans", the open-licence face with one glyph added, the
   naira sign, which it does not carry. Sentient's licence forbids keeping
   it anywhere public, as this repository is, so it is fetched from
   Fontshare when the app opens (src/design/fonts.ts), until the owner's own
   face takes its place; where it cannot be, the titles fall back to Geist
   (withoutProse). A face is a file per weight, so a weight
   is asked for by name: a custom family given a fontWeight is drawn in the
   system face on Android and thickened by hand on the web. The web keeps
   the old stack behind the name for the moment before the files land. */
export type Weight = '400' | '500' | '600' | '700';
export const FACES = {
  sans: { '400': 'BeetleSans-Regular', '500': 'BeetleSans-Medium', '600': 'BeetleSans-SemiBold', '700': 'BeetleSans-Bold' },
  prose: { '400': 'Sentient-Regular', '500': 'Sentient-Medium', '600': 'Sentient-Medium', '700': 'Sentient-Medium' },
} as const;
const STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const named = (name: string) => (Platform.OS === 'web' ? `${name}, ${name.startsWith('Sentient') ? 'BeetleSans-Regular, ' : ''}${STACK}` : name);

/** The face for a weight: Beetle Sans unless the serif is asked for. */
export const font = (weight: Weight = '400', kind: keyof typeof FACES = 'sans'): TextStyle => ({
  fontFamily: named(FACES[kind][weight]),
  fontWeight: 'normal',
});

const face = (size: number, height: number, weight: Weight, kind: keyof typeof FACES = 'sans'): TextStyle => ({
  fontSize: size,
  lineHeight: height,
  ...font(weight, kind),
  color: colour.text,
});

export const type = {
  /* the big figures, in Geist */
  display: face(32, 40, '700'),
  /* a page's main title: the one place for the serif */
  title: face(32, 40, '400', 'prose'),
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

/** Sentient could not be fetched: the titles are drawn in Geist instead, at the weight they had before the brand.
    Called before the first screen is drawn, so nothing is ever seen changing. */
export function withoutProse() {
  Object.assign(type.title, font('600'));
}

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
