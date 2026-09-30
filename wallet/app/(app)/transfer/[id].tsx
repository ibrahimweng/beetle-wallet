/* See src/features/transfers. */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Transfer } from '../../../src/features/transfers/Transfer';

export default function TransferRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Transfer id={id ?? ''} />;
}
