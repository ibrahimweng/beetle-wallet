/* The way in is a stack of steps. A step that is not the one you are on — done
   or still ahead — is a 24 glyph in ink with a 16 grey label 36 in, and they sit
   20 apart. The step you are on is a 32 glyph, a 32 bold title, and a 14 regular
   line under it — a smaller line than the Page head component uses, so this is
   its own head, not that one. The frames put the steps behind you above the head
   and the ones ahead below it, drawn the same way. */
import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Body, Display, Meta } from './text';
import { IconName } from '../icons';

export type TrailStep = { icon: IconName; label: string };

export function StepTrail({ done }: { done: TrailStep[] }) {
  if (!done.length) return null;
  return (
    <View style={{ gap: 20 }}>
      {done.map(s => (
        <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name={s.icon} size={24} />
          <Body tone="tertiary">{s.label}</Body>
        </View>
      ))}
    </View>
  );
}

/** The same rows, for the steps still ahead of you. */
export const StepsAhead = StepTrail;

/* The glyph on the step you are on carries the same colour as the blob at the
   top of the screen — cyan for the number, purple for the name, pink for the
   face. Behind and ahead of it the same glyph is ink. */
export function StepHead({
  icon,
  title,
  sub,
  tint,
}: {
  icon: IconName;
  title: string;
  sub: string;
  tint?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Icon name={icon} size={32} colour={tint} />
      <Display>{title}</Display>
      <Meta tone="secondary">{sub}</Meta>
    </View>
  );
}
