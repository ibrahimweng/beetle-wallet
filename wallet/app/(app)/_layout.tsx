import React from 'react';
import { Stack } from 'expo-router';
import { colour } from '../../src/design';

export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colour.surface } }} />;
}
