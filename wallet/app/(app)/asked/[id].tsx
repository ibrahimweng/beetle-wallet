import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Asked } from '../../../src/features/request';

export default function AskedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Asked id={id ?? ''} />;
}
