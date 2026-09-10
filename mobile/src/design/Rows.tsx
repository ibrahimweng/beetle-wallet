/* The row shapes the settings, limits and device screens are built from, each
   taken off its frame.

   A settings row is a 28 filled glyph, a 16 semibold title, a 14 regular value
   on the right and a 16 chevron. A device row is a 20 glyph with a 16 semibold
   title over a 12 regular line, and a 12 semibold pill. A cap row puts the
   value in 16 semibold above its 12 regular explanation. */
import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, Mark } from './Icon';
import { Body, Caption, Head, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, space } from './tokens';
import { Tap } from './motion';

export function SectionLabel({ children }: { children: string }) {
  return <Body tone="secondary">{children}</Body>;
}

export function SettingRow({
  glyph,
  ink,
  title,
  value,
  onPress,
}: {
  glyph?: IconName;
  /* the frames colour some of these marks — the face is the accent, the
     camera the violet, the bell the amber — and leave the rest in ink */
  ink?: string;
  title: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Tap
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s5,
      }}
    >
      {glyph ? <Icon name={glyph} size={28} colour={ink} /> : <View style={{ width: 28 }} />}
      <Row style={{ flex: 1 }}>{title}</Row>
      {value ? <Meta tone="secondary">{value}</Meta> : null}
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

export function ToggleRow({
  glyph,
  ink,
  title,
  sub,
  value,
  onChange,
}: {
  glyph?: IconName;
  ink?: string;
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s5 }}>
      {glyph ? <Icon name={glyph} size={28} colour={ink} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        {sub ? <Meta tone="secondary">{sub}</Meta> : null}
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

/* The switch, drawn rather than borrowed. React Native's own is a different
   shape on every platform and none of them is the file's: a 52 by 32 track
   with a 26 knob three in from the end, blue when it is on and the pale rail
   grey when it is not. */
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange?: (v: boolean) => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange?.(!value)}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        padding: 3,
        flexShrink: 0,
        backgroundColor: value ? colour.accent : colour.rail,
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colour.surface }} />
    </Pressable>
  );
}

/* The rule rows on the goal sheet. The frames do not box these: a 40 badge, a
   title over its explanation over what it comes to a month, a switch on the
   right, and a hairline between one and the next. */
export function FeedRow({
  glyph,
  title,
  sub,
  note,
  quiet = false,
  right,
  onPress,
}: {
  glyph: IconName;
  title: string;
  sub: string;
  note: string;
  /* the last row has no amount yet, so its third line is grey and regular
     where the others are the green the money is set in */
  quiet?: boolean;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Tap
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingTop: 6,
        paddingBottom: 1,
      }}
    >
      <Mark glyph={glyph} />
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Caption tone="tertiary">{sub}</Caption>
        {quiet ? <Meta tone="tertiary">{note}</Meta> : <Label tone="good">{note}</Label>}
      </View>
      {right}
    </Tap>
  );
}

export function DeviceRow({
  glyph,
  title,
  where,
  tag,
  odd = false,
  onPress,
}: {
  glyph: IconName;
  title: string;
  where: string;
  tag?: string;
  /* the one the frame marks in amber, because it does not belong */
  odd?: boolean;
  onPress?: () => void;
}) {
  return (
    <Tap
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s2,
      }}
    >
      {/* the frames set the glyph on a white square, so a row of devices reads
          as a list of things rather than a list of lines */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colour.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={glyph} size={20} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Caption tone="secondary">{where}</Caption>
      </View>
      {tag ? (
        <View
          style={{
            /* on the grey card a plain grey pill would not show, so the frames
               use the stronger rule grey — and amber for the odd one out */
            backgroundColor: odd ? colour.warn : colour.rule,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Caption style={{ fontWeight: '600' }}>{tag}</Caption>
        </View>
      ) : null}
    </Tap>
  );
}

export function CapRow({
  title,
  sub,
  value,
  onPress,
}: {
  title: string;
  sub: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Tap
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s4,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Caption tone="secondary">{sub}</Caption>
      </View>
      <Row>{value}</Row>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

/* What is out today against what you set. */
export function Usage({ out, of, note }: { out: string; of: string; note: string }) {
  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Meta tone="secondary">Out today</Meta>
        <Meta tone="secondary">of {of}</Meta>
      </View>
      <Head style={{ fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{out}</Head>
      <Meta tone="secondary">{note}</Meta>
    </View>
  );
}

/* A note behind a small glyph, used at the foot of a lot of screens. */
export function Aside({ glyph = 'lock', children }: { glyph?: IconName; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s3 }}>
      <Icon name={glyph} size={16} colour={colour.textTertiary} />
      <Meta tone="secondary" style={{ flex: 1 }}>
        {children}
      </Meta>
    </View>
  );
}

/* Back beside one action, the way the frames end a screen that is not a dock. */
export function BottomBar({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s2,
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: colour.surface,
      }}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
