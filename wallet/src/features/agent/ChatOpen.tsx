/* A receipt in the chat, opened where it is (Round 20, the owner's word: the
   dark card that expands, every detail in it, as a line opens on
   Activities but in the chat's dark; never a sheet from the bottom).

   The card stays in the chat as it is, loses its outline and reaches out to
   the chat's right edge, and what it does not say grows in under what it
   does: the same rows a line on Activities grows (activities/InPlace's
   Details), in the dark's inks. Who and where, the bank and the account
   always said; the money; anything written with it; the session id kept
   back until it is asked for; then Share receipt and See in Activities side
   by side. What is under the card in the chat goes down to make room, and
   the chat scrolls up in step if the card would run under the chips and the
   ask bar. Everything else, the header and the ask bar too, goes soft under
   a frost of the chat's own dark, above the card and below it, so the card
   is the only sharp thing on the screen.

   A tap on the frost or on the card again, or the phone's back, and it
   goes back as a line on Activities does: the rows leave first while the
   frost stays whole, then they fold away as the frost clears. */
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { LOOSE, Veil, measure } from '../../design';
import { Details, TAP_SLOP } from '../activities/InPlace';
import type { OpenCtl } from '../activities/OpenLine';
import { ReceiptShare, useReceipt } from '../receipts/use';
import { useLine } from '../transfers/use';
import type { ReceiptCard as Card } from './conversation';

/** Should the measuring never come (no receipt for the line), it opens anyway. */
const LATE = 260;

/** What grows in under the open card. `row` is the card's own box in the chat, measured once, so the frost can be laid
    round it; `onReady` once both are measured. */
export function ChatDetails({
  card,
  ctl,
  row,
  slip,
  session,
  onSession,
  onShare,
  onRecord,
  onReady,
}: {
  card: Card;
  ctl: OpenCtl;
  row: React.RefObject<View | null>;
  slip: React.RefObject<View | null>;
  session: boolean;
  onSession: () => void;
  onShare: () => void;
  onRecord: () => void;
  onReady: () => void;
}) {
  const { receipt } = useReceipt(card.rowId);
  const { row: ledger } = useLine(card.rowId);
  const known = useRef({ row: false, rows: false, begun: false });
  const ready = () => {
    const k = known.current;
    if (k.begun || !k.row || !k.rows) return;
    k.begun = true;
    onReady();
  };
  useEffect(() => {
    /* where the card is on the screen, and how tall, before anything grows */
    void measure(row).then(at => {
      ctl.top.value = at.y;
      ctl.rowH.value = at.h;
      known.current.row = true;
      ready();
    });
    const late = setTimeout(() => {
      known.current.rows = true;
      ready();
    }, LATE);
    return () => clearTimeout(late);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* it grows to what it holds as the card opens, what holds it loose in it (see LOOSE) */
  const grow = useAnimatedStyle(() => ({ height: ctl.grown.value * ctl.p.value }));
  return (
    <Animated.View style={[s.grow, grow]} testID="chat-receipt-rows">
      <View
        style={[LOOSE, s.inner]}
        onLayout={e => {
          ctl.grown.value = e.nativeEvent.layout.height;
          if (receipt) {
            known.current.rows = true;
            ready();
          }
        }}
      >
        {receipt ? (
          <Details
            t={ctl.p}
            shown={ctl.shown}
            receipt={receipt}
            name={ledger?.name ?? receipt.line}
            slip={slip}
            session={session}
            onSession={onSession}
            onShare={onShare}
            onRepeat={onRecord}
            state={null}
            dark
            dated
            indent={0}
            second={{ label: 'See in Activities', glyph: 'clock', onPress: onRecord }}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

/** The frost round the open card: over the whole screen above the card and below what grew in under it, the header
    and the ask bar too, following the card as the chat scrolls for it (`shift`) and as it grows. A tap on it puts the
    card back. */
export function ChatFrost({ ctl, shift, onClose }: { ctl: OpenCtl; shift: SharedValue<number>; onClose: () => void }) {
  const above = useAnimatedStyle(() => ({ height: Math.max(0, ctl.top.value - shift.value * ctl.p.value) }));
  const below = useAnimatedStyle(() => ({ top: ctl.top.value - shift.value * ctl.p.value + ctl.rowH.value + ctl.grown.value * ctl.p.value }));
  /* a tap puts it back; a drag across the frost is not a tap */
  const down = useRef<{ x: number; y: number } | null>(null);
  const pressIn = (e: GestureResponderEvent) => (down.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
  const press = (e: GestureResponderEvent) => {
    const d = down.current;
    if (d && Math.hypot(e.nativeEvent.pageX - d.x, e.nativeEvent.pageY - d.y) > TAP_SLOP) return;
    onClose();
  };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="chat-receipt">
      <Animated.View style={[s.band, s.above, above]}>
        <Veil tone="dark" t={ctl.p} testID="chat-receipt-veil" />
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Back to the chat" onPressIn={pressIn} onPress={press} testID="chat-receipt-away" />
      </Animated.View>
      <Animated.View style={[s.band, s.below, below]}>
        <Veil tone="dark" t={ctl.p} testID="chat-receipt-veil-below" />
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Back to the chat" onPressIn={pressIn} onPress={press} testID="chat-receipt-away-below" />
      </Animated.View>
    </View>
  );
}

/** The share sheet for the open card, the picture taken of its rows as they are drawn. */
export function ChatShare({ card, slip, onDismiss }: { card: Card; slip: React.RefObject<View | null>; onDismiss: () => void }) {
  const { receipt } = useReceipt(card.rowId);
  return receipt ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={onDismiss} /> : null;
}

const s = StyleSheet.create({
  grow: { overflow: 'hidden' },
  /* the first row 16 under what the card says */
  inner: { paddingTop: 16 },
  band: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  above: { top: 0 },
  below: { bottom: 0 },
});
