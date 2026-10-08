/* What arrival.ts keeps, drawn above every screen: the way in's coin, and
   the dark that covers the way into home and opens onto it. Nothing here
   takes a touch except the dark while it is up, so home cannot be pressed
   before it is shown. */
import React, { useSyncExternalStore } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { CoinLoop, blurred } from '../../design';
import { Cover } from './Cover';
import { burst, coin, snapshot, subscribe } from './arrival';

/** The coin's picture is drawn at the welcome's size and scaled down from there, so it is sharp where it is largest. */
const BASE = 378;
/** The impact on the coin, as parts of the reveal: a dip, then out into the dark's blur. */
const DIP = 0.14;
const GONE = 0.46;

export function ArrivalLayer() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  const { width, height } = useWindowDimensions();
  if (!s.coin && !s.cover) return null;
  return (
    /* the dark takes every touch until it has gone, the oval's opening included: home is not pressed, swiped or pulled
       before it is shown and the tour has begun (Round 29) */
    <View pointerEvents={s.cover ? 'auto' : 'none'} style={StyleSheet.absoluteFill} testID={s.revealing ? 'arrival-opening' : 'arrival'}>
      {s.cover ? <Cover width={width} height={height} /> : null}
      {s.coin ? <TravellingCoin width={width} /> : null}
    </View>
  );
}

function TravellingCoin({ width }: { width: number }) {
  const style = useAnimatedStyle(() => {
    const b = burst.value;
    const punch = b <= 0 ? 1 : b < DIP ? 1 - 0.08 * (b / DIP) : 0.92 + 0.5 * ((b - DIP) / (1 - DIP));
    const fade = b <= DIP ? 1 : Math.max(0, 1 - (b - DIP) / (GONE - DIP));
    const k = (coin.size.value / BASE) * (1 + 0.06 * coin.breath.value) * punch;
    const moving = { opacity: coin.on.value * fade, transform: [{ translateX: width / 2 - BASE / 2 }, { translateY: coin.cy.value - BASE / 2 }, { scale: k }] };
    /* the blur only once the impact has begun: a turning picture under a filter costs every frame it is drawn */
    return b > DIP ? { ...moving, ...blurred((b - DIP) * 24) } : moving;
  });
  /* the picture carries the dark it was made on; cut round, its corners never cover what is beside it */
  return (
    <Animated.View style={[s.coin, style]}>
      <CoinLoop size={BASE} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  coin: { position: 'absolute', left: 0, top: 0, width: BASE, height: BASE, borderRadius: BASE / 2, overflow: 'hidden' },
});
