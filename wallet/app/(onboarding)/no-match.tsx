/* The record did not match. Nothing is wrong with the person, usually. */
import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AgentSay, BottomBar, Button, Card, Icon, Meta, More, Row, Screen, StepHead, StepTrail, colour, space, toast, washes } from '../../src/design';
import { NUMBER } from '../../src/features/onboarding/steps';
import { groupIdentity } from '../../src/lib/format';

export default function NoMatch() {
  const router = useRouter();
  const { number } = useLocalSearchParams<{ number?: string }>();
  const shown = number ? groupIdentity(number) : 'those digits';
  return (
    <Screen
      sink
      wash={washes.nomatch}
      dock={
        <BottomBar onBack={() => router.back()}>
          <Button label="Try again" onPress={() => router.back()} />
        </BottomBar>
      }
    >
      <StepTrail done={[NUMBER]} />
      <StepHead icon="id-filled" title="Who you are" sub="Eleven digits from your NIN or your BVN. These ones did not match anything." tint={washes.nomatch.tone} />
      <Card style={{ gap: space.s4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4 }}>
          <Icon name="warn-filled" size={28} colour={colour.warn} />
          <Row>Nothing came back</Row>
        </View>
        <Meta tone="secondary">No record matches {shown}. One wrong digit is the usual reason, so it is worth reading them again.</Meta>
      </Card>
      <AgentSay>If the digits are right and it still says this, your BVN will work instead. It is the same eleven digits from a different register.</AgentSay>
      <More label="Talk to someone" onPress={() => toast('Support opens here once the chat is built.')} />
    </Screen>
  );
}
