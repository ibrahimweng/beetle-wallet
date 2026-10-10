/* A card in the chat: Beetle's question with the fields in it, on the dark
   card, and its own button that pays. What was said is already filled; what
   was not is empty and asks.

   Sending: To takes a $tag, a name or an account number, the way it does on
   Send money (see send/ToField); somebody found by a name is shown with
   their bank and number and asked about — "Is this the person?" — with Not
   them beside it. The amount is the picker, dark: the ruler, chips, and the
   figure tapped to type. Paying the light: the company, Prepaid or
   Postpaid, the meter (looked up as soon as it reads right), the amount.
   Data: the number (its network shown as it is typed) and the plan.

   A small Recent at the card's top right grows the card itself into the
   list of what was paid before — people, lines or meters — which scrolls;
   one tap fills the card and it settles back. Once it has all it needs the
   button says what it does (Confirm ₦5,000, Pay ₦8,000, Buy 5GB) and goes
   to the passcode; nothing else needs confirming after it. */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  AmountPicker,
  Avatar,
  Caption,
  Chevron,
  CompanyPicker,
  Icon,
  LOOSE,
  Label,
  Logo,
  Meta,
  Row,
  Swap,
  Tap,
  colour,
  dark,
  font,
  logoOf,
  settle,
  useStill,
  type LogoName,
  type PickItem,
} from '../../design';
import {
  AIRTIME,
  BILL_AMOUNTS,
  DISCOS,
  arrivesAt,
  askMissing,
  discoById,
  feeTo,
  groupMeter,
  isBeetle,
  likelyPlans,
  meters,
  meterProblem,
  networkInfo,
  networkOf,
  phoneProblem,
  planById,
  planFor,
  planName,
  planSize,
  plansFor,
  unitsFor,
} from '../../services';
import type { AskField, AskFound, AskPanel, AskValues, Beneficiaries, Beneficiary, MeterKind, Network, Person, Plan } from '../../services';
import { amountIn } from '../../services/agent';
import { dataIn, groupPhoneNumber } from '../../services/nigeria';
import { groupAccount, initialsOf, naira } from '../../lib/format';
import { ToField, whereOf } from '../send/ToField';
import type { AskState } from './conversation';

export type SavedKind = 'person' | 'line' | 'meter';

/** What the pill says. */
export function askWord(state: AskState, missing: number, tool?: AskPanel['tool']): string {
  if (state === 'done') return tool === 'transfer' ? 'Sent' : tool === 'pay' ? 'Paid' : tool ? 'Bought' : 'Filled';
  if (state === 'busy') return 'Checking';
  return missing ? 'Needs a bit' : 'Ready';
}

/** What the card's button says once the card has all it needs. */
export function actionWord(ask: AskPanel): string {
  const v = ask.values;
  if (ask.tool === 'transfer') return `Confirm ${naira(v.amount ?? 0)}`;
  if (ask.tool === 'pay') return `Pay ${naira(v.amount ?? 0)}`;
  if (ask.tool === 'data') {
    const plan = v.plan ? planById(v.plan) : null;
    return plan ? `Buy ${planSize(plan)} · ${naira(plan.price)}` : 'Buy';
  }
  return `Buy ${naira(v.amount ?? 0)} airtime`;
}

/** What the button says while the card still needs something: the one thing left to do. */
export function stillWord(ask: AskPanel, first: AskField | undefined): string {
  switch (first) {
    case 'who':
      return ask.hint && /^\d{10}$/.test(ask.hint) ? 'Pick the bank' : 'Who is it to?';
    case 'amount':
      return 'Pick how much';
    case 'disco':
      return 'Pick the company';
    case 'meterKind':
      return 'Prepaid or postpaid?';
    case 'meter':
      return 'Type the meter number';
    case 'number':
      return 'Type the number';
    case 'plan':
      return 'Pick a plan';
    default:
      return 'Fill in the rest';
  }
}

const RECENT: Record<SavedKind, string> = { person: 'People you have paid', line: 'Numbers you top up', meter: 'Meters you have paid' };

export function AskPanelView({
  ask,
  state,
  saved,
  balance = Infinity,
  onFill,
  onConfirm,
  onFocus,
}: {
  ask: AskPanel;
  state: AskState;
  saved?: Beneficiaries;
  /** what Everyday holds: the picker stops there */
  balance?: number;
  onFill: (values: AskValues, found?: AskFound, extra?: Partial<Pick<AskPanel, 'confirmWho' | 'hint'>>) => void;
  /** the card has all it needs and its button is pressed: on to the passcode */
  onConfirm: () => void;
  /** a field took the keyboard */
  onFocus?: () => void;
}) {
  const missing = askMissing(ask);
  const open = state === 'open';
  const v = ask.values;
  const network = v.number ? networkOf(v.number) : null;
  const line = v.number ? saved?.lines.find(l => l.number === v.number) : undefined;
  const prefilled = useRef(Object.values(v).some(x => x !== undefined && x !== '')).current;
  const [recent, setRecent] = useState(false);
  const set = (values: AskValues, found?: AskFound, extra?: Partial<Pick<AskPanel, 'confirmWho' | 'hint'>>) => {
    if (open) onFill(values, found, extra);
  };
  const list: Beneficiary[] = !saved || !ask.saved ? [] : ask.saved === 'person' ? saved.people : ask.saved === 'line' ? saved.lines.filter(l => !l.own) : saved.meters;
  const pick = (b: Beneficiary) => {
    setRecent(false);
    if (b.kind === 'person') set({ who: b.name }, { person: { name: b.name, bank: b.bank, number: b.number } }, { confirmWho: false, hint: undefined });
    else if (b.kind === 'line') set({ number: b.number, plan: ask.tool === 'data' ? b.plan : undefined, amount: ask.tool === 'airtime' ? (b.amount ?? v.amount) : v.amount });
    else set({ disco: b.disco, meterKind: b.meterKind, meter: b.meter, amount: v.amount ?? b.amount }, { meter: { name: b.name, address: '' } });
  };
  const person = ask.found?.person ?? null;
  const fee = ask.tool === 'transfer' && v.amount ? feeTo(v.amount, person?.bank) : 0;
  const cap = ask.tool === 'transfer' ? Math.max(0, Math.floor(balance - feeTo(balance, person?.bank))) : ask.tool === 'airtime' ? Math.min(AIRTIME.max, Math.floor(balance)) : Math.floor(balance);
  /* a word on the card only when something is wrong: what is missing, the chat above has said, and the button says */
  const lead = state === 'done' ? null : (ask.note ?? null);
  const ready = open && missing.length === 0;
  const headLogo = ask.tool === 'data' || ask.tool === 'airtime' ? logoOf(network) : ask.tool === 'pay' ? logoOf(v.disco) : undefined;
  /* the title follows what is known (Round 39, the owner's word): the company once it is picked, then the person
     once their name is found, cut short with … where it runs long */
  const title =
    ask.tool === 'pay'
      ? (ask.found?.meter?.name ?? (v.disco ? discoById(v.disco)?.name : undefined) ?? ask.title)
      : ask.tool === 'transfer'
        ? (person?.name ?? ask.title)
        : ((line && !line.own ? line.label : undefined) ?? (network ? `${network} ${ask.tool === 'data' ? 'data' : 'airtime'}` : ask.title));
  return (
    <View style={s.panel} testID="ask">
      <View style={s.head}>
        {/* whose it is, once that is known: the network's logo for a top-up, the company's for the light (Round 38) */}
        {headLogo ? (
          <Logo name={headLogo} size={32} radius={12} testID="ask-logo" />
        ) : (
          <View style={s.icon} testID="ask-icon">
            <Icon name={ask.icon} size={16} colour={dark.paper} />
          </View>
        )}
        <Label style={{ flex: 1, color: dark.paper }} numberOfLines={1} ellipsizeMode="tail" testID="ask-title">
          {title}
        </Label>
        {/* Recent: the card grows into the list of what was paid before */}
        {list.length && open ? (
          <Tap
            accessibilityRole="button"
            accessibilityLabel={recent ? 'Back to the card' : 'Recent'}
            accessibilityState={{ expanded: recent }}
            onPress={() => setRecent(r => !r)}
            hitSlop={8}
            style={[s.recent, recent && s.recentOn]}
            testID="ask-recent"
          >
            <Caption style={{ color: recent ? colour.ink : dark.pillText, ...font('600') }}>Recent</Caption>
            <Chevron dir={recent ? 'up' : 'down'} size={12} colour={recent ? colour.ink : dark.label} />
          </Tap>
        ) : (
          <View style={s.pill} testID="ask-pill">
            <View style={[s.dot, { backgroundColor: missing.length && open ? '#f5a524' : '#34c759' }]} />
            <Swap value={askWord(state, missing.length, ask.tool)}>{w => <Caption style={{ color: dark.pillText, ...font('600') }}>{w}</Caption>}</Swap>
          </View>
        )}
      </View>
      <Grow>
        {recent ? (
          <RecentList title={RECENT[ask.saved ?? 'person']} list={list} onPick={pick} />
        ) : (
          <View style={[s.body, !open && { opacity: 0.72 }]} pointerEvents={open ? 'auto' : 'none'}>
            {lead ? (
              <Caption style={{ color: ask.note ? '#ffd48a' : dark.textSoft }} testID="ask-lead">
                {lead}
              </Caption>
            ) : null}
            {ask.fields.map(f => {
              switch (f) {
                case 'who':
                  return (
                    <WhoField
                      key={f}
                      person={person}
                      confirm={!!ask.confirmWho && open}
                      hint={ask.hint ?? (person ? undefined : v.who)}
                      paid={saved?.people ?? []}
                      onPick={(p, how) => set({ who: p.name }, { person: p }, { confirmWho: false, hint: undefined, ...(how ? {} : {}) })}
                      onNotThem={() => set({ who: undefined }, { person: undefined }, { confirmWho: false, hint: person?.name.split(' ')[0] })}
                      onFocus={onFocus}
                    />
                  );
                case 'amount':
                  /* the amount comes once what it is for is known: the person, the meter, the line */
                  if (!amountShows(ask)) return null;
                  return (
                    <View key={f} style={s.amount} testID="ask-amount">
                      <AmountPicker
                        tone="dark"
                        value={v.amount ?? 0}
                        onChange={amount => set({ amount: amount || undefined })}
                        max={cap}
                        note={amountNote(ask, cap, fee, person)}
                        chips={ask.tool === 'pay' ? [...BILL_AMOUNTS] : ask.tool === 'airtime' ? [500, 1_000, 2_000] : likelyFor(ask, saved)}
                        all={ask.tool === 'transfer' ? 'All of it' : undefined}
                        testID="ask-picker"
                      />
                    </View>
                  );
                case 'number':
                  return (
                    <NumberField
                      key={f}
                      value={v.number ?? ''}
                      label={line?.label}
                      times={line?.times}
                      prefilled={prefilled && !!v.number}
                      onChange={number => set({ number, plan: undefined })}
                      onFocus={onFocus}
                    />
                  );
                case 'plan':
                  return <PlanField key={f} network={network} value={v.plan} usual={line?.plan} onChange={plan => set({ plan })} onFocus={onFocus} />;
                case 'meterKind':
                  return <KindField key={f} value={v.meterKind} onChange={meterKind => set({ meterKind }, { meter: undefined })} />;
                case 'disco':
                  return <DiscoField key={f} value={v.disco} onChange={disco => set({ disco }, { meter: undefined })} />;
                case 'meter':
                  return (
                    <MeterField
                      key={f}
                      value={v.meter ?? ''}
                      disco={v.disco}
                      kind={v.meterKind}
                      found={ask.found?.meter}
                      onChange={meter => set({ meter }, { meter: undefined })}
                      onFound={record => set({}, { meter: record })}
                      onFocus={onFocus}
                    />
                  );
              }
            })}
          </View>
        )}
      </Grow>
      {recent ? null : (
        <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
          <Tap
            accessibilityRole="button"
            accessibilityLabel={state === 'done' ? askWord(state, 0, ask.tool) : ready ? actionWord(ask) : stillWord(ask, missing[0])}
            disabled={!ready}
            onPress={onConfirm}
            style={[s.action, ready ? s.actionReady : null, !ready && state !== 'done' && { opacity: 0.55 }]}
            testID="ask-action"
          >
            <Swap value={state === 'done' ? askWord(state, 0, ask.tool) : state === 'busy' ? 'Checking…' : ready ? actionWord(ask) : stillWord(ask, missing[0])}>
              {label => <Row style={{ color: ready ? colour.ink : dark.paper }}>{label}</Row>}
            </Swap>
          </Tap>
        </View>
      )}
    </View>
  );
}

/** Whether the card is far enough along for the amount: who it is for found, the meter found, the line right. */
function amountShows(ask: AskPanel): boolean {
  const missing = askMissing(ask).filter(f => f !== 'amount');
  return missing.length === 0 || (ask.values.amount ?? 0) > 0;
}

/** The line under the figure: what it can be, what it costs, when it lands. */
function amountNote(ask: AskPanel, cap: number, fee: number, person: Person | null): string {
  const v = ask.values;
  if (ask.tool === 'transfer') {
    if (!v.amount) return `Everyday can send ${naira(cap)}`;
    if (isBeetle(person)) return 'Free · Beetle to Beetle · there at once';
    return `${fee ? `Fee ₦${fee.toFixed(2)}` : 'No fee'} · ${arrivesAt(v.amount, person?.bank).toLowerCase()}`;
  }
  if (ask.tool === 'pay') return v.amount && v.meterKind !== 'postpaid' ? `About ${unitsFor(v.amount)} kWh` : `Everyday has ${naira(cap)}`;
  return `Lands at once · up to ${naira(cap)}`;
}

/** The likely amounts to someone: what was sent to them before, then the round figures. */
function likelyFor(ask: AskPanel, saved?: Beneficiaries): number[] {
  const usual = ask.tool === 'transfer' && ask.found?.person ? saved?.people.find(p => p.number === ask.found?.person?.number) : undefined;
  return [...new Set([...(usual ? [] : []), 5_000, 10_000, 20_000])];
}

/* Who, on the card: the person found — their bank and number, or Beetle and
   their tag — asked about where they were found by a name; or the To field. */
function WhoField({
  person,
  confirm,
  hint,
  paid,
  onPick,
  onNotThem,
  onFocus,
}: {
  person: Person | null;
  confirm: boolean;
  hint?: string;
  paid: import('../../services').PersonPaid[];
  onPick: (p: Person, how?: string) => void;
  onNotThem: () => void;
  onFocus?: () => void;
}) {
  if (person)
    return (
      <View style={s.person} testID="ask-who">
        {confirm ? (
          <Caption style={{ color: dark.pillText, ...font('600') }} testID="ask-is-this">
            Is this the person?
          </Caption>
        ) : null}
        <View style={s.personRow}>
          <Avatar initials={initialsOf(person.name)} size={38} />
          <View style={{ flex: 1, gap: 2 }}>
            <Label style={{ color: dark.paper }} numberOfLines={1}>
              {person.name}
            </Label>
            <Meta style={{ color: dark.textSoft }} numberOfLines={1} testID="ask-who-where">
              {whereOf(person)}
            </Meta>
          </View>
          <Tap accessibilityRole="button" accessibilityLabel={confirm ? 'Not them' : 'Change who it is for'} onPress={onNotThem} hitSlop={8} style={s.tertiary} testID="ask-not-them">
            <Caption style={{ color: dark.link, ...font('600') }}>{confirm ? 'Not them' : 'Change'}</Caption>
          </Tap>
        </View>
        {isBeetle(person) ? <Caption style={{ color: '#7fd99a' }}>A Beetle account · free, and there at once</Caption> : null}
      </View>
    );
  return <ToField tone="dark" value={null} onChange={p => p && onPick(p)} paid={paid} initial={hint} onFocus={onFocus} testID="ask-to" />;
}

/* The card's own height, following what is in it: the fields, or the list
   it grows into, one movement either way. */
function Grow({ children }: { children: ReactNode }) {
  const still = useStill();
  const h = useSharedValue(-1);
  const style = useAnimatedStyle(() => (h.value < 0 ? {} : { height: h.value }));
  /* once the card has its height, what is in it lies loose in it, so on the phone it can grow past it (see LOOSE) */
  const [loose, setLoose] = useState(false);
  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <View
        style={loose ? LOOSE : null}
        onLayout={e => {
          const next = e.nativeEvent.layout.height;
          h.value = h.value < 0 || still ? next : withTiming(next, { duration: 280, easing: settle });
          if (!loose) setLoose(true);
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/* What was paid before, in the card: a list that scrolls, one tap each. */
function RecentList({ title, list, onPick }: { title: string; list: Beneficiary[]; onPick: (b: Beneficiary) => void }) {
  return (
    <View style={s.recentList} testID="ask-recent-list">
      <Caption style={{ color: dark.label, paddingHorizontal: 4, paddingBottom: 6 }}>{title}</Caption>
      <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {list.map(b => {
          const name = b.kind === 'person' ? b.name : b.label;
          const detail =
            b.kind === 'person'
              ? `${b.bank} · ${groupAccount(b.number)}`
              : b.kind === 'line'
                ? `${groupPhoneNumber(b.number)} · ${b.network}${b.plan ? ` · ${planName(planById(b.plan)!)}` : b.amount ? ` · ${naira(b.amount)}` : ''}`
                : `${discoById(b.disco)?.short ?? b.disco} · ${b.meterKind === 'prepaid' ? 'Prepaid' : 'Postpaid'} · ${groupMeter(b.meter)}`;
          return (
            <Tap key={b.id} accessibilityRole="button" accessibilityLabel={name} onPress={() => onPick(b)} style={s.recentRow} scale={0.98} testID="ask-recent-row">
              {b.kind === 'person' ? (
                <Avatar initials={initialsOf(b.name)} size={34} />
              ) : logoOf(b.kind === 'line' ? b.network : b.disco) ? (
                <Logo name={logoOf(b.kind === 'line' ? b.network : b.disco)!} size={34} round />
              ) : b.kind === 'line' ? (
                <View style={[s.mark, { backgroundColor: networkInfo(b.network).colour }]}>
                  <Label style={{ color: networkInfo(b.network).ink }}>{name.charAt(0).toUpperCase()}</Label>
                </View>
              ) : (
                <View style={[s.mark, { backgroundColor: dark.edgeStrong }]}>
                  <Icon name="power" size={16} colour={dark.paper} />
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Label style={{ color: dark.paper }} numberOfLines={1}>
                  {name}
                </Label>
                <Caption style={{ color: dark.textSoft }} numberOfLines={1}>
                  {detail}
                </Caption>
              </View>
              {b.kind === 'meter' && b.amount ? <Caption style={{ color: dark.label }}>{naira(b.amount)}</Caption> : b.when ? <Caption style={{ color: dark.label }}>{b.when}</Caption> : null}
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---- the fields ---- */

/** A field on the dark card: the label above, the box, a line under. */
function Field({ label, children, under, tone = 'soft', testID }: { label: string; children: ReactNode; under?: string | null; tone?: 'soft' | 'good' | 'warn'; testID?: string }) {
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <Meta style={{ color: dark.label }}>{label}</Meta>
      {children}
      {under ? (
        <Caption style={{ color: tone === 'good' ? '#7fd99a' : tone === 'warn' ? '#ffd48a' : dark.textSoft, paddingTop: 2 }} testID={testID ? `${testID}-under` : undefined}>
          {under}
        </Caption>
      ) : null}
    </View>
  );
}

function Box({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.box}>
      {children}
      {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}

const inputStyle = { flex: 1, color: dark.paper, fontSize: 16, ...font('600'), paddingVertical: 0, height: 46 };

export function NetworkBadge({ network }: { network: Network }) {
  const info = networkInfo(network);
  const logo = logoOf(network);
  /* the network's colour and name, its logo at the front (Round 38) */
  return (
    <View style={[s.badge, { backgroundColor: info.colour }, logo ? s.badgeLogo : null]} testID="network">
      {logo ? <Logo name={logo} size={16} round /> : null}
      <Caption style={{ color: info.ink, ...font('600') }}>{network}</Caption>
    </View>
  );
}

function NumberField({
  value,
  label,
  times,
  prefilled,
  onChange,
  onFocus,
}: {
  value: string;
  label?: string;
  times?: number;
  prefilled: boolean;
  onChange: (number: string) => void;
  onFocus?: () => void;
}) {
  const [editing, setEditing] = useState(!prefilled);
  const [text, setText] = useState(value ? groupPhoneNumber(value) : '');
  useEffect(() => {
    if (text.replace(/\D/g, '') !== value) setText(value ? groupPhoneNumber(value) : '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const network = value ? networkOf(value) : null;
  const problem = value.length >= 11 ? phoneProblem(value) : null;
  const change = (t: string) => {
    const digits = t.replace(/\D/g, '').slice(0, 11);
    setText(digits.length > 4 ? groupPhoneNumber(digits) : digits);
    onChange(digits);
  };
  const whoseLine =
    label === 'Your line' ? 'Your own line' : label ? `${label}${times ? ` · topped up ${times === 1 ? 'once' : `${times} times`}` : ''}` : value.length === 11 && !problem ? 'A new number' : null;
  if (!editing) {
    return (
      <Field label="Line" testID="ask-number">
        <View style={s.compact}>
          <View style={{ flex: 1, gap: 2 }}>
            <Row style={{ color: dark.paper }}>{groupPhoneNumber(value)}</Row>
            {whoseLine ? <Caption style={{ color: dark.textSoft }}>{whoseLine}</Caption> : null}
          </View>
          {network ? <NetworkBadge network={network} /> : null}
          <Tap accessibilityRole="button" accessibilityLabel="Change the number" onPress={() => setEditing(true)} style={s.tertiary} hitSlop={6}>
            <Caption style={{ color: dark.link, ...font('600') }}>Change</Caption>
          </Tap>
        </View>
      </Field>
    );
  }
  return (
    <Field label="Number" under={problem ?? whoseLine} tone={problem ? 'warn' : label ? 'good' : 'soft'} testID="ask-number">
      <Box right={network ? <NetworkBadge network={network} /> : null}>
        <TextInput
          value={text}
          onChangeText={change}
          onFocus={onFocus}
          placeholder="0803 000 0000"
          placeholderTextColor={dark.label}
          style={inputStyle}
          accessibilityLabel="Number"
          keyboardType="phone-pad"
        />
      </Box>
    </Field>
  );
}

function PlanField({ network, value, usual, onChange, onFocus }: { network: Network | null; value?: string; usual?: string; onChange: (plan: string | undefined) => void; onFocus?: () => void }) {
  const [text, setText] = useState(value ? planName(planById(value)!) : '');
  const [all, setAll] = useState(false);
  const plan = value ? planById(value) : null;
  useEffect(() => {
    if (plan && text !== planName(plan)) setText(planName(plan));
    if (!plan && text && planByWords(network, text)) setText('');
  }, [value, network]); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (t: string) => {
    setText(t);
    onChange(network ? (planByWords(network, t)?.id ?? undefined) : undefined);
  };
  const likely = network ? likelyPlans(network, { usual, amount: plan ? null : (amountIn(text) ?? null), gb: plan ? null : dataIn(text) }) : [];
  const rest = network && all ? plansFor(network).filter(p => !likely.includes(p)) : [];
  const under = !network
    ? 'The number first, so I know the network'
    : plan
      ? `${planName(plan)} · ${naira(plan.price)}${usual === plan.id ? ' · the one bought last time' : ''}`
      : text
        ? `Nothing on ${network} matches that; pick one below`
        : null;
  return (
    <Field label="Plan" under={under} tone={plan ? 'good' : text && network ? 'warn' : 'soft'} testID="ask-plan">
      <Box>
        <TextInput
          value={text}
          onChangeText={change}
          onFocus={onFocus}
          placeholder="5GB, or an amount"
          placeholderTextColor={dark.label}
          style={inputStyle}
          accessibilityLabel="Plan"
          editable={!!network}
          autoCorrect={false}
        />
      </Box>
      {network ? (
        <>
          <View style={s.chips}>
            {likely.map(p => (
              <Chip
                key={p.id}
                on={value === p.id}
                label={planSize(p)}
                sub={`${naira(p.price)}${p.days !== 30 ? ` · ${p.days === 1 ? '1 day' : `${p.days} days`}` : ''}`}
                onPress={() => onChange(p.id)}
              />
            ))}
          </View>
          {all ? (
            <View style={s.chips}>
              {rest.map(p => (
                <Chip
                  key={p.id}
                  on={value === p.id}
                  label={planSize(p)}
                  sub={`${naira(p.price)}${p.days !== 30 ? ` · ${p.days === 1 ? '1 day' : `${p.days} days`}` : ''}`}
                  onPress={() => onChange(p.id)}
                />
              ))}
            </View>
          ) : (
            <Tap accessibilityRole="button" accessibilityLabel={`All ${network} plans`} onPress={() => setAll(true)} style={s.link}>
              <Caption style={{ color: dark.link }}>All {network} plans</Caption>
              <Icon name="chevron" size={12} colour={dark.link} />
            </Tap>
          )}
        </>
      ) : null}
    </Field>
  );
}

/** The plan the typed words mean: a size, or a price. */
function planByWords(network: Network | null, text: string): Plan | null {
  if (!network || !text.trim()) return null;
  const gb = dataIn(text);
  const amount = gb ? null : amountIn(text.replace(/,/g, ''));
  return planFor(network, { gb, amount });
}

function KindField({ value, onChange }: { value?: MeterKind; onChange: (kind: MeterKind) => void }) {
  return (
    <Field label="Meter" testID="ask-kind">
      <View style={s.segments}>
        {(['prepaid', 'postpaid'] as MeterKind[]).map(k => {
          const on = value === k;
          return (
            <Tap
              key={k}
              accessibilityRole="button"
              accessibilityLabel={k === 'prepaid' ? 'Prepaid' : 'Postpaid'}
              accessibilityState={{ selected: on }}
              onPress={() => onChange(k)}
              scale={0.97}
              style={[s.segment, on && s.segmentOn]}
            >
              <Label style={{ color: on ? colour.ink : dark.text }}>{k === 'prepaid' ? 'Prepaid' : 'Postpaid'}</Label>
            </Tap>
          );
        })}
      </View>
    </Field>
  );
}

/* the electricity companies, every one, in a box of its own height that scrolls: found by typing or by scrolling,
   the phone ticking as they pass; once one is picked the box folds to it (Round 39, the owner's word: chips were
   wrong, and the card must keep its size) */
const DISCO_ITEMS: PickItem[] = DISCOS.map(d => ({ id: d.id, name: d.name, sub: `${d.short === d.name ? '' : `${d.short} · `}${d.area}`, logo: logoOf(d.id), words: [d.short, ...d.aliases] }));

function DiscoField({ value, onChange }: { value?: string; onChange: (disco: string) => void }) {
  return (
    <Field label="Company" testID="ask-disco">
      <CompanyPicker items={DISCO_ITEMS} value={value} onPick={d => onChange(d.id)} tone="dark" fold rows={3.5} placeholder="Find your electricity company" testID="disco-picker" />
    </Field>
  );
}

function MeterField({
  value,
  disco,
  kind,
  found,
  onChange,
  onFound,
  onFocus,
}: {
  value: string;
  disco?: string;
  kind?: MeterKind;
  found?: import('../../services').MeterRecord | null;
  onChange: (meter: string) => void;
  onFound: (record: import('../../services').MeterRecord | null) => void;
  onFocus?: () => void;
}) {
  const [text, setText] = useState(value ? groupMeter(value) : '');
  const [looking, setLooking] = useState(false);
  useEffect(() => {
    if (text.replace(/\D/g, '') !== value) setText(value ? groupMeter(value) : '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const problem = value.length >= 8 ? meterProblem(value) : null;
  const ready = !!value && !problem && !!disco && !!kind;
  /* looked up once it reads right and the company and the kind are known */
  useEffect(() => {
    if (!ready || found !== undefined) return;
    let live = true;
    setLooking(true);
    const t = setTimeout(() => {
      meters.lookup(disco!, kind!, value).then(record => {
        if (!live) return;
        setLooking(false);
        onFound(record);
      });
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
      setLooking(false);
    };
  }, [ready, found, disco, kind, value]); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (t: string) => {
    const digits = t.replace(/\D/g, '').slice(0, 13);
    setText(groupMeter(digits));
    onChange(digits);
  };
  const under =
    problem ??
    (found
      ? `${found.name}${found.address ? ` · ${found.address}` : ''}`
      : found === null
        ? 'No meter with that number there. Check the digits, or the company.'
        : looking
          ? 'Looking up the meter…'
          : value && !disco
            ? 'The company first, so I know where to look'
            : null);
  return (
    <Field label="Meter number" under={under} tone={problem || found === null ? 'warn' : found ? 'good' : 'soft'} testID="ask-meter">
      <Box>
        <TextInput
          value={text}
          onChangeText={change}
          onFocus={onFocus}
          placeholder="The digits on the meter"
          placeholderTextColor={dark.label}
          style={inputStyle}
          accessibilityLabel="Meter number"
          keyboardType="number-pad"
        />
      </Box>
    </Field>
  );
}

/** A chip: a word and a smaller one under it, the frame's 112×62 at the
    panel's scale; lit white when picked. */
function Chip({ on, label, sub, small, logo, onPress }: { on: boolean; label: string; sub?: string; small?: boolean; logo?: LogoName; onPress: () => void }) {
  return (
    <Tap
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      scale={0.96}
      style={[s.chip, small && s.chipSmall, logo ? s.chipLogo : null, on && s.chipOn]}
    >
      {logo ? <Logo name={logo} size={20} round /> : null}
      <Label style={{ color: on ? colour.ink : dark.paper }}>{label}</Label>
      {sub ? <Caption style={{ color: on ? dark.edgeStrong : dark.textSoft }}>{sub}</Caption> : null}
    </Tap>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, overflow: 'hidden', paddingBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: dark.edge, borderBottomWidth: 1, borderBottomColor: dark.edgeStrong },
  icon: { width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  dot: { width: 6, height: 6, borderRadius: 3 },
  body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, gap: 12 },
  box: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 14, paddingHorizontal: 14, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: dark.edge,
    borderWidth: 1,
    borderColor: dark.edgeStrong,
  },
  tertiary: { height: 28, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: dark.edgeStrong },
  badge: { height: 24, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeLogo: { flexDirection: 'row', gap: 5, paddingLeft: 4 },
  chips: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 60,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: dark.edge,
    borderWidth: 1,
    borderColor: dark.edgeStrong,
  },
  chipSmall: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minHeight: 40, paddingVertical: 8, paddingHorizontal: 14 },
  /* a company's chip: its logo before its name */
  chipLogo: { flexDirection: 'row', gap: 8, paddingLeft: 9 },
  chipOn: { backgroundColor: dark.paper, borderColor: dark.paper },
  segments: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 24, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  segment: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: dark.paper },
  track: { height: 4, borderRadius: 2, backgroundColor: dark.edgeStrong },
  trackOn: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: dark.paper },
  tick: { position: 'absolute', width: 2, height: 8, marginLeft: -1, borderRadius: 1, backgroundColor: dark.label },
  knob: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: dark.paper,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, alignSelf: 'flex-start' },
  /* the small tertiary Recent at the head's right: a pill that lights white while the list is out */
  recent: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  recentOn: { backgroundColor: dark.paper, borderColor: dark.paper },
  recentList: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 8 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 54, paddingHorizontal: 4, borderRadius: 12 },
  mark: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  /* the picker sits on the card itself, the ruler running edge to edge inside it */
  amount: { marginHorizontal: -4, paddingTop: 4 },
  person: { gap: 8 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  /* ready: the button lights white, the one thing to press */
  actionReady: { backgroundColor: dark.paper, borderColor: dark.paper },
  action: {
    height: 52,
    borderRadius: 26,
    backgroundColor: dark.edge,
    borderWidth: 1,
    borderColor: dark.edgeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
