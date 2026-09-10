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
import { Bubble } from './Bubble';
import { Caption, Display, Head, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, radius, space } from './tokens';
import { Tap } from './motion';

/* The wallet bar sits under the status bar rather than at the top of the
   column the rest of the screen keeps to — the frames put it twenty above
   where everything else begins. The bell is on the pale disc; the mark is
   not. */
export function WalletHeader({ onSettings, onAlerts }: { onSettings?: () => void; onAlerts?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -20 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings}>
        <Icon name="mark" size={28} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Label>Wallet</Label>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Alerts"
        onPress={onAlerts}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colour.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="bell" size={18} />
      </Pressable>
    </View>
  );
}

export function Balance({ whole, kobo, change }: { whole: string; kobo: string; change: string }) {
  return (
    <View style={{ alignItems: 'center', gap: space.s2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <Meta tone="secondary">Total balance</Meta>
        <View
          style={{
            backgroundColor: colour.surface2,
            borderRadius: radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Label>{change}</Label>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Display>{whole}</Display>
        <Head style={{ marginTop: 8 }}>{kobo}</Head>
      </View>
    </View>
  );
}

/* The frames leave more room above the four than the column's own gap — the
   balance and what it can do read as one block, and these are the next one. */
export function Shortcuts({ items }: { items: { glyph: IconName; label: string; onPress?: () => void }[] }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 }}>
      {items.map(i => (
        <Tap
          key={i.label}
          accessibilityRole="button"
          onPress={i.onPress}
          style={{
            alignItems: 'center',
            gap: 10,
            flex: 1,
          }}
        >
          <Icon name={i.glyph} size={28} />
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
  plain = false,
  go = false,
  onPress,
}: {
  lead: ReactNode;
  title: string;
  sub: string;
  value?: string;
  /* the card tile is white with a hairline where the others are pale grey */
  plain?: boolean;
  /* and it ends in a filled circle rather than a bare chevron */
  go?: boolean;
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
        backgroundColor: plain ? colour.surface : colour.surface2,
        borderWidth: plain ? 1 : 0,
        borderColor: colour.rule,
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
      {go ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colour.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron" size={16} colour={colour.textInverse} />
        </View>
      ) : (
        <Icon name="chevron" size={16} colour={colour.textTertiary} />
      )}
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

/* Something the agent noticed.

   The frames draw it as a white card with a hairline: the mark and what it
   noticed across the top, the line itself in the pale blue bubble, and then
   what you can do about it. Where it can be put away, the black button and the
   round dismiss sit in one row; where it cannot, the action is a grey pill
   with a chevron on it. */
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
    /* the frames set one of these close under the line above it, not a column
       gap away */
    <View
      style={{
        backgroundColor: colour.surface,
        borderWidth: 1,
        borderColor: colour.rule,
        borderRadius: radius.lg,
        padding: space.s4,
        gap: space.s3,
        marginTop: -11,
        marginBottom: 11,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <Icon name="mark" size={32} colour={colour.accent} />
        <Label style={{ flex: 1 }}>{kicker}</Label>
      </View>
      {body ? <Bubble>{body}</Bubble> : null}
      {children}
      {action ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: onDismiss ? colour.ink : colour.surface2,
              borderRadius: radius.pill,
              height: 44,
            }}
          >
            <Row tone={onDismiss ? 'inverse' : 'ink'}>{action}</Row>
            {onDismiss ? null : <Icon name="chevron" size={16} colour={colour.textTertiary} />}
          </Pressable>
          {onDismiss ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not now"
              onPress={onDismiss}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colour.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close-small" size={16} colour={colour.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
