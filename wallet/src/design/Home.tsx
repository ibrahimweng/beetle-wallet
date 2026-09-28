/* The pieces the home screen is made of, taken off its frame. The balance is
   32 bold with the kobo at 20 semibold beside it; the four shortcuts use the
   tone glyphs, the only ones in the set that carry their own colour; a ledger
   row is a 20 glyph with a 16 semibold name over a 14 regular line and the
   amount 14 semibold on the right; and an insight is the agent's mark with a
   14 semibold kicker, a 16 regular body and one thing to do. */
import React, { ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from './Icon';
import { Bubble } from './Bubble';
import { Caption, Display, Head, Label, Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, frame, radius, space } from './tokens';
import { Tap } from './motion';

/* The head of the first-day home, which its frame still draws the earlier
   way: the wallet bar sits under the status bar rather than at the top of the
   column the rest of the screen keeps to, twenty above where everything else
   begins, with the bell on the pale disc and the mark not. */
/* The mark the home frame sets by the wallet name is a picture, not a glyph,
   so it ships as one: the frame's own 36 disc, taken out of the file at 3x. */
const MARK = require('../../assets/wallet-mark.png');

export function WalletHeader({ onSettings, onAlerts }: { onSettings?: () => void; onAlerts?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -20, marginBottom: 4 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings}>
        <Image
          source={MARK}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          accessibilityLabel="Beetle"
        />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Label>Wallet</Label>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Alerts"
        onPress={onAlerts}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colour.surface2,
          borderWidth: 1,
          borderColor: colour.surface3,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="bell" size={16} />
      </Pressable>
    </View>
  );
}

export function Balance({ whole, kobo, change }: { whole: string; kobo: string; change: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, height: 24 }}>
        <Caption tone="secondary">Total balance</Caption>
        <View
          style={{
            height: 24,
            justifyContent: 'center',
            backgroundColor: colour.surface2,
            borderWidth: 1,
            borderColor: colour.surface3,
            borderRadius: 12,
            paddingHorizontal: 8,
          }}
        >
          <Label tone="secondary">{change}</Label>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 }}>
        <Display>{whole}</Display>
        <Head style={{ marginTop: 8, color: colour.ruleStrong }}>{kobo}</Head>
      </View>
    </View>
  );
}

/* The top of the home screen as its frame now draws it: one pale card the
   width of the phone, rounded 36 at its foot, holding the mark and the wallet
   name, the balance with its reading in dollars, Receive, the four shortcuts
   on a hairline card, and the hint that the rest is underneath. It starts at
   the top edge, above the column everything else keeps to, and what follows
   sits 32 under it rather than the column's 20. */
export function HomeCard({
  whole,
  kobo,
  dollars,
  onDollars,
  onReceive,
  shortcuts,
}: {
  whole: string;
  kobo: string;
  dollars: string;
  onDollars?: () => void;
  onReceive?: () => void;
  shortcuts: { glyph: IconName; label: string; onPress?: () => void }[];
}) {
  return (
    <View
      style={{
        marginTop: -frame.topPad,
        marginHorizontal: -frame.sidePad,
        marginBottom: 12,
        backgroundColor: colour.surface2,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image
          source={MARK}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          accessibilityLabel="Beetle"
        />
        <Label>Wallet</Label>
      </View>
      <View style={{ alignItems: 'center', gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Caption tone="secondary">Total balance</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 }}>
            <Display>{whole}</Display>
            <Head style={{ marginTop: 8, color: colour.ruleStrong }}>{kobo}</Head>
          </View>
          {/* the reading in dollars sits on a chip the colour of the card, so
              only its hairline shows */}
          <Tap
            accessibilityRole="button"
            accessibilityLabel="Your dollars"
            onPress={onDollars}
            style={{
              height: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colour.surface3,
              paddingHorizontal: 4,
              justifyContent: 'center',
            }}
          >
            <Label tone="secondary">{dollars}</Label>
          </Tap>
        </View>
        {/* Receive is a 40 pill here, padded 10, with the glyph on a 24 disc */}
        <Tap
          accessibilityRole="button"
          onPress={onReceive}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 40,
            borderRadius: 20,
            paddingHorizontal: 10,
            backgroundColor: colour.ink,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colour.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="receive-filled" size={14} colour={colour.ink} />
          </View>
          <Row tone="inverse">Receive</Row>
        </Tap>
        <View
          style={{
            alignSelf: 'stretch',
            flexDirection: 'row',
            gap: 4,
            borderRadius: 20,
            paddingVertical: 12,
            paddingHorizontal: 8,
          }}
        >
          {shortcuts.map(i => (
            <Tap
              key={i.label}
              accessibilityRole="button"
              onPress={i.onPress}
              style={{ flex: 1, alignItems: 'center', gap: 8, paddingVertical: 4 }}
            >
              <Icon name={i.glyph} size={32} />
              <Caption>{i.label}</Caption>
            </Tap>
          ))}
        </View>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Caption>Swipe Up</Caption>
          <View style={{ width: 27, height: 4, borderRadius: 2, backgroundColor: '#cdcdcd' }} />
        </View>
      </View>
    </View>
  );
}

/* The four shortcuts of the first-day home, whose frame still draws them
   bare, with more room above than the column's own gap. */
export function Shortcuts({ items }: { items: { glyph: IconName; label: string; onPress?: () => void }[] }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        marginTop: 4,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 8,
      }}
    >
      {items.map(i => (
        <Tap
          key={i.label}
          accessibilityRole="button"
          onPress={i.onPress}
          style={{ flex: 1, alignItems: 'center', gap: 8, paddingVertical: 4 }}
        >
          <Icon name={i.glyph} size={32} />
          <Caption>{i.label}</Caption>
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
        gap: space.s3,
        backgroundColor: plain ? colour.surface : colour.surface2,
        borderWidth: plain ? 1 : 0,
        borderColor: colour.rule,
        borderRadius: radius.card,
        paddingVertical: space.s3,
        paddingHorizontal: space.s4,
      }}
    >
      {lead}
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Meta tone="tertiary">{sub}</Meta>
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
        <Icon name="chevron" size={16} colour={colour.ruleStrong} />
      )}
    </Tap>
  );
}

/* The health ring, with its score in the middle. The home frame draws it in
   the green of a good thing with the score at row size; elsewhere it is the
   accent with a caption. */
export function Dial({
  score,
  size = 36,
  tone = colour.accent,
  strong = false,
}: {
  score: number;
  size?: number;
  tone?: string;
  strong?: boolean;
}) {
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
          stroke={tone}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${(c * score) / 100} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {strong ? <Row>{String(score)}</Row> : <Caption style={{ fontWeight: '600' }}>{String(score)}</Caption>}
    </View>
  );
}

/* The score as the home frame sets it at the head of the day: the ring with
   the number in it, the words, and a chevron, on a pale card padded 12 by 16. */
export function ScoreRow({
  score,
  title,
  sub,
  onPress,
}: {
  score: number;
  title: string;
  sub: string;
  onPress?: () => void;
}) {
  return (
    <Tap
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colour.surface2,
        borderRadius: radius.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <Dial score={score} tone={colour.goodText} strong />
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Meta tone="good">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.ruleStrong} />
    </Tap>
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
            <Label tone={on ? 'inverse' : 'secondary'}>{o}</Label>
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
