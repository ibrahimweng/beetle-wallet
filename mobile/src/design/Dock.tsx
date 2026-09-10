/* Dock — 104 tall, 24 above and below its row. The ask bar is 48 tall at the
   pill radius, and the design ends it with a camera and a microphone rather
   than a send arrow: you point it at something, or you talk to it. */
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { colour, frame, radius, space } from './tokens';

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
        <Pressable accessibilityRole="button" accessibilityLabel="Scan something" onPress={onScan}>
          <Icon name="camera" size={18} colour={colour.textSecondary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Speak" onPress={fire}>
          <Icon name="mic" size={18} colour={colour.textSecondary} />
        </Pressable>
      </View>
      {action}
    </View>
  );
}

/* Action button — 56 square, black, the one the menu opens from. */
export function ActionButton({ onPress, label = 'What can I do' }: { onPress?: () => void; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.fab}>
      <Icon name="fab-plus" size={24} colour={colour.textInverse} />
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
