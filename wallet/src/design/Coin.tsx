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
   holed coin face on, the logo coin landed.

   Round 37, the owner's word: on a receipt the logo coin is the middle of
   it, bigger, turning for as long as the receipt is up, once round every
   three seconds with the same ease in and out as the holed coin, the soft
   blur travelling round its rim, and a soft warm light behind it that
   swells and settles with each turn. */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useStill } from './motion';

const LOOP = require('../../assets/brand/coin-hole-loop.webp');
const LOOP_STILL = require('../../assets/brand/coin-hole-still.jpg');
const TURN = require('../../assets/brand/coin-logo-turn.webp');
const TURN_STILL = require('../../assets/brand/coin-logo-face.png');
const HERO = require('../../assets/brand/coin-logo-loop.webp');
const HERO_STILL = require('../../assets/brand/coin-logo-still.png');
/** one turn of the hero coin, as it was rendered: 72 frames at 24 a second */
const HERO_TURN = 3000;

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

/** A confirmed transaction's coin at the middle of its receipt: turning on a loop, a soft warm light breathing behind it. */
export function CoinHero({ size, testID = 'coin' }: { size: number; testID?: string }) {
  const still = useStill();
  const breath = useSharedValue(0);
  useEffect(() => {
    if (!still) breath.value = withRepeat(withTiming(1, { duration: HERO_TURN / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [still, breath]);
  const glow = useAnimatedStyle(() => ({ opacity: 0.6 + breath.value * 0.4, transform: [{ scale: 0.9 + breath.value * 0.14 }] }));
  const halo = size * 1.7;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID}>
      <Animated.View style={[{ position: 'absolute', width: halo, height: halo, left: (size - halo) / 2, top: (size - halo) / 2 }, glow]}>
        <Svg width={halo} height={halo}>
          <Defs>
            <RadialGradient id="coin-halo" cx="50%" cy="52%" r="50%">
              <Stop offset="0" stopColor="#f5a524" stopOpacity="0.32" />
              <Stop offset="0.45" stopColor="#fde8df" stopOpacity="0.55" />
              <Stop offset="1" stopColor="#fde8df" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={halo / 2} cy={halo / 2} r={halo / 2} fill="url(#coin-halo)" />
        </Svg>
      </Animated.View>
      <Image source={still ? HERO_STILL : HERO} style={StyleSheet.absoluteFill} contentFit="contain" autoplay={!still} />
    </View>
  );
}
