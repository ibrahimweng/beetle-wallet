/* Passcode keypad — 252 by 296 in the file, centred. The grid is three by four,
   cells 84 across and 76 down, and each key is a 68 circle of the pale grey
   sitting in the middle of its cell. Digits are 20 semibold, and the delete
   glyph takes the last cell. Measured off the Sign in frame: the first row of
   circles runs 79 to 145 across and 532 to 599 down. */
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
    <View style={{ width: 252, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
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
              width: 84,
              height: 76,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                alignItems: 'center',
                justifyContent: 'center',
                /* the two glyph keys sit on the page itself; only digits get the disc */
                backgroundColor: k === 'del' || k === 'face' ? 'transparent' : colour.surface2,
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
            </View>
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
