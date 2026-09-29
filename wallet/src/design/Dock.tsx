/* The round black buttons the docks carry. The dock itself — Back, the ask
   bar, the plus — is the app's one foot, src/features/more/Foot.tsx, which
   every screen shares and which morphs from one screen's to the next's. */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Icon } from './Icon';
import { colour } from './tokens';
import { Tap, arrive, ease, motion, useStill } from './motion';

/* Send button — the round black one the chat frames put beside the bar,
   where the home frames put the plus. */
export function SendButton({ onPress }: { onPress?: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel="Send" onPress={onPress} style={s.fab}>
      <Icon name="up" size={22} colour={colour.textInverse} />
    </Tap>
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
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colour.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
