/* A line of Activities, opened where it is: the line itself (Round 17, the
   owner's word). Nothing is drawn over it. The line stays in the list as it
   is, and what it does not say grows in under it, in the list too: the
   lines below slide down to make room, and come back up when it closes. If
   what grows in would run off the screen, the page scrolls up in step with
   it. The rest of the page goes soft where it is, under a frost of white
   above the line and below what grew in under it, so the line and its
   rows are the only sharp things on the page; the page's title stays sharp
   at the top, the ··· beside it (the owner's choices: frosted where it is,
   the lines below pushed down).

   What grows in is the receipt's own rows (InPlace's Details): who and
   where, the money, anything written with it and the session id, kept back
   until it is asked for, then Share receipt and Set it up side by side. A
   line still on its way, that did not go or came back says what it is
   instead, with its next steps.

   A tap on the frost, on the line again, or the phone's back, and it goes
   back: what grew in leaves first while the frost stays whole, then it
   folds away as the frost clears and the lines below come back up. */
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { scrollTo, useAnimatedReaction, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Veil, frame, measure } from '../../design';
import { useHeadScroll, usePageScroll } from '../../design/collapse';
import { ReceiptShare, useReceipt } from '../receipts/use';
import { useLine } from '../transfers/use';
import { Details, Menu, TAP_SLOP, stateOf, type Opened } from './InPlace';

/** Room kept clear under what grows in: the bar goes down while a line is open, so only the phone's own foot. */
const FOOT_ROOM = 28;
/** The line never goes up under the page's head: the shrunk title and the room under it. */
const HEAD_CLEAR = 112;
/** Should the measuring never come (no receipt for the line), it opens anyway. */
const LATE = 260;

/** The open line's numbers, shared by the line in the list, the frost around it and the ··· at the top. */
export type OpenCtl = {
  /** 0 to 1 as it opens: what grows in under the line, the frost, the ··· */
  p: SharedValue<number>;
  /** 1 while it is open: what grew in goes first on the way out */
  shown: SharedValue<number>;
  /** where the line's top is in the column, and how tall the line is */
  top: SharedValue<number>;
  rowH: SharedValue<number>;
  /** how tall what grows in under it is, once measured */
  grown: SharedValue<number>;
};

export function useOpenCtl(): OpenCtl {
  const p = useSharedValue(0);
  const shown = useSharedValue(1);
  const top = useSharedValue(0);
  const rowH = useSharedValue(0);
  const grown = useSharedValue(0);
  return { p, shown, top, rowH, grown };
}

/** What grows in under the open line, in the list. `row` is the line's own place in the list, measured once, so the
    frost can be laid round it; `onReady` once both are measured. */
export function LineDetails({
  line,
  ctl,
  row,
  slip,
  session,
  onSession,
  onShare,
  onLeave,
  onReady,
}: {
  line: Opened;
  ctl: OpenCtl;
  row: React.RefObject<View | null>;
  slip: React.RefObject<View | null>;
  session: boolean;
  onSession: () => void;
  onShare: () => void;
  onLeave: (go: () => void) => void;
  onReady: () => void;
}) {
  const router = useRouter();
  const y = useHeadScroll();
  const { receipt } = useReceipt(line.id);
  const { row: ledger } = useLine(line.id);
  const known = useRef({ row: false, rows: false, begun: false });
  const ready = () => {
    const k = known.current;
    if (k.begun || !k.row || !k.rows) return;
    k.begun = true;
    onReady();
  };
  useEffect(() => {
    void measure(row).then(at => {
      ctl.top.value = at.y + (y ? y.value : 0);
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
  /* it grows to what it holds, as the line opens; the lines below go down with it */
  const grow = useAnimatedStyle(() => ({ height: ctl.grown.value * ctl.p.value }));
  return (
    <Animated.View style={[s.grow, grow]}>
      <View
        style={s.inner}
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
            name={line.name}
            slip={slip}
            session={session}
            onSession={onSession}
            onShare={onShare}
            state={line.state && ledger ? stateOf(line.state, ledger, router, line.id, onLeave) : null}
            onRepeat={() => {
              const to =
                receipt.kind === 'transfer'
                  ? `/rule?offer=again&row=${line.id}`
                  : `/rule?offer=${receipt.kind === 'in' ? 'salary' : receipt.kind === 'convert' ? 'dollars' : receipt.kind === 'saving' ? 'salary' : 'ikeja'}`;
              onLeave(() => router.push(to as never));
            }}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

/** The frost round the open line: over the column above the line, and below what grew in under it, following it down
    as it grows. In the column, so it moves with it; a tap on it puts the line away. */
export function PageFrost({ ctl, onClose }: { ctl: OpenCtl; onClose: () => void }) {
  const y = useHeadScroll();
  const column = usePageScroll();
  const { height: H } = useWindowDimensions();
  /* where the column stood when the line opened, and how far it has to move for the line and its rows to show */
  const from = useSharedValue(y ? y.value : 0);
  const shift = useSharedValue(0);
  useAnimatedReaction(
    () => (ctl.rowH.value > 0 ? ctl.grown.value : 0),
    grown => {
      if (!grown) return;
      const top = ctl.top.value - from.value;
      const over = top + ctl.rowH.value + grown - (H - FOOT_ROOM);
      shift.value = top < HEAD_CLEAR ? top - HEAD_CLEAR : over > 0 ? Math.min(over, top - HEAD_CLEAR) : 0;
    },
    [H],
  );
  useAnimatedReaction(
    () => ctl.p.value,
    p => {
      if (column && shift.value) scrollTo(column, 0, Math.max(0, from.value + shift.value * p), false);
    },
  );
  const above = useAnimatedStyle(() => ({ height: ctl.top.value }));
  const below = useAnimatedStyle(() => ({ top: ctl.top.value + ctl.rowH.value + ctl.grown.value * ctl.p.value }));
  /* a tap puts it away; a drag across the frost is not a tap */
  const down = useRef<{ x: number; y: number } | null>(null);
  const pressIn = (e: GestureResponderEvent) => (down.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
  const press = (e: GestureResponderEvent) => {
    const d = down.current;
    if (d && Math.hypot(e.nativeEvent.pageX - d.x, e.nativeEvent.pageY - d.y) > TAP_SLOP) return;
    onClose();
  };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="in-place">
      <Animated.View style={[s.band, s.above, above]}>
        <Veil tone="page" intensity={70} t={ctl.p} testID="in-place-veil" />
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Back to Activities" onPressIn={pressIn} onPress={press} testID="in-place-away" />
      </Animated.View>
      <Animated.View style={[s.band, s.below, below]}>
        <Veil tone="page" intensity={70} t={ctl.p} testID="in-place-veil-below" />
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Back to Activities" onPressIn={pressIn} onPress={press} testID="in-place-away-below" />
      </Animated.View>
    </View>
  );
}

/** The ··· for the rest of what can be done with the line — Ask Beetle about this, Report a problem — at the top
    right beside the page's title, which stays sharp. */
export function LineMenu({ line, ctl, onLeave }: { line: Opened; ctl: OpenCtl; onLeave: (go: () => void) => void }) {
  const { receipt } = useReceipt(line.id);
  const fade = useAnimatedStyle(() => ({ opacity: ctl.p.value * ctl.shown.value }));
  if (!receipt) return null;
  const head = line.head;
  return (
    <Animated.View style={[s.dots, head ? { top: head.y + (head.h - 36) / 2 } : null, fade]}>
      <Menu receipt={receipt} id={line.id} onLeave={onLeave} />
    </Animated.View>
  );
}

/** The share sheet for the open line, the picture taken of its rows as they are drawn. */
export function LineShare({ line, slip, onDismiss }: { line: Opened; slip: React.RefObject<View | null>; onDismiss: () => void }) {
  const { receipt } = useReceipt(line.id);
  return receipt ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={onDismiss} /> : null;
}

const s = StyleSheet.create({
  grow: { overflow: 'hidden' },
  /* what grows in sits 4 under the line, as it did */
  inner: { paddingTop: 4 },
  band: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  above: { top: 0 },
  below: { bottom: 0 },
  dots: { position: 'absolute', top: frame.topPad + 2, right: frame.sidePad },
});
