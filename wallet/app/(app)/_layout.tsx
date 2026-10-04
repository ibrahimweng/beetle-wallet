/* Every screen after the way in, in one stack that moves the way the phone
   does: a page slides in from the right over the one it came from, which
   gives way a little to the left, and slides back out to the right; on the
   phone the swipe from the left edge takes it back under the finger. It is
   expo-router's JavaScript stack, so the phone and the web move alike, and
   so a page can open over home with home still under it.

   Card, Services, Loan and Savings, the pages home's four cards open, slide
   in the same way but over home itself, their ground frosted glass, so
   home shows through behind them (Screen's `frost`). A receipt opens in
   place over whatever it came from, with no slide of its own: the line
   stays and the rest grows in under it (see receipts/Over.tsx).

   Each screen carries its own foot (FootScope), so the foot slides with
   its page. */
import React from 'react';
import { Stack, TransitionPresets, type StackNavigationOptions } from 'expo-router/js-stack';
import { colour } from '../../src/design';
import { FootScope } from '../../src/features/more/Foot';

/** A page: the phone's own slide. */
export const PAGE: StackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
  animation: 'slide_from_right',
  ...TransitionPresets.SlideFromRightIOS,
  cardStyle: { backgroundColor: colour.surface },
};

/** A page that opens over home: the same slide, home kept under it, no white of its own. */
const OVER: StackNavigationOptions = {
  ...PAGE,
  presentation: 'transparentModal',
  cardStyle: { backgroundColor: 'transparent' },
  cardOverlayEnabled: false,
};

/** A receipt, opened in place over what it came from. */
const IN_PLACE: StackNavigationOptions = {
  headerShown: false,
  presentation: 'transparentModal',
  animation: 'none',
  cardStyle: { backgroundColor: 'transparent' },
  cardOverlayEnabled: false,
  gestureEnabled: false,
};

export default function AppLayout() {
  return (
    <Stack screenOptions={PAGE} screenLayout={({ children }) => <FootScope>{children}</FootScope>}>
      {/* home is where the stack starts: nothing to swipe back to */}
      <Stack.Screen name="home" options={{ gestureEnabled: false }} />
      <Stack.Screen name="card" options={OVER} />
      <Stack.Screen name="services" options={OVER} />
      <Stack.Screen name="loan" options={OVER} />
      <Stack.Screen name="goal" options={OVER} />
      <Stack.Screen name="receipt/[id]" options={IN_PLACE} />
    </Stack>
  );
}
