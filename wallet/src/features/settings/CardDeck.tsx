/* The cards, side by side (Round 37, the owner's word): a swipe across the
   card shows the next one, and the dots under them say how many there are
   and which is showing (each dot is a button to it, for whoever cannot
   swipe). Everything on the page under the deck is the card showing.

   A card held turns over, as a card in the hand does: on its back the
   magnetic strip, the signature panel with the CVV (dots, until Reveal shows
   it), the colours to pick from, and Photo, Name and Limit. Held again, or
   Turn over, it turns back. Its name, number and expiry are the issuer's and
   are not on the back to change. */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CardFace, Caption, Icon, Label, Tap, colour, font, frame, useStill } from '../../design';
import { TONES, TONE_IDS, faceLine, fullNumber, hiddenNumber, type CardTone, type VirtualCard } from './card';

const FACE_H = 194;

export function Deck({
  cards,
  index,
  onIndex,
  holder,
  shown,
  onTone,
  onPhoto,
  onName,
  onLimit,
}: {
  cards: VirtualCard[];
  index: number;
  onIndex: (i: number) => void;
  holder: string;
  /** the card whose whole number and CVV are showing, for its ten seconds */
  shown: string | null;
  onTone: (card: VirtualCard, tone: CardTone) => void;
  onPhoto: (card: VirtualCard) => void;
  onName: (card: VirtualCard) => void;
  onLimit: (card: VirtualCard) => void;
}) {
  const { width } = useWindowDimensions();
  const page = Math.min(width, 500);
  const list = useRef<ScrollView>(null);
  const at = useRef(index);
  /* the page asks for a card (one just made, or a dot): the deck goes to it */
  useEffect(() => {
    if (at.current === index) return;
    at.current = index;
    list.current?.scrollTo({ x: index * page, animated: true });
  }, [index, page]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(cards.length - 1, Math.round(e.nativeEvent.contentOffset.x / page)));
    if (i !== at.current) {
      at.current = i;
      onIndex(i);
    }
  };
  return (
    <View style={{ gap: 10 }} testID="card-deck">
      <ScrollView
        ref={list}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ marginHorizontal: -frame.sidePad, flexGrow: 0 }}
        contentOffset={{ x: index * page, y: 0 }}
        testID="card-pages"
      >
        {cards.map(c => (
          <View key={c.id} style={{ width: page, paddingHorizontal: frame.sidePad }}>
            <FlipCard card={c} holder={holder} shown={shown === c.id} onTone={t => onTone(c, t)} onPhoto={() => onPhoto(c)} onName={() => onName(c)} onLimit={() => onLimit(c)} />
          </View>
        ))}
      </ScrollView>
      {cards.length > 1 ? (
        <View style={s.dots} testID="card-dots">
          {cards.map((c, i) => (
            <Tap
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Card ${i + 1} of ${cards.length}`}
              accessibilityState={{ selected: i === index }}
              onPress={() => onIndex(i)}
              hitSlop={8}
              style={[s.dot, i === index ? s.dotOn : null]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* One card, either way up. A hold turns it over; the turn is a half turn about its middle, the face going as it passes
   edge on and the back coming in. */
function FlipCard({
  card,
  holder,
  shown,
  onTone,
  onPhoto,
  onName,
  onLimit,
}: {
  card: VirtualCard;
  holder: string;
  shown: boolean;
  onTone: (t: CardTone) => void;
  onPhoto: () => void;
  onName: () => void;
  onLimit: () => void;
}) {
  const still = useStill();
  const [back, setBack] = useState(false);
  const turn = useSharedValue(0);
  const flip = () => {
    const to = back ? 0 : 1;
    setBack(!back);
    turn.value = still ? to : withTiming(to, { duration: 520, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  };
  const front = useAnimatedStyle(() => ({ opacity: turn.value < 0.5 ? 1 : 0, transform: [{ perspective: 1000 }, { rotateY: `${turn.value * 180}deg` }] }));
  const rear = useAnimatedStyle(() => ({ opacity: turn.value >= 0.5 ? 1 : 0, transform: [{ perspective: 1000 }, { rotateY: `${turn.value * 180 - 180}deg` }] }));
  const tone = TONES[card.tone] ?? TONES.cocoa;
  return (
    <View style={{ height: FACE_H }}>
      <Animated.View style={[StyleSheet.absoluteFill, s.side, front]} pointerEvents={back ? 'none' : 'auto'}>
        <Tap
          accessibilityRole="button"
          accessibilityLabel={`${faceLine(card)} card ending ${card.number.slice(-4)}. Hold to turn it over`}
          accessibilityActions={[{ name: 'longpress', label: 'Turn it over' }]}
          onAccessibilityAction={flip}
          onLongPress={flip}
          delayLongPress={450}
          scale={0.98}
          testID="card-front"
        >
          <CardFace
            only={faceLine(card)}
            number={shown ? fullNumber(card.number) : hiddenNumber(card.number)}
            name={holder}
            expiry={card.expiry}
            frozen={card.frozen}
            colours={tone.colours}
            photo={card.photo}
          />
        </Tap>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, s.side, rear]} pointerEvents={back ? 'auto' : 'none'}>
        <Back card={card} shown={shown} onTurn={flip} onTone={onTone} onPhoto={onPhoto} onName={onName} onLimit={onLimit} />
      </Animated.View>
    </View>
  );
}

/* The back: the strip, the signature panel with the CVV, the colours, and what else is the owner's to change. */
function Back({
  card,
  shown,
  onTurn,
  onTone,
  onPhoto,
  onName,
  onLimit,
}: {
  card: VirtualCard;
  shown: boolean;
  onTurn: () => void;
  onTone: (t: CardTone) => void;
  onPhoto: () => void;
  onName: () => void;
  onLimit: () => void;
}) {
  const tone = TONES[card.tone] ?? TONES.cocoa;
  return (
    <Tap accessibilityRole="none" onLongPress={onTurn} delayLongPress={450} scale={1} style={{ flex: 1 }} testID="card-back">
      <LinearGradient colors={[tone.colours[0], tone.colours[1]]} start={{ x: 0.9, y: 0 }} end={{ x: 0.1, y: 1 }} style={s.back}>
        <View style={s.strip} />
        <View style={s.signRow}>
          <View style={s.sign}>
            <Caption style={s.signText}>{`CVV ${shown ? card.cvv : '•••'}`}</Caption>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel="Turn over" onPress={onTurn} hitSlop={8} style={s.turn} testID="card-turn">
            <Icon name="undo-filled" size={14} colour={colour.textInverse} />
            <Caption tone="inverse" style={font('600')}>
              Turn over
            </Caption>
          </Tap>
        </View>
        <View style={s.tones} testID="card-tones">
          {TONE_IDS.map(id => (
            <Tap
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`${TONES[id].name} colour`}
              accessibilityState={{ selected: card.tone === id && !card.photo }}
              onPress={() => onTone(id)}
              hitSlop={4}
              style={[s.toneRing, card.tone === id && !card.photo ? s.toneOn : null]}
            >
              <LinearGradient colors={[TONES[id].colours[0], TONES[id].colours[1]]} style={s.toneDot} />
            </Tap>
          ))}
        </View>
        <View style={s.pills}>
          <BackPill glyph="camera" label={card.photo ? 'Photo' : 'Add photo'} onPress={onPhoto} />
          <BackPill glyph="list" label="Name" onPress={onName} />
          <BackPill glyph="chart" label="Limit" onPress={onLimit} />
        </View>
      </LinearGradient>
    </Tap>
  );
}

function BackPill({ glyph, label, onPress }: { glyph: 'camera' | 'list' | 'chart'; label: string; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={label === 'Name' ? 'Name the card' : label === 'Limit' ? 'Change the limit' : label} onPress={onPress} scale={0.95} style={s.pill}>
      <Icon name={glyph} size={14} colour={colour.textInverse} />
      <Label style={{ color: colour.textInverse }}>{label}</Label>
    </Tap>
  );
}

const s = StyleSheet.create({
  side: { backfaceVisibility: 'hidden' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, height: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colour.ruleStrong },
  dotOn: { width: 18, backgroundColor: colour.ink },
  back: { height: FACE_H, borderRadius: 24, overflow: 'hidden', paddingHorizontal: 18, paddingBottom: 14, paddingTop: 16, gap: 12 },
  strip: { height: 30, marginHorizontal: -18, backgroundColor: 'rgba(10,8,6,0.72)' },
  signRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sign: { flex: 1, height: 26, borderRadius: 6, backgroundColor: 'rgba(251,239,227,0.9)', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 10 },
  signText: { color: colour.ink, ...font('600'), letterSpacing: 1 },
  turn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 26 },
  tones: { flexDirection: 'row', gap: 10, height: 28, alignItems: 'center' },
  toneRing: { width: 28, height: 28, borderRadius: 14, padding: 3, borderWidth: 1.5, borderColor: 'transparent' },
  toneOn: { borderColor: 'rgba(251,239,227,0.95)' },
  toneDot: { flex: 1, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(251,239,227,0.35)' },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(251,239,227,0.16)' },
});
