/* On the web, a field coming into use has the browser scroll every box that clips it until the field shows,
   the boxes the app holds still among them (overflow hidden: the home page while the card is open, the open
   card's own frame). The card then slides up out of its bounds, the page showing under it. A box held still
   may go back toward where it was held (the page easing to its top as the card opens) but never further from
   it: the browser's scroll is undone at once (Round 39, the owner's word: the dark card never leaves its
   bounds). Only the box named is held: the boxes in it (the chat, which moves itself for a receipt opening in
   place while a finger may not scroll it) are left alone. */
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Holds still the box `node` gives, while it clips. */
export function useClipsHeld(node: () => unknown) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const raw = node() as { getScrollableNode?: () => unknown } | null;
    const el = (raw?.getScrollableNode?.() ?? raw) as HTMLElement | null;
    if (!el?.addEventListener) return;
    /* where it was last let be */
    let was = { top: el.scrollTop, left: el.scrollLeft };
    const back = () => {
      const style = getComputedStyle(el);
      const still = style.overflowY === 'hidden' && style.overflowX === 'hidden';
      if (still && (el.scrollTop > was.top || el.scrollLeft > was.left)) {
        el.scrollTop = Math.min(el.scrollTop, was.top);
        el.scrollLeft = Math.min(el.scrollLeft, was.left);
        return;
      }
      was = { top: el.scrollTop, left: el.scrollLeft };
    };
    el.addEventListener('scroll', back);
    return () => el.removeEventListener('scroll', back);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
