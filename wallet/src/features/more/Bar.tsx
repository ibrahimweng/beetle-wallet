/* The bar at the foot of home, drawn the way Fuse draws its own: a white
   surface with its top corners rounded and a soft shadow above it, three
   bare glyphs at the left — Home, Activities, Settings, the one you are on
   in black and the others in grey — and the black plus to the side, the
   one that opens More. The clock is drawn here, a disc with white hands,
   since the set's filled clock has its hands in the disc's own colour. 104 tall like the frames' docks, its row 24 above
   and below, the glyphs 24 on 44 targets 12 apart, the first 18 in, the
   plus 16 from the edge. It goes down as the card opens, since the open
   chat has the shortcuts row instead, and comes back as the card closes. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { ActionButton, Icon, Tap, colour, frame, useDeparture } from '../../design';
import type { IconName } from '../../icons';

export const BAR_H = 56 + 2 * frame.dockPad;

export function Bar({ open, onMore }: { open: SharedValue<number>; onMore: () => void }) {
  const going = useAnimatedStyle(() => ({ transform: [{ translateY: open.value * (BAR_H + 16) }] }));
  /* the pages arrive from their glyphs: the record's clock from this one, Settings from the gear */
  const activities = useDeparture({ id: 'bar:activities', to: '/activities' });
  const settings = useDeparture({ id: 'bar:settings', to: '/settings' });
  const item = (glyph: IconName | 'clock-drawn', label: string, on: boolean, j?: ReturnType<typeof useDeparture>) => (
    <Tap ref={j?.ref} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={j?.onPress} scale={0.9} style={s.item}>
      {glyph === 'clock-drawn' ? (
        <View style={[s.disc, { backgroundColor: on ? colour.ink : colour.textTertiary }]}>
          <View style={s.handUp} />
          <View style={s.handRight} />
        </View>
      ) : (
        <Icon name={glyph} size={24} colour={on ? colour.ink : colour.textTertiary} />
      )}
    </Tap>
  );
  return (
    <Animated.View style={[s.bar, going]} testID="bar">
      <View style={s.items}>
        {item('home-filled', 'Home', true)}
        {item('clock-drawn', 'Activities', false, activities)}
        {item('gear', 'Settings', false, settings)}
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
    paddingLeft: 18,
    paddingRight: 16,
    paddingVertical: frame.dockPad,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colour.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
  },
  items: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  item: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  disc: { width: 24, height: 24, borderRadius: 12 },
  handUp: { position: 'absolute', left: 11, top: 5, width: 2, height: 8, borderRadius: 1, backgroundColor: colour.surface },
  handRight: { position: 'absolute', left: 11, top: 11, width: 7, height: 2, borderRadius: 1, backgroundColor: colour.surface },
});
