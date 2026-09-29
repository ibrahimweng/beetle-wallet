/* Past your own limit, from its frame: what the line looks like when a
   transfer crosses it. The passcode is done; the three words are typed in
   full, letter by letter, and the button waits for the last one. Reached
   from Spending limits to be looked at, so nothing here sends anything. */
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, BigStatus, BottomBar, Button, Caption, Card, ChoiceRow, PageHead, Row, Screen, Step, colour, radius, toast } from '../../design';
import { useSessionGuard } from '../onboarding/useGuard';
import { LAB } from '../../lab/enabled';
import { typedState } from './words';

export function LimitStop() {
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ typed?: string }>();
  /* the lab opens it mid-word, as the frame draws it */
  const [typed, setTyped] = useState(LAB && asked.typed === '1' ? 'Confirm this transa' : '');
  const input = useRef<TextInput>(null);
  if (!ok) return null;
  const st = typedState(typed);
  const looked = (what: string) => () => {
    toast(`${what} Nothing was sent: this is what the line looks like.`);
    router.back();
  };
  return (
    <Screen
      dock={
        <BottomBar onBack={() => router.back()}>
          <Button label="Send ₦120,000" disabled={!st.done} onPress={looked('And it would go.')} />
        </BottomBar>
      }
      head={<PageHead title="Past your own limit" sub="Nothing has been sent" />}
    >
      {/* the frame sets the banner 11 under the line, and the choice 16 under the card */}
      <View style={{ marginBottom: -8 }}>
        <BigStatus glyph="warn-filled" tone={colour.good} amount="₦120,000" line="₦20,000 over the ₦100,000 you set for one transfer" />
      </View>
      <Banner glyph="warn-filled" ink={colour.good} text="This is your limit, not the bank’s. Two things and it goes." testID="banner" />
      <Card style={s.steps} testID="steps">
        <Step n={1} done right={<Caption style={{ fontWeight: '600' }}>Done</Caption>}>
          Your passcode
        </Step>
        <View style={{ gap: 12, paddingVertical: 16 }}>
          <Step n={2}>Now type the words in full</Step>
          <View style={{ paddingLeft: 40, gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="The words so far" onPress={() => input.current?.focus()} style={s.field} testID="words">
              <Row>{typed}</Row>
              {st.done ? null : <View style={s.caret} />}
              <Row tone="tertiary">{st.rest}</Row>
              <TextInput
                ref={input}
                accessibilityLabel="Type the three words"
                value={typed}
                onChangeText={setTyped}
                autoCorrect={false}
                autoCapitalize="sentences"
                spellCheck={false}
                style={s.input}
              />
            </Pressable>
            <Caption tone={st.right ? 'secondary' : 'bad'}>{st.line}</Caption>
          </View>
        </View>
      </Card>
      <View style={{ marginTop: -4 }}>
        <ChoiceRow glyph="send" title="Send ₦100,000 instead" sub="The rest tomorrow, no typing" onPress={looked('₦100,000 would go now, the rest tomorrow.')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  steps: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colour.surface },
  caret: { width: 2, height: 20, backgroundColor: colour.ink, marginHorizontal: 1 },
  /* the field itself, over the words and out of sight: the keyboard types into it */
  input: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, color: 'transparent', fontSize: 16 },
});
