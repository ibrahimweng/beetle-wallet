/* Every screen after the way in, in one stack that moves the way the phone
   does: a page slides in from the right over the one it came from, which
   gives way a little to the left, and slides back out to the right; on the
   phone the swipe from the left edge takes it back under the finger. It is
   expo-router's JavaScript stack, so the phone and the web move alike, and
   so a page can open over home with home still under it.

   Card, Services, Loan and Savings, the pages home's four cards open, come
   up from the bottom instead, as white sheets over home, which steps back
   behind them; a page opened from a sheet comes up as a sheet over it
   (Round 14, the owner's word; design/sheetStack.tsx). A sheet comes up on
   a long, settling ease and the one under it steps back on the same one,
   on the web as on the phone (Round 18, the owner's word: the web stack
   moves nothing it is not told how to move, so the sheets used to appear
   at once there). A receipt opens in
   place over whatever it came from, with no slide of its own: the line
   stays and the rest grows in under it (see receipts/Over.tsx). The
   camera is a page, the whole screen, from wherever it is opened; what it
   reads opens in its place, in this same stack, so Done on that page's
   receipt goes back past it (the analysis after Round 21: from a stack of
   its own, a bill read off a photo could be paid twice).

   Each screen says what its foot holds (FootScope); the foot is drawn
   once over the whole stack (FootHost), staying put while pages slide in
   and out above it and changing shape from one page's foot to the next
   (Round 18, the owner's word). */
import React from 'react';
import { Easing, View } from 'react-native';
import { Stack, TransitionPresets, type StackNavigationOptions } from 'expo-router/js-stack';
import { colour } from '../../src/design';
import { SheetScope, forModalPresentationIOS, isSheet } from '../../src/design/sheetStack';
import { FootHost, FootScope } from '../../src/features/more/Foot';
import { TourHost } from '../../src/features/home/Tour';

/** A page: the phone's own slide. */
export const PAGE: StackNavigationOptions = {
  headerShown: false,
  presentation: 'card',
  animation: 'slide_from_right',
  ...TransitionPresets.SlideFromRightIOS,
  cardStyle: { backgroundColor: colour.surface },
};

/** How a sheet moves: the curve sheets use on the phone, quick off the
    mark and settling gently into place, up in half a second and down a
    little quicker. The sheet under it steps back on the same curve, since
    it moves on the new sheet's progress. */
type Spec = NonNullable<StackNavigationOptions['transitionSpec']>['open'];
const SHEET_EASE = Easing.bezier(0.32, 0.72, 0, 1);
const SHEET_UP: Spec = { animation: 'timing', config: { duration: 500, easing: SHEET_EASE } };
const SHEET_DOWN: Spec = { animation: 'timing', config: { duration: 400, easing: SHEET_EASE } };

/** A sheet: up from the bottom, white, over what it came from, which steps
    back; a swipe down from its top puts it away, as Back at its foot does. */
const SHEET: StackNavigationOptions = {
  headerShown: false,
  presentation: 'modal',
  /* named, so the web moves it too; how it moves is the two lines below */
  animation: 'slide_from_bottom',
  cardStyleInterpolator: forModalPresentationIOS,
  transitionSpec: { open: SHEET_UP, close: SHEET_DOWN },
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
    <View style={{ flex: 1 }}>
      <Stack
        /* a page slides in from the right; a page opened from a sheet comes up as a sheet over it */
        screenOptions={({ route, navigation }) => (isSheet(navigation.getState().routes, route.key) ? SHEET : PAGE)}
        /* a sheet with something under it stops under the status bar; one the stack starts with (the lab opens a page so) is the whole screen */
        screenLayout={({ children, options, route, navigation }) => (
          <SheetScope on={options.cardStyleInterpolator === forModalPresentationIOS && navigation.getState().routes.findIndex(r => r.key === route.key) > 0}>
            <FootScope navigation={navigation}>{children}</FootScope>
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
      {/* the foot, over every page, changing shape from one page's foot to the next */}
      <FootHost />
      {/* home's tour for a new account, over the page and the foot alike (Round 28) */}
      <TourHost />
    </View>
  );
}
