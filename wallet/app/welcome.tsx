/* Opening an account. Taken from the Start frame: a blue blob bleeding down
   from the top edge, the four words the bank is for stacked low with only the
   one you are on in ink and its glyph in the gutter beside it, then the mark,
   the pitch and the two ways in. Everything hangs off the bottom of the screen,
   not the top. The word being pointed at moves on its own, and stays still for
   anyone who has asked for less movement. */
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Body, Button, Display, Icon, Pane, Row, Wash, colour, space, washes, useStill } from '../src/design';
import { useGo } from '../src/features/onboarding/useGo';
import { useSessionRedirect } from '../src/features/onboarding/useGuard';

const WORDS = [
  { word: 'Save', icon: 'pot' },
  { word: 'Send', icon: 'send' },
  { word: 'Spend', icon: 'card' },
  { word: 'Ask', icon: 'mark' },
] as const;

export default function Welcome() {
  const go = useGo();
  useSessionRedirect();
  const still = useStill();
  const [on, setOn] = useState(1);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setOn(i => (i + 1) % WORDS.length), 1600);
    return () => clearInterval(t);
  }, [still]);
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      <Wash tone={washes.start.tone} height={washes.start.height} />
      <Pane leaving={go.leaving} style={{ flex: 1, paddingHorizontal: space.s5, paddingBottom: 36 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            paddingBottom: 32,
            gap: 4,
          }}
        >
          {WORDS.map((w, i) => (
            <View key={w.word} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36 }}>{i === on ? <Icon name={w.icon} size={22} colour={colour.accent} /> : null}</View>
              <Display tone={i === on ? 'ink' : 'tertiary'}>{w.word}</Display>
            </View>
          ))}
        </View>
        <View style={{ gap: space.s3, marginBottom: space.s5 }}>
          <Icon name="mark" size={40} colour={colour.accent} />
          <Display>Beetle</Display>
          <Body tone="tertiary">A bank that answers when you ask it something. Opening one takes about a minute, and all it needs is your number and your NIN.</Body>
        </View>
        <Button label="Open an account" onPress={() => go.push('/phone')} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: space.s4,
          }}
        >
          <Body tone="tertiary">Already have one?</Body>
          <Pressable onPress={() => go.push('/sign-in')} accessibilityRole="button">
            <Row tone="accent">Sign in</Row>
          </Pressable>
        </View>
      </Pane>
    </View>
  );
}
