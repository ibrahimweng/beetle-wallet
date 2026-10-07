/* The chats, in a drawer inside the chat's own dark card, and nowhere else.

   While the chat is open a soft light runs down the card's left edge. A
   swipe to the right that starts near it, anywhere in a thumb's width of
   the edge, brings the drawer in from the left, following the finger — or
   a tap on the light does. (A thumb's width, not the light's own 16: on a
   phone a swipe from the edge lands well inside the glass, and the owner
   found the drawer would not come, Round 13.) It lives inside the
   card, under the header, and stops short of the ask bar: its dark is solid
   at the top and thins as it goes down, into a blur of the chat, so the
   bar under it stays in sight and in reach. At its top a quiet New chat —
   the glyph and the words, 12 apart — then a hairline, then the chats,
   today's and yesterday's, a line each, the open one on a faint ground.
   The rows come in one after another, out of a blur, as it opens, and the
   chat behind steps back a little. A swipe to the left anywhere on it, a
   tap on the chat beside it, a tap on the ask bar, or the phone's back puts
   it away. With the chat closed there is no edge and no drawer. */
import React, { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, withSpring, type AnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { Caption, Icon, Meta, Tap, blurred, colour, dark, swipes } from '../../design';
import { Frost } from '../home/Frost';
import type { Chat } from './chats';
import { dayName } from '../../lib/days';

type BlurModule = typeof import('expo-blur');
const blurKit: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();
type MaskModule = typeof import('@react-native-masked-view/masked-view');
const Masked: MaskModule['default'] | null = (() => {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@react-native-masked-view/masked-view') as MaskModule).default;
  } catch {
    return null;
  }
})();

/** How tall the blur at the drawer's foot is: it runs down over the chips to the top of the ask bar. */
const FOG = 120;

/** How the drawer settles, in or out. */
export const SPRING = { damping: 28, stiffness: 260, mass: 0.9, overshootClamping: true } as const;
/** The edge a swipe starts from: the card's own margin, clear of everything in the chat. */
export const EDGE = 16;
/** The drawer's width inside the card: most of it, the chat showing beside it. */
export const drawerWidth = (W: number) => Math.min(304, Math.round(W * 0.78));

const clamp = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

/* The keyboard put away, from a gesture: through a function of this file,
   since a gesture runs on the animation thread and cannot take React
   Native's Keyboard there (it stopped the app on the phone: "Cannot copy
   value of type KeyboardImpl"). */
const putKeyboardAway = () => Keyboard.dismiss();

/** How far in from the left a swipe can start and bring the drawer in: a
    thumb's width, as react-navigation's drawers allow, since on a phone a
    swipe "from the edge" lands well inside the glass, not on the light. */
export const EDGE_SWIPE = 44;

/* The swipe that brings the drawer in, following the finger. It belongs to
   the whole of home, not to the light: it starts anywhere in the first
   EDGE_SWIPE from the left, and a touch there that goes up or down is the
   chat's scroll, a tap is whatever is under it. */
export function useChatsSwipe(d: SharedValue<number>, width: number, onOpen: () => void, enabled: boolean) {
  return useMemo(() => {
    const opened = (open: boolean) => {
      if (open) onOpen();
    };
    return Gesture.Pan()
      .enabled(enabled)
      .hitSlop({ left: 0, width: EDGE_SWIPE })
      .activeOffsetX(10)
      .failOffsetY([-12, 12])
      .onStart(() => {
        runOnJS(putKeyboardAway)();
        runOnJS(swipes.start)();
      })
      .onUpdate(e => {
        d.value = clamp(e.translationX / width);
      })
      .onEnd(e => {
        runOnJS(swipes.end)();
        const open = d.value > 0.35 || e.velocityX > 500;
        d.value = withSpring(open ? 1 : 0, { ...SPRING, velocity: e.velocityX / width });
        runOnJS(opened)(open);
      });
  }, [d, width, onOpen, enabled]);
}

/* The left edge while the chat is open: the soft light, which a tap on
   brings the drawer in too (the swipe is home's, above). */
export function ChatsEdge({
  d,
  style,
  onOpen,
}: {
  d: SharedValue<number>;
  /** where it runs: down the chat, between its header and its ask bar */ style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  onOpen: () => void;
}) {
  const tap = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        d.value = withSpring(1, SPRING);
        runOnJS(putKeyboardAway)();
        runOnJS(onOpen)();
      }),
    [d, onOpen],
  );
  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[s.edge, style]}
        accessibilityRole="button"
        accessibilityLabel="Your chats"
        accessibilityHint="Swipe right, or tap, for the chats"
        /* VoiceOver's double tap brings the drawer in as a tap does, not only says it is in (the analysis after Round 21: it stayed unseen, over the chat, taking every tap) */
        onAccessibilityTap={() => {
          d.value = withSpring(1, SPRING);
          putKeyboardAway();
          onOpen();
        }}
        testID="chats-edge"
      >
        <Glow />
      </Animated.View>
    </GestureDetector>
  );
}

/* The light itself: brightest at the middle of the edge and fading every
   way from there, so it reads as a glow on the card's side rather than a
   line down it. */
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

/** What the chat behind wears as the drawer comes in: a step to the right, dimmer, a little soft. */
export function useChatRecedes(d: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    opacity: 1 - 0.55 * d.value,
    transform: [{ translateX: 28 * d.value }],
    ...blurred(d.value * 3),
  }));
}

export function ChatsDrawer({
  d,
  open,
  width,
  top,
  height,
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
  /** where the drawer starts in the card: under its header */
  top: number;
  /** how far down the card it reaches: short of the ask bar, which stays clear */
  height: SharedValue<number>;
  chats: Chat[];
  /** the chat open now, on its faint ground */
  currentId?: string;
  onNew: () => void;
  onPick: (chat: Chat) => void;
  onClose: () => void;
}) {
  const shut = (then?: () => void) => {
    d.value = withSpring(0, SPRING);
    onClose();
    then?.();
  };
  /* a swipe to the left, anywhere on it or the chat beside it, takes it back out, following the finger */
  const pan = useMemo(() => {
    const closed = (stays: boolean) => {
      if (!stays) onClose();
    };
    return Gesture.Pan()
      .activeOffsetX(-10)
      .failOffsetY([-14, 14])
      .onStart(() => {
        runOnJS(swipes.start)();
      })
      .onUpdate(e => {
        d.value = clamp(1 + Math.min(0, e.translationX) / width);
      })
      .onEnd(e => {
        runOnJS(swipes.end)();
        const stays = d.value > 0.6 && e.velocityX > -500;
        d.value = withSpring(stays ? 1 : 0, { ...SPRING, velocity: e.velocityX / width });
        runOnJS(closed)(stays);
      });
  }, [d, width, onClose]);
  const area = useAnimatedStyle(() => ({ height: height.value }));
  /* put away, the panel is not drawn at all */
  const panel = useAnimatedStyle(() => ({ transform: [{ translateX: -width * (1 - d.value) }], opacity: d.value > 0.001 ? 1 : 0 }));
  /* the day a chat was last touched, by this phone's calendar: "today" does not last for ever (the analysis after Round 21) */
  const dayOf = (c: Chat) => (c.lastAt !== undefined ? dayName(c.lastAt) : c.day);
  const today = chats.filter(c => dayOf(c) === 'today');
  const yesterday = chats.filter(c => dayOf(c) === 'yesterday');
  const earlier = chats.filter(c => dayOf(c) === 'earlier');
  /* New chat comes first; the groups and their chats after it, in order */
  let n = 1;
  const group = (name: string, list: Chat[]) =>
    list.length ? (
      <View style={{ gap: 2 }}>
        <Arrives d={d} i={n++}>
          <Caption style={s.group}>{name}</Caption>
        </Arrives>
        {list.map(c => (
          <Arrives key={c.id} d={d} i={n++}>
            <ChatRow chat={c} on={c.id === currentId} onPress={() => shut(() => onPick(c))} />
          </Arrives>
        ))}
      </View>
    ) : null;
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[s.area, { top }, area]} pointerEvents={open ? 'box-none' : 'none'} aria-hidden={!open} testID="chats-drawer">
        {/* the chat beside it: a tap there puts it away */}
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Back to the chat" onPress={() => shut()} />
        <Animated.View style={[s.panel, { width }, panel]}>
          {/* solid at the top, thinning into a blur of the chat on the way down */}
          <PanelGround />
          <Arrives d={d} i={0}>
            <Tap accessibilityRole="button" accessibilityLabel="New chat" onPress={() => shut(onNew)} style={s.new} testID="new">
              <Icon name="plus" size={20} colour={dark.pillText} />
              <Meta style={s.newWords}>New chat</Meta>
            </Tap>
          </Arrives>
          <View style={s.hair} />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
            {chats.length ? (
              <>
                {group('Today', today)}
                {group('Yesterday', yesterday)}
                {group('Earlier', earlier)}
              </>
            ) : (
              <Meta style={{ color: dark.label, paddingHorizontal: 12 }}>No chats yet. What you ask is kept here, a line for each.</Meta>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/* The panel's ground: a dark a step lighter than the chat's own (Round 20,
   the owner's word: the drawer reads as a layer over the chat), near solid
   down most of it, then thinning to nothing over the blur, so its foot has
   no edge. */
const GROUND = [1, 3, 5].map(i => parseInt(dark.drawer.slice(i, i + 2), 16)).join(', ');
function PanelGround() {
  const [h, setH] = React.useState(0);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={e => setH(e.nativeEvent.layout.height)}>
      {h ? <Frost height={h} side="top" solid={Math.round(h * 0.62)} rgb={GROUND} /> : null}
      <Fog />
    </View>
  );
}

/* The blur the drawer thins into at its foot: over the chips, and gone by
   the top of the ask bar, so the bar is read clearly through it. Masked to
   come in and go out again, so it has no edge of its own. */
function Fog() {
  const Blur = blurKit?.BlurView;
  if (!Blur) return null;
  const glass = <Blur intensity={22} tint="dark" style={StyleSheet.absoluteFill} />;
  const box = { position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: FOG };
  if (Platform.OS === 'web') return <WebFog style={box} />;
  if (Masked)
    return (
      <Masked style={box} maskElement={<LinearGradient colors={['transparent', '#000', '#000', 'transparent']} locations={[0, 0.4, 0.8, 1]} style={StyleSheet.absoluteFill} />}>
        {glass}
      </Masked>
    );
  return null;
}

/* On the web the blur and its mask go on one node: a mask on the blur's
   parent would cut the blur off from what is behind it. */
function WebFog({ style }: { style: object }) {
  const ref = useRef<View>(null);
  useLayoutEffect(() => {
    const el = ref.current as unknown as { style?: Record<string, string> } | null;
    if (!el?.style) return;
    const mask = 'linear-gradient(to bottom, transparent 0%, #000 40%, #000 80%, transparent 100%)';
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
    el.style.backdropFilter = 'blur(6px)';
    el.style.webkitBackdropFilter = 'blur(6px)';
    el.style.backgroundColor = `rgba(${GROUND}, 0.18)`;
  }, []);
  return <View ref={ref} style={style} />;
}

/* One thing in the drawer, arriving in its turn as the drawer comes in: out of a blur, from a little to the left. */
function Arrives({ d, i, children }: { d: SharedValue<number>; i: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const k = clamp((d.value - 0.3 - i * 0.05) / 0.4);
    return { opacity: k, transform: [{ translateX: -12 * (1 - k) }], ...blurred((1 - k) * 4) };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

/* A chat in the drawer: what it was about, and when, on one line; a dot on
   one Beetle started that is not opened yet; the open one on a faint ground. */
function ChatRow({ chat, on, onPress }: { chat: Chat; on: boolean; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={chat.title} accessibilityState={{ selected: on }} onPress={onPress} scale={0.98} style={[s.row, on ? s.rowOn : null]}>
      {chat.unread ? <View style={s.unread} /> : null}
      <Meta style={s.title} numberOfLines={1}>
        {chat.title}
      </Meta>
      <Caption style={{ color: dark.label }}>{chat.time}</Caption>
    </Tap>
  );
}

const s = StyleSheet.create({
  edge: { position: 'absolute', left: 0, width: EDGE },
  area: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  panel: { position: 'absolute', left: 0, top: 0, bottom: 0, borderTopRightRadius: 24, overflow: 'hidden', paddingTop: 8 },
  new: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, marginHorizontal: 8, paddingHorizontal: 12, borderRadius: 14 },
  newWords: { color: '#ffffff', fontWeight: '500' },
  hair: { height: 1, backgroundColor: dark.divider, marginHorizontal: 20, marginTop: 8, marginBottom: 12 },
  list: { gap: 20, paddingHorizontal: 8, paddingBottom: 96 },
  group: { color: dark.label, paddingHorizontal: 12, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 12, borderRadius: 14 },
  rowOn: { backgroundColor: 'rgba(255,255,255,0.07)' },
  title: { flex: 1, color: dark.pillText },
  unread: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.accent },
});
