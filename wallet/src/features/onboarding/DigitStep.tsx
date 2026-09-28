/* One step of the way in that takes digits: the trail of steps behind you,
   the step you are on, the digits as they are typed, a line for what went
   wrong or what is happening, and the keypad pinned to the foot of the screen.
   Every size is the frame's: the step glyph 32, the title 32 bold, the line
   under it 14, the digits 32 bold, the pad the file's own 3 by 4. */
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Field, Icon, Keypad, Meta, Pips, StepHead, StepTrail, TrailStep, Wash, colour, Rise, RevealAll, keys, useStill } from '../../design';
import type { IconName } from '../../icons';
import { groupDigits } from '../../lib/format';

export type Note = { text: string; tone?: 'secondary' | 'bad' | 'accent' } | null;

export function DigitStep({
  trail = [],
  icon,
  title,
  sub,
  digits,
  onDigits,
  groups,
  max,
  note,
  footer,
  busy = false,
  shake = 0,
  secret = false,
  wash,
  onBack,
  onFace,
}: {
  trail?: TrailStep[];
  icon: IconName;
  title: string;
  sub: string;
  digits: string;
  onDigits: (d: string) => void;
  groups: number[];
  max: number;
  note?: Note;
  footer?: React.ReactNode;
  /** while a service is being asked, the pad does nothing */
  busy?: boolean;
  /** bump it to shake the digits, for a code that did not match */
  shake?: number;
  /** a passcode: one dot per digit, and never the digit itself */
  secret?: boolean;
  wash?: { tone: string; height?: number };
  onBack?: () => void;
  onFace?: () => void;
}) {
  const still = useStill();
  const x = useSharedValue(0);
  useEffect(() => {
    if (!shake || still) return;
    x.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }));
  }, [shake, still, x]);
  const shaking = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const key = (k: string) => {
    if (busy) return;
    onDigits(k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, max));
  };
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      {wash ? <Wash tone={wash.tone} height={wash.height} /> : null}
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{ position: 'absolute', top: 52, left: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        >
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 28, gap: 20 }}>
          <RevealAll>
            <StepTrail done={trail} />
            <StepHead icon={icon} title={title} sub={sub} tint={icon === 'mark' ? undefined : wash?.tone} />
            <Animated.View style={shaking}>
              {secret ? (
                <View style={{ height: 24, justifyContent: 'center' }}>
                  <Pips of={max} filled={digits.length} align="left" />
                </View>
              ) : (
                <Field value={groupDigits(digits, groups) || ' '} caret={!busy} />
              )}
            </Animated.View>
            <View style={{ minHeight: 20 }}>
              {note ? (
                <Meta tone={note.tone === 'bad' ? 'bad' : note.tone === 'accent' ? 'accent' : 'secondary'} accessibilityLiveRegion="polite">
                  {note.text}
                </Meta>
              ) : null}
            </View>
            {footer}
          </RevealAll>
        </View>
        <Rise spring={keys} from={120} delay={60}>
          <View style={{ opacity: busy ? 0.5 : 1 }}>
            <Keypad onKey={key} onFace={onFace} />
          </View>
        </Rise>
        <View style={{ height: 24 }} />
      </View>
    </View>
  );
}
