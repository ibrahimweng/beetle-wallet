/* The button's menu. Read off the Actions frame: the home screen fades out,
   the five actions stand right aligned with their own coloured glyph, rows 68
   apart, glyphs 40 square with their right edge 26 in from the side, and the
   black button stays where it is so it closes what it opened. Anywhere that
   is not an action closes it too.

   How it moves: the home screen behind goes soft — a real blur, not a white
   wash — while the five buttons come up out of the button you pressed, the
   nearest one first, each overshooting slightly and settling. The plus turns
   forty-five degrees into a cross on the way in and back on the way out, so
   the same button reads as the thing that opened this and the thing that will
   close it. Closing runs the whole thing backwards before the screen goes,
   which is why leaving never feels like a cut. */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Head, Icon, colour } from '../design';
import { Backdrop, arrive, bouncy, ease, motion, useStill } from '../design/motion';
import { IconName } from '../icons';
import { Route } from '../routes';
import { Home } from './home';
import { still as nowhere } from './send';

const ITEMS: { icon: IconName; label: string; to: Route; colour: string }[] = [
  { icon: 'voice-filled', label: 'Voice', to: 'ask', colour: colour.warn },
  { icon: 'send-filled', label: 'Send money', to: 'pay', colour: colour.accent },
  { icon: 'receive-filled', label: 'Receive', to: 'ways', colour: colour.good },
  { icon: 'history-filled', label: 'History', to: 'history', colour: colour.violet },
  { icon: 'settings-filled', label: 'Settings', to: 'settings', colour: colour.ink },
];

/* How long the menu takes to fold itself away before the screen changes. Short
   enough that it reads as part of the tap, not as waiting. */
const AWAY = 190;

export function Actions({ go, close }: { go: (r: Route) => void; close: () => void }) {
  const frozen = useStill();
  /* 1 while the menu is open, 0 while it is folding away */
  const open = useSharedValue(frozen ? 1 : 0);
  const [leaving, setLeaving] = useState(false);
  const going = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!frozen) open.value = withSpring(1, arrive);
    /* if the screen goes some other way, the fold-away must not still fire */
    return () => {
      if (going.current) clearTimeout(going.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Run it backwards, then go. Every way out of this screen comes through
     here, so the menu never simply vanishes. */
  const leave = (then: () => void) => {
    if (frozen) return then();
    if (leaving) return;
    setLeaving(true);
    open.value = withTiming(0, { duration: AWAY, easing: ease });
    going.current = setTimeout(then, AWAY);
  };

  /* the softening arrives ahead of the buttons, so they come up onto a
     background that has already gone quiet */
  const soft = useAnimatedStyle(() => ({ opacity: Math.min(1, open.value * 1.9) }));
  const turning = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 45}deg` }] }));

  return (
    <Pressable style={s.fill} accessibilityLabel="Close" onPress={() => leave(close)}>
      <View style={s.behind} pointerEvents="none">
        <Backdrop>
          <Home nav={nowhere} />
        </Backdrop>
      </View>

      {/* the screen behind goes soft rather than white */}
      <Animated.View style={[s.veil, soft]} pointerEvents="none">
        <BlurView intensity={44} tint="light" style={StyleSheet.absoluteFill as never} />
        <View style={s.wash} />
      </Animated.View>

      <View style={s.items}>
        {ITEMS.map((it, i) => (
          <Item
            key={it.label}
            item={it}
            open={open}
            frozen={frozen}
            /* counted from the bottom, so they come out of the button */
            step={ITEMS.length - 1 - i}
            onPress={() => leave(() => go(it.to))}
          />
        ))}
      </View>

      <Pressable accessibilityLabel="Close" onPress={() => leave(close)} style={s.fab}>
        <Animated.View style={turning}>
          <Icon name="fab-plus" size={24} colour={colour.textInverse} />
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}

/* One action. It comes up and out from where the button is, overshoots, and
   settles. Going away it does the same in reverse, without the overshoot,
   because leaving should be quicker than arriving. */
function Item({
  item,
  open,
  step,
  frozen,
  onPress,
}: {
  item: (typeof ITEMS)[number];
  open: SharedValue<number>;
  step: number;
  frozen: boolean;
  onPress: () => void;
}) {
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
        onPressIn={() => {
          held.value = withTiming(1, { duration: motion.press, easing: ease });
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
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colour.surface,
  },
  behind: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  veil: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    /* light enough that the home is still there behind the blur, which is
       what the frame shows */
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  items: { position: 'absolute', right: 26, bottom: 138, alignItems: 'flex-end', gap: 28 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  fab: {
    /* exactly where the dock's own button is, so the one you pressed is the
       one that closes this */
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colour.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
