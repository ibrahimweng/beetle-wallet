/* The big-number pad. Three columns 94 apart and four rows 90 apart on the
   frame, with 000 in the bottom left and delete on the right. The first key
   pressed replaces what is there rather than appending to it, because a
   figure that arrives filled in is a suggestion, not something you are
   halfway through typing. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Caption, Display, Head, Body } from './text';
import { space } from './tokens';
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', width: 353 }}>
        {KEYS.map(k => (
          <Tap
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k === 'del' ? 'Delete' : k}
            onPress={() => press(k)}
            style={{
              width: 353 / 3,
              height: 90,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {k === 'del' ? <Icon name="del" size={32} /> : <Head>{k}</Head>}
          </Tap>
        ))}
      </View>
    </View>
  );
}
