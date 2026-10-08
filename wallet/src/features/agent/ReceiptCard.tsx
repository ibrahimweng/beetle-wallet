/* The receipt in the chat, on the dark card, in a few words: the amount,
   who it went to, when, and that it went through. A tap opens it where it
   is, the way a line opens on Activities, in the chat's dark (Round 20,
   the owner's word; agent/ChatOpen.tsx): the card loses its outline and
   grows its rows under what it says, every detail of the transaction, so
   there is no line here leading off to a full receipt. Where there is
   nothing to open it in, the receipt by its address. A request's card
   still leads to the request. */
import React, { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Caption, Coin, Head, Icon, Label, Meta, Tap, colour, dark, measure, useDeparture, type Rect } from '../../design';
import type { ReceiptCard as Card } from './conversation';

export function ReceiptCard({
  card,
  to,
  onOpen,
  p,
  children,
}: {
  card: Card;
  to: string;
  onOpen?: (at: Rect) => void;
  /** opening, 0 to 1, while it is the one open: its outline goes as it opens */
  p?: SharedValue<number>;
  /** what grows in under what it says, while it is open */
  children?: ReactNode;
}) {
  const amount = useRef<View>(null);
  const j = useDeparture({ id: `chat-receipt:${card.rowId}`, to, words: card.amount, anchor: amount });
  const press = () => (onOpen ? void measure(j.ref).then(onOpen) : void j.onPress());
  /* the outline, a layer of its own so it can go: an open receipt has none (the owner's word) */
  const outline = useAnimatedStyle(() => ({ opacity: p ? 1 - Math.max(0, Math.min(1, p.value)) : 1 }));
  return (
    <Tap
      ref={j.ref}
      accessibilityRole="button"
      accessibilityLabel={card.kind === 'request' ? 'Request' : 'Receipt'}
      /* what VoiceOver says after it: how much, to or from whom, how it went and when */
      accessibilityValue={{ text: `${card.amount}, ${card.line}, ${card.status}, ${card.time}` }}
      onPress={press}
      style={s.card}
      testID="receipt-card"
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.outline, outline]} testID="receipt-card-outline" />
      <View style={s.head}>
        {card.kind === 'request' ? (
          <View style={s.disc}>
            <Icon name="request" size={16} colour={dark.paper} />
          </View>
        ) : (
          /* money that went: the brand's coin in the disc's place, turning once as the card lands (Round 26) */
          <Coin size={32} reach={46} delay={160} />
        )}
        <Label style={{ color: dark.paper, flex: 1 }}>{card.kind === 'request' ? 'Request' : 'Receipt'}</Label>
        <View style={s.pill}>
          <View style={s.dot} />
          <Caption style={{ color: colour.good }}>{card.status}</Caption>
        </View>
      </View>
      <View style={s.body}>
        <View ref={amount} style={{ flex: 1, gap: 2 }}>
          <Head style={{ color: dark.paper }}>{card.amount}</Head>
          <Meta style={{ color: dark.text }}>{card.line}</Meta>
        </View>
        <Meta style={{ color: dark.label }}>{card.time}</Meta>
      </View>
      {/* the rows, straight under what it says: the card's gap is theirs to keep while they have no height */}
      {children ? <View style={s.grown}>{children}</View> : null}
      {card.kind === 'request' ? (
        <View style={s.foot}>
          <Caption style={{ color: dark.textSoft }}>The request</Caption>
          <Icon name="chevron" size={12} colour={dark.textSoft} />
        </View>
      ) : null}
    </Tap>
  );
}

const s = StyleSheet.create({
  /* 17 in: the 16 the frame sets inside the outline, and the outline's own 1, which is a layer over it now */
  card: { backgroundColor: dark.panel, borderRadius: 24, padding: 17, gap: 12 },
  outline: { borderRadius: 24, borderWidth: 1, borderColor: dark.edge },
  grown: { marginTop: -12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disc: { width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(52,199,89,0.16)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.good },
  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
