/* The brand's font files (Round 25), by the names src/design/tokens.ts asks
   for them by. They load once, at the root, before the first screen is drawn;
   the licences are beside them in assets/fonts. */
import type { FACES, Weight } from './tokens';

type Name = (typeof FACES)['sans'][Weight];

export const FONT_FILES: Record<Name, number> = {
  'BeetleSans-Regular': require('../../assets/fonts/BeetleSans-Regular.ttf'),
  'BeetleSans-Medium': require('../../assets/fonts/BeetleSans-Medium.ttf'),
  'BeetleSans-SemiBold': require('../../assets/fonts/BeetleSans-SemiBold.ttf'),
  'BeetleSans-Bold': require('../../assets/fonts/BeetleSans-Bold.ttf'),
};

/* Sentient, for the look and feel until the owner's own face is ready: its
   licence lets an app use it but not have it kept anywhere public, so it is
   not in this repository; it comes from Fontshare's own servers as the app
   opens, and the root gives it a few seconds before drawing without it. */
const FONTSHARE = 'https://cdn.fontshare.com/wf/';
export const REMOTE_FONTS = {
  'Sentient-Regular': FONTSHARE + 'RVTZPYAA57KV4AMXRX7ZIPJXSTYCRP7A/36OUS5CBIXRKI2QU7G7OUHOK7HHA53Y2/SIH66VPT4WS2HIF5PEJNDU4INNUF54LG.ttf',
  'Sentient-Medium': FONTSHARE + 'XVVLA67EPQTZD7YHR3MQPW2IQXXDTGPX/IHGNDJMSP2Y53DG23KZTPBH753PUEUB2/RNUZPHMIVMPXFHVACRGCAJ32E6WUEDVU.ttf',
} satisfies Record<(typeof FACES)['prose'][Weight], string>;

/** How long the first screen waits for Sentient before it draws without it. */
export const REMOTE_WAIT = 4000;
