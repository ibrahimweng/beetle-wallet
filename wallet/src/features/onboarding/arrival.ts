/* The coin of the way in, and the way from it into home (Round 28, the
   owner's word).

   The coin is one coin from the welcome to home: it is drawn above every
   screen (see Arrival.tsx), not inside the way in, so it never starts its
   turn again as the steps change or as home takes the way in's place. The
   way in says where it should be (WayIn.tsx); this keeps it.

   Done signing up, the coin comes to the middle and breathes for two
   seconds while the account is opened. Under it the dark covers everything
   and home is put together there, unseen. Then the dark takes the impact:
   it swells, blurs and fades to nothing while an oval opens fast from the
   middle onto home, and the coin goes with it. */
import { Easing, makeMutable, runOnJS, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/** where the coin is: its middle from the top of the screen, its picture's square (the coin fills four fifths of
    it), and how much it shows */
export const coin = {
  cy: makeMutable(0),
  size: makeMutable(0),
  on: makeMutable(0),
  /** the breath while the account is opened: 0 at rest, 1 at its fullest */
  breath: makeMutable(0),
  /** whether it has been put anywhere since the way in last took it: the first place is taken at once */
  placed: makeMutable(0),
};
/** the dark over everything while home is put together under it: 1 whole */
export const cover = makeMutable(0);
/** the reveal: 0 not begun, 1 done */
export const burst = makeMutable(0);

/** The coin's glide to the middle, the breath, and the reveal. */
export const LAND = 640;
export const BREATH = 2000;
export const BURST = 680;
/** the coin's picture in the middle */
export const MIDDLE = 300;

type State = { coin: boolean; cover: boolean; revealing: boolean };
let state: State = { coin: false, cover: false, revealing: false };
const listeners = new Set<() => void>();
const put = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
};
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const snapshot = () => state;

let claims = 0;
let finishing = false;
let breathed = false;
let underneath = false;
let after: (() => void)[] = [];
let opening: (() => void)[] = [];

/** The way in shows the coin; it is taken back when the way in goes, unless it is on its way into home. */
export function claimCoin() {
  claims += 1;
  if (state.coin) return;
  coin.placed.value = 0;
  coin.on.value = 0;
  put({ coin: true });
}
export function releaseCoin() {
  claims = Math.max(0, claims - 1);
  if (claims === 0 && !finishing) put({ coin: false });
}

/** Done: the coin goes to the middle (the way in moves it) and breathes there; the reveal waits for the breath and for home. */
export function finish() {
  finishing = true;
  breathed = false;
  underneath = false;
  burst.value = 0;
  const half = { duration: BREATH / 4, easing: Easing.inOut(Easing.sin) };
  coin.breath.value = withDelay(LAND, withRepeat(withSequence(withTiming(1, half), withTiming(0, half)), 2, false));
  setTimeout(() => {
    breathed = true;
    reveal();
  }, LAND + BREATH);
}

/** The dark over everything, at once: the way in under it has already gone bare, so nothing is seen to change. */
export function coverUp() {
  cover.value = 1;
  put({ cover: true });
}

/** Home has been put in the way in's place, under the dark. A moment for it to draw, and it can be shown. */
export function homeIsUnder() {
  setTimeout(() => {
    underneath = true;
    reveal();
  }, 160);
}

/** Opening the account failed: everything back as it was, the coin where the way in puts it. */
export function abandon() {
  finishing = false;
  coin.breath.value = 0;
  cover.value = 0;
  put({ cover: false, revealing: false, coin: claims > 0 });
}

function reveal() {
  if (!finishing || !breathed || !underneath || state.revealing) return;
  put({ revealing: true });
  const now = opening;
  opening = [];
  now.forEach(f => f());
  burst.value = withTiming(1, { duration: BURST, easing: Easing.out(Easing.quad) }, done => {
    if (done) runOnJS(arrived)();
  });
}

function arrived() {
  finishing = false;
  coin.on.value = 0;
  coin.breath.value = 0;
  cover.value = 0;
  burst.value = 0;
  put({ coin: claims > 0, cover: false, revealing: false });
  opening = [];
  const waiting = after;
  after = [];
  waiting.forEach(f => f());
}

/** Whether the way into home is still showing. */
export const arriving = () => finishing;

/** Something for home to do as it comes into view, once the oval begins to open onto it: at once if nothing is in the way. */
export function whenOpening(f: () => void) {
  if (!finishing || state.revealing) f();
  else opening.push(f);
  return () => {
    opening = opening.filter(g => g !== f);
  };
}

/** Something to do once home is showing whole: at once if it already is. */
export function whenArrived(f: () => void) {
  if (!finishing) f();
  else after.push(f);
  return () => {
    after = after.filter(g => g !== f);
  };
}
