/* Choosing a company from a long list (Round 39, the owner's word: chips
   were wrong for the electricity companies, and there are far more of them,
   and of banks, than chips can hold). A box of its own height with the list
   scrolling inside it, so whatever it sits in keeps its size; a field at its
   top to find one by name; each company with its logo, or its initials where
   it has none. The phone ticks as the rows pass under the finger and knocks
   once when one is picked. Where the card around it has room for no more,
   the pick folds the list away to the one picked, with Change to open it
   again. */
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Icon } from './Icon';
import { Logo, type LogoName } from './Logo';
import { Caption, Label, Meta } from './text';
import { Tap } from './motion';
import { feel } from './haptics';
import { colour, dark, font } from './tokens';

export type PickItem = {
  id: string;
  name: string;
  /** a second line: where it supplies, or what kind of bank it is */
  sub?: string;
  logo?: LogoName;
  /** other names it is found by (AEDC, GTB, Diamond) */
  words?: string[];
};

const ROW = 52;

const TONES = {
  light: {
    ink: colour.ink,
    soft: colour.textSecondary,
    faint: colour.textTertiary,
    box: colour.surface2,
    edge: colour.surface2,
    rowOn: colour.surface,
    mono: colour.surface3,
    monoInk: colour.ink,
    rule: colour.rule,
    link: colour.accent,
  },
  dark: {
    ink: dark.paper,
    soft: dark.textSoft,
    faint: dark.label,
    box: dark.edge,
    edge: dark.edgeStrong,
    rowOn: dark.edgeStrong,
    mono: dark.edgeStrong,
    monoInk: dark.paper,
    rule: dark.edgeStrong,
    link: dark.link,
  },
};

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(w => w && !/^(of|and|the|bank|plc|ltd|limited|nigeria)$/i.test(w))
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();

/** A company's mark: its logo where it has one, else its initials on a disc in the same place. */
export function CompanyMark({ name, logo, size = 32, round = true, tone = 'light' }: { name: string; logo?: LogoName; size?: number; round?: boolean; tone?: 'light' | 'dark' }) {
  if (logo) return <Logo name={logo} size={size} round={round} />;
  const t = TONES[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: round ? size / 2 : Math.round(size * 0.3), backgroundColor: t.mono, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Caption style={{ color: t.monoInk, ...font('600'), fontSize: Math.round(size * 0.36), lineHeight: Math.round(size * 0.5) }}>{initials(name)}</Caption>
    </View>
  );
}

/** The words typed, found in a company's name or any name it goes by; those whose name starts with them first. */
export function findIn(items: PickItem[], typed: string): PickItem[] {
  const q = typed.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return items;
  const flat = q.replace(/ /g, '');
  const score = (it: PickItem) => {
    const names = [it.name, ...(it.words ?? [])].map(n => n.toLowerCase());
    if (names.some(n => n.startsWith(q))) return 0;
    if (names.some(n => n.split(/[\s\-()]+/).some(w => w.startsWith(q)))) return 1;
    if (names.some(n => n.includes(q) || n.replace(/[\s\-()]+/g, '').includes(flat))) return 2;
    return -1;
  };
  return items
    .map(it => [it, score(it)] as const)
    .filter(([, sc]) => sc >= 0)
    .sort((a, b) => a[1] - b[1])
    .map(([it]) => it);
}

export function CompanyPicker({
  items,
  value,
  onPick,
  tone = 'light',
  placeholder = 'Find a company',
  rows = 4.5,
  pinned,
  pinnedTitle = 'Likely',
  allTitle,
  fold = false,
  what = 'company',
  testID = 'picker',
}: {
  items: PickItem[];
  value?: string | null;
  onPick: (item: PickItem) => void;
  tone?: 'light' | 'dark';
  placeholder?: string;
  /** how many rows show before the list scrolls; a half row at the foot says there is more */
  rows?: number;
  /** ids shown first under their own heading: the banks a number is likely at */
  pinned?: string[];
  pinnedTitle?: string;
  allTitle?: string;
  /** once one is picked, show only it, with Change to open the list again */
  fold?: boolean;
  /** what the list holds, for the words: company, bank, merchant */
  what?: string;
  testID?: string;
}) {
  const t = TONES[tone];
  const [typed, setTyped] = useState('');
  const [open, setOpen] = useState(!(fold && value));
  const passed = useRef(0);
  const picked = items.find(i => i.id === value) ?? null;

  /* the list as shown: what was typed, or the likely ones over everything else */
  const shown = useMemo(() => {
    if (typed.trim()) return { found: findIn(items, typed), top: [] as PickItem[] };
    const top = (pinned ?? []).map(id => items.find(i => i.id === id)).filter((i): i is PickItem => !!i);
    return { found: items.filter(i => !top.includes(i)), top };
  }, [items, typed, pinned]);
  const count = shown.top.length + shown.found.length + (shown.top.length ? 2 : 0) * 0.5;
  const height = Math.min(rows, Math.max(1, count)) * ROW;

  const pick = (it: PickItem) => {
    feel.pick();
    setTyped('');
    if (fold) setOpen(false);
    onPick(it);
  };
  /* a tick each time a row passes under the finger, the way a wheel clicks */
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const at = Math.round(e.nativeEvent.contentOffset.y / ROW);
    if (at !== passed.current) {
      passed.current = at;
      feel.tick();
    }
  };

  if (fold && picked && !open)
    return (
      <View style={[s.chosen, { backgroundColor: t.box, borderColor: t.edge }]} testID={`${testID}-chosen`}>
        <CompanyMark name={picked.name} logo={picked.logo} tone={tone} />
        <View style={{ flex: 1, gap: 2 }}>
          <Label style={{ color: t.ink }} numberOfLines={1}>
            {picked.name}
          </Label>
          {picked.sub ? (
            <Caption style={{ color: t.soft }} numberOfLines={1}>
              {picked.sub}
            </Caption>
          ) : null}
        </View>
        <Tap
          accessibilityRole="button"
          accessibilityLabel={`Change the ${what}`}
          onPress={() => {
            feel.tick();
            setOpen(true);
          }}
          hitSlop={8}
          style={[s.change, { backgroundColor: t.rowOn }]}
          testID={`${testID}-change`}
        >
          <Caption style={{ color: t.ink, ...font('600') }}>Change</Caption>
        </Tap>
      </View>
    );

  const row = (it: PickItem) => {
    const on = it.id === value;
    return (
      <Tap
        key={it.id}
        accessibilityRole="button"
        accessibilityLabel={it.name}
        accessibilityState={{ selected: on }}
        onPress={() => pick(it)}
        scale={0.98}
        style={[s.row, on ? { backgroundColor: t.rowOn } : null]}
        testID={`${testID}-row`}
      >
        <CompanyMark name={it.name} logo={it.logo} tone={tone} />
        <View style={{ flex: 1, gap: 1 }}>
          <Label style={{ color: t.ink }} numberOfLines={1}>
            {it.name}
          </Label>
          {it.sub ? (
            <Caption style={{ color: t.soft }} numberOfLines={1}>
              {it.sub}
            </Caption>
          ) : null}
        </View>
        {on ? <Icon name="check" size={16} colour={t.ink} /> : null}
      </Tap>
    );
  };
  const heading = (words: string) => (
    <Caption key={words} style={[s.heading, { color: t.faint }]}>
      {words}
    </Caption>
  );

  return (
    <View style={[s.box, { backgroundColor: t.box, borderColor: t.edge }]} testID={testID}>
      <View style={[s.find, { borderBottomColor: t.rule }]}>
        <Icon name="search" size={16} colour={t.faint} />
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder={placeholder}
          placeholderTextColor={t.faint}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={placeholder}
          style={[s.input, { color: t.ink }]}
          testID={`${testID}-find`}
        />
        {typed ? (
          <Tap accessibilityRole="button" accessibilityLabel="Clear" onPress={() => setTyped('')} hitSlop={10}>
            <Icon name="close" size={14} colour={t.faint} />
          </Tap>
        ) : null}
      </View>
      <ScrollView style={{ height }} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator onScroll={onScroll} scrollEventThrottle={32} testID={`${testID}-list`}>
        {shown.top.length ? heading(pinnedTitle) : null}
        {shown.top.map(row)}
        {shown.top.length ? heading(allTitle ?? `Every ${what}`) : null}
        {shown.found.map(row)}
        {!shown.top.length && !shown.found.length ? (
          <Meta style={[s.none, { color: t.soft }]} testID={`${testID}-none`}>
            {`No ${what} called “${typed.trim()}”.`}
          </Meta>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  find: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  /* outlineWidth 0: the browser's own focus ring has no place in the box */
  input: { flex: 1, minWidth: 0, fontSize: 15, ...font('500'), padding: 0, outlineWidth: 0 } as object,
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: ROW, paddingHorizontal: 10, borderRadius: 12, marginHorizontal: 4 },
  heading: { height: ROW / 2, paddingHorizontal: 14, paddingTop: 8 },
  none: { paddingHorizontal: 14, paddingVertical: 16 },
  chosen: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  change: { height: 28, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
