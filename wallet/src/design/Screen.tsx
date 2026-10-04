/* The page itself, and the pieces every page is made of. A screen column is
   spaced 20, starts 72 down and leaves 124 clear at the bottom for the dock.
   A card is 24 radius with 20 and 21 of padding. */
import React, { ReactNode, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { Meta, Row } from './text';
import { IconName } from '../icons';
import { colour, frame, radius, space } from './tokens';
import { Tap } from './motion';
import { Wash } from './Wash';
import { JourneyProvider } from './journey';
import { SoftBlur } from './Glass';
import { HeadScroll, SMALL, SMALL_TOP } from './collapse';
import { useSheet } from './sheetStack';
import Animated, { useAnimatedScrollHandler, useDerivedValue, useSharedValue } from 'react-native-reanimated';

/* The page slides in and out whole, with the phone's own movement (the
   stack in app/(app)/_layout.tsx): nothing in it arrives on its own. The
   `head` stays at the top while the column scrolls under it, the title
   shrinking to the size of home's word Wallet as it does (see collapse.ts),
   over a soft blur that comes in as the first of the column passes under.
   In a sheet (sheetStack.tsx) the head starts near the sheet's top, under a
   grabber, and the ground is plain white. */
export function Screen(props: ScreenProps) {
  return (
    <JourneyProvider>
      <Body {...props} />
    </JourneyProvider>
  );
}

type ScreenProps = {
  children: ReactNode;
  /* the page's head, which stays at the top as the column scrolls */
  head?: ReactNode;
  dock?: ReactNode;
  /* kept for the screens that say it: nothing arrives on its own now */
  still?: boolean;
  leaving?: boolean;
  /* the blob of colour some frames open with */
  wash?: { tone: string; height?: number };
  /* the way-in frames hang their column off the dock rather than the status bar */
  sink?: boolean;
  /* no white of its own: the column over whatever it opens over (a receipt over its page) */
  bare?: boolean;
};

/** How tall the soft blur at the top is: well past the shrunk title, so it is at its strongest behind it, with room under it to fade. */
const BAND = SMALL_TOP + Math.round(SMALL * 1.43) + 52;
/** In a sheet the head starts this far under the sheet's top, the grabber over it. */
const SHEET_HEAD = 32;

function Body({ children, head, dock, wash, sink = false, bare = false }: ScreenProps) {
  const sheet = useSheet();
  /* where the head starts: the frames' 72 on a page, near the top of a sheet */
  const headTop = sheet ? SHEET_HEAD : frame.topPad;
  const y = useSharedValue(0);
  const onWorklet = useAnimatedScrollHandler(e => {
    y.value = e.contentOffset.y;
  });
  /* the web is handed the scroll as an ordinary event */
  const onScroll = Platform.OS === 'web' ? (e: NativeSyntheticEvent<NativeScrollEvent>) => (y.value = e.nativeEvent.contentOffset.y) : onWorklet;
  /* the blur comes in as the column starts to pass under the head */
  const blur = useDerivedValue(() => Math.max(0, Math.min(1, y.value / 24)));
  /* the head's height as it lies, so the column starts where it did when the head was part of it */
  const [headH, setHeadH] = useState<number | null>(null);
  const top = head ? headTop + (headH ?? 0) + frame.columnGap : headTop;
  const band = BAND - (frame.topPad - headTop);
  return (
    <HeadScroll.Provider value={y}>
      <View style={[s.screen, bare && s.bare]}>
        {wash ? <Wash tone={wash.tone} height={wash.height} /> : null}
        {/* the head comes before the column, so a screen reader says the title
            first, and is drawn over it, the blur between them */}
        {head ? (
          /* in a sheet the head is where a swipe down starts: it keeps the touch from the column under it, so the sheet takes it */
          <View style={[s.head, { top: headTop }]} pointerEvents={sheet ? 'auto' : 'box-none'} onLayout={e => setHeadH(e.nativeEvent.layout.height)} testID="page-head">
            {head}
          </View>
        ) : null}
        {head ? (
          <View style={[s.band, { height: band }]} pointerEvents="none">
            <SoftBlur side="top" height={band} k={blur} strong testID="head-blur" />
          </View>
        ) : null}
        <Animated.ScrollView
          style={{ flex: 1, opacity: head && headH === null ? 0 : 1 }}
          contentContainerStyle={[s.body, { paddingTop: top }, sink && s.sunk]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {children}
        </Animated.ScrollView>
        {dock}
        {/* a sheet's grabber, on a strip across its top that takes the touch, so a swipe down from there puts the sheet away */}
        {sheet ? (
          <View style={[s.grab, { height: headTop }]} testID="sheet-grab">
            <View style={s.grabber} testID="sheet-grabber" />
          </View>
        ) : null}
      </View>
    </HeadScroll.Provider>
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
    paddingBottom: frame.bottomPad,
    gap: frame.columnGap,
  },
  /* the head where the column used to start it: 72 down, 20 in */
  head: { position: 'absolute', top: frame.topPad, left: frame.sidePad, right: frame.sidePad, zIndex: 2 },
  /* the soft blur at the top, over the column and under the head */
  band: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  grab: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 8, alignItems: 'center', zIndex: 3 },
  grabber: { width: 36, height: 5, borderRadius: 2.5, backgroundColor: colour.ruleStrong },
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
