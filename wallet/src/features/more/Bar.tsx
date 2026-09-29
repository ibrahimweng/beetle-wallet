/* The bar at the foot of home, where the frames put their docks: 104 tall,
   24 above and below a 56 row set 16 in from either side. A grey pill 48
   tall carries Home, Activities and Camera, and the black plus stands to the
   side, the one that opens More. It goes down as the card opens, since the
   open chat has the shortcuts row instead, and comes back as the card
   closes. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { ActionButton, Caption, Icon, Tap, colour, frame, radius } from '../../design';
import type { IconName } from '../../icons';

export const BAR_H = 56 + 2 * frame.dockPad;

export function Bar({ open, onActivities, onCamera, onMore }: { open: SharedValue<number>; onActivities: () => void; onCamera: () => void; onMore: () => void }) {
  const going = useAnimatedStyle(() => ({ transform: [{ translateY: open.value * (BAR_H + 8) }] }));
  const item = (glyph: IconName, label: string, on: boolean, onPress?: () => void) => (
    <Tap accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={onPress} scale={0.94} style={s.item}>
      <Icon name={glyph} size={22} colour={on ? colour.ink : colour.textSecondary} />
      <Caption tone={on ? 'ink' : 'secondary'} style={on ? { fontWeight: '600' } : undefined}>
        {label}
      </Caption>
    </Tap>
  );
  return (
    <Animated.View style={[s.bar, going]} testID="bar">
      <View style={s.pill}>
        {item('home-filled', 'Home', true)}
        {item('history-filled', 'Activities', false, onActivities)}
        {item('camera', 'Camera', false, onCamera)}
      </View>
      <ActionButton onPress={onMore} label="More" />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_H,
    paddingHorizontal: 16,
    paddingVertical: frame.dockPad,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colour.surface,
  },
  pill: {
    flex: 1,
    height: frame.askBarHeight,
    borderRadius: radius.pill,
    backgroundColor: colour.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 1, width: 80, height: frame.askBarHeight },
});
