/* The root: the providers, the toast host, and one stack every screen lives
   in. Screens fade between each other; each one animates its own column in. */
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/features/onboarding/store';
import { ToastHost, colour } from '../src/design';

export default function Root() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colour.surface } }} />
        <ToastHost />
      </AppProvider>
    </SafeAreaProvider>
  );
}
