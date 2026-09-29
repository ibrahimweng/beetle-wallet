/* Passcode keypad, at the two sizes the file draws it.

   On the way in it is 252 by 296: cells 84 across and 76 down, each key a 68
   circle of the pale grey. Measured off the Sign in frame, where the first row
   of circles runs 79 to 145 across and 532 to 599 down.

   On the sheet that takes your passcode before money moves it is bigger — 300
   by 352, cells 100 across, keys of 76 with 16 between the rows — because
   that is the one you use with the phone in one hand. Measured off the
   passcode sheet: discs at 68 to 144 across and 424 to 500 down, the next
   row 92 lower. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Head } from './text';
import { colour, dark } from './tokens';
import { Tap } from './motion';

/** The pad on the page, or on the dark card before money moves. */
export type PadTone = 'light' | 'dark';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'face', '0', 'del'] as const;

/* The face key sits in the bottom left where the frame leaves a gap, and is
   only drawn when the screen has something for it to do. */
export function Keypad({ onKey, onFace, big = false, tone = 'light' }: { onKey: (k: string) => void; onFace?: () => void; big?: boolean; tone?: PadTone }) {
  const cell = big ? { w: 100, h: 76, key: 76, gap: 16 } : { w: 84, h: 76, key: 68, gap: 0 };
  const ink = tone === 'dark' ? '#ffffff' : colour.ink;
  const disc = tone === 'dark' ? dark.edge : colour.surface2;
  return (
    <View style={{ width: cell.w * 3, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', rowGap: cell.gap }} testID="keypad">
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
                backgroundColor: k === 'del' || k === 'face' ? 'transparent' : disc,
              }}
            >
              {k === 'del' ? (
                <Icon name="del" size={28} colour={ink} />
              ) : k === 'face' ? (
                onFace ? (
                  <Icon name="faceid" size={28} colour={tone === 'dark' ? ink : colour.accent} />
                ) : null
              ) : (
                <Head style={{ color: ink }}>{k}</Head>
              )}
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

/* The dots above a passcode as it is typed — 14 across, 20 apart, as the sheet
   frames draw them. The sheets centre them; the passcode step on the way in
   starts them at the left edge with everything else. */
export function Pips({ of = 6, filled, align = 'center', tone = 'light' }: { of?: number; filled: number; align?: 'center' | 'left'; tone?: PadTone }) {
  const full = tone === 'dark' ? '#ffffff' : colour.ink;
  const ring = tone === 'dark' ? dark.edgeStrong : colour.ruleStrong;
  return (
    <View style={{ flexDirection: 'row', gap: 20, alignSelf: align === 'center' ? 'center' : 'flex-start' }} testID="pips">
      {Array.from({ length: of }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: i < filled ? full : 'transparent',
            borderWidth: i < filled ? 0 : 2,
            borderColor: ring,
          }}
        />
      ))}
    </View>
  );
}
