/* What a page inside the pager knows about itself: which of the three it
   is and whether it is the one showing; and the pager's own swipe, for a
   thing on a page that swipes sideways itself (the Services card) and so
   has to have first say over a sideways move that starts on it. */
import { createContext, useContext } from 'react';
import type { PanGesture } from 'react-native-gesture-handler';
import type { Tab } from './tabs';

export type PageInfo = { tab: Tab | null; active: boolean };

export const PageContext = createContext<PageInfo | null>(null);

/** The page this is, and whether it is showing. Outside the pager a screen is always showing. */
export function usePage(): PageInfo {
  return useContext(PageContext) ?? { tab: null, active: true };
}

export const SwipeContext = createContext<PanGesture | null>(null);

/** The pager's swipe, where there is one: a sideways gesture on a page blocks it while it runs. */
export const usePagerSwipe = () => useContext(SwipeContext);
