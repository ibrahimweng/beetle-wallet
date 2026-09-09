/* The way in is a stack of steps. A step already behind you is a 24 glyph with
   a 16 regular label 36 in, and they sit 40 apart. The step you are on is a 32
   glyph, a 32 bold title, and a 14 regular line under it — which is a smaller
   line than the Page head component uses, so this is its own head, not that one. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Body, Display, Meta } from './text';
import { IconName } from '../icons';
import { colour } from './tokens';

export type TrailStep = { icon: IconName; label: string };

export function StepTrail({ done }: { done: TrailStep[] }) {
  if (!done.length) return null;
  return (
    <View style={{ gap: 20 }}>
      {done.map(s => (
        <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name={s.icon} size={24} colour={colour.textTertiary} />
          <Body tone="tertiary">{s.label}</Body>
        </View>
      ))}
    </View>
  );
}

export function StepHead({ icon, title, sub }: { icon: IconName; title: string; sub: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Icon name={icon} size={32} />
      <Display>{title}</Display>
      <Meta tone="secondary">{sub}</Meta>
    </View>
  );
}
