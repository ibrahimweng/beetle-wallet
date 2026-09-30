/* See src/features/transfers. */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Wrong } from '../../../src/features/transfers/Wrong';

export default function WrongRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Wrong id={id ?? ''} />;
}
