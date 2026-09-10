/* Bubble — the set's four variants.
     who = You | You · typed        black, 20 radius, 16 semibold white
     who = Beetle                   accent wash, 16 radius, 16 regular ink
     who = Beetle · with a title    the same, with a 14 semibold title over
                                    12 regular secondary */
import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Label, Row } from './text';
import { colour, radius } from './tokens';

type Who = 'You' | 'You · typed' | 'Beetle';

export function Bubble({
  who = 'Beetle',
  title,
  children,
}: {
  who?: Who;
  title?: string;
  children: React.ReactNode;
}) {
  const mine = who !== 'Beetle';
  if (mine) {
    return (
      <View
        style={{
          alignSelf: 'flex-end',
          maxWidth: '82%',
          backgroundColor: colour.ink,
          borderRadius: radius.lg,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <Row tone="inverse">{children}</Row>
      </View>
    );
  }
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: '92%',
        backgroundColor: colour.accentWash,
        borderRadius: radius.md,
        paddingVertical: title ? 12 : 16,
        paddingHorizontal: 16,
        gap: title ? 4 : 0,
      }}
    >
      {title ? <Label>{title}</Label> : null}
      {title ? <Caption tone="secondary">{children}</Caption> : <Body>{children}</Body>}
    </View>
  );
}
