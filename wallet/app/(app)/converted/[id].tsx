import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Converted } from '../../../src/features/dollars';

export default function ConvertedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Converted id={id ?? ''} />;
}
