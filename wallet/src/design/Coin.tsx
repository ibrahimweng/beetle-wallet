/* The brand's two coins (Round 27), drawn from the owner's own models
   (coin-hole.glb and coin-logo-text.glb) and rendered turning, so every
   phone shows the same clay, the same light and the same ease.

   The punch-holed coin belongs to the way in and the opening: it turns all
   the way round every three seconds, easing in and out, the soft blur under
   it travelling round its rim with it, on the way in's own dark.
   The coin with the logo and its words belongs to a confirmed transaction:
   a turn and a half, slowing, landing face on, once; it is cut out, so it
   sits on the light sheet and on the chat's dark alike.

   Both are pictures, a box of the size asked for, so a coin takes a glyph's
   place without moving anything. With motion reduced each is still: the
   holed coin face on, the logo coin landed. */
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useStill } from './motion';

const LOOP = require('../../assets/brand/coin-hole-loop.webp');
const LOOP_STILL = require('../../assets/brand/coin-hole-still.jpg');
const TURN = require('../../assets/brand/coin-logo-turn.webp');
const TURN_STILL = require('../../assets/brand/coin-logo-face.png');

/** The way in's coin, turning for as long as it is there. `size` is the picture's square; the coin fills 80% of it. */
export function CoinLoop({ size, testID = 'coin' }: { size: number; testID?: string }) {
  const still = useStill();
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID}>
      <Image source={still ? LOOP_STILL : LOOP} style={{ width: size, height: size }} contentFit="contain" autoplay={!still} />
    </View>
  );
}

/** A confirmed transaction's coin, turning once as it arrives. */
export function CoinTurn({ size, testID = 'coin' }: { size: number; testID?: string }) {
  const still = useStill();
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID}>
      <Image source={still ? TURN_STILL : TURN} style={{ width: size, height: size }} contentFit="contain" autoplay={!still} />
    </View>
  );
}
