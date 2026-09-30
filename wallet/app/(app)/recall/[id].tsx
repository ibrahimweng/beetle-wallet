/* See src/features/transfers. */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Recall } from '../../../src/features/transfers/Recall';

export default function RecallRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Recall id={id ?? ''} />;
}
