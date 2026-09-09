/* Passcode keypad — 353 by 352 in the file. Keys are 76 square on a three by
   four grid, columns 84 apart and rows 76 apart, digits 20 semibold, with the
   delete glyph in the last cell. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Head } from './text';
import { colour } from './tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function Keypad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <View style={{ width: 353, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
      {KEYS.map((k, i) => (
        <Pressable
          key={i}
          accessibilityRole={k ? 'button' : undefined}
          accessibilityLabel={k === 'del' ? 'Delete' : k || undefined}
          disabled={!k}
          onPress={() => k && onKey(k)}
          style={({ pressed }) => ({
            width: 353 / 3, height: 76, alignItems: 'center', justifyContent: 'center',
            opacity: pressed && k ? 0.4 : 1,
          })}
        >
          {k === 'del' ? <Icon name="del" size={28} colour={colour.ink} /> : k ? <Head>{k}</Head> : null}
        </Pressable>
      ))}
    </View>
  );
}

/* The dots above a passcode as it is typed. */
export function Pips({ of = 6, filled }: { of?: number; filled: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignSelf: 'center' }}>
      {Array.from({ length: of }).map((_, i) => (
        <View key={i} style={{
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: i < filled ? colour.ink : 'transparent',
          borderWidth: i < filled ? 0 : 2, borderColor: colour.ruleStrong,
        }} />
      ))}
    </View>
  );
}
