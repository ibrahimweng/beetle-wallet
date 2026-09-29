/* The ask bar: the mark, the field, and the camera. One of these lives on
   home and moves between its two places — the dock, and the foot of the
   open card — so it is drawn here and put where home says. */
import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon, Tap, colour, frame, radius, space } from '../../design';

export const AskBar = forwardRef<
  TextInput,
  {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onFocus?: () => void;
    onCamera: () => void;
    placeholder?: string;
  }
>(function AskBar({ value, onChange, onSubmit, onFocus, onCamera, placeholder = 'Ask, or show me a photo' }, ref) {
  return (
    <View style={s.bar}>
      <Icon name="mark" size={32} colour={colour.accent} />
      <TextInput
        ref={ref}
        style={s.input}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colour.textTertiary}
        returnKeyType="send"
        blurOnSubmit={false}
        accessibilityLabel="Ask Beetle"
      />
      <Tap accessibilityRole="button" accessibilityLabel="Show me a photo" onPress={onCamera} scale={0.85} hitSlop={8}>
        <Icon name="camera" size={20} colour={colour.textSecondary} />
      </Tap>
    </View>
  );
});

const s = StyleSheet.create({
  bar: {
    height: frame.askBarHeight,
    borderRadius: radius.pill,
    backgroundColor: colour.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
    paddingLeft: 8,
    paddingRight: 12,
  },
  input: { flex: 1, minWidth: 0, fontSize: 16, color: colour.ink, padding: 0 },
});
