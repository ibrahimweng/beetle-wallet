/* The people, lines or meters paid before, listed over everything: the
   screen recedes under a blur and the list grows out of the line that
   asked for it, the way a receipt grows out of its row. A tap on one fills
   the ask panel and the list folds back; a tap anywhere else folds it back
   with nothing picked. The Send money page adds two rows under the people:
   a number to type, and the camera. */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Avatar, Caption, Icon, Label, Tap, colour, lift, settle, useStill, type Rect } from '../../design';
import { discoById, groupMeter, groupPhoneNumber, networkInfo, planById, planName, type Beneficiary } from '../../services';
import { groupAccount, initialsOf, naira } from '../../lib/format';
import type { SavedKind } from './AskPanel';
import type { IconName } from '../../icons';
import { BAR_H } from '../more/Foot';

type BlurModule = typeof import('expo-blur');
const blur: BlurModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-blur') as BlurModule;
  } catch {
    return null;
  }
})();

const ROW_H = 56;
const AWAY = 190;
const TITLE: Record<SavedKind, string> = { person: 'People you have paid', line: 'Numbers you top up', meter: 'Meters you have paid' };

export type Extra = { glyph: IconName; label: string; onPress: () => void };

export function SavedPeek({
  kind,
  list,
  at,
  extras = [],
  onPick,
  onClose,
}: {
  kind: SavedKind;
  list: Beneficiary[];
  at: Rect;
  /** other ways to say who, under the list */ extras?: Extra[];
  onPick: (b: Beneficiary) => void;
  onClose: () => void;
}) {
  const still = useStill();
  const { width: W, height: H } = useWindowDimensions();
  const t = useSharedValue(still ? 1 : 0);
  const [leaving, setLeaving] = useState(false);
  const going = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rows = list.slice(0, 5);
  const cardH = 16 + 32 + 12 + (rows.length + extras.length) * ROW_H + 8;
  /* never down over the foot: Back and the page's button stay clear of the list, and the list of them */
  const top = Math.max(24, Math.min(at.y, H - cardH - (BAR_H + 8)));
  const left = 20;
  const width = W - 40;
  useEffect(() => {
    if (!still) t.value = withSpring(1, lift);
    return () => {
      if (going.current) clearTimeout(going.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const leave = (then: () => void) => {
    if (still) return then();
    if (leaving) return;
    setLeaving(true);
    t.value = withTiming(0, { duration: AWAY, easing: settle });
    going.current = setTimeout(then, AWAY);
  };
  const veil = useAnimatedStyle(() => ({ opacity: Math.min(1, t.value * 1.9) }));
  const box = useAnimatedStyle(() => ({
    top: at.y + (top - at.y) * t.value,
    left: at.x + (left - at.x) * t.value,
    width: at.w + (width - at.w) * t.value,
    height: at.h + (cardH - at.h) * t.value,
    backgroundColor: `rgba(255, 255, 255, ${Math.min(1, t.value * 2)})`,
    borderColor: `rgba(222, 222, 227, ${Math.min(1, t.value * 2)})`,
  }));
  const inner = useAnimatedStyle(() => ({ opacity: Math.max(0, (t.value - 0.35) / 0.65) }));
  const Blur = blur?.BlurView;
  return (
    <View style={StyleSheet.absoluteFill} testID="saved">
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={() => leave(onClose)}>
        <Animated.View style={[StyleSheet.absoluteFill, veil]} pointerEvents="none">
          {Blur ? <Blur intensity={36} tint="light" experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'} style={StyleSheet.absoluteFill} /> : null}
          <View style={s.wash} />
        </Animated.View>
      </Pressable>
      <Animated.View style={[s.card, box]} testID="saved-card">
        <Animated.View style={[{ gap: 12 }, inner]}>
          <View style={s.head}>
            <View style={s.disc}>
              <Icon name={kind === 'person' ? 'person' : kind === 'line' ? 'airtime' : 'power'} size={16} colour={colour.ink} />
            </View>
            <Label style={{ flex: 1 }}>{TITLE[kind]}</Label>
          </View>
          <View>
            {rows.map(b => (
              <SavedRow key={b.id} b={b} onPress={() => leave(() => onPick(b))} />
            ))}
            {extras.map(x => (
              <Tap key={x.label} accessibilityRole="button" accessibilityLabel={x.label} onPress={() => leave(x.onPress)} style={s.row} scale={0.98}>
                <View style={[s.mark, { backgroundColor: colour.surface2 }]}>
                  <Icon name={x.glyph} size={18} colour={colour.ink} />
                </View>
                <Label style={{ flex: 1 }}>{x.label}</Label>
              </Tap>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function SavedRow({ b, onPress }: { b: Beneficiary; onPress: () => void }) {
  const name = b.kind === 'person' ? b.name : b.label;
  const detail =
    b.kind === 'person'
      ? `${b.bank} · ${groupAccount(b.number)}`
      : b.kind === 'line'
        ? `${groupPhoneNumber(b.number)} · ${b.network}${b.plan ? ` · ${planName(planById(b.plan)!)}` : b.amount ? ` · ${naira(b.amount)}` : ''}`
        : `${discoById(b.disco)?.name ?? b.disco} · ${b.meterKind === 'prepaid' ? 'Prepaid' : 'Postpaid'} ${groupMeter(b.meter)}`;
  const times = b.times ? (b.times === 1 ? 'once' : `${b.times} times`) : '';
  return (
    <Tap accessibilityRole="button" accessibilityLabel={name} onPress={onPress} style={s.row} scale={0.98}>
      {b.kind === 'person' ? (
        <Avatar initials={initialsOf(b.name)} size={36} />
      ) : b.kind === 'line' ? (
        <View style={[s.mark, { backgroundColor: networkInfo(b.network).colour }]}>
          <Label style={{ color: networkInfo(b.network).ink }}>{name.charAt(0).toUpperCase()}</Label>
        </View>
      ) : (
        <View style={[s.mark, { backgroundColor: colour.surface2 }]}>
          <Icon name="power" size={18} colour={colour.ink} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.line}>
          <Label numberOfLines={1} style={{ flex: 1 }}>
            {name}
          </Label>
          {b.when ? <Caption tone="tertiary">{b.when}</Caption> : null}
        </View>
        <View style={s.line}>
          <Caption tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
            {detail}
          </Caption>
          {times ? <Caption tone="tertiary">{times}</Caption> : null}
        </View>
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  wash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.28)' },
  card: { position: 'absolute', borderRadius: 24, borderWidth: 1, padding: 16, paddingBottom: 8, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 32 },
  disc: { width: 32, height: 32, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: ROW_H, borderRadius: 12 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
