/* The root: the providers, the toast host, the tab back to the lab where
   there is one, one stack every screen lives in, and over it the one foot
   they share. Screens fade between each other; each one animates its own
   column in; the foot morphs from the one screen's to the next's. */
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/features/onboarding/store';
import { ToastHost, colour } from '../src/design';
import { LabTab } from '../src/lab/LabTab';
import { Foot } from '../src/features/more/Foot';

/* the web build is a picture of the phone: no browser focus ring on a field, which the phone never draws */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'input:focus, textarea:focus { outline: none; }';
  document.head.appendChild(style);
}

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          {/* a short cross-fade: the page's own column arriving out of its blur is the movement */}
          <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 240, contentStyle: { backgroundColor: colour.surface } }} />
          {/* the foot every screen shares: the bar on home, Back and the ask bar on a page */}
          <Foot />
          <LabTab />
          <ToastHost />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
