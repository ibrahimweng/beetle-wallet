/* The root: the providers, the toast host, the tab back to the lab where
   there is one, and the stack the way in and the app live in (the camera is
   one of the app's pages, so what it opens stays in the app's one stack).
   It moves the way the phone does, as the app's own stack does (see
   app/(app)/_layout.tsx): a screen slides in from the right and back out.
   Each page of the app carries its own foot.

   It also keeps what went wrong (services/problems.ts): an error that would
   stop the app is written down before it does, and a build with the lab says
   what it was the next time it opens. An error inside the screens stops
   nothing: the screen says something went wrong, with Try again. */
import React, { useEffect } from 'react';
import { Alert, Platform, View } from 'react-native';
import { Stack, TransitionPresets } from 'expo-router/js-stack';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/features/onboarding/store';
import { Body, Button, Title, ToastHost, colour, frame } from '../src/design';
import { LabTab } from '../src/lab/LabTab';
import { AppLock } from '../src/features/lock/AppLock';
import { LAB } from '../src/lab/enabled';
import { copyText } from '../src/features/receive/clipboard';
import { keepProblem, problemOf, takeLastProblem, watchProblems } from '../src/services/problems';

watchProblems();

/* the web build is a picture of the phone: no browser focus ring on a field, which the phone never draws */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'input:focus, textarea:focus { outline: none; }';
  document.head.appendChild(style);
}

export default function Root() {
  /* what stopped the app last time, said once in a build with the lab, to be copied and sent on */
  useEffect(() => {
    if (!LAB) return;
    const last = takeLastProblem();
    if (!last) return;
    const words = `${last.message}\n\n${last.at}${last.stack ? `\n\n${last.stack}` : ''}`;
    Alert.alert(last.fatal ? 'Beetle closed last time' : 'Something went wrong last time', last.message, [
      { text: 'Copy the details', onPress: () => void copyText(words) },
      { text: 'OK', style: 'cancel' },
    ]);
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', ...TransitionPresets.SlideFromRightIOS, cardStyle: { backgroundColor: colour.surface } }}>
            {/* signed in, there is no swiping back into the way in */}
            <Stack.Screen name="(app)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          </Stack>
          <LabTab />
          {/* over everything but the toasts: the app locked, on opening and after the wait */}
          <AppLock />
          <ToastHost />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/* An error inside the screens: kept, said plainly, and Try again draws them
   afresh instead of the app stopping. A build with the lab shows the error's
   own words under it. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    keepProblem(problemOf(error, false));
  }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface, justifyContent: 'center', paddingHorizontal: frame.sidePad, gap: 12 }}>
      <Title>Something went wrong</Title>
      <Body tone="secondary">Try again, and if it happens again, tell us what you tapped.</Body>
      {LAB ? (
        <Body tone="tertiary" selectable>
          {problemOf(error, false).message}
        </Body>
      ) : null}
      <View style={{ height: 12 }} />
      <Button label="Try again" onPress={() => void retry()} />
    </View>
  );
}
