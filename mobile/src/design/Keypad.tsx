/* Passcode keypad — 353 by 352 in the file. Keys are 76 square on a three by
   four grid, columns 84 apart and rows 76 apart, digits 20 semibold, with the
   delete glyph in the last cell. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Head } from './text';
import { colour } from './tokens';
import { Tap } from './motion';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'face', '0', 'del'] as const;

/* The face key sits in the bottom left where the frame leaves a gap, and is
   only drawn when the screen has something for it to do. */
export function Keypad({ onKey, onFace }: { onKey: (k: string) => void; onFace?: () => void }) {
  return (
    <View style={{ width: 353, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
      {KEYS.map((k, i) => {
        const live = k === 'face' ? !!onFace : !!k;
        return (
          <Tap
            key={i}
            accessibilityRole={live ? 'button' : undefined}
            accessibilityLabel={!live ? undefined : k === 'del' ? 'Delete' : k === 'face' ? 'Use Face ID' : k}
            disabled={!live}
            onPress={() => {
              if (k === 'face') onFace?.();
              else if (k) onKey(k);
            }}
            style={{
              width: 353 / 3,
              height: 76,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {k === 'del' ? (
              <Icon name="del" size={28} colour={colour.ink} />
            ) : k === 'face' ? (
              onFace ? (
                <Icon name="faceid" size={28} colour={colour.ink} />
              ) : null
            ) : (
              <Head>{k}</Head>
            )}
          </Tap>
        );
      })}
    </View>
  );
}

/* The dots above a passcode as it is typed. */
export function Pips({ of = 6, filled }: { of?: number; filled: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignSelf: 'center' }}>
      {Array.from({ length: of }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: i < filled ? colour.ink : 'transparent',
            borderWidth: i < filled ? 0 : 2,
            borderColor: colour.ruleStrong,
          }}
        />
      ))}
    </View>
  );
}
