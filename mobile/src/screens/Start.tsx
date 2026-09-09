/* Opening an account. Taken from the Start frame: the four words stacked at
   the top with only the last in ink, the wordmark and the pitch low down. */
import React from 'react';
import { Body, Button, Display, Icon, Row, colour, frame, space } from '../design';
import { View } from 'react-native';
import { Pressable } from 'react-native';

export function Start({ go }: { go: (r: 'number' | 'signin') => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface, paddingHorizontal: frame.sidePad, paddingTop: frame.topPad, paddingBottom: 40 }}>
      <View style={{ gap: 4 }}>
        <Display tone="tertiary">Save</Display>
        <Display tone="tertiary">Send</Display>
        <Display tone="tertiary">Spend</Display>
        <Display>Ask</Display>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ gap: space.s3, marginBottom: space.s5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <Icon name="mark" size={36} colour={colour.accent} />
          <Display>Beetle</Display>
        </View>
        <Body tone="tertiary">
          A bank that answers when you ask it something. Opening one takes about a minute, and all it needs is your number and your NIN.
        </Body>
      </View>
      <Button label="Open an account" onPress={() => go('number')} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: space.s4 }}>
        <Body tone="tertiary">Already have one?</Body>
        <Pressable onPress={() => go('signin')} accessibilityRole="button">
          <Row tone="accent">Sign in</Row>
        </Pressable>
      </View>
    </View>
  );
}
