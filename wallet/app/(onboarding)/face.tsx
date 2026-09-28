/* One photo, and what happens to it. On a phone this asks the device for its
   own face check, so that the same face that opens the phone opens the money.
   Where there is none, it can wait. */
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Aside, BottomBar, Button, Icon, Meta, More, Screen, StepHead, StepTrail, colour, space, washes } from '../../src/design';
import { NUMBER, WHO } from '../../src/features/onboarding/steps';
import { useApp } from '../../src/features/onboarding/store';
import { useStepGuard } from '../../src/features/onboarding/useGuard';
import { useGo } from '../../src/features/onboarding/useGo';

export default function Face() {
  const go = useGo();
  const app = useApp();
  const allowed = useStepGuard('face');
  const [state, setState] = useState<'idle' | 'checking' | 'failed'>('idle');
  if (!allowed) return null;

  const take = async () => {
    setState('checking');
    try {
      if (Platform.OS !== 'web') {
        const can = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
        if (can) {
          const r = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Look at the phone',
            cancelLabel: 'Not now',
            disableDeviceFallback: true,
          });
          if (!r.success) {
            setState('failed');
            return;
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 900));
      }
      await app.setFace('enrolled');
      go.push('/passcode');
    } catch {
      setState('failed');
    }
  };
  const later = async () => {
    await app.setFace('later');
    go.push('/passcode');
  };
  return (
    <Screen
      sink
      wash={washes.face}
      leaving={go.leaving}
      dock={
        <BottomBar onBack={go.back}>
          <Button label={state === 'checking' ? 'Hold still…' : state === 'failed' ? 'Try again' : 'Take it'} disabled={state === 'checking'} onPress={take} />
        </BottomBar>
      }
    >
      <StepTrail done={[NUMBER, WHO]} />
      <StepHead icon="faceid-filled" title="Your face" sub="One photo, checked against the same record, so that only you can open this again." tint={washes.face.tone} />
      <View
        style={{
          alignItems: 'center',
          gap: space.s5,
          paddingVertical: space.s6,
        }}
      >
        <Icon name={state === 'failed' ? 'alert' : 'person'} size={56} colour={state === 'failed' ? colour.bad : colour.textTertiary} />
        <Meta tone={state === 'failed' ? 'bad' : 'secondary'}>{state === 'failed' ? 'That did not take. Hold still and look at the camera.' : 'Hold still and look at the camera'}</Meta>
      </View>
      <Aside glyph="eye">The photo is kept on this phone. It is not a profile picture and nobody else sees it.</Aside>
      <More label="Do it later" onPress={later} />
    </Screen>
  );
}
