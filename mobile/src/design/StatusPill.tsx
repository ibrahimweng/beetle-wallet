/* Status pill — 24 tall, 12 radius, white, 12 semibold secondary, with the
   dot 8 from the word. */
import React from 'react';
import { View } from 'react-native';
import { Caption } from './text';
import { colour, radius } from './tokens';

export function StatusPill({ label, tone = colour.accent }: { label: string; tone?: string }) {
  return (
    <View
      style={{
        height: 24,
        borderRadius: radius.sm,
        backgroundColor: colour.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 8,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone }} />
      <Caption tone="secondary" style={{ fontWeight: '600' }}>
        {label}
      </Caption>
    </View>
  );
}
