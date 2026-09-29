/* The ask bar, in its two states off the frame. Idle: the grey petals of
   the mark, the placeholder, and the camera. Active — the moment there is
   something typed: a hairline round the bar, the words in semibold, and a
   black disc with an arrow where the camera was, to send. The camera and
   the disc trade places through a blur, the way everything here changes. */
import React, { forwardRef, useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon, Tap, blurred, colour, motion, standard, useStill } from '../../design';

/* the mark as the bar draws it: three petals, dark at a fifth */
const PETALS = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 21.5352 21.5352" fill="none"><g fill="#2B2722" fill-opacity="0.2"><path d="M18.3136 0.159776C18.5388 -0.0654773 18.9108 -0.0497619 19.1151 0.193826C21.3283 2.82876 21.1921 6.76283 18.7169 9.24062C16.2994 11.6582 12.4989 11.8389 9.86658 9.79066L9.79062 9.86661C11.8389 12.4989 11.6555 16.302 9.23797 18.7196C6.7628 21.1948 2.82873 21.3283 0.193792 19.1151C-0.0497956 18.9108 -0.0628917 18.5389 0.159742 18.3136L18.3136 0.159776Z"/><path d="M11.7577 3.64334C11.9699 3.8555 11.9751 4.19861 11.7603 4.41339L4.41341 11.7603C4.20126 11.9725 3.85552 11.9725 3.64074 11.7603C3.56741 11.687 3.52288 11.6005 3.49931 11.5089C3.49669 11.5062 3.49407 11.5036 3.49669 11.501C3.49145 11.4827 3.48883 11.4643 3.48883 11.446C3.48621 11.4434 3.48359 11.4408 3.48883 11.4355C3.0357 9.01275 3.55169 6.69735 5.12322 5.12582C6.7 3.54905 9.02848 3.03568 11.4696 3.49404C11.4775 3.49666 11.4906 3.49666 11.4958 3.5019C11.5927 3.52024 11.6844 3.56738 11.7577 3.64334Z"/><path d="M20.4038 10.6105C20.4588 10.6655 20.4955 10.7258 20.5243 10.7886C22.0592 14.0888 21.8784 17.6012 19.7411 19.7385C17.6039 21.8758 14.0915 22.0618 10.7939 20.519C10.7729 20.5164 10.7598 20.5086 10.7441 20.4981C10.6917 20.4745 10.6472 20.4405 10.6053 20.4012C10.401 20.1969 10.3958 19.8616 10.5948 19.6521C10.5974 19.6442 10.6027 19.6364 10.6105 19.6311L10.6262 19.6154C12.2135 17.8998 12.9547 15.6551 12.8107 13.4419C12.8107 13.4419 12.8107 13.4402 12.8107 13.4367C12.8107 13.3974 12.8081 13.3528 12.8054 13.3109C12.8107 13.1774 12.8631 13.0516 12.96 12.9547C13.07 12.8447 13.214 12.7923 13.3581 12.8002C13.3843 12.7976 13.4131 12.8028 13.4393 12.8054C13.4445 12.8054 13.4472 12.808 13.455 12.808C15.6735 12.9469 17.926 12.2056 19.6416 10.6079C19.7726 10.4769 19.9533 10.4298 20.1209 10.4586C20.1288 10.4612 20.1419 10.4612 20.1471 10.4665C20.244 10.4848 20.3357 10.5319 20.409 10.6079L20.4038 10.6105Z"/></g></svg>`;

/** The ring the active bar wears, as the frame colours it. */
const RING = '#472400';

export const AskBar = forwardRef<
  TextInput,
  {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onFocus?: () => void;
    onCamera: () => void;
    placeholder?: string;
  }
>(function AskBar({ value, onChange, onSubmit, onFocus, onCamera, placeholder = 'Ask, or show me a photo' }, ref) {
  const still = useStill();
  const active = value.trim().length > 0;
  const t = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    t.value = still ? (active ? 1 : 0) : withTiming(active ? 1 : 0, { duration: motion.swap, easing: standard });
  }, [active, still, t]);
  const ring = useAnimatedStyle(() => ({ opacity: t.value }));
  const cameraStyle = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ scale: 1 - t.value * 0.2 }], ...blurred(t.value * 4) }));
  const discStyle = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.8 + t.value * 0.2 }], ...blurred((1 - t.value) * 4) }));
  return (
    <View style={[s.bar, active ? s.barActive : s.barIdle]} testID="ask-bar">
      <Animated.View pointerEvents="none" style={[s.ringView, ring]} />
      <SvgXml xml={PETALS} width={22} height={22} />
      <TextInput
        ref={ref}
        style={[s.input, active && s.inputActive]}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colour.textSecondary}
        returnKeyType="send"
        blurOnSubmit={false}
        accessibilityLabel="Ask Beetle"
      />
      <View style={s.end}>
        <Animated.View style={[s.endItem, cameraStyle]} pointerEvents={active ? 'none' : 'auto'}>
          <Tap accessibilityRole="button" accessibilityLabel="Show me a photo" onPress={onCamera} scale={0.85} hitSlop={8}>
            <Icon name="camera" size={20} colour={colour.ink} />
          </Tap>
        </Animated.View>
        <Animated.View style={[s.endItem, discStyle]} pointerEvents={active ? 'auto' : 'none'}>
          <Tap accessibilityRole="button" accessibilityLabel="Send this" onPress={onSubmit} scale={0.85} hitSlop={8} style={s.disc}>
            <View style={{ transform: [{ rotate: '45deg' }] }}>
              <Icon name="send" size={16} colour={colour.textInverse} />
            </View>
          </Tap>
        </Animated.View>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  bar: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colour.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
  },
  barIdle: { paddingRight: 24 },
  barActive: { paddingRight: 12 },
  ringView: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, borderWidth: 1, borderColor: RING },
  input: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, letterSpacing: -0.15, color: colour.ink, padding: 0 },
  inputActive: { fontWeight: '600' },
  end: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  endItem: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  disc: { width: 28, height: 28, borderRadius: 14, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
});
