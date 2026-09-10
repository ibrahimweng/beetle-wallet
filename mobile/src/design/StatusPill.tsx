/* Status pill — 24 tall, 12 radius, the pale grey, 12 semibold, with the dot 8
   from the word. On a receipt the word takes the dot's colour; in a tool panel
   it stays grey and only the dot carries the state. */
import React from 'react';
import { View } from 'react-native';
import { Caption } from './text';
import { colour, radius } from './tokens';

export function StatusPill({
  label,
  tone = colour.accent,
  ink,
}: {
  label: string;
  tone?: string;
  ink?: string;
}) {
  return (
    <View
      style={{
        height: 24,
        borderRadius: radius.sm,
        backgroundColor: colour.surface2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 8,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone }} />
      <Caption tone="secondary" style={[{ fontWeight: '600' }, ink ? { color: ink } : null]}>
        {label}
      </Caption>
    </View>
  );
}
