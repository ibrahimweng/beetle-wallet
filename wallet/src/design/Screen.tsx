/* The page itself, and the pieces every page is made of. A screen column is
   spaced 20, starts 72 down and leaves 124 clear at the bottom for the dock.
   A card is 24 radius with 20 and 21 of padding. */
import React, { ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, frame, radius, space } from './tokens';
import { Pane, Tap } from './motion';
import { Wash } from './Wash';

/* The column and the dock arrive together, out of a blur, and when the screen
   is `leaving` they go back into one before the next screen comes. */
export function Screen({
  children,
  dock,
  still = false,
  wash,
  sink = false,
  leaving = false,
}: {
  children: ReactNode;
  dock?: ReactNode;
  still?: boolean;
  /* on its way out: see useLeave */
  leaving?: boolean;
  /* the blob of colour some frames open with */
  wash?: { tone: string; height?: number };
  /* the way-in frames hang their column off the dock rather than the status bar */
  sink?: boolean;
}) {
  return (
    <View style={s.screen}>
      {wash ? <Wash tone={wash.tone} height={wash.height} /> : null}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.body, sink && s.sunk]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {still ? (
          children
        ) : (
          <Pane leaving={leaving} style={{ gap: frame.columnGap }}>
            {children}
          </Pane>
        )}
      </ScrollView>
      {still ? dock : <Pane leaving={leaving}>{dock}</Pane>}
    </View>
  );
}

export function Card({ children, style, outline = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; outline?: boolean }) {
  return <View style={[s.card, outline ? s.outline : null, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colour.rule }} />;
}

export function ListRow({ icon, title, sub, right, onPress }: { icon?: IconName; title: string; sub?: string; right?: ReactNode; onPress?: () => void }) {
  return (
    <Tap accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={s.row}>
      {icon ? <Icon name={icon} size={20} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        {sub ? <Meta tone="secondary">{sub}</Meta> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={18} colour={colour.textTertiary} /> : null)}
    </Tap>
  );
}

export function ActionRow(p: Parameters<typeof ListRow>[0]) {
  return (
    <Card style={{ paddingVertical: space.s3 }}>
      <ListRow {...p} />
    </Card>
  );
}

/* A line of small print beside a lock, the way the frames reassure. */
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

/* The bar at the foot of a way-in screen: back on the left, the button across
   the rest. 24 above and below, like the dock. */
export function BottomBar({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <View style={s.bottom}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="back" size={22} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

/* A line the design puts under a heading, in the tertiary grey, or in red
   when something needs fixing. */
export function Note({ tone = 'secondary', children }: { tone?: 'secondary' | 'bad'; children: ReactNode }) {
  return <Meta tone={tone}>{children}</Meta>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.surface },
  sunk: { flexGrow: 1, justifyContent: 'flex-end' },
  body: {
    paddingHorizontal: frame.sidePad,
    paddingTop: frame.topPad,
    paddingBottom: frame.bottomPad,
    gap: frame.columnGap,
  },
  card: {
    backgroundColor: colour.surface2,
    borderRadius: radius.card,
    paddingVertical: frame.cardPad.vertical,
    paddingHorizontal: frame.cardPad.horizontal,
    gap: space.s5,
  },
  outline: {
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.rule,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  bottom: {
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
  },
});
