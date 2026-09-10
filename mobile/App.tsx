/* The account is read back from the device before the first screen draws, so
   no screen ever renders against an empty balance and then jump. */
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { hydrate } from './src/state/storage';
import { App as Routes } from './src/navigation';
import { colour } from './src/design';

export default function Root() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrate().finally(() => setReady(true));
  }, []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colour.surface }} />;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Routes />
    </SafeAreaProvider>
  );
}
