/* More, from the Actions frame: the screen behind goes soft under a real
   blur and turns almost entirely white, the white see-through at the top
   (the frame's 76%) and solid by the foot, as the owner asked and as Fuse
   has it; the actions stand right aligned above the button, each with
   its own coloured glyph, rows 68 apart, glyphs 40 with their right edge 28
   in from the side. The frame draws five; the bar at the foot of home
   carries Activities and Settings, so the sheet keeps the other three —
   Camera, Send money, Receive — sitting nearest the button. The black
   button stays where it is, so the one you pressed is the one that closes
   this; anywhere that is not an action closes it too.

   How it moves: the softening arrives first, then the three come up out of
   the button, the nearest one first, each overshooting a little and
   settling; the plus turns forty-five degrees into a cross on the way in and
   back on the way out, so the same button reads as the thing that opened
   this and the thing that will close it. Closing runs the whole thing
   backwards before the screen goes, which is why leaving never feels like
   a cut. */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, useDerivedValue } from 'react-native-reanimated';
import type { useRouter } from 'expo-router';
import { Head, Icon, Veil, colour } from '../../design';
import { arrive, bouncy, motion, settle, useStill } from '../../design/motion';
import type { IconName } from '../../icons';
import { openTab } from '../tabs/tabs';

export type MoreItem = 'camera' | 'send' | 'receive';

const ITEMS: { id: MoreItem; icon: IconName; label: string; colour: string }[] = [
  { id: 'camera', icon: 'camera-filled', label: 'Camera', colour: colour.warn },
  { id: 'send', icon: 'send-filled', label: 'Send money', colour: colour.accent },
  { id: 'receive', icon: 'receive-filled', label: 'Receive', colour: colour.good },
];

/** How long the menu takes to fold itself away before the screen changes. */
const AWAY = 190;

type Router = ReturnType<typeof useRouter>;

/** Where each action goes from a page that is not home: the camera and
    Send money on their own screens; receiving back on home, turned to Home
    with the Receive sheet up. */
export function moreTo(router: Router, item: MoreItem) {
  if (item === 'camera') router.push('/scan');
  else if (item === 'send') router.push('/send');
  else openTab(router, 'home', { receive: `pick-${Date.now()}` });
}

export function More({ onPick, onClose }: { onPick: (item: MoreItem) => void; onClose: () => void }) {
  const frozen = useStill();
  /* 1 while the menu is open, 0 while it is folding away */
  const open = useSharedValue(frozen ? 1 : 0);
  const [leaving, setLeaving] = useState(false);
  const going = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!frozen) open.value = withSpring(1, arrive);
    return () => {
      if (going.current) clearTimeout(going.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Run it backwards, then go. Every way out comes through here, so the
     menu never simply vanishes. */
  const leave = (then: () => void) => {
    if (frozen) return then();
    if (leaving) return;
    setLeaving(true);
    open.value = withTiming(0, { duration: AWAY, easing: settle });
    going.current = setTimeout(then, AWAY);
  };

  /* the softening arrives ahead of the buttons, so they come up onto a
     background that has already gone quiet */
  const soft = useDerivedValue(() => Math.min(1, open.value * 1.9));
  const turning = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 45}deg` }] }));
  return (
    <View style={StyleSheet.absoluteFill} testID="more">
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" accessibilityRole="button" onPress={() => leave(onClose)}>
        <Veil tone="light" t={soft} testID="more-veil" />
      </Pressable>
      <View style={s.items} pointerEvents="box-none">
        {ITEMS.map((it, i) => (
          <Item key={it.id} item={it} open={open} frozen={frozen} step={ITEMS.length - 1 - i} onPress={() => leave(() => onPick(it.id))} />
        ))}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => leave(onClose)} style={s.fab} testID="more-close">
        <Animated.View style={turning}>
          <Icon name="fab-plus" size={24} colour={colour.textInverse} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

/* One action. It comes up and out from where the button is, overshoots, and
   settles. Going away it does the same in reverse, without the overshoot,
   because leaving should be quicker than arriving. */
function Item({ item, open, step, frozen, onPress }: { item: (typeof ITEMS)[number]; open: SharedValue<number>; step: number; frozen: boolean; onPress: () => void }) {
  const t = useSharedValue(frozen ? 1 : 0);
  useEffect(() => {
    if (!frozen) t.value = withDelay(step * motion.step, withSpring(1, bouncy));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => {
    /* while it is folding away, `open` takes over from the arrival */
    const shown = Math.min(t.value, open.value);
    return {
      opacity: Math.min(1, shown * 1.6),
      transform: [{ translateY: (1 - shown) * 34 }, { scale: 0.86 + shown * 0.14 }],
    };
  });
  const held = useSharedValue(0);
  const pressing = useAnimatedStyle(() => ({ transform: [{ scale: 1 - held.value * 0.05 }] }));
  return (
    <Animated.View style={moving}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.label}
        onPressIn={() => {
          held.value = withTiming(1, { duration: motion.press, easing: settle });
        }}
        onPressOut={() => {
          held.value = withSpring(0, arrive);
        }}
        onPress={onPress}
      >
        <Animated.View style={[s.item, pressing]}>
          <Head>{item.label}</Head>
          <Icon name={item.icon} size={40} colour={item.colour} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  items: { position: 'absolute', right: 28, bottom: 100, alignItems: 'flex-end', gap: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 32, height: 52 },
  /* exactly where the dock's own button is, so the one you pressed is the one that closes this */
  fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
});

/** A question for Beetle from another page: back to home, turned to Home,
    with the chat opening on it. Stamped, so the same words asked twice are
    asked twice. */
export function askHome(router: Router, q: string, about?: string) {
  openTab(router, 'home', { say: `${q} #${Date.now()}`, ...(about ? { about } : {}) });
}

/** Ask Beetle about this: a fresh chat on home with the transaction as what it is about, and Beetle asking what you want to know. */
export function askAbout(router: Router, about: string) {
  openTab(router, 'home', { about, fresh: String(Date.now()) });
}
