/* The card where money is about to move, once it is ready (Round 44, the
   owner's word: it should say this is not just any action). Every Slide to
   wraps its card in this: the beam's light blooms out around the card's
   edge and breathes, from the moment the slide can be slid, and lets go
   while the passcode or another sheet is up, or the money has gone. It adds
   no step and covers nothing: the light is behind and around the card,
   under nothing a finger needs. (Inside the edge, the card's white panels
   hid it: Border beam's pulse-outside, not pulse-inner.) */
import React, { type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Beam } from './Beam';

export function ReadyGlow({ ready, radius = 24, style, testID, children }: { ready: boolean; radius?: number; style?: StyleProp<ViewStyle>; testID?: string; children: ReactNode }) {
  return (
    <Beam kind="pulse-outside" active={ready} radius={radius} theme="light" strength={1} style={style} testID={testID}>
      {children}
    </Beam>
  );
}
