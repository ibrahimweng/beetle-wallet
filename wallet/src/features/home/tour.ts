/* Home's tour (Round 28, the owner's word: a first-time tour, skippable).

   A new account going in for the first time is shown round home once it is
   there: four things, one at a time, each lit in the dark with a line about
   it, Skip always at the top. The way in asks for it (wantTour); home
   starts it once the way in's dark has opened onto it (see Home.tsx); the
   tour itself is drawn over the bar as well as the page (Tour.tsx, in the
   app's layout). Nothing is kept: an app closed before home was reached
   does not bring it back.

   Home lends the tour its hands: the card's dip, so the pull is shown, and
   the chat's opening and closing, so the place to ask is. */
let wanted = false;
let state: 'idle' | 'waiting' | 'on' = 'idle';
const listeners = new Set<() => void>();
const put = (next: typeof state) => {
  state = next;
  listeners.forEach(l => l());
};
export const subscribeTour = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const tourState = () => state;

/** The way in, for a new account: show home round once it is there. */
export const wantTour = () => {
  wanted = true;
};
/** Home, once it is there: whether the tour was asked for. From here until it ends, home holds its own first-time dip back. */
export function takeTour() {
  if (!wanted) return false;
  wanted = false;
  put('waiting');
  return true;
}
/** Whether the tour is asked for, waiting or showing. */
export const touring = () => wanted || state !== 'idle';
export const showTour = () => put('on');
export const endTour = () => put('idle');

export type TourHands = {
  /** the card dips and springs back, as it does the first time */
  dip: () => void;
  /** the card opens into the chat, without a greeting, and closes again */
  open: () => void;
  close: () => void;
};
let hands: TourHands | null = null;
export const lendHands = (h: TourHands | null) => {
  hands = h;
};
export const tourHands = () => hands;
