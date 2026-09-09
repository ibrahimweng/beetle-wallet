/* The component kit. Every number in here was read off a frame in the Figma
   file, not judged by eye: cards are 24 radius with 20 and 21 of padding,
   buttons are 56 tall, the dock leaves 24 above and below its row, a screen
   column is spaced 20 and starts 72 down. */
import React, { ReactNode } from 'react';
import {
  View, ScrollView, Pressable, TextInput, StyleSheet, ViewStyle, StyleProp,
} from 'react-native';
import { Icon } from './Icon';
import { Body, Caption, Head, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, frame, radius, space } from '../theme';

export function Screen({ children, dock }: { children: ReactNode; dock?: ReactNode }) {
  return (
    <View style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {dock}
    </View>
  );
}

export function PageHead({ title, sub, big }: { title: string; sub?: string; big?: boolean }) {
  const T = big ? Head : Head;
  return (
    <View style={{ gap: space.s2, marginBottom: 18 }}>
      <T>{title}</T>
      {sub ? <Body tone="tertiary">{sub}</Body> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Divider() {
  return <View style={s.divider} />;
}

export function Button(
  { title, onPress, kind = 'primary', icon }:
  { title: string; onPress?: () => void; kind?: 'primary' | 'accent' | 'quiet'; icon?: IconName },
) {
  const fill = kind === 'primary' ? colour.ink : kind === 'accent' ? colour.accent : colour.surface2;
  const ink = kind === 'quiet' ? colour.ink : colour.textInverse;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.button, { backgroundColor: fill, opacity: pressed ? 0.9 : 1 }]}
    >
      {icon ? <Icon name={icon} size={20} colour={ink} /> : null}
      <Row style={{ color: ink }}>{title}</Row>
    </Pressable>
  );
}

export function ListRow(
  { icon, title, sub, right, onPress }:
  { icon?: IconName; title: string; sub?: string; right?: ReactNode; onPress?: () => void },
) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [s.listRow, { opacity: pressed && onPress ? 0.6 : 1 }]}
    >
      {icon ? <Icon name={icon} size={20} colour={colour.ink} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        {sub ? <Meta tone="secondary">{sub}</Meta> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={18} colour={colour.textTertiary} /> : null)}
    </Pressable>
  );
}

export function ActionRow(props: Parameters<typeof ListRow>[0]) {
  return (
    <Card style={{ paddingVertical: space.s3 }}>
      <ListRow {...props} />
    </Card>
  );
}

/* The step list the agent shows while it works. The three markers are the
   design's own glyphs rather than a circle drawn in code. */
export function ToolPanel(
  { title, state, rows }:
  { title: string; state: string; rows: { k: string; v: string; done?: boolean | 'work' }[] },
) {
  return (
    <View style={s.tool}>
      <View style={s.toolHead}>
        <Icon name="send" size={16} colour={colour.textSecondary} />
        <Label>{title}</Label>
        <View style={{ flex: 1 }} />
        <Caption tone="secondary">{state}</Caption>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.toolRow}>
          <Icon
            name={r.done === false ? 'step-todo' : r.done === 'work' ? 'step-work' : 'step-done'}
            size={18}
          />
          <Meta tone="secondary" style={{ flex: 1 }}>{r.k}</Meta>
          <Label>{r.v}</Label>
        </View>
      ))}
    </View>
  );
}

export function Pill({ text, tone = 'good' }: { text: string; tone?: 'good' | 'accent' | 'warn' }) {
  const bg = tone === 'good' ? '#e6f7ec' : tone === 'warn' ? '#fdf1dc' : colour.accentWash;
  const fg = tone === 'good' ? colour.goodText : tone === 'warn' ? colour.warn : colour.accent;
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Caption style={{ color: fg, fontWeight: '600' }}>{text}</Caption>
    </View>
  );
}

/* The bar at the bottom of every screen: back, the ask field, a camera and a
   microphone. The design ends it with those two, not a send arrow. */
export function Dock(
  { placeholder = 'Ask, or just say what you need', onBack, onAsk }:
  { placeholder?: string; onBack?: () => void; onAsk?: (q: string) => void },
) {
  const [value, setValue] = React.useState('');
  const fire = () => {
    const v = value.trim();
    if (!v) return;
    setValue('');
    onAsk?.(v);
  };
  return (
    <View style={s.dock}>
      {onBack ? (
        <Pressable accessibilityLabel="Back" onPress={onBack} style={s.back}>
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
      <View style={s.askBar}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <TextInput
          style={s.askInput}
          placeholder={placeholder}
          placeholderTextColor={colour.textTertiary}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={fire}
          returnKeyType="send"
          accessibilityLabel="Ask Beetle"
        />
        <Icon name="camera" size={18} colour={colour.textSecondary} />
        <Icon name="mic" size={18} colour={colour.textSecondary} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.surface },
  scroll: { flex: 1 },
  scrollBody: {
    paddingHorizontal: frame.sidePad,
    paddingTop: frame.topPad,
    paddingBottom: frame.bottomPad,
    gap: frame.columnGap,
  },
  card: {
    backgroundColor: colour.surface2,
    borderRadius: radius.card,
    paddingVertical: frame.cardPad.vertical,
    paddingHorizontal: frame.cardPad.horizontal,
    gap: space.s5,
  },
  divider: { height: 1, backgroundColor: colour.rule },
  button: {
    minHeight: frame.buttonHeight,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s2,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  tool: {
    backgroundColor: colour.surface2, borderRadius: radius.md, overflow: 'hidden',
  },
  toolHead: {
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
    paddingHorizontal: space.s4, paddingVertical: space.s3,
    backgroundColor: colour.surface3,
  },
  toolRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.s3,
    paddingHorizontal: space.s4, paddingVertical: space.s3,
    borderTopWidth: 1, borderTopColor: colour.rule,
  },
  pill: { borderRadius: radius.pill, paddingHorizontal: space.s3, paddingVertical: 5 },
  dock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: space.s2,
    paddingHorizontal: frame.sidePad, paddingVertical: frame.dockPad,
    backgroundColor: colour.surface,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  askBar: {
    flex: 1, height: frame.askBarHeight, borderRadius: radius.pill,
    backgroundColor: colour.surface2, flexDirection: 'row', alignItems: 'center',
    gap: space.s2, paddingLeft: 8, paddingRight: 12,
  },
  askInput: { flex: 1, fontSize: 16, color: colour.ink, padding: 0 },
});

