/* Dock — 104 tall, 24 above and below its row. The ask bar is 48 tall at the
   pill radius, and the design ends it with a camera and a microphone rather
   than a send arrow: you point it at something, or you talk to it. */
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Icon } from './Icon';
import { colour, frame, radius, space } from './tokens';
import { Tap, arrive, ease, motion, useStill } from './motion';

export function Dock({
  placeholder = 'Ask, or just say what you need',
  onBack,
  onAsk,
  onScan,
  action,
}: {
  placeholder?: string;
  onBack?: () => void;
  onAsk?: (q: string) => void;
  onScan?: () => void;
  /* the round button sits in the row beside the bar, not over it */
  action?: React.ReactNode;
}) {
  const [value, setValue] = useState('');
  const fire = () => {
    const v = value.trim();
    if (!v) return;
    setValue('');
    onAsk?.(v);
  };
  return (
    <View style={s.dock}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={s.back}>
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
      <View style={s.bar}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={fire}
          placeholder={placeholder}
          placeholderTextColor={colour.textTertiary}
          returnKeyType="send"
          accessibilityLabel="Ask Beetle"
        />
        <Tap accessibilityRole="button" accessibilityLabel="Scan something" onPress={onScan} scale={0.85}>
          <Icon name="camera" size={18} colour={colour.textSecondary} />
        </Tap>
        <Tap accessibilityRole="button" accessibilityLabel="Speak" onPress={fire} scale={0.85}>
          <Icon name="mic" size={18} colour={colour.textSecondary} />
        </Tap>
      </View>
      {action}
    </View>
  );
}

/* Action button — 56 square, black, the one the menu opens from.

   The turn into a cross starts here, under the finger, and the menu carries it
   the rest of the way. Pressing it is the first frame of the animation that
   screen finishes, which is what keeps the two feeling like one movement. */
export function ActionButton({ onPress, label = 'What can I do' }: { onPress?: () => void; label?: string }) {
  const held = useSharedValue(0);
  const still = useStill();
  const turning = useAnimatedStyle(() => ({
    transform: [{ rotate: `${held.value * 14}deg` }, { scale: 1 - held.value * 0.06 }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        if (!still) held.value = withTiming(1, { duration: motion.press, easing: ease });
      }}
      onPressOut={() => {
        if (!still) held.value = withSpring(0, arrive);
      }}
      style={s.fab}
    >
      <Animated.View style={turning}>
        <Icon name="fab-plus" size={24} colour={colour.textInverse} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
    paddingHorizontal: frame.sidePad,
    paddingVertical: frame.dockPad,
    backgroundColor: colour.surface,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bar: {
    flex: 1,
    height: frame.askBarHeight,
    borderRadius: radius.pill,
    backgroundColor: colour.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
    paddingLeft: 8,
    paddingRight: 12,
  },
  input: { flex: 1, fontSize: 16, color: colour.ink, padding: 0 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colour.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
