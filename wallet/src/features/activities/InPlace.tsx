/* A settled line of Activities, opened where it is.

   Nothing new is pushed and nothing fills the screen. The line stays in its
   place, sharp, and the page under it goes soft behind a frost of white —
   still there, just out of focus — the way Fuse opens a coin in its list.
   Under the line the rest of it grows in: what the line does not already
   say. Not who (the line says that) and not the total (the amount and the
   fee say that): where it came from and the fee, the amount and the balance
   after, anything written with it, and the session id, kept back until it
   is asked for, since it only matters when the transaction is being
   queried. Then Share receipt and Set it up, side by side. The ··· for the
   rest — Ask Beetle about this, Report a problem — sits at the top right
   beside the page's title, which stays sharp over the frost while it is on
   the screen. A line low on the page lifts just enough for
   what grows under it to fit. A tap anywhere off it, or the phone's back,
   and it all goes back the way it came. */
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Caption, GlyphTitle, HistoryRow, Icon, Label, MoreButton, Tap, Veil, away, blurred, colour, frame, motion, settle, toast, useStill, type Rect } from '../../design';
import type { IconName } from '../../icons';
import { copyText } from '../receive/clipboard';
import { ReceiptShare, useReceipt, useReceiptMenu } from '../receipts/ReceiptScreen';
import type { Field, Receipt } from '../receipts/receipts';

/** Where a line sits when it was opened by a link rather than a tap: under the page's head. */
const LINKED_TOP = 180;
/** Room kept clear under what grows in: the bar goes down while a line is open, so only the phone's own foot. */
const FOOT_ROOM = 28;
/** How far a finger can move and still have tapped. */
const TAP_SLOP = 12;

/** `at` is where the line was, `head` where the page's title row was, each in the window, when it was opened. */
export type Opened = { id: string; glyph: IconName; name: string; detail: string; amount: string; at: Rect | null; head?: Rect | null };

export function InPlace({ line, onClose }: { line: Opened; onClose: () => void }) {
  const router = useRouter();
  const still = useStill();
  const { height: H } = useWindowDimensions();
  const { receipt } = useReceipt(line.id);
  const [sharing, setSharing] = useState(false);
  const [session, setSession] = useState(false);
  /* the card as drawn, for the picture the share sheet hands out */
  const slip = useRef<View>(null);
  const at = line.at ?? { x: frame.sidePad, y: LINKED_TOP, w: 393 - frame.sidePad * 2, h: 72 };
  /* the page's title, kept sharp over the frost while it is on the screen, with the ··· on its row */
  const head = line.head && line.head.y + line.head.h > 0 ? line.head : null;

  /* 0 to 1 as it opens; how far the line lifts to make room under it */
  const t = useSharedValue(still ? 1 : 0);
  const lift = useSharedValue(0);
  const going = useRef(false);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!still) t.value = withTiming(1, { duration: motion.enter - 80, easing: settle });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => {
    if (going.current) return;
    going.current = true;
    if (still) return onClose();
    lift.value = withTiming(0, { duration: motion.leave, easing: away });
    t.value = withTiming(0, { duration: motion.leave, easing: away }, done => {
      if (done) runOnJS(onClose)();
    });
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sharing) setSharing(false);
      else closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, [sharing]);

  /* once the card has its height: lift the line if the two would run past the foot */
  const measured = (cardH: number) => {
    const bottom = at.y + at.h + 8 + cardH;
    const over = Math.max(0, bottom - (H - FOOT_ROOM));
    const up = Math.min(over, Math.max(0, at.y - 120));
    lift.value = still ? -up : withTiming(-up, { duration: motion.enter - 80, easing: settle });
  };

  const veil = useAnimatedStyle(() => ({ opacity: t.value }));
  const held = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  /* the card grows in a beat after the page has gone soft: out of a blur, from just under the line */
  const card = useAnimatedStyle(() => {
    const k = Math.max(0, (t.value - 0.25) / 0.75);
    return { opacity: k, transform: [{ translateY: -10 * (1 - k) }, { scale: 0.98 + 0.02 * k }], ...blurred((1 - k) * motion.blur) };
  });
  const dots = useAnimatedStyle(() => ({ opacity: t.value }));

  return (
    <View style={StyleSheet.absoluteFill} testID="in-place">
      <Animated.View style={[StyleSheet.absoluteFill, veil]}>
        <Veil tone="frost" intensity={70} testID="in-place-veil" />
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Back to Activities"
          onPressIn={e => (downAt.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
          onPress={e => {
            /* a tap puts it away; a swipe across the frost is not a tap, and the pages hold still under it */
            const d = downAt.current;
            if (d && Math.hypot(e.nativeEvent.pageX - d.x, e.nativeEvent.pageY - d.y) > TAP_SLOP) return;
            close();
          }}
          testID="in-place-away"
        />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: at.x, width: at.w, top: at.y }, held]} pointerEvents="box-none">
        {/* the line itself, where it was, sharp over the frost */}
        <View pointerEvents="none" testID="in-place-line">
          <HistoryRow glyph={line.glyph} name={line.name} detail={line.detail} amount={line.amount} />
        </View>
        <Animated.View style={[{ marginTop: 8 }, card]} onLayout={e => measured(e.nativeEvent.layout.height)}>
          {receipt ? (
            <Details
              receipt={receipt}
              name={line.name}
              slip={slip}
              session={session}
              onSession={() => setSession(true)}
              onShare={() => setSharing(true)}
              onRepeat={() => {
                closeRef.current();
                const to =
                  receipt.kind === 'transfer'
                    ? `/rule?offer=again&row=${line.id}`
                    : `/rule?offer=${receipt.kind === 'in' ? 'salary' : receipt.kind === 'convert' ? 'dollars' : receipt.kind === 'saving' ? 'salary' : 'ikeja'}`;
                setTimeout(() => router.push(to as never), motion.leave);
              }}
            />
          ) : null}
        </Animated.View>
      </Animated.View>
      {head ? (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: head.x, top: head.y, width: head.w }, dots]} testID="in-place-head">
          <GlyphTitle glyph="clock" title="Activities" />
        </Animated.View>
      ) : null}
      {/* the ··· for the rest, at the top right beside the page's title */}
      {receipt ? (
        <Animated.View style={[s.dots, head ? { top: head.y + (head.h - 36) / 2 } : null, dots]}>
          <Menu receipt={receipt} id={line.id} onLeave={() => closeRef.current()} />
        </Animated.View>
      ) : null}
      {sharing && receipt ? <ReceiptShare receipt={receipt} slip={slip} onDismiss={() => setSharing(false)} /> : null}
    </View>
  );
}

function Menu({ receipt, id, onLeave }: { receipt: Receipt; id: string; onLeave: () => void }) {
  const items = useReceiptMenu(receipt, id).map(it => ({
    ...it,
    onPress: () => {
      onLeave();
      it.onPress();
    },
  }));
  return <MoreButton items={items} testID="in-place-more" />;
}

/* What grows in under the line: the facts two by two, the session id kept
   back, and the two things to do with it. */
function Details({
  receipt,
  name,
  slip,
  session,
  onSession,
  onShare,
  onRepeat,
}: {
  receipt: Receipt;
  name: string;
  slip: React.RefObject<View | null>;
  session: boolean;
  onSession: () => void;
  onShare: () => void;
  onRepeat: () => void;
}) {
  const facts = factsOf(receipt.fields, name);
  const pairs: Field[][] = [];
  for (let i = 0; i < facts.length; i += 2) pairs.push(facts.slice(i, i + 2));
  const copy = async () => {
    toast((await copyText(receipt.session)) ? 'The session id copied. Paste it anywhere.' : 'This build cannot reach the clipboard.');
  };
  return (
    <View ref={slip} collapsable={false} style={s.card} testID="in-place-card">
      <View style={{ gap: 16 }}>
        {pairs.map(pair => (
          <View key={pair.map(f => f[0]).join()} style={s.pair}>
            {pair.map(([label, value, note]) => (
              <View key={label} style={s.fact}>
                <Caption tone="secondary">{label}</Caption>
                <Label style={s.value}>{value}</Label>
                {note && label !== 'Fee' ? <Caption tone="tertiary">{note}</Caption> : null}
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={s.rule} />
      {/* the session id: only when it is asked for, since it matters only when the transaction is queried */}
      {session ? (
        <View style={s.session} testID="in-place-session">
          <View style={{ flex: 1, gap: 2 }}>
            <Caption tone="secondary">{receipt.sessionLabel}</Caption>
            <Label style={{ fontVariant: ['tabular-nums'] }}>{receipt.session}</Label>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Copy the session id" onPress={() => void copy()} scale={0.9} style={s.copy} hitSlop={6}>
            <Icon name="copy" size={16} colour={colour.textSecondary} />
          </Tap>
        </View>
      ) : (
        <Tap accessibilityRole="button" accessibilityLabel={`Show the ${receipt.sessionLabel.toLowerCase()}`} onPress={onSession} style={s.reveal} hitSlop={6}>
          <Caption tone="secondary">{receipt.sessionLabel}</Caption>
          <Label tone="accent">Show it</Label>
        </Tap>
      )}
      <View style={s.actions}>
        <Tap accessibilityRole="button" accessibilityLabel="Share receipt" onPress={onShare} scale={0.96} style={s.action} testID="in-place-share">
          <Icon name="share" size={16} colour={colour.ink} />
          <Label>Share receipt</Label>
        </Tap>
        <Tap accessibilityRole="button" accessibilityLabel={receipt.nudge.action} onPress={onRepeat} scale={0.96} style={s.action} testID="in-place-repeat">
          <Icon name="history-filled" size={16} colour={colour.ink} />
          <Label>{receipt.nudge.action}</Label>
        </Tap>
      </View>
    </View>
  );
}

/** The facts the line does not already say: not who (the line's own name), not the totals; where it came from and the fee first, then the amount and the balance after, then the rest. */
export function factsOf(fields: Field[], name: string): Field[] {
  const kept = fields.filter(([label, value]) => value !== name && !/^Total /.test(label) && !(label === 'To' && value === name));
  const rank = (label: string) => ['From', 'To', 'Fee', 'Amount', 'Balance after'].indexOf(label);
  return [...kept].sort((a, b) => {
    const ra = rank(a[0]);
    const rb = rank(b[0]);
    return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
  });
}

const s = StyleSheet.create({
  dots: { position: 'absolute', top: frame.topPad + 2, right: frame.sidePad },
  card: {
    backgroundColor: colour.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colour.rule,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  pair: { flexDirection: 'row', gap: 16 },
  fact: { flex: 1, gap: 4 },
  value: { fontSize: 16, lineHeight: 22 },
  rule: { height: 1, backgroundColor: colour.rule, marginVertical: 16 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reveal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 24 },
  copy: { width: 32, height: 32, borderRadius: 16, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  action: { flex: 1, height: 44, borderRadius: 22, backgroundColor: colour.surface2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
