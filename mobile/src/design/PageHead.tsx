/* Page head — the set's two variants. lead=no is a 20 point title, lead=yes is
   a 32 point one. Both leave 8 under the title, and the line below is 16
   regular in the tertiary grey, not 14. */
import React from 'react';
import { View } from 'react-native';
import { Body, Head, Title } from './text';

export function PageHead({ title, sub, lead = false }: { title: string; sub?: string; lead?: boolean }) {
  const T = lead ? Title : Head;
  return (
    <View style={{ gap: 8 }}>
      <T>{title}</T>
      {sub ? <Body tone="tertiary">{sub}</Body> : null}
    </View>
  );
}
