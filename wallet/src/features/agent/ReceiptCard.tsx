/* The receipt in the chat, on the dark card, in a few words: the amount,
   who it went to, when, and that it went through. A tap opens it where it
   is, a little larger with a few lines more (see ChatReceipt); where there
   is nothing to open it in, the full one. */
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption, Head, Icon, Label, Meta, Tap, colour, dark, measure, useDeparture, type Rect } from '../../design';
import type { ReceiptCard as Card } from './conversation';

export function ReceiptCard({ card, to, onOpen }: { card: Card; to: string; onOpen?: (at: Rect) => void }) {
  const amount = useRef<View>(null);
  const j = useDeparture({ id: `chat-receipt:${card.rowId}`, to, words: card.amount, anchor: amount });
  const press = () => (onOpen ? void measure(j.ref).then(onOpen) : void j.onPress());
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={card.kind === 'request' ? 'Request' : 'Receipt'} onPress={press} style={s.card} testID="receipt-card">
      <View style={s.head}>
        <View style={s.disc}>
          <Icon name={card.kind === 'request' ? 'request' : 'receipt'} size={16} colour="#ffffff" />
        </View>
        <Label style={{ color: '#ffffff', flex: 1 }}>{card.kind === 'request' ? 'Request' : 'Receipt'}</Label>
        <View style={s.pill}>
          <View style={s.dot} />
          <Caption style={{ color: colour.good }}>{card.status}</Caption>
        </View>
      </View>
      <View style={s.body}>
        <View ref={amount} style={{ flex: 1, gap: 2 }}>
          <Head style={{ color: '#ffffff' }}>{card.amount}</Head>
          <Meta style={{ color: dark.text }}>{card.line}</Meta>
        </View>
        <Meta style={{ color: dark.label }}>{card.time}</Meta>
      </View>
      <View style={s.foot}>
        <Caption style={{ color: dark.textSoft }}>{card.kind === 'request' ? 'The request' : 'The full receipt'}</Caption>
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
