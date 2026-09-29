/* The rows a settings page is made of, as the frames draw them: 64 tall, the
   glyph 28 set 4 in, the words 16 after it, what is set in grey at the end
   and a chevron on the edge, or a switch there instead; the switch itself;
   and the grey line that names a group of them. */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon } from './Icon';
import { Body, Meta, Row } from './text';
import type { IconName } from '../icons';
import { colour } from './tokens';
import { Tap, keys, useStill } from './motion';
import { useDeparture } from './journey';

export function SectionLabel({ children }: { children: string }) {
  return <Body tone="tertiary">{children}</Body>;
}

export function SettingRow({
  glyph,
  ink,
  title,
  value,
  onPress,
  to,
  testID,
}: {
  glyph: IconName;
  /** the frames colour some marks: the face in the accent, the shield in green, the bell in amber */
  ink?: string;
  title: string;
  value?: string;
  onPress?: () => void;
  /** the page the row leads to: the row lights, the page arrives from it, and it pulses on the way back */
  to?: string;
  testID?: string;
}) {
  const j = useDeparture({ id: `row:${title}`, to, words: title });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={title} onPress={to ? j.onPress : onPress} style={[s.row, j.style]} testID={testID}>
      <Icon name={glyph} size={28} colour={ink ?? colour.ink} />
      <Row style={{ flex: 1 }}>{title}</Row>
      {value ? <Meta tone="secondary">{value}</Meta> : null}
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

/* The switch: a 52 by 32 track with a 26 knob 3 in from the end, the accent
   when it is on and the pale rail when it is not. Drawn, because the
   platform's own is a different shape on each and none of them the file's.
   The knob slides on the keys spring, the track's colour following it. */
export function Toggle({ value, onChange, label, testID }: { value: boolean; onChange?: (v: boolean) => void; label?: string; testID?: string }) {
  const still = useStill();
  const t = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    t.value = still ? (value ? 1 : 0) : withSpring(value ? 1 : 0, keys);
  }, [value, still, t]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.value, [0, 1], [colour.rail, colour.accent]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * 20 }] }));
  return (
    <Tap accessibilityRole="switch" accessibilityState={{ checked: value }} aria-checked={value} accessibilityLabel={label} onPress={() => onChange?.(!value)} scale={0.94} testID={testID}>
      <Animated.View style={[s.track, track]}>
        <Animated.View style={[s.knob, knob]} />
      </Animated.View>
    </Tap>
  );
}

/* A setting that is on or off: the same row, with the switch at its end. */
export function ToggleRow({ glyph, ink, title, value, onChange, testID }: { glyph: IconName; ink?: string; title: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  return (
    <View style={s.row} testID={testID}>
      <Icon name={glyph} size={28} colour={ink ?? colour.ink} />
      <Row style={{ flex: 1 }}>{title}</Row>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 64, paddingLeft: 4, gap: 16, borderRadius: 16 },
  track: { width: 52, height: 32, borderRadius: 16, padding: 3 },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: colour.surface },
});
