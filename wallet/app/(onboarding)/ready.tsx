/* The account exists. Drawn from the ready frame: the four steps behind you,
   a green tick beside the news, the five things an account can do in one card
   with the two that are not on yet ringed rather than ticked, and the card
   that finishes setting up, outlined so it reads as a door rather than a
   fact. The ticks land one after another, the way a checklist finishes. The step guards send a fresh session here once; "Take me in" clears
   the way in, so every open after this goes straight home. */
import React from 'react';
import { View } from 'react-native';
import { BottomBar, Button, Caption, Card, Divider, Head, Icon, Label, Meta, Screen, StepTrail, Tap, Tick, colour, motion, space, toast } from '../../src/design';
import { FACE, NUMBER, PASS, WHO } from '../../src/features/onboarding/steps';
import { useApp } from '../../src/features/onboarding/store';
import { useSessionGuard } from '../../src/features/onboarding/useGuard';
import { useGo } from '../../src/features/onboarding/useGo';
import { groupAccount } from '../../src/lib/format';

const CAN: { text: string; on: boolean }[] = [
  { text: 'Receive money from any Nigerian bank', on: true },
  { text: 'Send up to ₦50,000 a day', on: true },
  { text: 'Buy airtime, data and pay bills', on: true },
  { text: 'Hold dollars', on: false },
  { text: 'Send up to ₦1,000,000 a day', on: false },
];

export default function Ready() {
  const go = useGo();
  const app = useApp();
  const { session } = app;
  const ok = useSessionGuard();
  if (!ok || !session) return null;
  const number = groupAccount(session.account.accountNumber);
  return (
    <Screen
      sink
      leaving={go.leaving}
      dock={
        <BottomBar>
          <Button
            label="Take me in"
            onPress={async () => {
              await app.startOver();
              go.replace('/home');
            }}
          />
        </BottomBar>
      }
    >
      <StepTrail done={[NUMBER, WHO, FACE, PASS]} />
      <View style={{ flexDirection: 'row', gap: space.s3 }}>
        <Tick on size={24} delay={motion.markWait} />
        <View style={{ flex: 1, gap: 4 }}>
          <Head>Your account is ready</Head>
          <Meta tone="secondary">Your number is {number}, and money can reach it now.</Meta>
        </View>
      </View>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {CAN.map((c, i) => (
          <React.Fragment key={c.text}>
            {i ? <Divider /> : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s3,
                height: 50,
              }}
            >
              <Tick on={c.on} size={24} delay={motion.markWait + 90 * (i + 1)} />
              <Meta tone={c.on ? 'ink' : 'tertiary'} style={{ flex: 1 }}>
                {c.text}
              </Meta>
            </View>
          </React.Fragment>
        ))}
      </Card>
      <Tap accessibilityRole="button" onPress={() => toast('Finishing up is the next flow to build.')}>
        <Card
          outline
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.s3,
            paddingVertical: space.s3,
            borderRadius: 16,
          }}
        >
          <Icon name="shield-filled" size={24} colour={colour.ink} />
          <View style={{ flex: 1, gap: 2 }}>
            <Label>Finish setting up</Label>
            <Caption tone="tertiary">Two minutes, and the last two come on</Caption>
          </View>
          <Icon name="chevron" size={16} colour={colour.textTertiary} />
        </Card>
      </Tap>
    </Screen>
  );
}
