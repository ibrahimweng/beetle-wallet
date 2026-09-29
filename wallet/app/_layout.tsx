/* The root: the providers, the toast host, the tab back to the lab where
   there is one, and one stack every screen lives in. Screens fade between
   each other; each one animates its own column in. */
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/features/onboarding/store';
import { ToastHost, colour } from '../src/design';
import { LabTab } from '../src/lab/LabTab';

export default function Root() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colour.surface } }} />
        <LabTab />
        <ToastHost />
      </AppProvider>
    </SafeAreaProvider>
  );
}
