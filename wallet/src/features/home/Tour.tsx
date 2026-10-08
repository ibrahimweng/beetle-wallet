/* Home's tour, drawn over the page and the bar alike (Round 28, the
   owner's word: a first-time tour, skippable; this is its first version).

   Four things, one at a time: the card, which pulls down into the chat; Send
   and Receive; Activities; and the place to ask. The rest of the screen
   goes under the way in's dark with the thing being shown cut out of it,
   and a card beside it says what it is, with Next. Skip is at the top the
   whole time. On the card the card dips, as it does the first time, so the
   pull is seen; for the place to ask, the chat opens, and closes again at
   the end. Nothing under the dark can be pressed while it is up. */
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button, Caption, Head, Label, Meta, away, blurred, colour, dark, motion, settle, useStill } from '../../design';
import { endTour, subscribeTour, tourHands, tourState } from './tour';
import { around, measureSpot, type Rect, type SpotId } from './spots';
import { Spotlight } from './Spotlight';
import { markChatPointedOut } from './first';
import { tabs } from '../tabs';

type Step = {
  spots: SpotId[];
  title: string;
  line: string;
  /** the hole's corners, and how far it stands off the thing round it */
  radius: number;
  pad: number;
  act?: 'dip' | 'open';
};

export const TOUR: Step[] = [
  { spots: ['card'], title: 'Pull the card down', line: 'It opens into a chat with me, the whole screen. Push it back up to close it.', radius: 40, pad: 0, act: 'dip' },
  { spots: ['send', 'receive'], title: 'Send and Receive', line: 'Send to any bank in Nigeria. Receive gives you your account number to share.', radius: 26, pad: 8 },
  { spots: ['activities'], title: 'Activities', line: 'Every naira in and out, and what I noticed about it, on the page next door.', radius: 26, pad: 4 },
  { spots: ['ask'], title: 'Ask me anything', line: 'Type it the way you would say it: “How much did I spend on food?” or “Send 5,000 to Ada.”', radius: 28, pad: 6, act: 'open' },
];

/** how long the chat takes to open before the place to ask is where it stays */
const OPENING = 760;
/** the first step waits for home to have come in, so the card is measured where it rests */
const SETTLE = 360;
/** how often the card dips while it is the one shown */
const DIP_EVERY = 3200;
const GAP = 14;
const SIDE = 24;

export function TourHost() {
  const state = useSyncExternalStore(subscribeTour, tourState, tourState);
  /* the app's screens going (signing out from the lock, the lab) put a tour that was up or waiting away with them, so
     the next home does not open with it (Round 29) */
  useEffect(
    () => () => {
      if (tourState() !== 'idle') endTour();
    },
    [],
  );
  return state === 'on' ? <Tour /> : null;
}

function Tour() {
  const still = useStill();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [at, setAt] = useState(0);
  const [place, setPlace] = useState<Rect | null>(null);
  const opened = useRef(false);
  const placed = useRef(false);
  const ending = useRef(false);
  const shown = useSharedValue(0);
  const hole = { x: useSharedValue(width / 2), y: useSharedValue(height / 2), w: useSharedValue(0), h: useSharedValue(0), r: useSharedValue(0) };

  useEffect(() => {
    /* the tour is home's: if a swipe got another page up first, home comes back for it */
    if (tabs.get() !== 'home') tabs.go('home');
    shown.value = withTiming(1, { duration: still ? 0 : motion.enter, easing: settle });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* each step: what it does first, then where its thing is, and the hole glides there */
  useEffect(() => {
    const step = TOUR[at]!;
    let live = true;
    if (step.act === 'open' && !opened.current) {
      opened.current = true;
      tourHands()?.open();
    }
    const timer = setTimeout(
      async () => {
        const r = around(await Promise.all(step.spots.map(measureSpot)));
        if (!live) return;
        const box = r ? { x: r.x - step.pad, y: r.y - step.pad, w: r.w + step.pad * 2, h: r.h + step.pad * 2 } : { x: width / 2, y: height / 2, w: 0, h: 0 };
        const to = (v: { value: number }, n: number) => {
          v.value = placed.current && !still ? withTiming(n, { duration: motion.enter, easing: settle }) : n;
        };
        to(hole.x, box.x);
        to(hole.y, box.y);
        to(hole.w, box.w);
        to(hole.h, box.h);
        to(hole.r, step.radius);
        placed.current = true;
        setPlace(box);
        if (step.act === 'dip' && !still) tourHands()?.dip();
      },
      step.act === 'open' ? OPENING : at === 0 ? SETTLE : 0,
    );
    const dips = step.act === 'dip' && !still ? setInterval(() => tourHands()?.dip(), DIP_EVERY) : undefined;
    return () => {
      live = false;
      clearTimeout(timer);
      if (dips) clearInterval(dips);
    };
  }, [at]); // eslint-disable-line react-hooks/exhaustive-deps

  const end = useCallback(() => {
    if (ending.current) return;
    ending.current = true;
    if (opened.current) tourHands()?.close();
    void markChatPointedOut();
    if (still) endTour();
    else
      shown.value = withTiming(0, { duration: motion.leave, easing: away }, done => {
        if (done) runOnJS(endTour)();
      });
  }, [shown, still]);
  const next = () => (at < TOUR.length - 1 ? setAt(at + 1) : end());
  /* the phone's own back is Skip */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      end();
      return true;
    });
    return () => sub.remove();
  }, [end]);

  const fading = useAnimatedStyle(() => ({ opacity: shown.value }));
  const step = TOUR[at]!;
  /* the card goes under what it is about, or over it when that is low on the screen */
  const below = !place || place.y + place.h / 2 < height * 0.55;
  const tipAt = place ? (below ? { top: Math.min(place.y + place.h + GAP, height - 220 - insets.bottom) } : { bottom: Math.max(height - place.y + GAP, insets.bottom + 16) }) : { top: height / 2 };
  return (
    <Animated.View style={[StyleSheet.absoluteFill, fading]} onStartShouldSetResponder={() => true} accessibilityViewIsModal testID="tour">
      <Spotlight hole={hole} width={width} height={height} />
      {/* no lines anywhere (Round 29, the owner's word): the lit place is told by the dark round it alone */}
      {place ? (
        <View style={[s.tipRow, tipAt]} pointerEvents="box-none">
          <Tip key={at} step={step} at={at} onNext={next} />
        </View>
      ) : null}
      <Pressable onPress={end} accessibilityRole="button" accessibilityLabel="Skip" style={[s.skip, { top: insets.top + 8 }]} hitSlop={8} testID="tour-skip">
        <Label style={{ color: dark.paper }}>Skip</Label>
      </Pressable>
    </Animated.View>
  );
}

function Tip({ step, at, onNext }: { step: Step; at: number; onNext: () => void }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) t.value = withTiming(1, { duration: motion.enter, easing: settle });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const arriving = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 10 }], ...blurred((1 - t.value) * motion.blur) }));
  const last = at === TOUR.length - 1;
  return (
    <Animated.View style={[s.tip, arriving]} testID="tour-tip">
      <Caption tone="tertiary">{`${at + 1} of ${TOUR.length}`}</Caption>
      <Head>{step.title}</Head>
      <Meta tone="secondary">{step.line}</Meta>
      <View style={s.tipFoot}>
        <View style={s.dots}>
          {TOUR.map((_, i) => (
            <View key={i} style={[s.dot, i === at ? s.dotOn : null]} />
          ))}
        </View>
        <Button label={last ? 'Done' : 'Next'} size={40} full={false} onPress={onNext} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  tipRow: { position: 'absolute', left: SIDE, right: SIDE },
  tip: { backgroundColor: colour.surface, borderRadius: 24, padding: 20, gap: 6 },
  tipFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.surface3 },
  dotOn: { backgroundColor: colour.ink },
  skip: {
    position: 'absolute',
    right: 16,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 19, 13, 0.72)',
  },
});
