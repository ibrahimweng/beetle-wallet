/* The page itself, and the pieces every page is made of. A screen column is
   spaced 20, starts 72 down and leaves 124 clear at the bottom for the dock.
   A card is 24 radius with 20 and 21 of padding. */
import React, { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, frame, radius, space } from './tokens';
import { Pane, Tap } from './motion';
import { Wash } from './Wash';
import { JourneyProvider, useRecession } from './journey';
import Animated from 'react-native-reanimated';

/* The column and the dock arrive together, out of a blur, and when the screen
   is `leaving` they go back into one before the next screen comes. The
   `head` sits above the pane and arrives on its own: from the thing that
   opened the screen, where there was one (see journey.tsx). When something
   on the screen leads away, the whole of it recedes until it is come back to. */
export function Screen(props: ScreenProps) {
  return (
    <JourneyProvider>
      <Body {...props} />
    </JourneyProvider>
  );
}

type ScreenProps = {
  children: ReactNode;
  /* the page's head, arriving on its own ahead of the pane */
  head?: ReactNode;
  dock?: ReactNode;
  still?: boolean;
  /* on its way out: see useLeave */
  leaving?: boolean;
  /* the blob of colour some frames open with */
  wash?: { tone: string; height?: number };
  /* the way-in frames hang their column off the dock rather than the status bar */
  sink?: boolean;
  /* no white of its own: the column over whatever it opens over (a receipt over its page) */
  bare?: boolean;
};

function Body({ children, head, dock, still = false, wash, sink = false, leaving = false, bare = false }: ScreenProps) {
  const receding = useRecession();
  return (
    <View style={[s.screen, bare && s.bare]}>
      {wash ? <Wash tone={wash.tone} height={wash.height} /> : null}
      <Animated.View style={[{ flex: 1 }, receding]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.body, sink && s.sunk]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {head}
          {still ? (
            children
          ) : (
            <Pane leaving={leaving} delay={head ? 60 : 0} style={{ gap: frame.columnGap }}>
              {children}
            </Pane>
          )}
        </ScrollView>
        {still ? dock : <Pane leaving={leaving}>{dock}</Pane>}
      </Animated.View>
    </View>
  );
}

export function Card({ children, style, outline = false, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; outline?: boolean; testID?: string }) {
  return (
    <View style={[s.card, outline ? s.outline : null, style]} testID={testID}>
      {children}
    </View>
  );
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
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 }}>
      <Icon name={glyph} size={16} colour={colour.textTertiary} />
      <Meta tone="secondary" style={{ flex: 1 }}>
        {children}
      </Meta>
    </View>
  );
}

/* The bar at the foot of a way-in screen: back on the left, the button across
   the rest. 24 above and below, like the dock. */
/* A line the design puts under a heading, in the tertiary grey, or in red
   when something needs fixing. */
export function Note({ tone = 'secondary', children }: { tone?: 'secondary' | 'bad'; children: ReactNode }) {
  return <Meta tone={tone}>{children}</Meta>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.surface },
  bare: { backgroundColor: 'transparent' },
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
});
