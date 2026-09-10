/* The row shapes the settings, limits and device screens are built from, each
   taken off its frame.

   A settings row is a 28 filled glyph, a 16 semibold title, a 14 regular value
   on the right and a 16 chevron. A device row is a 20 glyph with a 16 semibold
   title over a 12 regular line, and a 12 semibold pill. A cap row puts the
   value in 16 semibold above its 12 regular explanation. */
import React, { ReactNode } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Icon } from './Icon';
import { Body, Caption, Head, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, space } from './tokens';
import { Tap } from './motion';

export function SectionLabel({ children }: { children: string }) {
  return <Body tone="secondary">{children}</Body>;
}

export function SettingRow({
  glyph,
  title,
  value,
  onPress,
}: {
  glyph?: IconName;
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
      {glyph ? <Icon name={glyph} size={28} /> : <View style={{ width: 28 }} />}
      <Row style={{ flex: 1 }}>{title}</Row>
      {value ? <Meta tone="secondary">{value}</Meta> : null}
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

export function ToggleRow({
  glyph,
  title,
  sub,
  value,
  onChange,
}: {
  glyph?: IconName;
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s5 }}>
      {glyph ? <Icon name={glyph} size={28} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        {sub ? <Meta tone="secondary">{sub}</Meta> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ true: colour.good, false: colour.rule }}
      />
    </View>
  );
}

export function DeviceRow({
  glyph,
  title,
  where,
  tag,
  onPress,
}: {
  glyph: IconName;
  title: string;
  where: string;
  tag?: string;
  onPress?: () => void;
}) {
  return (
    <Tap
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s5,
      }}
    >
      <Icon name={glyph} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Caption tone="secondary">{where}</Caption>
      </View>
      {tag ? (
        <View
          style={{
            backgroundColor: colour.surface2,
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
