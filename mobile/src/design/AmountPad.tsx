/* The big-number pad — 282 by 342, centred. Three columns 94 apart and four
   rows 90 apart, each digit on a 72 disc of the pale grey; delete sits on the
   page itself. The first key pressed replaces what is there rather than
   appending to it, because a figure that arrives filled in is a suggestion,
   not something you are halfway through typing. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Caption, Display, Head, Body } from './text';
import { colour, space } from './tokens';
import { Tap } from './motion';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'] as const;

export function AmountPad({
  value,
  onChange,
  heard,
  heardLabel = 'I heard',
}: {
  value: number;
  onChange: (n: number) => void;
  heard?: string;
  heardLabel?: string;
}) {
  const [fresh, setFresh] = useState(true);
  const press = (k: string) => {
    if (k === 'del') {
      setFresh(false);
      return onChange(Math.floor(value / 10));
    }
    const add = k === '000' ? '000' : k;
    const next = fresh ? Number(add) : Number(String(value) + add);
    setFresh(false);
    onChange(Math.min(next, 99999999));
  };
  return (
    <View style={{ gap: space.s5 }}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        {heard ? <Caption tone="secondary">{heardLabel}</Caption> : null}
        {heard ? <Body tone="secondary">{heard}</Body> : null}
        <Display>{'₦' + value.toLocaleString('en-NG')}</Display>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', width: 282 }}>
        {KEYS.map(k => (
          <Tap
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k === 'del' ? 'Delete' : k}
            onPress={() => press(k)}
            style={{
              width: 94,
              height: 90,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: k === 'del' ? 'transparent' : colour.surface2,
              }}
            >
              {k === 'del' ? <Icon name="del" size={32} /> : <Head>{k}</Head>}
            </View>
          </Tap>
        ))}
      </View>
    </View>
  );
}
