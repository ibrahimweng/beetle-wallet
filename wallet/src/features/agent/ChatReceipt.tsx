/* The receipt in the chat, opened where it is, the way Fuse opens a
   transaction: the card grows a little — out to the chat's edges and down
   by a few lines — and says a bit more than it did: who it went to and
   where, the fee, the balance after. Share sends it on; the full receipt is
   one tap further. The chat goes soft under the dark veil around it. A tap
   anywhere else, or the phone's back, folds it back into its place. Never
   a full or a half screen: the card, a little larger. */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, useDerivedValue } from 'react-native-reanimated';
import { Caption, Head, Icon, Label, Meta, Tap, Veil, colour, dark, lift, motion, settle, useStill, type Rect } from '../../design';
import { ReceiptShare, useReceipt } from '../receipts/use';
import type { Receipt } from '../receipts/receipts';
import type { ReceiptCard as Card } from './conversation';

/** The card, grown: out to 16 from either edge, and taller by the rule, the three lines and the buttons, less the foot it had. */
const SIDE = 16;
const MORE_H = 1 + 12 + (3 * 24 + 2 * 4) + 12 + (4 + 40) - 16;
const AWAY = 190;

/** The few lines more: who and where (who it came from, for money in), the fee, the balance after. */
export function detailsOf(r: Receipt): [string, string][] {
  const find = (label: string) => r.fields.find(f => f[0] === label);
  const who = r.kind === 'in' ? (find('From') ?? find('To')) : (find('To') ?? find('From'));
  const lines: [string, string][] = [];
  if (who) lines.push([who[0], who[2] ? `${who[1]} · ${who[2]}` : who[1]]);
  const fee = find('Fee');
  if (fee) lines.push(['Fee', fee[1]]);
  const after = find('Balance after');
  if (after) lines.push(['Balance after', after[1]]);
  return lines.slice(0, 3);
}

export function ChatReceipt({ card, at, onClose }: { card: Card; at: Rect; onClose: () => void }) {
  const router = useRouter();
  const still = useStill();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { receipt } = useReceipt(card.rowId);
  const [sharing, setSharing] = useState(false);
  const box = useRef<View>(null);
  const t = useSharedValue(still ? 1 : 0);
  const leaving = useRef(false);
  useEffect(() => {
    if (!still) t.value = withSpring(1, lift);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const leave = (then: () => void = onClose) => {
    if (leaving.current) return;
    leaving.current = true;
    if (still) return then();
    t.value = withTiming(0, { duration: AWAY, easing: settle }, done => {
      if (done) runOnJS(then)();
    });
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sharing) setSharing(false);
      else leave();
      return true;
    });
    return () => sub.remove();
  });

  /* where it grows to: the same top, unless that would run it past the foot of the screen */
  const w1 = W - 2 * SIDE;
  const h1 = at.h + MORE_H;
  const y1 = Math.max(insets.top + 8, Math.min(at.y, H - insets.bottom - 16 - h1));
  const grown = useAnimatedStyle(() => ({
    left: at.x + (SIDE - at.x) * t.value,
    top: at.y + (y1 - at.y) * t.value,
    width: at.w + (w1 - at.w) * t.value,
    height: at.h + (h1 - at.h) * t.value,
  }));
  const veil = useDerivedValue(() => Math.min(1, t.value * 1.6));
  const more = useAnimatedStyle(() => ({ opacity: Math.max(0, (t.value - 0.45) / 0.55), transform: [{ translateY: 8 * (1 - t.value) }] }));
  const full = () => {
    router.push((card.to ?? `/receipt/${card.rowId}`) as never);
    /* once the page has come over it, this can go */
    setTimeout(onClose, motion.screen + 200);
  };
  const lines = receipt ? detailsOf(receipt) : [];
  return (
    <View style={StyleSheet.absoluteFill} testID="chat-receipt">
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={() => leave()}>
        <Veil tone="dark" t={veil} testID="chat-receipt-veil" />
      </Pressable>
      <Animated.View ref={box} collapsable={false} style={[s.card, grown]} testID="chat-receipt-card">
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
          <View style={{ flex: 1, gap: 2 }}>
            <Head style={{ color: '#ffffff' }}>{card.amount}</Head>
            <Meta style={{ color: dark.text }}>{card.line}</Meta>
          </View>
          <Meta style={{ color: dark.label }}>{card.time}</Meta>
        </View>
        <Animated.View style={[{ gap: 12 }, more]}>
          <View style={s.rule} />
          <View style={{ gap: 4 }}>
            {lines.map(([label, value]) => (
              <View key={label} style={s.line}>
                <Meta style={{ color: dark.label }}>{label}</Meta>
                <Meta style={{ color: '#ffffff', flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>
                  {value}
                </Meta>
              </View>
            ))}
          </View>
          <View style={s.actions}>
            <Tap accessibilityRole="button" accessibilityLabel="Share" onPress={() => setSharing(true)} style={s.share} testID="chat-receipt-share">
              <Icon name="share" size={16} colour="#ffffff" />
              <Label style={{ color: '#ffffff' }}>Share</Label>
            </Tap>
            <Tap accessibilityRole="button" accessibilityLabel="The full receipt" onPress={full} style={s.full}>
              <Caption style={{ color: dark.textSoft }}>The full receipt</Caption>
              <Icon name="chevron" size={12} colour={dark.textSoft} />
            </Tap>
          </View>
        </Animated.View>
      </Animated.View>
      {sharing && receipt ? <ReceiptShare receipt={receipt} slip={box} onDismiss={() => setSharing(false)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { position: 'absolute', backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edgeStrong, borderRadius: 24, padding: 16, gap: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 32 },
  disc: { width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(52,199,89,0.16)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.good },
  body: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  rule: { height: 1, backgroundColor: dark.edge },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, height: 24 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, height: 40 },
  share: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: dark.edgeStrong },
  full: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 40 },
});
