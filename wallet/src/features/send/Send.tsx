/* Send money. The first field is To, and it takes all three ways of saying
   who (see ToField): a $tag finds a Beetle account, free and there at once;
   a name brings the closest names with their banks; ten digits ask which
   bank, and the name on the account is looked up and shown before anything
   can move. Then the amount, picked where it is (see design/Amount): the
   ruler, stepped and stopping hard at what Everyday can send, chips of the
   likely amounts, or the figure tapped and typed. Then the reference, typed
   in place, and from where, when it lands and the fee, the bank always said.
   No bubble from Beetle over it (see DESIGN.md): each card says what matters
   on its own line. Slide to send leads to the passcode, which shows the
   whole of it while the six digits go in, and the receipt after it, with
   the line in the day. Send on the card and Send money in More open it
   empty; the people paid before are under the empty To field, one tap each. */
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Body, Caption, Icon, Label, Meta, PageHead, Screen, Tap, YouTyped, colour, toast } from '../../design';
import { DEMO_SAVED, PEOPLE, arrivesAt, beneficiariesOf, feeLabel, feeTo, isBeetle, ownLine, reader, whose, type Move, type Person, type Reading } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { clock } from '../agent/chats';
import { PasscodeSheet, lockedFor } from '../passcode';
import { handoff } from '../scan/handoff';
import { LAB } from '../../lab/enabled';
import { moneyExact, naira } from '../../lib/format';
import { checkFor, draft, softReading } from './hand';
import { refuses } from './rules';
import { useOnline } from '../offline';
import { PayFromSheet, dollarsOf, usdFull, usdOf, type Source } from '../dollars';
import { ToField, howOf, whereOf } from './ToField';

/** The three parts the frame's message fills in, for the lab. */
const DEMO = { who: PEOPLE[0]!, amount: 50_000, reference: 'Flat deposit', said: 'send Sarah 50k for the flat deposit' };
const FROM_MESSAGE = 'I took this from your message';

const money = moneyExact;

export function Send() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string; from?: string; to?: string }>();
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const rate = h?.rate ?? 1_552;
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
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
  /* the To field opened for typing, by a page that handed back "type the number" */
  const [typeAgain, setTypeAgain] = useState(0);
  const [guard, setGuard] = useState(false);
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  /* where it leaves from: Everyday, or the dollars at the rate on this page */
  const [source, setSource] = useState<Source>(asked.from === 'dollars' ? 'dollars' : 'everyday');
  const [choosing, setChoosing] = useState(LAB && asked.from === 'pick');
  const fromDollars = source === 'dollars';
  const usd = fromDollars ? usdOf(amount, rate) : 0;

  /* a photo the camera took: the number on it, or both readings where the reader was not sure */
  const readPhoto = useCallback(
    async (photo: { uri: string; reading?: Reading }) => {
      setBusy(true);
      const r = photo.reading ?? (await reader.read(photo.uri));
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
      setWhoNote('Read off the photo · check the name before you slide');
      setRead('photo');
    },
    [router],
  );

  /* back in front: what Check this number or Not enough handed back, or the photo the camera took */
  useFocusEffect(
    useCallback(() => {
      const d = draft.take();
      if (d) {
        if (d.who) {
          setWho(d.who);
          setWhoNote(d.whoNote ?? '');
          setRead(d.read);
        }
        if (d.amount !== undefined) {
          setAmount(d.amount);
          setAmountNote(d.amountNote ?? '');
        }
        if (d.reference !== undefined) setReference(d.reference);
        if (d.typing) {
          setWho(null);
          setTypeAgain(n => n + 1);
        }
      }
      const photo = handoff.take();
      if (photo) void readPhoto(photo);
    }, [readPhoto]),
  );

  const fee = fromDollars ? 0 : feeTo(amount, who?.bank);
  /* Slide to send: past the balance it is Not enough; otherwise the passcode */
  const slide = () => {
    if (!who || !amount) return;
    /* no network: nothing is sent against a balance that cannot be checked */
    if (!online) {
      router.push(`/offline?asked=${amount}&name=${encodeURIComponent(who.name.split(' ')[0] ?? who.name)}`);
      return;
    }
    /* the whole balance to somebody never paid before: Beetle stops and says why */
    if (
      !fromDollars &&
      refuses(
        amount,
        balance,
        saved.people.some(p => p.number === who.number),
      )
    ) {
      router.push(`/refused?amount=${amount}&name=${encodeURIComponent(who.name)}&number=${who.number}`);
      return;
    }
    if (fromDollars && usd > dollars) {
      toast(`That is more than the ${usdFull(dollars)} you hold. Pay from Everyday, or convert some first.`);
      return;
    }
    if (!fromDollars && amount + fee > balance) {
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
    const move: Move = {
      name: who.name,
      detail: `${whereShort(who)} · ${fromDollars ? 'sent from dollars' : 'sent'} · ${at}`,
      amount: -amount,
      icon: 'send',
      kind: 'transfer',
      fee,
      person: who,
      reference: reference.trim() || undefined,
      read,
      ...(fromDollars ? { usd: -usd } : {}),
    };
    const row = rowFrom(move, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    router.replace(`/receipt/${row.id}`);
  };

  useFoot({
    kind: 'slide',
    label: 'Slide to send',
    amount: naira(amount),
    disabled: !who || !amount || busy,
    onSlide: slide,
    veil: guard || choosing ? 'away' : undefined,
  });
  if (!ok || !account) return null;
  const first = who?.name.split(' ')[0] ?? '';
  const beetle = isBeetle(who);
  /* the most it can be: all Everyday holds less the fee on it, or all the dollars at the rate */
  const cap = fromDollars ? Math.floor(dollars * rate) : Math.max(0, Math.floor(balance - feeTo(balance, who?.bank)));
  /* what was sent to them before, then the round figures */
  const before = who ? [...new Set([...moves, ...(h?.ledger ?? [])].filter(r => r.kind === 'transfer' && r.name === who.name && r.amount < 0).map(r => Math.abs(r.amount)))].slice(0, 2) : [];
  const chips = [...new Set([...before, 10_000, 20_000, 50_000])]
    .filter(c => c <= cap)
    .slice(0, 2)
    .sort((a, b) => a - b);
  const over = fromDollars ? usd > dollars : amount + fee > balance;
  const amountLine = busy
    ? 'Reading the photo…'
    : over
      ? fromDollars
        ? `More than the ${usdFull(dollars)} you hold`
        : `${naira(amount + fee - balance)} more than Everyday holds; slide and I show three ways to close it`
      : fromDollars && amount
        ? `About ${usdFull(usd)} from your dollars`
        : amountNote || (fromDollars ? `Your dollars come to ${naira(cap)}` : `Everyday can send ${naira(cap)}`);
  /* the whole of it, for the passcode sheet: what they receive, the fee, what leaves where */
  const breakdown = who
    ? [
        { label: 'They receive', value: money(amount) },
        { label: 'Fee', value: beetle ? 'Free · Beetle to Beetle' : feeLabel(fee) },
        { label: 'Arrives', value: arrivesAt(amount, who.bank) },
        fromDollars ? { label: 'Leaves Dollars', value: usdFull(usd), strong: true } : { label: 'Leaves Everyday', value: money(amount + fee), strong: true },
      ]
    : [];

  return (
    <>
      <Screen head={<PageHead title="Send money" sub={who ? `To ${who.name} · ${beetle ? 'Beetle' : who.bank}` : fromDollars ? 'From Dollars' : 'From Everyday'} />}>
        {said ? <YouTyped said={said} /> : null}
        {/* 12 around the white cards, 8 between them; To first, since it decides the rest */}
        <View style={s.card} testID="send-card">
          <View style={[s.sub, s.who]} testID="send-who">
            <ToField
              label="To"
              key={typeAgain}
              value={who}
              note={who ? (read === 'photo' ? undefined : whoNote || howOf(who, saved.people.find(p => p.number === who.number)?.times)) : undefined}
              onChange={(p, how) => {
                setWho(p);
                setWhoNote(how ?? '');
                setRead(undefined);
              }}
              paid={saved.people}
              onCamera={() => router.push('/scan')}
              showRecent
              autoFocus={typeAgain > 0}
            />
            {who && read === 'photo' ? (
              <Tap
                accessibilityRole="button"
                accessibilityLabel="Before I filled this in"
                onPress={() => {
                  const past = [...moves, ...(h?.ledger ?? [])].find(r => r.kind === 'transfer' && r.name === who.name);
                  checkFor.put({
                    who,
                    times: saved.people.find(p => p.number === who.number)?.times ?? 0,
                    usual: past ? { amount: Math.abs(past.amount), reference: past.reference } : undefined,
                    amount,
                    read: true,
                  });
                  router.push('/checking');
                }}
                testID="check-photo"
              >
                <Caption tone="accent">{`${whoNote} · before I filled this in`}</Caption>
              </Tap>
            ) : null}
          </View>
          <View style={[s.sub, s.amount]} testID="send-amount">
            <AmountPicker
              value={amount}
              onChange={v => {
                setAmount(v);
                setAmountNote('');
              }}
              max={cap}
              note={amountLine}
              warn={over}
              chips={chips}
              all="All of it"
            />
          </View>
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
            <Caption tone="secondary">{refNote || (who ? `${first} sees it on their statement` : 'They see it on their statement')}</Caption>
          </View>
          <View style={[s.sub, s.rows]} testID="send-rows">
            <Tap accessibilityRole="button" accessibilityLabel="From" onPress={() => setChoosing(true)} style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                From
              </Body>
              <Label style={s.value}>{fromDollars ? `Dollars · ${usdFull(dollars)}` : `Everyday · ${naira(balance)}`}</Label>
              <Icon name="chevron" size={16} colour={colour.textTertiary} />
            </Tap>
            <View style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                Arrives
              </Body>
              <Label style={s.value}>{arrivesAt(amount, who?.bank)}</Label>
            </View>
            <View style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                Fee
              </Body>
              <Label style={[s.value, { color: fee ? colour.ink : colour.goodText }]}>{beetle ? 'Free · Beetle to Beetle' : feeLabel(fee)}</Label>
            </View>
          </View>
        </View>
        <View style={[s.lock, fromDollars ? { alignItems: 'flex-start' } : null]}>
          <Icon name="lock" size={16} colour={colour.textTertiary} />
          <Meta tone="secondary" style={{ flex: 1 }}>
            {fromDollars ? 'The rate is held for sixty seconds once you slide.' : 'Nothing moves until you slide and enter your passcode'}
          </Meta>
        </View>
      </Screen>
      {choosing ? (
        <PayFromSheet everyday={balance} dollars={dollars} rate={rate} value={source} who={who ? first : 'Whoever it is for'} onPick={setSource} onDismiss={() => setChoosing(false)} />
      ) : null}
      {guard && who ? <PasscodeSheet amount={naira(amount)} name={who.name} detail={whereOf(who)} rows={breakdown} verify={app.checkPasscode} onDone={done} onCancel={() => setGuard(false)} /> : null}
    </>
  );
}

/** The bank on the line in the day: GTBank, or Beetle and the tag. */
export const whereShort = (p: Person) => (isBeetle(p) && p.tag ? `Beetle · $${p.tag}` : p.bank);

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 12, gap: 8 },
  sub: { backgroundColor: colour.surface, borderRadius: 20, paddingHorizontal: 16 },
  who: { paddingTop: 12, paddingBottom: 14, gap: 10 },
  amount: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 0 },
  ref: { paddingTop: 11, paddingBottom: 8, gap: 8 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 22, overflow: 'visible' },
  /* outlineWidth 0: the browser's own focus ring has no place on the card */
  refInput: { flex: 1, minWidth: 0, textAlign: 'right', fontSize: 16, lineHeight: 24, color: colour.ink, padding: 0, outlineWidth: 0 },
  rows: { paddingHorizontal: 16, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52 },
  value: { fontSize: 16, lineHeight: 24 },
  lock: { marginTop: -6, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
