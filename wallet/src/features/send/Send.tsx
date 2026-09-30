/* Send money, from its frame: the amount, who it is going to, a reference,
   and from where, when it lands and the fee, each on its own white card in
   one grey one, with Beetle saying where things stand above them and Slide
   to send at the foot beside Back. Send on the card and Send money in More
   open it empty; a tap on the amount opens the keypad page, a tap on the
   person opens the people paid before with a number to type and the
   camera under them, and the reference is typed in place. Past the balance
   the slide leads to Not enough; otherwise to the passcode, and the receipt
   after it, with the line in the day. Four taps: Send, who, the amount,
   and the passcode — the slide is a drag. */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Body, Caption, Display, Icon, Label, Meta, PageHead, Say, Screen, Tap, colour, measure, toast, useDeparture, type Rect } from '../../design';
import { DEMO_SAVED, PEOPLE, beneficiariesOf, feeFor, feeLabel, ownLine, reader, whose, type Move, type Person } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { rowFrom, useMoves } from '../home/moves';
import { clock } from '../agent/chats';
import { SavedPeek } from '../agent/SavedPeek';
import { PasscodeSheet, lockedFor } from '../passcode';
import { handoff } from '../scan/handoff';
import { LAB } from '../../lab/enabled';
import { groupAccount, initialsOf, naira } from '../../lib/format';
import { draft, softReading } from './hand';

const later = (what: string, round: number) => () => toast(`${what} comes with round ${round}.`);
/** The three parts the frame's message fills in, for the lab. */
const DEMO = { who: PEOPLE[0]!, amount: 50_000, reference: 'Flat deposit', said: 'send Sarah 50k for the flat deposit' };
const FROM_MESSAGE = 'I took this from your message';

export function Send() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + moves.reduce((a, r) => a + r.amount, 0);
  const saved = useMemo(
    () => beneficiariesOf([...moves, ...(h?.ledger ?? [])], account?.demo ? DEMO_SAVED : { lines: [], meters: [] }, PEOPLE, account ? ownLine(account.phone) : null),
    [moves, h, account],
  );

  const [who, setWho] = useState<Person | null>(demo ? DEMO.who : null);
  const [whoNote, setWhoNote] = useState(demo ? 'The only Sarah you have paid' : '');
  const [read, setRead] = useState<'photo' | undefined>(undefined);
  const [amount, setAmount] = useState(demo ? DEMO.amount : 0);
  const [amountNote, setAmountNote] = useState(demo ? FROM_MESSAGE : '');
  const [reference, setReference] = useState(demo ? DEMO.reference : '');
  const [refNote, setRefNote] = useState(demo ? FROM_MESSAGE : '');
  const [said] = useState(demo ? DEMO.said : '');
  const [typing, setTyping] = useState(false);
  const [number, setNumber] = useState('');
  const [pick, setPick] = useState<Rect | null>(null);
  const [guard, setGuard] = useState(false);
  const [busy, setBusy] = useState(false);
  const whoCard = useRef<View>(null);
  const numberField = useRef<TextInput>(null);

  /* a photo the camera took: the number on it, or both readings where the reader was not sure */
  const readPhoto = useCallback(
    async (uri: string) => {
      setBusy(true);
      const r = await reader.read(uri);
      setBusy(false);
      if (r.soft) {
        softReading.put(r);
        router.push('/misread');
        return;
      }
      const n = r.numbers[0];
      if (!n) {
        toast('I could not find an account number on that photo.');
        return;
      }
      setWho(whose(n, r));
      setWhoNote('Read off the photo');
      setRead('photo');
      setTyping(false);
    },
    [router],
  );

  /* back in front: what the keypad, Check this number or Not enough handed back, or the photo the camera took */
  useFocusEffect(
    useCallback(() => {
      const d = draft.take();
      if (d) {
        if (d.who) {
          setWho(d.who);
          setWhoNote(d.whoNote ?? '');
          setRead(d.read);
          setTyping(false);
        }
        if (d.amount !== undefined) {
          setAmount(d.amount);
          setAmountNote(d.amountNote ?? '');
        }
        if (d.reference !== undefined) setReference(d.reference);
        if (d.typing) {
          setTyping(true);
          setNumber('');
          setTimeout(() => numberField.current?.focus(), 400);
        }
      }
      const photo = handoff.take();
      if (photo) void readPhoto(photo.uri);
    }, [readPhoto]),
  );

  /* the account number typed: ten digits and it is somebody */
  const typed = (digits: string) => {
    const n = digits.replace(/\D/g, '').slice(0, 10);
    setNumber(n);
    if (n.length < 10) return;
    const p = whose(n);
    const known = saved.people.find(x => x.number === n);
    setWho(known ? { name: known.name, bank: known.bank, number: known.number } : p);
    setWhoNote(known ? `${known.name}, who you have paid before` : 'You typed the number');
    setRead(undefined);
    setTyping(false);
  };

  /* Slide to send: past the balance it is Not enough; otherwise the passcode */
  const slide = () => {
    if (!who || !amount) return;
    if (amount > balance) {
      router.push(`/short?asked=${amount}`);
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${shut} seconds and slide again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the line goes into the day, and its receipt opens */
  const done = () => {
    if (!who || !account) return;
    const at = clock();
    const fee = feeFor(amount);
    const move: Move = { name: who.name, detail: `${who.bank} · sent · ${at}`, amount: -amount, icon: 'send', kind: 'transfer', fee, person: who, reference: reference.trim() || undefined, read };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    router.replace(`/receipt/${row.id}`);
  };

  useFoot({ kind: 'slide', label: 'Slide to send', amount: naira(amount), disabled: !who || !amount || busy || typing, onSlide: slide, veil: guard ? 'away' : pick ? 'recede' : undefined });
  /* the keypad page arrives from the figure */
  const amend = useDeparture({ id: 'send:amount', to: `/amend?amount=${amount}`, words: naira(amount) });

  if (!ok || !account) return null;
  const first = who?.name.split(' ')[0] ?? '';
  const fee = feeFor(amount);
  const over = amount > balance;
  const line = busy
    ? 'Reading the photo…'
    : said && who && amount
      ? 'Here it is, ready to go. Check the three parts I filled in.'
      : over && who
        ? `That is ${naira(amount - balance)} more than Everyday holds. Slide, and I show you three ways to close it.`
        : who && amount
          ? 'Here it is, ready to go. Check it, then slide.'
          : who
            ? `How much for ${first}? Tap the amount to type it.`
            : amount
              ? `Who is the ${naira(amount)} for? Tap the card to choose.`
              : 'Who is it for, and how much? Tap a card to fill it in, or point the camera at an account number.';
  const openPeople = () => void measure(whoCard).then(setPick);

  return (
    <>
      <Screen head={<PageHead title="Send money" sub={who ? `To ${who.name}` : 'From Everyday'} />}>
        {said ? (
          <View style={{ gap: 8 }} testID="you-typed">
            <Caption tone="secondary">You typed</Caption>
            <Body tone="secondary">{said}</Body>
          </View>
        ) : null}
        <View style={said ? { marginTop: -4 } : null}>
          <Say testID="say">{line}</Say>
        </View>
        {/* the frame runs the grey card 7 under the bubble, and 12 around the white cards, 8 between them */}
        <View style={s.card} testID="send-card">
          <Tap ref={amend.ref} accessibilityRole="button" accessibilityLabel="The amount" onPress={amend.onPress} style={[s.sub, s.amount, amend.style]} testID="send-amount">
            <Display tone={amount ? 'ink' : 'tertiary'}>{naira(amount)}</Display>
            <Caption tone="secondary">{amountNote || (amount ? 'Tap to change it' : 'Tap to type an amount')}</Caption>
          </Tap>
          {typing ? (
            <View style={[s.sub, s.who]} testID="send-who">
              <View style={s.typingRow}>
                <View style={s.disc}>
                  <Icon name="grid" size={18} colour={colour.ink} />
                </View>
                <TextInput
                  ref={numberField}
                  accessibilityLabel="Account number"
                  value={number}
                  onChangeText={typed}
                  keyboardType="number-pad"
                  placeholder="Ten digits"
                  placeholderTextColor={colour.textTertiary}
                  style={s.input}
                  autoFocus
                />
              </View>
              <Caption tone="secondary">{number.length ? `${groupAccount(number)} · ${10 - number.length} to go` : 'As it is on their slip or their screen'}</Caption>
            </View>
          ) : (
            <Tap ref={whoCard} accessibilityRole="button" accessibilityLabel={who ? who.name : 'Who is it for?'} onPress={openPeople} style={[s.sub, s.who]} testID="send-who">
              <View style={s.person}>
                {who ? (
                  <Avatar initials={initialsOf(who.name)} size={38} />
                ) : (
                  <View style={s.disc}>
                    <Icon name="person" size={18} colour={colour.ink} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Label>{busy ? 'Reading…' : who ? who.name : 'Who is it for?'}</Label>
                  <Meta tone="secondary">{who ? `${who.bank} · ${groupAccount(who.number)}` : 'Someone you have paid, a number, or a photo'}</Meta>
                </View>
                <View style={{ marginTop: 11 }}>
                  <Icon name="chevron" size={16} colour={colour.textTertiary} />
                </View>
              </View>
              {whoNote ? <Caption tone="secondary">{whoNote}</Caption> : null}
            </Tap>
          )}
          <View style={[s.sub, s.ref]} testID="send-ref">
            <View style={s.refRow}>
              <Body tone="secondary">Reference</Body>
              <TextInput
                accessibilityLabel="Reference"
                value={reference}
                onChangeText={v => {
                  setReference(v);
                  setRefNote('');
                }}
                placeholder="Add one"
                placeholderTextColor={colour.textTertiary}
                style={s.refInput}
                returnKeyType="done"
              />
            </View>
            <Caption tone="secondary">{refNote || 'They see it on their statement'}</Caption>
          </View>
          <View style={[s.sub, s.rows]} testID="send-rows">
            <Tap accessibilityRole="button" accessibilityLabel="From" onPress={later('Paying from Dollars', 6)} style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                From
              </Body>
              <Label style={s.value}>{`Everyday · ${naira(balance)}`}</Label>
              <Icon name="chevron" size={16} colour={colour.textTertiary} />
            </Tap>
            <Tap accessibilityRole="button" accessibilityLabel="Arrives" onPress={later('Sending it later', 7)} style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                Arrives
              </Body>
              <Label style={s.value}>{amount > 50_000 ? 'Under a minute' : 'In a few seconds'}</Label>
              <Icon name="chevron" size={16} colour={colour.textTertiary} />
            </Tap>
            <View style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                Fee
              </Body>
              <Label style={[s.value, { color: fee ? colour.ink : colour.goodText }]}>{feeLabel(fee)}</Label>
            </View>
          </View>
        </View>
        <View style={s.lock}>
          <Icon name="lock" size={16} colour={colour.textTertiary} />
          <Meta tone="secondary">Nothing moves until you slide</Meta>
        </View>
      </Screen>
      {pick ? (
        <SavedPeek
          kind="person"
          list={saved.people}
          at={pick}
          extras={[
            {
              glyph: 'grid',
              label: 'Type an account number',
              onPress: () => {
                setPick(null);
                setTyping(true);
                setNumber('');
                setTimeout(() => numberField.current?.focus(), 300);
              },
            },
            {
              glyph: 'camera',
              label: 'Point the camera at one',
              onPress: () => {
                setPick(null);
                router.push('/scan');
              },
            },
          ]}
          onPick={b => {
            if (b.kind !== 'person') return;
            setWho({ name: b.name, bank: b.bank, number: b.number });
            setWhoNote(b.times > 1 ? `Paid ${b.times} times, the last ${b.when.toLowerCase()}` : `Paid once, ${b.when.toLowerCase()}`);
            setRead(undefined);
            setPick(null);
          }}
          onClose={() => setPick(null)}
        />
      ) : null}
      {guard && who ? (
        <PasscodeSheet amount={naira(amount)} name={who.name} detail={`${who.bank} · ${groupAccount(who.number)}`} verify={app.checkPasscode} onDone={done} onCancel={() => setGuard(false)} />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  card: { marginTop: -13, backgroundColor: colour.surface2, borderRadius: 24, padding: 12, gap: 8 },
  sub: { backgroundColor: colour.surface, borderRadius: 20, paddingHorizontal: 16 },
  amount: { paddingTop: 12, paddingBottom: 10, gap: 12 },
  /* the frame boxes the person's row at 38 — the chip and the chevron sit on that — and lets the two lines beside them run to 44 */
  who: { paddingTop: 12, paddingBottom: 9, gap: 8 },
  person: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, height: 38, overflow: 'visible' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 38 },
  disc: { width: 38, height: 38, borderRadius: 19, backgroundColor: colour.surface3, alignItems: 'center', justifyContent: 'center' },
  /* outlineWidth 0: the browser's own focus ring has no place on the card */
  input: { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 24, fontWeight: '600', color: colour.ink, padding: 0, letterSpacing: 1, outlineWidth: 0 },
  ref: { paddingTop: 11, paddingBottom: 8, gap: 8 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 22, overflow: 'visible' },
  refInput: { flex: 1, minWidth: 0, textAlign: 'right', fontSize: 16, lineHeight: 24, color: colour.ink, padding: 0, outlineWidth: 0 },
  rows: { paddingHorizontal: 16, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56 },
  value: { fontSize: 16, lineHeight: 24 },
  lock: { marginTop: -6, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
