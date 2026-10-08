/* Passcode keypad, at the two sizes the file draws it.

   On the way in it is 252 by 296: cells 84 across and 76 down, each key a 68
   circle of the pale grey. Measured off the Sign in frame, where the first row
   of circles runs 79 to 145 across and 532 to 599 down.

   On the sheet that takes your passcode before money moves it is bigger — 300
   by 352, cells 100 across, keys of 76 with 16 between the rows — because
   that is the one you use with the phone in one hand. Measured off the
   passcode sheet: discs at 68 to 144 across and 424 to 500 down, the next
   row 92 lower.

   For an amount it is 282 by 344: keys of 74 with 20 between the columns
   and 16 between the rows, and 000 where the face key would be, so a round
   figure is three taps. Measured off the Change the amount frame: keys at
   66, 160 and 254 across and 254, 344, 434 and 524 down. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Head } from './text';
import { colour, dark } from './tokens';
import { night, useScheme } from './scheme';
import { Tap } from './motion';

/** The pad on the page, or on the dark card before money moves. */
export type PadTone = 'light' | 'dark';
/** A cell's size: its width and height, the disc in it, and the room between rows. */
export type PadCell = { w: number; h: number; key: number; gap: number };
/** The passcode sheet's pad, as big as it can be: the frame's 76 keys where there is room, then a snug 68 and a small 60. */
export const PAD_CELLS = {
  big: { w: 100, h: 76, key: 76, gap: 16 },
  snug: { w: 100, h: 70, key: 66, gap: 8 },
  small: { w: 96, h: 60, key: 56, gap: 6 },
} as const satisfies Record<string, PadCell>;
export const padHeight = (c: PadCell) => c.h * 4 + c.gap * 3;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'face', '0', 'del'] as const;
const AMOUNT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'] as const;

/* The face key sits in the bottom left where the frame leaves a gap, and is
   only drawn when the screen has something for it to do; on the amount pad
   the 000 key sits there instead. */
export function Keypad({
  onKey,
  onFace,
  big = false,
  zeros = false,
  tone,
  size,
}: {
  onKey: (k: string) => void;
  onFace?: () => void;
  big?: boolean;
  /** the amount pad, with 000 */ zeros?: boolean;
  tone?: PadTone;
  /** the cell, where the screen has worked out how much room there is */
  size?: PadCell;
}) {
  const cell = size ?? (zeros ? { w: 94, h: 74, key: 74, gap: 16 } : big ? PAD_CELLS.big : { w: 84, h: 76, key: 68, gap: 0 });
  const keys: readonly string[] = zeros ? AMOUNT_KEYS : KEYS;
  /* no tone asked for: the scheme's, the way in's dark keys a step up from its ground (Round 27) */
  const onNight = useScheme() === 'dark' && !tone;
  const ink = onNight ? night.ink : tone === 'dark' ? dark.paper : colour.ink;
  const disc = onNight ? night.panel2 : tone === 'dark' ? dark.edge : colour.surface2;
  return (
    <View style={{ width: cell.w * 3, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', rowGap: cell.gap }} testID="keypad">
      {keys.map((k, i) => {
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
export function Pips({ of = 6, filled, align = 'center', tone }: { of?: number; filled: number; align?: 'center' | 'left'; tone?: PadTone }) {
  const onNight = useScheme() === 'dark' && !tone;
  const full = onNight ? night.ink : tone === 'dark' ? dark.paper : colour.ink;
  const ring = onNight ? night.ruleStrong : tone === 'dark' ? dark.edgeStrong : colour.ruleStrong;
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
