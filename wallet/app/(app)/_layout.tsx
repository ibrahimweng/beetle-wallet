/* Every screen after the way in, in one stack that moves the way the phone
   does: a page slides in from the right over the one it came from, which
   gives way a little to the left, and slides back out to the right; on the
   phone the swipe from the left edge takes it back under the finger. It is
   expo-router's JavaScript stack, so the phone and the web move alike, and
   so a page can open over home with home still under it.

   Card, Services, Loan and Savings, the pages home's four cards open, come
   up from the bottom instead, as white sheets over home, which steps back
   behind them; a page opened from a sheet comes up as a sheet over it
   (Round 14, the owner's word; design/sheetStack.tsx). A receipt opens in
   place over whatever it came from, with no slide of its own: the line
   stays and the rest grows in under it (see receipts/Over.tsx).

   Each screen carries its own foot (FootScope), so the foot slides with
   its page. */
import React from 'react';
import { Stack, TransitionPresets, type StackNavigationOptions } from 'expo-router/js-stack';
import { colour } from '../../src/design';
import { SheetScope, forModalPresentationIOS, isSheet } from '../../src/design/sheetStack';
import { FootScope } from '../../src/features/more/Foot';

/** A page: the phone's own slide. */
export const PAGE: StackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
  animation: 'slide_from_right',
  ...TransitionPresets.SlideFromRightIOS,
  cardStyle: { backgroundColor: colour.surface },
};

/** A sheet: up from the bottom, white, over what it came from, which steps
    back; a swipe down from its top puts it away, as Back at its foot does. */
const SHEET: StackNavigationOptions = {
  headerShown: false,
  presentation: 'modal',
  cardStyleInterpolator: forModalPresentationIOS,
  transitionSpec: TransitionPresets.ModalPresentationIOS.transitionSpec,
  gestureEnabled: true,
  gestureDirection: 'vertical',
  gestureResponseDistance: 120,
  cardOverlayEnabled: true,
  /* what is under a sheet stays drawn, so it shows over the sheet's top */
  detachPreviousScreen: false,
  cardStyle: { backgroundColor: colour.surface },
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
    <Stack
      /* a page slides in from the right; a page opened from a sheet comes up as a sheet over it */
      screenOptions={({ route, navigation }) => (isSheet(navigation.getState().routes, route.key) ? SHEET : PAGE)}
      /* a sheet with something under it stops under the status bar; one the stack starts with (the lab opens a page so) is the whole screen */
      screenLayout={({ children, options, route, navigation }) => (
        <SheetScope on={options.cardStyleInterpolator === forModalPresentationIOS && navigation.getState().routes.findIndex(r => r.key === route.key) > 0}>
          <FootScope>{children}</FootScope>
        </SheetScope>
      )}
    >
      {/* home is where the stack starts: nothing to swipe back to */}
      <Stack.Screen name="home" options={{ gestureEnabled: false }} />
      <Stack.Screen name="card" options={SHEET} />
      <Stack.Screen name="services" options={SHEET} />
      <Stack.Screen name="loan" options={SHEET} />
      <Stack.Screen name="goal" options={SHEET} />
      <Stack.Screen name="receipt/[id]" options={IN_PLACE} />
    </Stack>
  );
}
