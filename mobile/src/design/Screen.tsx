/* The page itself, and the pieces every page is made of. A screen column is
   spaced 20, starts 72 down and leaves 124 clear at the bottom for the dock.
   A card is 24 radius with 20 and 21 of padding. */
import React, { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, frame, radius, space } from './tokens';
import { Reveal, RevealAll, Tap } from './motion';
import { Wash } from './Wash';

/* The column arrives a piece at a time rather than all at once, so you can see
   the screen being put together after the tap that asked for it. The dock is
   last, and does not wait its turn — it is the thing you might want to touch
   straight away. */
export function Screen({
  children,
  dock,
  still = false,
  wash,
  sink = false,
}: {
  children: ReactNode;
  dock?: ReactNode;
  /* for a screen drawn behind a sheet, which should already be there */
  still?: boolean;
  /* the blob of colour some frames open with */
  wash?: { tone: string; height?: number };
  /* the way-in frames hang their column off the dock rather than the status bar */
  sink?: boolean;
}) {
  return (
    <View style={s.screen}>
      {wash ? <Wash tone={wash.tone} height={wash.height} /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.body, sink && s.sunk]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {still ? children : <RevealAll>{children}</RevealAll>}
      </ScrollView>
      {still ? (
        dock
      ) : (
        <Reveal index={2} rise={22}>
          {dock}
        </Reveal>
      )}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colour.rule }} />;
}

export function ListRow({
  icon,
  title,
  sub,
  right,
  onPress,
}: {
  icon?: IconName;
  title: string;
  sub?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
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
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
});
