/* To: the first field of a transfer, on Send money and in the chat's card.

   It takes all three ways of saying who. A $tag looks in Beetle's own
   directory; a name brings the closest names, from the people paid before
   and from Beetle's accounts, each with its bank said; ten digits ask which
   bank — the likely ones first, every bank a tap away — and then the name on
   the account is looked up there and shown. Picked, the field folds into
   the person: their name, their bank and number (or their tag), and how they
   were found, with Change beside them. Nothing about who can be wrong
   without the screen saying so. Light on a page, dark on the chat's card. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Avatar, Caption, Chevron, Icon, Label, Meta, Tap, colour, dark } from '../../design';
import { BEETLE, allBanks, checkName, closest, isBeetle, likelyBanks, tagWords, toKind, type Match } from '../../services/recipients';
import type { Person, PersonPaid } from '../../services';
import { groupAccount, initialsOf } from '../../lib/format';

export type ToTone = 'light' | 'dark';

const LOOK = {
  light: {
    ink: colour.ink,
    soft: colour.textSecondary,
    faint: colour.textTertiary,
    good: colour.goodText,
    warn: colour.bad,
    link: colour.accent,
    box: colour.surface2,
    edge: 'transparent',
    row: colour.surface2,
    chip: colour.surface2,
    chipOn: colour.ink,
    chipText: colour.ink,
    chipOnText: colour.textInverse,
    disc: colour.surface3,
  },
  dark: {
    ink: '#ffffff',
    soft: dark.textSoft,
    faint: dark.label,
    good: '#7fd99a',
    warn: '#ffd48a',
    link: '#9fb0ff',
    box: dark.edge,
    edge: dark.edgeStrong,
    row: dark.edge,
    chip: dark.edge,
    chipOn: '#ffffff',
    chipText: '#ffffff',
    chipOnText: '#000000',
    disc: dark.edgeStrong,
  },
} as const;

/** How the person was found, as the line under them says it. */
export const howOf = (p: Person, times?: number) =>
  isBeetle(p) ? 'A Beetle account · free, and there at once' : times ? `Paid ${times === 1 ? 'once' : `${times} times`} before` : `Name checked at ${p.bank}`;

/** Their bank and their number, or Beetle and their tag: what every screen says under a name. */
export const whereOf = (p: Person) => (isBeetle(p) && p.tag ? `${BEETLE} · ${tagWords(p.tag)}` : `${p.bank} · ${groupAccount(p.number)}`);

export function ToField({
  tone = 'light',
  value,
  note,
  onChange,
  paid,
  onCamera,
  initial = '',
  showRecent = false,
  onFocus,
  autoFocus = false,
  label,
  testID = 'to',
}: {
  tone?: ToTone;
  /** who it is going to, once known */
  value: Person | null;
  /** how they were found, under them */
  note?: string;
  /** somebody picked, or the field opened again; with how they were found */
  onChange: (p: Person | null, how?: string) => void;
  /** the people paid before */
  paid: PersonPaid[];
  /** the camera, where the page has one */
  onCamera?: () => void;
  /** words already said: a name, a tag or a number from a message */
  initial?: string;
  /** the people paid before, under the empty field */
  showRecent?: boolean;
  onFocus?: () => void;
  autoFocus?: boolean;
  /** the field's own word over it, with Change across from it once somebody is picked */
  label?: string;
  testID?: string;
}) {
  const look = LOOK[tone];
  const [text, setText] = useState(() => (toKind(initial) === 'number' ? groupDigits(initial.replace(/\D/g, '').slice(0, 10)) : initial));
  const [bank, setBank] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const [find, setFind] = useState('');
  const input = useRef<TextInput>(null);
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const kind = toKind(text);
  const digits = text.replace(/\D/g, '');
  const matches: Match[] = useMemo(() => (kind === 'tag' || kind === 'name' ? closest(text, paid) : []), [kind, text, paid]);
  const likely = useMemo(() => (digits.length === 10 ? likelyBanks(digits, paid).slice(0, 4) : []), [digits, paid]);
  const recent = useMemo(() => [...paid].sort((a, b) => b.times - a.times).slice(0, 3), [paid]);

  const pick = (p: Person, how: string) => {
    setProblem(null);
    setBank(null);
    setAll(false);
    onChange(p, how);
  };
  /* ten digits and a bank: the name on the account, looked up there */
  const lookUp = async (b: string) => {
    setBank(b);
    setAll(false);
    setProblem(null);
    setChecking(true);
    const r = await checkName(digits, b, paid);
    if (!live.current) return;
    setChecking(false);
    if (r.found) pick(r.person, isBeetle(r.person) ? howOf(r.person) : `Name checked at ${b}`);
    else setProblem(r.why);
  };
  const type = (t: string) => {
    /* a number is grouped as it is typed; anything else as it is */
    const next = toKind(t) === 'number' ? groupDigits(t.replace(/\D/g, '').slice(0, 10)) : t;
    setText(next);
    setBank(null);
    setProblem(null);
  };

  const change = (
    <Tap
      accessibilityRole="button"
      accessibilityLabel="Change who it is for"
      onPress={() => {
        onChange(null);
        setTimeout(() => input.current?.focus(), 60);
      }}
      hitSlop={10}
      testID={`${testID}-change`}
    >
      <Caption style={{ color: look.link, fontWeight: '600' }}>Change</Caption>
    </Tap>
  );
  const head = label ? (
    <View style={s.head}>
      <Caption style={{ color: look.soft }}>{label}</Caption>
      {value ? change : null}
    </View>
  ) : null;

  /* picked: the person, folded into one row, the whole of their bank and number said */
  if (value)
    return (
      <View style={{ gap: 8 }} testID={testID}>
        {head}
        <View style={s.person}>
          <Avatar initials={initialsOf(value.name)} size={38} />
          <View style={{ flex: 1, gap: 2 }}>
            <Label style={{ color: look.ink }} numberOfLines={1} testID={`${testID}-name`}>
              {value.name}
            </Label>
            <Meta style={{ color: look.soft }} numberOfLines={1} testID={`${testID}-where`}>
              {whereOf(value)}
            </Meta>
          </View>
          {label ? null : change}
        </View>
        {note ? (
          <View style={s.noteRow}>
            <Icon name="check" size={14} colour={look.good} />
            <Caption style={{ color: look.good, flex: 1 }} testID={`${testID}-note`}>
              {note}
            </Caption>
          </View>
        ) : null}
      </View>
    );

  const helper =
    kind === 'empty'
      ? 'A $tag for Beetle, or an account number for any bank'
      : kind === 'number'
        ? digits.length < 10
          ? `${digits.length} of 10 digits`
          : checking
            ? null
            : problem
              ? null
              : 'Which bank is it at?'
        : matches.length
          ? null
          : kind === 'tag'
            ? `No Beetle account is ${text.trim()}. Check the tag, or use their account number.`
            : 'Nobody by that name yet. Their $tag, or their account number, finds them.';

  return (
    <View style={{ gap: 10 }} testID={testID}>
      {head}
      <View style={[s.box, { backgroundColor: look.box, borderColor: look.edge, borderWidth: tone === 'dark' ? 1 : 0 }]}>
        <Icon name="search" size={18} colour={look.faint} />
        <TextInput
          ref={input}
          value={text}
          onChangeText={type}
          onFocus={onFocus}
          autoFocus={autoFocus}
          placeholder="$tag, name or number"
          placeholderTextColor={look.faint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel="Who it is for"
          style={[s.input, { color: look.ink }]}
          testID={`${testID}-input`}
        />
        {text ? (
          <Tap accessibilityRole="button" accessibilityLabel="Clear" onPress={() => type('')} hitSlop={8} style={s.icon}>
            <Icon name="close-small" size={18} colour={look.faint} />
          </Tap>
        ) : onCamera ? (
          <Tap accessibilityRole="button" accessibilityLabel="Point the camera at an account number" onPress={onCamera} hitSlop={8} style={s.icon} testID={`${testID}-camera`}>
            <Icon name="camera" size={20} colour={look.ink} />
          </Tap>
        ) : null}
      </View>
      {helper ? (
        <Caption style={{ color: look.soft, paddingHorizontal: 4 }} testID={`${testID}-helper`}>
          {helper}
        </Caption>
      ) : null}

      {/* nothing typed: the people paid before, one tap each */}
      {kind === 'empty' && showRecent && recent.length ? (
        <View testID={`${testID}-recent`}>
          <Caption style={{ color: look.faint, paddingHorizontal: 4, paddingBottom: 4 }}>Paid before</Caption>
          {recent.map(p => (
            <Choice
              key={p.id}
              look={look}
              person={{ name: p.name, bank: p.bank, number: p.number }}
              extra={p.times ? `Paid ${p.times === 1 ? 'once' : `${p.times} times`}` : undefined}
              onPress={() => pick({ name: p.name, bank: p.bank, number: p.number }, howOf({ name: p.name, bank: p.bank, number: p.number }, p.times))}
            />
          ))}
        </View>
      ) : null}

      {/* a name or a tag: the closest names, each with its bank */}
      {matches.length ? (
        <View testID={`${testID}-matches`}>
          {matches.map(m => (
            <Choice
              key={`${m.person.bank}:${m.person.number}`}
              look={look}
              person={m.person}
              extra={isBeetle(m.person) ? 'Free' : m.times ? `Paid ${m.times === 1 ? 'once' : `${m.times} times`}` : undefined}
              onPress={() => pick(m.person, howOf(m.person, m.times))}
            />
          ))}
        </View>
      ) : null}

      {/* ten digits: which bank, the likely ones first, then the name looked up there */}
      {kind === 'number' && digits.length === 10 ? (
        <View style={{ gap: 10 }} testID={`${testID}-banks`}>
          {checking ? (
            <View style={s.checking} testID={`${testID}-checking`}>
              <ActivityIndicator size="small" color={look.soft} />
              <Meta style={{ color: look.soft }}>{`Checking the name on ${groupDigits(digits)} at ${bank}…`}</Meta>
            </View>
          ) : (
            <>
              {problem ? (
                <Caption style={{ color: look.warn, paddingHorizontal: 4 }} testID={`${testID}-problem`}>
                  {problem}
                </Caption>
              ) : null}
              <View style={s.chips}>
                {likely.map(b => (
                  <Tap
                    key={b}
                    accessibilityRole="button"
                    accessibilityLabel={b}
                    onPress={() => void lookUp(b)}
                    scale={0.96}
                    style={[s.chip, { backgroundColor: bank === b ? look.chipOn : look.chip }]}
                    testID={`${testID}-bank`}
                  >
                    <Label style={{ color: bank === b ? look.chipOnText : look.chipText }}>{b}</Label>
                  </Tap>
                ))}
                <Tap
                  accessibilityRole="button"
                  accessibilityLabel="All banks"
                  onPress={() => setAll(a => !a)}
                  scale={0.96}
                  style={[s.chip, { backgroundColor: 'transparent', borderWidth: 1, borderColor: tone === 'dark' ? dark.edgeStrong : colour.rule }]}
                  testID={`${testID}-all-banks`}
                >
                  <Label style={{ color: look.ink }}>{likely.length ? 'Another bank' : 'Pick the bank'}</Label>
                  <Chevron dir={all ? 'up' : 'down'} size={14} colour={look.soft} />
                </Tap>
              </View>
              {all ? (
                <View style={[s.list, { backgroundColor: look.row }]} testID={`${testID}-bank-list`}>
                  <TextInput
                    value={find}
                    onChangeText={setFind}
                    placeholder="Find a bank"
                    placeholderTextColor={look.faint}
                    autoCorrect={false}
                    style={[s.find, { color: look.ink, borderBottomColor: tone === 'dark' ? dark.edgeStrong : colour.rule }]}
                    accessibilityLabel="Find a bank"
                  />
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {allBanks()
                      .filter(b => b.toLowerCase().includes(find.trim().toLowerCase()))
                      .map(b => (
                        <Tap key={b} accessibilityRole="button" accessibilityLabel={b} onPress={() => void lookUp(b)} style={s.bankRow}>
                          <Icon name="bank" size={16} colour={look.soft} />
                          <Meta style={{ color: look.ink, flex: 1 }}>{b}</Meta>
                        </Tap>
                      ))}
                  </ScrollView>
                </View>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

/* One person to pick: the initials, the name, the bank and number (or Beetle and the tag), and a word at the end. */
function Choice({ look, person, extra, onPress }: { look: (typeof LOOK)[ToTone]; person: Person; extra?: string; onPress: () => void }) {
  return (
    <Tap accessibilityRole="button" accessibilityLabel={`${person.name}, ${whereOf(person)}`} onPress={onPress} style={s.choice} testID="to-choice">
      <Avatar initials={initialsOf(person.name)} size={32} />
      <View style={{ flex: 1, gap: 1 }}>
        <Label style={{ color: look.ink }} numberOfLines={1}>
          {person.name}
        </Label>
        <Caption style={{ color: look.soft }} numberOfLines={1}>
          {whereOf(person)}
        </Caption>
      </View>
      {extra ? <Caption style={{ color: extra === 'Free' ? look.good : look.faint }}>{extra}</Caption> : null}
    </Tap>
  );
}

/** 0123 4567 89, as a number is typed: the way every screen groups an account number. */
const groupDigits = (d: string) => (d.length > 8 ? `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}` : d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d);

const s = StyleSheet.create({
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 16 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 14, paddingLeft: 14, paddingRight: 8 },
  /* outlineWidth 0: the browser's own focus ring has no place on the card */
  input: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 22, fontWeight: '500', padding: 0, outlineWidth: 0 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 48, borderRadius: 12, paddingHorizontal: 4 },
  checking: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 36, paddingHorizontal: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, borderRadius: 18, paddingHorizontal: 14 },
  list: { borderRadius: 14, overflow: 'hidden' },
  find: { height: 44, paddingHorizontal: 14, fontSize: 15, borderBottomWidth: 1, outlineWidth: 0 },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, borderRadius: 10 },
});
