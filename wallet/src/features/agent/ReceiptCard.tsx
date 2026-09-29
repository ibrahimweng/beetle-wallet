/* The receipt in the chat, on the dark card, in a few words: the amount,
   who it went to, when, and that it went through. A tap opens the full one. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption, Head, Icon, Label, Meta, Tap, colour, dark } from '../../design';
import type { ReceiptCard as Card } from './conversation';

export function ReceiptCard({ card, onPress }: { card: Card; onPress?: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel="Receipt" onPress={onPress} style={s.card} testID="receipt-card">
      <View style={s.head}>
        <View style={s.disc}>
          <Icon name="receipt" size={16} colour="#ffffff" />
        </View>
        <Label style={{ color: '#ffffff', flex: 1 }}>Receipt</Label>
        <View style={s.pill}>
          <View style={s.dot} />
          <Caption style={{ color: colour.good }}>{card.status}</Caption>
        </View>
      </View>
      <View style={s.body}>
        <View style={{ flex: 1, gap: 2 }}>
          <Head style={{ color: '#ffffff' }}>{card.amount}</Head>
          <Meta style={{ color: dark.text }}>{card.line}</Meta>
        </View>
        <Meta style={{ color: dark.label }}>{card.time}</Meta>
      </View>
      <View style={s.foot}>
        <Caption style={{ color: dark.textSoft }}>The full receipt</Caption>
        <Icon name="chevron" size={12} colour={dark.textSoft} />
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disc: { width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(52,199,89,0.16)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.good },
  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
