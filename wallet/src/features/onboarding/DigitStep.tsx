/* One step of the way in that takes digits: the trail of steps behind you,
   the step you are on, the digits as they are typed, a line for what went
   wrong or what is happening, and the keypad pinned to the foot of the screen.
   Every size is the frame's: the step glyph 32, the title 32 bold, the line
   under it 14, the digits 32 bold, the pad the file's own 3 by 4.

   The column arrives out of a blur and leaves into one. The wash at the top
   recedes while you type and comes back if you clear the field, so the colour
   gives way to the work. */
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Field, Icon, Keypad, Meta, Pane, Pips, StepHead, StepTrail, Swap, TrailStep, Wash, colour, Rise, keys, motion, soft, useStill } from '../../design';
import type { IconName } from '../../icons';
import { groupDigits } from '../../lib/format';

export type Note = {
  text: string;
  tone?: 'secondary' | 'bad' | 'accent';
} | null;

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
  leaving = false,
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
  /** on its way out: see useGo */
  leaving?: boolean;
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
  const shaking = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const typing = useSharedValue(0);
  const started = digits.length > 0;
  useEffect(() => {
    typing.value = withTiming(started ? 1 : 0, {
      duration: still ? 0 : motion.recede,
      easing: soft,
    });
  }, [started, still, typing]);
  const receding = useAnimatedStyle(() => ({
    opacity: 1 - typing.value * 0.65,
  }));

  const key = (k: string) => {
    if (busy) return;
    onDigits(k === 'del' ? digits.slice(0, -1) : (digits + k).slice(0, max));
  };
  const tone = note?.tone === 'bad' ? 'bad' : note?.tone === 'accent' ? 'accent' : 'secondary';
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      {wash ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: wash.height ?? 220,
            },
            receding,
          ]}
        >
          <Wash tone={wash.tone} height={wash.height} />
        </Animated.View>
      ) : null}
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{
            position: 'absolute',
            top: 52,
            left: 8,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
      <Pane leaving={leaving} style={{ flex: 1, paddingHorizontal: 20 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            paddingBottom: 28,
            gap: 20,
          }}
        >
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
            <Swap value={note?.text ?? ''}>
              {shown =>
                shown ? (
                  <Meta tone={tone} accessibilityLiveRegion="polite">
                    {shown}
                  </Meta>
                ) : null
              }
            </Swap>
          </View>
          {footer}
        </View>
        <Rise spring={keys} from={120} delay={60}>
          <View style={{ opacity: busy ? 0.5 : 1 }}>
            <Keypad onKey={key} onFace={onFace} />
          </View>
        </Rise>
        <View style={{ height: 24 }} />
      </Pane>
    </View>
  );
}
