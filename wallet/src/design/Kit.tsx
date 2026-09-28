/* The small pieces the way in and home share: a tick, a glyph on a disc, a
   quiet text button, a list to pick from, an empty state, a toast, and the
   agent saying something. Drawn to the same figures as everything beside
   them. */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Body, Caption, Head, Meta, Row } from './text';
import { Card, Divider } from './Screen';
import { Bubble } from './Bubble';
import { IconName } from '../icons';
import { colour, radius, space } from './tokens';
import { Tap } from './motion';

/* The round tick beside a thing that is on; a dashed ring when it is not yet. */
export function Tick({ on, size = 22 }: { on: boolean; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? colour.good : 'transparent',
        borderWidth: on ? 0 : 1.5,
        borderStyle: on ? 'solid' : 'dashed',
        borderColor: colour.ruleStrong,
      }}
    >
      {on ? <Icon name="check" size={Math.round(size * 0.5)} colour={colour.textInverse} /> : null}
    </View>
  );
}

/* A glyph in a circle, where the file wants an icon to read as a token. */
export function Badge({
  glyph,
  size = 44,
  tone = colour.surface3,
  ink = colour.ink,
}: {
  glyph: IconName;
  size?: number;
  tone?: string;
  ink?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={glyph} size={Math.round(size * 0.5)} colour={ink} />
    </View>
  );
}

/* Initials in a circle, the way the file draws a person. */
export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colour.surface3,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Row>{initials}</Row>
    </View>
  );
}

/* A centred text button, the quiet way out of a screen. */
export function Ghost({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" onPress={onPress} style={{ alignSelf: 'center' }}>
      <Row tone="accent">{label}</Row>
    </Tap>
  );
}

/* A line of text with a chevron after it, the way the frames offer the other
   way out of a step. */
export function More({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
    >
      <Row style={{ fontSize: 14, lineHeight: 20 }}>{label}</Row>
      <Icon name="chevron" size={12} colour={colour.ink} />
    </Tap>
  );
}

export type Choice = { id: string; label: string; sub?: string };

export function Picker({
  options,
  value,
  onChange,
  plain = false,
}: {
  options: Choice[];
  value: string;
  onChange: (id: string) => void;
  plain?: boolean;
}) {
  const Frame = plain ? PlainList : Card;
  return (
    <Frame style={{ gap: 0 }}>
      {options.map((o, i) => (
        <View key={o.id}>
          {i ? <Divider /> : null}
          <Tap
            accessibilityRole="radio"
            accessibilityState={{ selected: o.id === value }}
            onPress={() => onChange(o.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s3 }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              {plain ? <Body>{o.label}</Body> : <Row>{o.label}</Row>}
              {o.sub ? <Meta tone="secondary">{o.sub}</Meta> : null}
            </View>
            <Tick on={o.id === value} />
          </Tap>
        </View>
      ))}
    </Frame>
  );
}

function PlainList({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

/* Nothing here yet, drawn the way the empty frames draw it. */
export function Empty({ glyph, title, body, note }: { glyph: IconName; title?: string; body: string; note?: string }) {
  return (
    <View
      style={{
        backgroundColor: colour.surface2,
        borderRadius: radius.card,
        paddingVertical: 30,
        paddingHorizontal: 18,
        gap: space.s3,
        alignItems: 'center',
      }}
    >
      <Icon name={glyph} size={32} colour={colour.textSecondary} />
      {title ? <Head>{title}</Head> : null}
      <Body tone="secondary" style={{ textAlign: 'center' }}>
        {body}
      </Body>
      {note ? (
        <Caption tone="tertiary" style={{ textAlign: 'center' }}>
          {note}
        </Caption>
      ) : null}
    </View>
  );
}

/* The agent saying something: the mark, and the line in its bubble. */
export function AgentSay({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 }}>
      <Icon name="mark" size={32} colour={colour.accent} />
      <View style={{ flex: 1 }}>
        <Bubble>{children}</Bubble>
      </View>
    </View>
  );
}

/* ---- saying something happened ---- */

type Listener = (text: string) => void;
let listener: Listener | null = null;

/** Say one short thing at the bottom of the screen. */
export const toast = (text: string) => listener?.(text);

export function ToastHost() {
  const [text, setText] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    listener = t => setText(t);
    return () => {
      listener = null;
    };
  }, []);
  useEffect(() => {
    if (text === null) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setText(null));
    }, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  if (text === null) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 120,
        opacity: fade,
        backgroundColor: colour.ink,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Meta tone="inverse">{text}</Meta>
    </Animated.View>
  );
}
