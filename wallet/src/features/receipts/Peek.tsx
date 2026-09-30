/* A line's receipt in a few words, grown out of the line itself. The day
   recedes under a blur; the line stays where it is and opens into the same
   card the chat shows — the amount, who and what, when, that it went
   through — with the full receipt one tap further, arriving from the
   amount. A tap anywhere else closes it, running the whole thing backwards. */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Caption, Head, Icon, Label, Meta, Tap, colour, lift, motion, settle, useDeparture, useStill, type Rect } from '../../design';
import type { ReceiptCard as Card } from '../agent/conversation';

type BlurModule = typeof import('expo-blur');
const blur: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();

/** The card's height once it has grown: 16, a 32 head, 12, the amount and its line, 12, the foot, 16. */
export const PEEK_H = 148;
/** How long it takes to fold back into the line. */
const AWAY = 190;

export function ReceiptPeek({ card, at, onClose }: { card: Card; at: Rect; onClose: () => void }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  const [leaving, setLeaving] = useState(false);
  const going = useRef<ReturnType<typeof setTimeout> | null>(null);
  const amount = useRef<View>(null);
  useEffect(() => {
    if (!still) t.value = withSpring(1, lift);
    return () => {
      if (going.current) clearTimeout(going.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const leave = (then: () => void) => {
    if (still) return then();
    if (leaving) return;
    setLeaving(true);
    t.value = withTiming(0, { duration: AWAY, easing: settle });
    going.current = setTimeout(then, AWAY);
  };
  /* the full receipt: its amount travels from this one */
  const full = useDeparture({ id: `row:${card.rowId}`, to: card.to ?? `/receipt/${card.rowId}`, words: card.amount, anchor: amount });
  const veil = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 1.9) }));
  const box = useAnimatedStyle(() => ({
    height: at.h + (PEEK_H - at.h) * t.value,
    backgroundColor: `rgba(255, 255, 255, ${Math.min(1, t.value * 2)})`,
    borderColor: `rgba(222, 222, 227, ${Math.min(1, t.value * 2)})`,
    shadowOpacity: 0.12 * t.value,
  }));
  const inner = useAnimatedStyle(() => ({ opacity: Math.max(0, (t.value - 0.35) / 0.65) }));
  const Blur = blur?.BlurView;
  return (
    <View style={StyleSheet.absoluteFill} testID="peek">
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={() => leave(onClose)}>
        <Animated.View style={[StyleSheet.absoluteFill, veil]} pointerEvents="none">
          {Blur ? <Blur intensity={36} tint="light" experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} /> : null}
          <View style={s.wash} />
        </Animated.View>
      </Pressable>
      <Animated.View style={[s.card, { top: at.y, left: at.x, width: at.w }, box]} testID="peek-card">
        <Animated.View style={[{ gap: 12 }, inner]}>
          <View style={s.head}>
            <View style={s.disc}>
              <Icon name="receipt" size={16} colour={colour.ink} />
            </View>
            <Label style={{ flex: 1 }}>Receipt</Label>
            <View style={s.pill}>
              <View style={s.dot} />
              <Caption tone="good">{card.status}</Caption>
            </View>
          </View>
          <View style={s.body}>
            <View ref={amount} style={{ flex: 1, gap: 2 }}>
              <Head>{card.amount}</Head>
              <Meta tone="secondary">{card.line}</Meta>
            </View>
            <Meta tone="tertiary">{card.time}</Meta>
          </View>
          <Tap
            ref={full.ref}
            accessibilityRole="button"
            accessibilityLabel="The full receipt"
            onPress={() => {
              void full.onPress();
              /* once the page has come over it, this can go */
              going.current = setTimeout(onClose, motion.leave + motion.screen + 200);
            }}
            style={s.foot}
          >
            <Caption tone="secondary">The full receipt</Caption>
            <Icon name="chevron" size={12} colour={colour.textSecondary} />
          </Tap>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  wash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.28)' },
  card: { position: 'absolute', borderRadius: 24, borderWidth: 1, padding: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowRadius: 24 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 32 },
  disc: { width: 32, height: 32, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colour.goodTint },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.good },
  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 16 },
});
