/* A receipt, by the id of the line it belongs to. See src/features/receipts. */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ReceiptScreen } from '../../../src/features/receipts/ReceiptScreen';

export default function ReceiptRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReceiptScreen id={id ?? ''} />;
}
