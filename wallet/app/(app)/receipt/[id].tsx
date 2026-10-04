/* A receipt, opened in place over the page it came from. See src/features/receipts/Over.tsx. */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ReceiptOver } from '../../../src/features/receipts/Over';

export default function ReceiptRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReceiptOver id={id ?? ''} />;
}
