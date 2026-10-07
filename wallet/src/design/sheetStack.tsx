/* Pages that come up from the bottom as sheets (Round 14, the owner's word:
   "make the pages that open from the four tiles in the home screen to be
   bottom ups not full page", the text on them "perfectly readable", and
   "one bottom sheet over another bottom sheet", drawn after the Fuse
   wallet's own).

   A sheet is white, edge to edge, its top corners round, and stops just
   under the status bar. What it came up over steps back: a little narrower,
   its own top showing 10 over the sheet's, and a light grey comes over all
   of it. A page opened from a sheet comes up as a sheet over it, and the
   one under steps back in its turn. A swipe down from the sheet's top, or
   Back at its foot, puts it away.

   The stack draws the movement (app/(app)/_layout.tsx) and knows a sheet by
   its movement's name: that is why the movement carries the name of the
   stack's own iOS sheet, and keeps what is under a sheet drawn. */
import React, { createContext, useContext, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackCardInterpolatedStyle, StackCardInterpolationProps } from 'expo-router/js-stack';

/** The frames allow 52 for the status bar; a phone whose bar is taller pushes the sheet down to clear it. */
const STATUS = 52;
/** Where a sheet's top stops on a phone with this much at its top. */
export const sheetTop = (insetTop: number) => Math.max(STATUS, Math.round(insetTop));
/** How much of what is under a sheet shows over its top, and how far in it steps at either side. */
const PEEK = 10;
const INSET = 10;
/** A sheet's top corners: big and round, as the Fuse sheets are. */
export const SHEET_RADIUS = 38;
/** The grey each sheet brings over what is under it: one sheet greys home a little, a second greys it again. */
const DIM = 0.12;

/** The sheet's movement, and the step back of what is under it. */
export function forModalPresentationIOS({ index, current, next, inverted, layouts: { screen }, insets }: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const top = sheetTop(insets.top);
  /* the first of a run of sheets is the full screen they came up over */
  const first = index === 0;
  const progress = Animated.add(
    current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    next ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) : 0,
  );
  const scale = screen.width ? 1 - (2 * INSET) / screen.width : 1;
  /* stepped back: scaled about its middle, then moved so its top shows PEEK over the sheet now on it */
  const restTop = first ? 0 : top;
  const height = first ? screen.height : screen.height - top;
  const back = top - PEEK - (restTop + (height * (1 - scale)) / 2);
  const translateY = Animated.multiply(progress.interpolate({ inputRange: [0, 1, 2], outputRange: [first ? 0 : screen.height, 0, back] }), inverted);
  const scaled = progress.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1, scale] });
  const radius = first ? progress.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, SHEET_RADIUS] }) : SHEET_RADIUS;
  return {
    cardStyle: {
      overflow: 'hidden',
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      marginTop: first ? 0 : top,
      transform: [{ translateY }, { scale: scaled }],
    },
    overlayStyle: { opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, DIM], extrapolate: 'clamp' }) },
  };
}

/** The four pages home's cards open, always sheets. */
const SHEETS = new Set(['card', 'services', 'loan', 'goal']);
/** A receipt opens in place over what it came from (no sheet of its own), and passes on what is under it. */
const IN_PLACE = new Set(['receipt/[id]']);
/** The camera is the whole screen, black, wherever it is opened from. */
const WHOLE = new Set(['scan']);

/** Is the route with this key a sheet? It is one of the four, or it was
    opened from a sheet (or from a receipt open over one). Home never is,
    and the camera never is. */
export function isSheet(routes: readonly { key: string; name: string }[], key: string): boolean {
  let under = false;
  for (const r of routes) {
    const sheet: boolean = !WHOLE.has(r.name) && (SHEETS.has(r.name) || (under && r.name !== 'home' && !IN_PLACE.has(r.name)));
    if (r.key === key) return sheet;
    under = IN_PLACE.has(r.name) ? under : sheet;
  }
  return false;
}

type Sheet = { top: number } | null;
const SheetContext = createContext<Sheet>(null);

/** The sheet this page is drawn in, with where its top stops; null on a full page. */
export const useSheet = () => useContext(SheetContext);

export function SheetScope({ on, children }: { on: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <SheetContext.Provider value={on ? { top: sheetTop(insets.top) } : null}>{children}</SheetContext.Provider>;
}
