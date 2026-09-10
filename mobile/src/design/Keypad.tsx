/* Passcode keypad, at the two sizes the file draws it.

   On the way in it is 252 by 296: cells 84 across and 76 down, each key a 68
   circle of the pale grey. Measured off the Sign in frame, where the first row
   of circles runs 79 to 145 across and 532 to 599 down.

   On the sheet that takes your passcode before money moves it is bigger — 300
   by 352, cells 100 by 92 and keys of 77 — because that is the one you use
   with the phone in one hand. Measured off the Face ID did not catch you
   frame: discs at 68 to 144 across and 424 to 499 down. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Head } from './text';
import { colour } from './tokens';
import { Tap } from './motion';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'face', '0', 'del'] as const;

/* The face key sits in the bottom left where the frame leaves a gap, and is
   only drawn when the screen has something for it to do. */
export function Keypad({
  onKey,
  onFace,
  big = false,
}: {
  onKey: (k: string) => void;
  onFace?: () => void;
  big?: boolean;
}) {
  const cell = big ? { w: 100, h: 92, key: 77 } : { w: 84, h: 76, key: 68 };
  return (
    <View style={{ width: cell.w * 3, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
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
              width: cell.w,
              height: cell.h,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: cell.key,
                height: cell.key,
                borderRadius: cell.key / 2,
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

/* The dots above a passcode as it is typed — 14 across, 20 apart, as the sheet
   frames draw them. */
export function Pips({ of = 6, filled }: { of?: number; filled: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 20, alignSelf: 'center' }}>
      {Array.from({ length: of }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: i < filled ? colour.ink : 'transparent',
            borderWidth: i < filled ? 0 : 2,
            borderColor: colour.ruleStrong,
          }}
        />
      ))}
    </View>
  );
}
