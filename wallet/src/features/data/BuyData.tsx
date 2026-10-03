/* Buy data, from its frame: whose line, the bundle, and from where and
   what the round-up feeds, each on its own white card in one grey one,
   each saying what matters on its own line (no bubble from Beetle over
   them: see DESIGN.md); the other bundles to pick from, the
   other lines topped up, and Slide to buy at the foot beside Back. Buy
   airtime is the same page with a figure in the bundle's place. Data on
   All services, the Data shortcut under the open chat and the lab open
   it on the line topped up most; the line card opens the lines topped
   up before with a number to type and the camera under them; the slide
   leads to the passcode and the receipt after it. */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Avatar, Body, Caption, Icon, Label, Meta, PageHead, Picks, Screen, Tap, YouTyped, colour, measure, toast, type Rect } from '../../design';
import {
  AIRTIME,
  DEMO_SAVED,
  PEOPLE,
  airtimePanelFor,
  beneficiariesOf,
  dataPanelFor,
  groupPhoneNumber,
  networkOf,
  normalisePhone,
  ownLine,
  planById,
  planName,
  planSize,
  plansFor,
  type LinePaid,
  type Plan,
} from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { useFedName } from '../goal/store';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { PayFromSheet, dollarsOf, usdFull, usdOf, type Source } from '../dollars';
import { clock } from '../../lib/clock';
import { SavedPeek } from '../agent/SavedPeek';
import { PasscodeSheet, lockedFor } from '../passcode';
import { LAB } from '../../lab/enabled';
import { groupAccount, initialsOf, naira } from '../../lib/format';
import { topupDraft } from './hand';

const later = (what: string, round: number) => () => toast(`${what} comes with round ${round}.`);
/** The frame's words, for the lab. */
const SAID = '2k data for mum';

/** The three bundles nearest the one chosen, by price, on the same network. */
export function otherPlans(plan: Plan): Plan[] {
  return plansFor(plan.network)
    .filter(p => p.id !== plan.id)
    .sort((a, b) => Math.abs(a.price - plan.price) - Math.abs(b.price - plan.price))
    .slice(0, 3)
    .sort((a, b) => a.price - b.price);
}

/** Three figures of airtime around the one chosen. */
export function otherAmounts(amount: number): number[] {
  const stops = AIRTIME.stops.filter(n => n !== amount);
  return stops
    .sort((a, b) => Math.abs(a - amount) - Math.abs(b - amount))
    .slice(0, 3)
    .sort((a, b) => a - b);
}

/** What a round-up gives the goal: the kobo to the next hundred, or a naira in a hundred. */
export const roundUp = (price: number) => Math.max(0, Math.round(price / 100));

export function BuyData() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ kind?: string; demo?: string }>();
  const airtime = asked.kind === 'airtime';
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  /* round ups go to the first goal, by its name */
  const fed = useFedName(account);
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const balance = (h?.everyday ?? 0) + balanceOf(moves);
  const rate = h?.rate ?? 1_552;
  const dollars = dollarsOf(h?.dollars ?? 0, moves);
  /* where it leaves from: Everyday, or the dollars at today's rate */
  const [source, setSource] = useState<Source>('everyday');
  const [choosing, setChoosing] = useState(false);
  const fromDollars = source === 'dollars';
  const saved = useMemo(
    () => beneficiariesOf([...moves, ...(h?.ledger ?? [])], account?.demo ? DEMO_SAVED : { lines: [], meters: [] }, PEOPLE, account ? ownLine(account.phone) : null),
    [moves, h, account],
  );
  /* the line topped up most, and what it usually gets */
  const usual = useMemo(() => [...saved.lines].filter(l => !l.own).sort((a, b) => b.times - a.times)[0] ?? saved.lines[0] ?? null, [saved]);

  const [line, setLine] = useState<LinePaid | null>(usual);
  const [lineNote, setLineNote] = useState(usual ? 'The number you top up most' : '');
  const [plan, setPlan] = useState<Plan | null>(() => (usual?.plan ? planById(usual.plan) : usual ? plansFor(usual.network)[2]! : null));
  const [planNote, setPlanNote] = useState(usual?.plan ? 'The bundle you bought last month' : 'The usual size');
  const [amount, setAmount] = useState(usual?.amount ?? 1_000);
  const [amountNote, setAmountNote] = useState(usual?.amount ? 'What you sent last time' : 'Move the ruler, or tap the figure');
  const [said] = useState(demo ? SAID : '');
  const [typing, setTyping] = useState(false);
  const [number, setNumber] = useState('');
  const [pick, setPick] = useState<Rect | null>(null);
  const [guard, setGuard] = useState(false);
  const lineCard = useRef<View>(null);
  const numberField = useRef<TextInput>(null);

  /* back in front: what the keypad handed back, or the camera */
  useFocusEffect(
    useCallback(() => {
      const d = topupDraft.take();
      if (!d) return;
      if (d.line !== undefined) {
        setLine(d.line);
        setLineNote(d.read === 'photo' ? 'Read off the photo' : 'The line you picked');
        setTyping(false);
      }
      if (d.plan) {
        setPlan(d.plan);
        setPlanNote(d.read === 'photo' ? 'What the message asked for' : 'You picked it');
      }
      if (d.amount !== undefined) {
        setAmount(d.amount);
        setAmountNote('You typed it');
      }
    }, []),
  );

  /* a line switched: its usual bundle or figure comes with it */
  const choose = (l: LinePaid, note: string) => {
    setLine(l);
    setLineNote(note);
    if (!airtime) {
      const p = (l.plan && planById(l.plan)) || plansFor(l.network)[2] || null;
      setPlan(p);
      setPlanNote(l.plan ? 'The bundle you bought last month' : 'The usual size');
    } else if (l.amount) {
      setAmount(l.amount);
      setAmountNote('What you sent last time');
    }
    setTyping(false);
  };
  /* the line typed: eleven digits and its network is known */
  const typed = (digits: string) => {
    const n = normalisePhone(digits).slice(0, 11);
    setNumber(n);
    if (n.length < 11) return;
    const network = networkOf(n);
    if (!network) {
      toast('That does not look like a Nigerian line.');
      return;
    }
    const known = saved.lines.find(l => l.number === n);
    choose(
      known ?? { kind: 'line', id: `line:${n}`, label: groupPhoneNumber(n), number: n, network, when: '', times: 0 },
      known ? `${known.label}, who you have topped up before` : 'You typed the number',
    );
  };

  const price = airtime ? amount : (plan?.price ?? 0);
  const slide = () => {
    if (!line || !price) return;
    if (fromDollars && usdOf(price, rate) > dollars) {
      toast(`That is more than the ${usdFull(dollars)} you hold. Pay from Everyday, or convert some first.`);
      return;
    }
    if (!fromDollars && price > balance) {
      router.push(`/short?asked=${price}`);
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
    if (!line || !account) return;
    const at = clock();
    const phone = { number: line.number, network: line.network, label: line.own ? 'Your line' : line.label };
    const base = airtime || !plan ? airtimePanelFor(phone, amount).move : dataPanelFor(phone, plan).move;
    if (!base) return;
    const row = rowFrom({ ...base, detail: `${base.detail}${fromDollars ? ' · from dollars' : ''} · ${at}`, ...(fromDollars ? { usd: -usdOf(price, rate) } : {}) }, balance, 17 + moves.length);
    addMove(row);
    setGuard(false);
    router.replace(`/receipt/${row.id}`);
  };

  useFoot({ kind: 'slide', label: 'Slide to buy', amount: naira(price), disabled: !line || !price || typing, onSlide: slide, veil: guard || choosing ? 'away' : pick ? 'recede' : undefined });

  if (!ok || !account) return null;
  /* over what Everyday holds: said under the figure or the bundle, where it is about */
  const short = !fromDollars && price > balance ? `${naira(price - balance)} more than Everyday holds; slide and I show three ways to close it` : null;
  const others = airtime ? null : plan ? otherPlans(plan) : [];
  const alsoLines = saved.lines.filter(l => !l.own && l.number !== line?.number).slice(0, 4);
  const openLines = () => void measure(lineCard).then(setPick);

  return (
    <>
      <Screen head={<PageHead lead title={airtime ? 'Buy airtime' : 'Buy data'} sub="Check the parts I filled in before it goes" />}>
        {said ? <YouTyped said={said} /> : null}
        <View style={s.card} testID="buy-card">
          {typing ? (
            <View style={[s.sub, s.line]} testID="buy-line">
              <View style={s.typingRow}>
                <View style={s.disc}>
                  <Icon name="grid" size={18} colour={colour.ink} />
                </View>
                <TextInput
                  ref={numberField}
                  accessibilityLabel="Phone number"
                  value={number}
                  onChangeText={typed}
                  keyboardType="number-pad"
                  placeholder="Eleven digits"
                  placeholderTextColor={colour.textTertiary}
                  style={s.input}
                  autoFocus
                />
              </View>
              <Caption tone="secondary">{number.length ? `${groupPhoneNumber(number)} · ${11 - number.length} to go` : 'The line the data goes to'}</Caption>
            </View>
          ) : (
            <Tap
              ref={lineCard}
              accessibilityRole="button"
              accessibilityLabel={line ? (line.own ? 'Your line' : line.label) : 'Whose line?'}
              onPress={openLines}
              style={[s.sub, s.line]}
              testID="buy-line"
            >
              <View style={s.lineRow}>
                {line ? (
                  <Avatar initials={initialsOf(line.own ? 'You' : line.label)} size={38} />
                ) : (
                  <View style={s.disc}>
                    <Icon name="person" size={18} colour={colour.ink} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Label>{line ? (line.own ? 'Your line' : line.label) : 'Whose line?'}</Label>
                  <Meta tone="secondary">{line ? `${groupPhoneNumber(line.number)} · ${line.network}` : 'Someone you top up, or a number'}</Meta>
                </View>
                <View style={{ marginTop: 11 }}>
                  <Icon name="chevron" size={16} colour={colour.textTertiary} />
                </View>
              </View>
              {lineNote ? <Caption tone="secondary">{lineNote}</Caption> : null}
            </Tap>
          )}
          {airtime ? (
            <View style={[s.sub, s.amount]} testID="buy-amount">
              <AmountPicker
                value={amount}
                onChange={v => {
                  setAmount(v);
                  setAmountNote('You picked it');
                }}
                max={fromDollars ? Math.floor(dollars * rate) : Math.max(0, Math.floor(balance))}
                note={short ?? amountNote}
                warn={!!short}
              />
            </View>
          ) : (
            <View style={[s.sub, s.bundle]} testID="buy-bundle">
              <View style={s.bundleRow}>
                <View style={{ marginTop: 6 }}>
                  <Icon name="data" size={22} colour={colour.ink} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Label>{plan ? planName(plan) : 'Pick a bundle'}</Label>
                  <Caption tone="secondary">{plan ? 'It will not renew on its own' : 'From the ones below'}</Caption>
                </View>
                {plan ? <Label style={[s.value, { marginTop: 5 }]}>{naira(plan.price)}</Label> : null}
              </View>
              <Caption tone={short ? 'bad' : 'secondary'}>{short ?? planNote}</Caption>
            </View>
          )}
          <View style={[s.sub, s.rows]} testID="buy-rows">
            <Tap accessibilityRole="button" accessibilityLabel="From" onPress={() => setChoosing(true)} style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                From
              </Body>
              <Label style={s.value}>{fromDollars ? `Dollars · ${usdFull(dollars)}` : `Everyday · ${groupAccount(account.accountNumber)}`}</Label>
              <Icon name="chevron" size={16} colour={colour.textTertiary} />
            </Tap>
            <View style={s.row}>
              <Body tone="secondary" style={{ flex: 1 }}>
                {fed ? `Goes to your ${fed} goal` : 'Goes to your goal'}
              </Body>
              <Label tone="accent" style={s.value}>
                {naira(roundUp(price))}
              </Label>
            </View>
          </View>
        </View>
        <View style={{ marginTop: -4 }} testID="others-block">
          <Body tone="secondary">{airtime ? 'Other amounts' : 'Other bundles'}</Body>
          <View style={{ marginTop: 18 }}>
            {airtime ? (
              <Picks
                items={otherAmounts(amount).map(n => ({ value: n, big: naira(n), small: n >= 5_000 ? 'A month of calls' : n >= 1_000 ? 'A week or so' : 'A few days' }))}
                value={null}
                onPick={n => {
                  setAmount(n);
                  setAmountNote('You picked it');
                }}
                testID="picks"
              />
            ) : (
              <Picks
                items={(others ?? []).map(p => ({ value: p.id, big: planSize(p), small: naira(p.price) }))}
                value={null}
                onPick={id => {
                  const p = planById(id);
                  if (!p) return;
                  setPlan(p);
                  setPlanNote('You picked it');
                }}
                testID="picks"
              />
            )}
          </View>
        </View>
        {/* the frame's Other bundles column is 7 shorter than its picks, so this sits 9 under them */}
        <View style={{ marginTop: -11 }} testID="also-block">
          <Body tone="secondary">You also top up</Body>
          <View style={{ marginTop: 18, flexDirection: 'row', gap: 12 }} testID="also">
            {alsoLines.map(l => (
              <Tap key={l.id} accessibilityRole="button" accessibilityLabel={l.label} onPress={() => choose(l, `${l.label}, ${l.when.toLowerCase()}`)} style={s.also} testID="also-line">
                <Label>{initialsOf(l.label)}</Label>
              </Tap>
            ))}
            <Tap accessibilityRole="button" accessibilityLabel="Another line" onPress={openLines} style={[s.also, s.alsoPlus]} testID="also-plus">
              <Icon name="plus" size={18} colour={colour.ink} />
            </Tap>
          </View>
        </View>
      </Screen>
      {pick ? (
        <SavedPeek
          kind="line"
          list={saved.lines}
          at={pick}
          extras={[
            {
              glyph: 'grid',
              label: 'Type a number',
              onPress: () => {
                setPick(null);
                setTyping(true);
                setNumber('');
                setTimeout(() => numberField.current?.focus(), 300);
              },
            },
            {
              glyph: 'camera',
              label: 'Point the camera at a message',
              onPress: () => {
                setPick(null);
                router.push('/scan');
              },
            },
          ]}
          onPick={b => {
            if (b.kind !== 'line') return;
            choose(b, b.times > 1 ? `Topped up ${b.times} times, the last ${b.when.toLowerCase()}` : b.times === 1 ? `Topped up once, ${b.when.toLowerCase()}` : 'Your own line');
            setPick(null);
          }}
          onClose={() => setPick(null)}
        />
      ) : null}
      {choosing ? <PayFromSheet everyday={balance} dollars={dollars} rate={rate} value={source} who="the line" onPick={setSource} onDismiss={() => setChoosing(false)} /> : null}
      {guard && line ? (
        <PasscodeSheet
          amount={naira(price)}
          name={airtime || !plan ? `${line.network} · Airtime` : `${line.network} · ${planSize(plan)}`}
          detail={`${line.own ? 'Your line' : line.label} · ${groupPhoneNumber(line.number)}`}
          glyph={airtime ? 'airtime' : 'data'}
          rows={[
            airtime || !plan ? { label: 'Airtime', value: naira(price) } : { label: 'Plan', value: planName(plan) },
            { label: 'Lands', value: 'At once' },
            { label: 'Fee', value: 'Free' },
            fromDollars ? { label: 'Leaves Dollars', value: usdFull(usdOf(price, rate)), strong: true } : { label: 'Leaves Everyday', value: naira(price), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colour.surface2, borderRadius: 24, padding: 12, gap: 8 },
  sub: { backgroundColor: colour.surface, borderRadius: 20, paddingHorizontal: 16 },
  /* the frame boxes the line's row at 38 — the chip and the chevron sit on that — and lets the two lines beside them run to 44 */
  line: { paddingTop: 12, paddingBottom: 9, gap: 8 },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, height: 38, overflow: 'visible' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 38 },
  disc: { width: 38, height: 38, borderRadius: 19, backgroundColor: colour.surface3, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 24, fontWeight: '600', color: colour.ink, padding: 0, letterSpacing: 1, outlineWidth: 0 },
  /* the bundle's row is 35: the glyph 6 down on it, the price 5 */
  bundle: { paddingTop: 12, paddingBottom: 9, gap: 8 },
  bundleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, height: 35, overflow: 'visible' },
  amount: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 0 },
  rows: { paddingHorizontal: 16, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56 },
  value: { fontSize: 16, lineHeight: 24 },
  also: { width: 46, height: 46, borderRadius: 23, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  alsoPlus: { backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.rule },
});
