import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Dispute } from '../../../src/features/dispute';

export default function DisputeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Dispute id={String(id ?? '')} />;
}
