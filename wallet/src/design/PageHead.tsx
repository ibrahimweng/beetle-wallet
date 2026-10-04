/* Page head — the set's two variants. lead=no is a 20 point title, lead=yes is
   a 32 point one. Both leave 8 under the title, and the line below is 16
   regular in the tertiary grey, not 14.

   The big one hangs 9 above the column it starts. That is where the frames put
   it: everything else in the column begins 72 down, and a 32 title begins at
   63, so the words themselves line up with the top of the screen rather than
   the box around them. Both variants give 5 back at the bottom for the same
   reason: the line under the title carries more box than ink, and the frames
   space what follows from the ink: half of them put the next block 143
   down, the other half 147, and the build's 145 is within reach of both.

   On a page the head stays at the top while the column scrolls under it, and
   the title shrinks to the size of home's word Wallet, its top left corner
   held to the big title's line, the line under it fading (collapse.ts).
   Scrolled back to the top, it grows back. */
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Body, Head, Title } from './text';
import { SMALL, SMALL_TOP, collapsed, useHeadScroll } from './collapse';
import { frame } from './tokens';

export function PageHead({ title, sub, lead = false }: { title: string; sub?: string; lead?: boolean }) {
  const T = lead ? Title : Head;
  const shrunk = useShrink(lead ? 32 : 20, lead ? 0 : frame.topPad - SMALL_TOP);
  const fade = useFade();
  return (
    /* the big one sets its line two under the title where the small one
       leaves eight: at 32 the box already carries the room. Nothing in it
       takes a touch, so the column under it scrolls from anywhere. */
    <View pointerEvents="none" style={{ gap: lead ? 2 : 8, marginTop: lead ? -9 : 0, marginBottom: lead ? -4 : -3 }}>
      <Animated.View testID="head" style={[ORIGIN, shrunk]}>
        <T>{title}</T>
      </Animated.View>
      {sub ? (
        <Animated.View style={fade}>
          <Body tone="tertiary">{sub}</Body>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Scaled about its top left corner, so it shrinks toward where it starts. */
export const ORIGIN = { transformOrigin: 'left top' } as const;

/** A title of `size` shrinking to SMALL as the page scrolls, rising by `rise`
    to the shrunk title's line, and moving left by `left` (past a glyph that
    goes). Off a page it stays as it is. */
export function useShrink(size: number, rise = 0, left = 0) {
  const y = useHeadScroll();
  return useAnimatedStyle(() => {
    const k = y ? collapsed(y.value) : 0;
    return { transform: [{ translateX: -left * k }, { translateY: -rise * k }, { scale: 1 - k * (1 - SMALL / size) }] };
  });
}

/** The line under a title, and anything else that goes as it shrinks: gone by halfway, lifting a little. */
export function useFade() {
  const y = useHeadScroll();
  return useAnimatedStyle(() => {
    const k = y ? Math.min(1, collapsed(y.value) * 2) : 0;
    return { opacity: 1 - k, transform: [{ translateY: -8 * k }] };
  });
}

/** A page's title on its own, 32 point, set 72 down where the column starts
    (Settings draws its head so): it shrinks with the scroll like any head,
    rising the 9 to the big title's line as it does. */
export function HeadTitle({ children, style }: { children: string; style?: object }) {
  const shrunk = useShrink(32, frame.topPad - SMALL_TOP);
  return (
    <View pointerEvents="none" style={style}>
      <Animated.View testID="head" style={[ORIGIN, shrunk]}>
        <Title>{children}</Title>
      </Animated.View>
    </View>
  );
}
