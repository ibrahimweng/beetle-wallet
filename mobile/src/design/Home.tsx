/* The pieces the home screen is made of, taken off its frame. The balance is
   32 bold with the kobo at 20 semibold beside it; the four shortcuts use the
   tone glyphs, the only ones in the set that carry their own colour; a ledger
   row is a 20 glyph with a 16 semibold name over a 14 regular line and the
   amount 14 semibold on the right; and an insight is the agent's mark with a
   14 semibold kicker, a 16 regular body and one thing to do. */
import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
import { Body, Caption, Display, Head, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, radius, space } from './tokens';
import { Tap } from './motion';

export function WalletHeader({ onSettings, onAlerts }: { onSettings?: () => void; onAlerts?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings}>
        <Icon name="mark" size={32} colour={colour.accent} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Label>Wallet</Label>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Alerts" onPress={onAlerts}>
        <Icon name="bell" size={22} />
      </Pressable>
    </View>
  );
}

export function Balance({ whole, kobo, change }: { whole: string; kobo: string; change: string }) {
  return (
    <View style={{ alignItems: 'center', gap: space.s2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <Caption tone="secondary">Total balance</Caption>
        <View
          style={{
            backgroundColor: colour.surface2,
            borderRadius: radius.pill,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Caption style={{ fontWeight: '600' }}>{change}</Caption>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Display>{whole}</Display>
        <Head style={{ marginTop: 8 }}>{kobo}</Head>
      </View>
    </View>
  );
}

export function Shortcuts({ items }: { items: { glyph: IconName; label: string; onPress?: () => void }[] }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {items.map(i => (
        <Tap
          key={i.label}
          accessibilityRole="button"
          onPress={i.onPress}
          style={{
            alignItems: 'center',
            gap: space.s2,
            flex: 1,
          }}
        >
          <Icon name={i.glyph} size={32} />
          <Caption tone="secondary">{i.label}</Caption>
        </Tap>
      ))}
    </View>
  );
}

/* A card that stands for something with a figure attached: the dollars, the
   health score. */
export function Tile({
  lead,
  title,
  sub,
  value,
  onPress,
}: {
  lead: ReactNode;
  title: string;
  sub: string;
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
        gap: space.s4,
        backgroundColor: colour.surface2,
        borderRadius: radius.lg,
        padding: space.s4,
      }}
    >
      {lead}
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      {value ? <Row>{value}</Row> : null}
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

/* The health ring, with its score in the middle. */
export function Dial({ score, size = 36 }: { score: number; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colour.rule} strokeWidth={4} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colour.accent}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${(c * score) / 100} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Caption style={{ fontWeight: '600' }}>{String(score)}</Caption>
    </View>
  );
}

export function Filters({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: space.s2 }}>
      {options.map(o => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={{
              backgroundColor: on ? colour.ink : colour.surface2,
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Label tone={on ? 'inverse' : 'ink'}>{o}</Label>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LedgerRow({
  glyph,
  name,
  detail,
  amount,
  good,
  onPress,
}: {
  glyph: IconName;
  name: string;
  detail: string;
  amount: string;
  good?: boolean;
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
      <Icon name={glyph} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{name}</Row>
        <Meta tone="secondary">{detail}</Meta>
      </View>
      <Label tone={good ? 'good' : 'ink'}>{amount}</Label>
    </Tap>
  );
}

/* Something the agent noticed. It can always be put away. */
export function Insight({
  kicker,
  body,
  action,
  onAction,
  onDismiss,
  children,
}: {
  kicker: string;
  body?: string;
  action?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  children?: ReactNode;
}) {
  return (
    <View
      style={{ backgroundColor: colour.surface2, borderRadius: radius.lg, padding: space.s4, gap: space.s3 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <Label style={{ flex: 1 }}>{kicker}</Label>
        {onDismiss ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Not now" onPress={onDismiss}>
            <Icon name="close-small" size={16} colour={colour.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      {body ? <Body>{body}</Body> : null}
      {children}
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={{
            backgroundColor: colour.ink,
            borderRadius: radius.pill,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Row tone="inverse">{action}</Row>
        </Pressable>
      ) : null}
    </View>
  );
}
