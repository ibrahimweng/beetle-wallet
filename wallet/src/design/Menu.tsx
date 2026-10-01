/* The ··· at the top right of a transaction, and the soft pop-up it opens.

   A small white card grows out of the dots — from their corner, out of a
   blur, a touch small — with a line for each thing it offers, over a light
   white wash that softens the page without hiding it. A tap anywhere off
   the card puts it away the same way it came; a tap on a line puts it away
   and then does what the line says. */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
import { Row } from './text';
import { Tap, away, blurred, motion, settle, useStill } from './motion';
import { colour } from './tokens';
import { measure, type Rect } from './journey';
import type { IconName } from '../icons';

export type MenuItem = { glyph: IconName; label: string; onPress: () => void; tone?: 'bad' };

const CARD_W = 248;

export function MoreButton({ items, testID = 'more-menu' }: { items: MenuItem[]; testID?: string }) {
  const ref = useRef<View>(null);
  const [at, setAt] = useState<Rect | null>(null);
  return (
    <>
      <Tap ref={ref} accessibilityRole="button" accessibilityLabel="More about this" onPress={() => void measure(ref).then(setAt)} scale={0.9} hitSlop={8} style={s.dots} testID={testID}>
        <Dots />
      </Tap>
      {at ? <Pop at={at} items={items} onClose={() => setAt(null)} /> : null}
    </>
  );
}

/* Three dots in a row, drawn here: the set's own "more" is the four-dot grid, which reads as apps rather than options. */
function Dots() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx={4} cy={10} r={1.9} fill={colour.ink} />
      <Circle cx={10} cy={10} r={1.9} fill={colour.ink} />
      <Circle cx={16} cy={10} r={1.9} fill={colour.ink} />
    </Svg>
  );
}

function Pop({ at, items, onClose }: { at: Rect; items: MenuItem[]; onClose: () => void }) {
  const still = useStill();
  const { width: W } = useWindowDimensions();
  const t = useSharedValue(still ? 1 : 0);
  const going = useRef(false);
  useEffect(() => {
    if (!still) t.value = withTiming(1, { duration: 260, easing: settle });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* away the way it came, then whatever the line asked for */
  const close = (then?: () => void) => {
    if (going.current) return;
    going.current = true;
    const done = () => {
      onClose();
      then?.();
    };
    if (still) return done();
    t.value = withTiming(0, { duration: motion.leave - 80, easing: away }, finished => {
      if (finished) runOnJS(done)();
    });
  };
  const wash = useAnimatedStyle(() => ({ opacity: t.value }));
  const card = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: 0.92 + 0.08 * t.value }],
    ...blurred((1 - t.value) * motion.blur),
  }));
  /* under the dots, its right edge on theirs, never off the screen */
  const right = Math.max(12, W - (at.x + at.w));
  return (
    <Modal transparent visible animationType="none" onRequestClose={() => close()} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, s.wash, wash]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Put this away" onPress={() => close()} testID="menu-wash" />
      </Animated.View>
      <Animated.View style={[s.card, { top: at.y + at.h + 6, right, transformOrigin: 'top right' }, card]} testID="menu-card">
        {items.map((it, i) => (
          <Tap key={it.label} accessibilityRole="button" accessibilityLabel={it.label} onPress={() => close(it.onPress)} scale={0.98} style={[s.item, i ? s.hair : null]} testID="menu-item">
            <Icon name={it.glyph} size={20} colour={it.tone === 'bad' ? colour.bad : colour.ink} />
            <Row style={it.tone === 'bad' ? { color: colour.bad } : null}>{it.label}</Row>
          </Tap>
        ))}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dots: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colour.surface2 },
  /* light enough that the page stays readable under it */
  wash: { backgroundColor: 'rgba(255,255,255,0.55)' },
  card: {
    position: 'absolute',
    width: CARD_W,
    backgroundColor: colour.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52 },
  hair: { borderTopWidth: 1, borderTopColor: colour.rule },
});
