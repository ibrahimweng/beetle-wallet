/* A box to type words into (Round 30): an email, a password, a username,
   on the way in's dark and on the white sheets alike, its colours from the
   scheme. A label over it, the words in Geist 16 on 24, a password's
   letters hidden with Show beside them, and an optional prefix (a
   username's $). Whatever is typed into one is kept in view: the screens
   that hold them ride up over the keyboard. */
import React, { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Caption, Label } from './text';
import { font } from './tokens';
import { usePalette } from './scheme';

export type TextBoxProps = {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  /** hidden as it is typed, with Show and Hide beside it */
  secret?: boolean;
  /** drawn before the words, inside the box: a username's $ */
  prefix?: string;
  /** a line under the box: what is wrong, or what it is for */
  note?: string;
  bad?: boolean;
  /** anything at the box's right, after Show */
  right?: ReactNode;
  testID?: string;
} & Pick<TextInputProps, 'autoFocus' | 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'textContentType' | 'returnKeyType' | 'onSubmitEditing' | 'autoCorrect' | 'maxLength'>;

export const TextBox = forwardRef<TextInput, TextBoxProps>(function TextBox({ label, value, onChangeText, placeholder, secret, prefix, note, bad, right, testID, ...input }, ref) {
  const p = usePalette();
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          backgroundColor: p.card,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          borderWidth: 1,
          borderColor: bad ? p.bad : focus ? p.ruleStrong : p.rule,
          gap: 2,
        }}
      >
        <Caption tone="tertiary">{label}</Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {prefix ? <Label style={{ color: p.secondary }}>{prefix}</Label> : null}
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={p.tertiary}
            secureTextEntry={!!secret && !shown}
            autoCapitalize={input.autoCapitalize ?? 'none'}
            autoCorrect={input.autoCorrect ?? false}
            accessibilityLabel={label}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            testID={testID}
            style={{ flex: 1, fontSize: 16, lineHeight: 24, height: 28, padding: 0, color: p.ink, ...font('600') }}
            {...input}
          />
          {secret ? (
            <Pressable onPress={() => setShown(s => !s)} accessibilityRole="button" accessibilityLabel={shown ? 'Hide the password' : 'Show the password'} hitSlop={10}>
              <Caption style={{ color: p.secondary }}>{shown ? 'Hide' : 'Show'}</Caption>
            </Pressable>
          ) : null}
          {right}
        </View>
      </View>
      {note ? <Caption style={{ color: bad ? p.bad : p.secondary }}>{note}</Caption> : null}
    </View>
  );
});
