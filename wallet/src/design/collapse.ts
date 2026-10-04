/* How a page's title shrinks as the page scrolls (Round 13, the owner's
   word: "make sure the title animates to become a smaller text the size of
   the wallet text on the home screen hero section, when the user scroll
   back up the text becomes bigger at the top").

   The head stays at the top while the column scrolls under it. Over the
   first COLLAPSE points of scroll the title shrinks to SMALL, the size of
   the word Wallet on home's black card, its top left corner held to the
   big title's line (63 down, where the frames start a 32 point title), and
   the line under it fades. Scrolled back to the top, it grows back. The
   page (Screen) keeps how far it has scrolled; the heads read it here. */
import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** How far the page scrolls while the title shrinks. */
export const COLLAPSE = 56;
/** The shrunk title's size: the word Wallet on home's card is the label face, 14. */
export const SMALL = 14;
/** Where the shrunk title's top sits: the big title's own line, 9 above the column's 72. */
export const SMALL_TOP = 63;

export const HeadScroll = createContext<SharedValue<number> | null>(null);

/** How far the page this head is on has scrolled, or null off a page. */
export const useHeadScroll = () => useContext(HeadScroll);

/** 0 at the top, 1 once the title has shrunk all the way. */
export function collapsed(y: number): number {
  'worklet';
  return Math.max(0, Math.min(1, y / COLLAPSE));
}
