/* The aims as a list to tick (Round 41): on the way in, right after the
   account is ready, and in Settings to change them. Any number can be
   picked; each row is one tap. Drawn from the scheme it is in, so it sits on
   the way in's dark and on Settings' white alike. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from '../../design/Icon';
import { Caption, Label } from '../../design/text';
import { Tap } from '../../design/motion';
import { Tick } from '../../design/Kit';
import { usePalette } from '../../design/scheme';
import { feel } from '../../design/haptics';
import { radius, space } from '../../design/tokens';
import { AIMS, type AimId } from './aims';

export function AimPicker({ picked, onChange }: { picked: readonly AimId[]; onChange: (aims: AimId[]) => void }) {
  const p = usePalette();
  const flip = (id: AimId) => {
    feel.pick();
    const next = picked.includes(id) ? picked.filter(a => a !== id) : [...picked, id];
    onChange(AIMS.filter(a => next.includes(a.id)).map(a => a.id));
  };
  return (
    <View style={{ gap: space.s2 }} testID="aims">
      {AIMS.map(a => {
        const on = picked.includes(a.id);
        return (
          <Tap
            key={a.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            aria-checked={on}
            accessibilityLabel={a.label}
            onPress={() => flip(a.id)}
            testID={`aim-${a.id}`}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s3,
                paddingVertical: space.s3,
                paddingHorizontal: space.s4,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: on ? p.ink : p.rule,
                backgroundColor: p.field,
              }}
            >
              <Icon name={a.glyph} size={22} colour={on ? p.ink : p.secondary} />
              <View style={{ flex: 1 }}>
                <Label>{a.label}</Label>
                <Caption tone="tertiary">{a.sub}</Caption>
              </View>
              <Tick on={on} size={20} />
            </View>
          </Tap>
        );
      })}
    </View>
  );
}
