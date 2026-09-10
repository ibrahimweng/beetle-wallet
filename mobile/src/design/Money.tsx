/* Pieces the money screens share: a grid of services, a block that offers one
   way to be paid, the slide that actually sends, and the row shape the send
   form uses for the parts you can change. */
import React, { ReactNode, useRef, useState } from 'react';
import { Pressable, View, PanResponder, Animated } from 'react-native';
import { Icon } from './Icon';
import { Caption, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, radius, space } from './tokens';

export function Grid({ items }: { items: { glyph: IconName; label: string; onPress?: () => void }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {items.map(i => (
        <Pressable
          key={i.label}
          accessibilityRole="button"
          onPress={i.onPress}
          style={({ pressed }) => ({
            width: '25%',
            alignItems: 'center',
            gap: space.s2,
            paddingVertical: space.s3,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Icon name={i.glyph} size={24} />
          <Label>{i.label}</Label>
        </Pressable>
      ))}
    </View>
  );
}

/* One way to be paid: what it is, what it looks like, and the one thing to do
   with it. */
export function WayBlock({
  glyph,
  title,
  sub,
  value,
  action,
  onPress,
}: {
  glyph: IconName;
  title: string;
  sub: string;
  value: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View
      style={{ backgroundColor: colour.surface2, borderRadius: radius.lg, padding: space.s4, gap: space.s3 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s5 }}>
        <Icon name={glyph} size={20} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row>{title}</Row>
          <Caption tone="secondary">{sub}</Caption>
        </View>
      </View>
      <Row>{value}</Row>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Row>{action}</Row>
        <Icon name="chevron" size={20} />
      </Pressable>
    </View>
  );
}

/* A part of the send that can be changed before it goes. */
export function FormRow({
  label,
  value,
  sub,
  note,
  lead,
  onPress,
}: {
  label?: string;
  value: string;
  sub?: string;
  note?: string;
  lead?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.s3,
          opacity: pressed && onPress ? 0.6 : 1,
        })}
      >
        {lead}
        <View style={{ flex: 1, gap: 2 }}>
          {label ? <Meta tone="secondary">{label}</Meta> : null}
          <Row>{value}</Row>
          {sub ? <Meta tone="secondary">{sub}</Meta> : null}
        </View>
        {onPress ? <Icon name="chevron" size={16} colour={colour.textTertiary} /> : null}
      </Pressable>
      {note ? <Caption tone="tertiary">{note}</Caption> : null}
    </View>
  );
}

/* Slide to send. Nothing moves until the thumb reaches the end, which is the
   whole point of it. */
export function SlideToSend({ label, onDone }: { label: string; onDone: () => void }) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const max = Math.max(0, width - 56);
        x.setValue(Math.min(Math.max(0, g.dx), max));
      },
      onPanResponderRelease: (_, g) => {
        const max = Math.max(0, width - 56);
        if (g.dx > max * 0.75 && !done.current) {
          done.current = true;
          Animated.timing(x, { toValue: max, duration: 120, useNativeDriver: false }).start(onDone);
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  return (
    <View
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={{ height: 56, borderRadius: 28, backgroundColor: colour.ink, justifyContent: 'center' }}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
        <Row tone="inverse">{label}</Row>
      </View>
      <Animated.View
        {...pan.panHandlers}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colour.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 4,
          transform: [{ translateX: x }],
        }}
      >
        <Icon name="slide-arrow" size={20} />
      </Animated.View>
    </View>
  );
}

/* A square code somebody can point a camera at. Drawn rather than generated,
   because nothing here reaches a network. */
export function CodeSquare({ size = 190 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colour.surface2,
        borderRadius: radius.lg,
      }}
    >
      <Icon name="qr" size={size * 0.72} />
    </View>
  );
}
