/* Is this you. The record comes back and you say yes, or that it is wrong. */
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Body, BottomBar, Button, Card, Meta, More, Row, Screen, StepHead, StepTrail, space, washes } from '../../src/design';
import { NUMBER } from '../../src/features/onboarding/steps';
import { useApp } from '../../src/features/onboarding/store';
import { useStepGuard } from '../../src/features/onboarding/useGuard';
import { initialsOf, longDate } from '../../src/lib/format';

export default function Confirm() {
  const router = useRouter();
  const app = useApp();
  const allowed = useStepGuard('confirm');
  const id = app.progress.identity;
  if (!allowed || !id) return null;
  const { record } = id;
  const name = `${record.firstName} ${record.lastName}`;
  return (
    <Screen
      sink
      wash={washes.who}
      dock={
        <BottomBar onBack={() => router.back()}>
          <Button
            label="Yes, that is me"
            onPress={async () => {
              await app.confirmIdentity();
              router.push('/face');
            }}
          />
        </BottomBar>
      }
    >
      <StepTrail done={[NUMBER]} />
      <StepHead icon="id-filled" title="Who you are" sub="This came back from the record against those digits. I did not type it." tint={washes.who.tone} />
      <Card style={{ gap: space.s4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <Avatar initials={initialsOf(name)} />
          <View style={{ gap: 2 }}>
            <Row>{name}</Row>
            <Meta tone="secondary">Born {longDate(record.born)}</Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s3 }}>
          <Body tone="secondary">On the record as</Body>
          <Row>{record.recordName}</Row>
        </View>
      </Card>
      <More label="Something here is wrong" onPress={() => router.push({ pathname: '/no-match', params: { number: id.number } })} />
    </Screen>
  );
}
