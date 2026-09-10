/* Opening an account. Taken from the Start frame: a blue blob bleeding down
   from the top edge, the four words the bank is for stacked low with only the
   one you are on in ink and its glyph in the gutter beside it, then the mark,
   the pitch and the two ways in. Everything hangs off the bottom of the screen,
   not the top.

   The word being pointed at moves on its own, which is the frame's four
   variants read as one thing. It starts on Send, which is the variant the
   design shows, and it stays there for anyone who has asked for less movement. */
import React from 'react';
import { Body, Button, Display, Icon, Row, Wash, colour, space, washes } from '../design';
import { useStill } from '../design/motion';
import { Pressable, View } from 'react-native';

const WORDS = [
  { word: 'Save', icon: 'pot' },
  { word: 'Send', icon: 'send' },
  { word: 'Spend', icon: 'card' },
  { word: 'Ask', icon: 'mark' },
] as const;

export function Start({ go }: { go: (r: 'number' | 'signin') => void }) {
  const still = useStill();
  const [on, setOn] = React.useState(1);
  React.useEffect(() => {
    if (still) return;
    const t = setInterval(() => setOn(i => (i + 1) % WORDS.length), 1600);
    return () => clearInterval(t);
  }, [still]);
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      <Wash tone={washes.start.tone} height={washes.start.height} />
      <View style={{ flex: 1, paddingHorizontal: space.s5, paddingBottom: 36 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 32, gap: 4 }}>
          {WORDS.map((w, i) => (
            <View key={w.word} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36 }}>
                {i === on ? <Icon name={w.icon} size={22} colour={colour.accent} /> : null}
              </View>
              <Display tone={i === on ? 'ink' : 'tertiary'}>{w.word}</Display>
            </View>
          ))}
        </View>
        <View style={{ gap: space.s3, marginBottom: space.s5 }}>
          <Icon name="mark" size={40} colour={colour.accent} />
          <Display>Beetle</Display>
          <Body tone="tertiary">
            A bank that answers when you ask it something. Opening one takes about a minute, and all it needs
            is your number and your NIN.
          </Body>
        </View>
        <Button label="Open an account" onPress={() => go('number')} />
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
          <Pressable onPress={() => go('signin')} accessibilityRole="button">
            <Row tone="accent">Sign in</Row>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
