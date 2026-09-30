/* The chats, in a drawer at the chat's left, and nowhere else.

   While the chat is open a soft light runs down the screen's left edge. A
   swipe from there to the right brings the drawer in from the left,
   following the finger — or a tap on the edge does. New chat is at its
   top; under it the chats, today's and yesterday's, the ones you started
   and the ones Beetle did, with a dot on one not yet opened and the one
   open now marked. A chat picked there picks up where it was left; New
   chat files this one and starts afresh. A swipe back to the left, a tap
   on the chat beside it, or the phone's back puts it away. With the chat
   closed there is no edge and no drawer. */
import React, { useId, useMemo } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, withSpring, type AnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { Caption, Head, Icon, Label, Meta, Row, Tap, colour, dark, swipes } from '../../design';
import type { Chat } from './chats';

/** How the drawer settles, in or out. */
const SPRING = { damping: 28, stiffness: 280, mass: 0.9, overshootClamping: true } as const;
/** The edge a swipe starts from: the card's own margin, clear of everything in the chat. */
export const EDGE = 16;
/** Where a screen's head starts, clear of the phone's clock, as the black card has it. */
const TOP = 52;

const clamp = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

/* The left edge while the chat is open: the soft light, and the swipe (or
   the tap) that brings the drawer in. */
export function ChatsEdge({
  d,
  width,
  style,
  onOpen,
}: {
  d: SharedValue<number>;
  width: number;
  /** where it runs: down the chat, between its header and its ask bar */ style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  onOpen: () => void;
}) {
  const gesture = useMemo(() => {
    const opened = (open: boolean) => {
      if (open) onOpen();
    };
    const pan = Gesture.Pan()
      .activeOffsetX(8)
      .failOffsetY([-14, 14])
      .onStart(() => {
        runOnJS(Keyboard.dismiss)();
        runOnJS(swipes.start)();
      })
      .onUpdate(e => {
        d.value = clamp(e.translationX / width);
      })
      .onEnd(e => {
        runOnJS(swipes.end)();
        const open = d.value > 0.4 || e.velocityX > 500;
        d.value = withSpring(open ? 1 : 0, { ...SPRING, velocity: e.velocityX / width });
        runOnJS(opened)(open);
      });
    const tap = Gesture.Tap().onEnd(() => {
      d.value = withSpring(1, SPRING);
      runOnJS(Keyboard.dismiss)();
      runOnJS(opened)(true);
    });
    return Gesture.Exclusive(pan, tap);
  }, [d, width, onOpen]);
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[s.edge, style]}
        accessibilityRole="button"
        accessibilityLabel="Your chats"
        accessibilityHint="Swipe right, or tap, for the chats"
        onAccessibilityTap={onOpen}
        testID="chats-edge"
      >
        <Glow />
      </Animated.View>
    </GestureDetector>
  );
}

/* The light itself: brightest at the middle of the edge and fading every
   way from there — into the chat, and up and down the edge — so it reads as
   a glow on the card's side rather than a line down it. */
function Glow() {
  const id = 'glow' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="0%" cy="50%" rx="100%" ry="50%" fx="0%" fy="50%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.24} />
          <Stop offset="0.55" stopColor="#ffffff" stopOpacity={0.08} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function ChatsDrawer({
  d,
  open,
  width,
  chats,
  currentId,
  onNew,
  onPick,
  onClose,
}: {
  d: SharedValue<number>;
  /** in, and so answering touches; out, it lets them through to the chat */
  open: boolean;
  width: number;
  chats: Chat[];
  /** the chat open now, marked in the list */
  currentId?: string;
  onNew: () => void;
  onPick: (chat: Chat) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  /* the head sits where the chat's own does: under the phone's clock, which a browser does not have */
  const top = Math.max(TOP, Math.round(insets.top) + 2) + 8;
  const shut = (then?: () => void) => {
    d.value = withSpring(0, SPRING);
    onClose();
    then?.();
  };
  /* a swipe to the left takes it back out, following the finger */
  const pan = useMemo(() => {
    const closed = (open: boolean) => {
      if (!open) onClose();
    };
    return Gesture.Pan()
      .activeOffsetX(-8)
      .failOffsetY([-14, 14])
      .onStart(() => {
        runOnJS(swipes.start)();
      })
      .onUpdate(e => {
        d.value = clamp(1 + Math.min(0, e.translationX) / width);
      })
      .onEnd(e => {
        runOnJS(swipes.end)();
        const open = d.value > 0.6 && e.velocityX > -500;
        d.value = withSpring(open ? 1 : 0, { ...SPRING, velocity: e.velocityX / width });
        runOnJS(closed)(open);
      });
  }, [d, width, onClose]);
  /* put away, the panel is not drawn at all: its shadow would otherwise lie along the screen's left edge */
  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: -width * (1 - d.value) }], opacity: d.value > 0.001 ? 1 : 0 }));
  const scrim = useAnimatedStyle(() => ({ opacity: d.value }));
  const today = chats.filter(c => c.day === 'today');
  const yesterday = chats.filter(c => c.day !== 'today');
  const group = (name: string, list: Chat[]) =>
    list.length ? (
      <View style={{ gap: 4 }}>
        <Caption style={{ color: dark.label, marginBottom: 4, paddingHorizontal: 8 }}>{name}</Caption>
        {list.map(c => (
          <ChatRow key={c.id} chat={c} on={c.id === currentId} onPress={() => shut(() => onPick(c))} />
        ))}
      </View>
    ) : null;
  return (
    <GestureDetector gesture={pan}>
      <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'box-none' : 'none'} aria-hidden={!open} testID="chats-drawer">
        <Animated.View style={[StyleSheet.absoluteFill, s.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Back to the chat" onPress={() => shut()} />
        </Animated.View>
        <Animated.View style={[s.panel, { width, paddingTop: top, paddingBottom: insets.bottom + 16 }, panel]}>
          <Head style={{ color: '#ffffff', paddingHorizontal: 20 }}>Chats</Head>
          <Tap accessibilityRole="button" accessibilityLabel="New chat" onPress={() => shut(onNew)} style={s.new} testID="new">
            <Icon name="plus" size={16} colour={colour.ink} />
            <Label>New chat</Label>
          </Tap>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 20, paddingHorizontal: 12, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            {chats.length ? (
              <>
                {group('Today', today)}
                {group('Yesterday', yesterday)}
              </>
            ) : (
              <Meta style={{ color: dark.label, paddingHorizontal: 8 }}>No chats yet. What you ask is kept here, a line for each.</Meta>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/* A chat in the drawer: the mark, what it was about, what it came to, and
   when. One Beetle started and you have not opened yet carries a dot; the
   one open now sits on a lighter ground. */
function ChatRow({ chat, on, onPress }: { chat: Chat; on: boolean; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={chat.title} accessibilityState={{ selected: on }} onPress={onPress} style={[s.row, on ? s.rowOn : null]}>
      <Icon name="mark" size={20} colour={colour.accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row style={{ color: '#ffffff' }} numberOfLines={1}>
          {chat.title}
        </Row>
        <Meta style={{ color: dark.textSoft }} numberOfLines={1}>
          {chat.startedBy === 'beetle' ? 'Beetle' : 'You'} · {chat.detail}
        </Meta>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {chat.unread ? <View style={s.unread} /> : null}
        <Label style={{ color: dark.label }}>{chat.time}</Label>
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  edge: { position: 'absolute', left: 0, width: EDGE },
  scrim: { backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: dark.panel,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    borderRightWidth: 1,
    borderColor: dark.edge,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 8, height: 0 },
  },
  new: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginHorizontal: 20, borderRadius: 22, backgroundColor: '#ffffff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 16 },
  rowOn: { backgroundColor: dark.edge },
  unread: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.accent },
});
