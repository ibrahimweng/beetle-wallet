/* See src/features/transfers. */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AlreadyGone } from '../../../src/features/transfers/AlreadyGone';

export default function AlreadyGoneRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AlreadyGone id={id ?? ''} />;
}
