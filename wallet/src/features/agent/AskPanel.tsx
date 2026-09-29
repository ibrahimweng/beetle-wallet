/* The ask panel: Beetle's question with the fields in it, on the dark card.
   What was said is already filled; what was not is empty and asks. A phone
   number shows its network as it is typed; a plan is typed or picked from
   the likely ones, with the rest a tap away; airtime has a slider for the
   amount; a meter is looked up as soon as it reads right. A small line
   under the fields — someone you have paid before, a number you have topped
   up, a meter you have paid — blurs the screen and lists them. Continue
   hands it all back to Beetle. Read off the Pay a bill and Buy data frames'
   sub-cards and chips. */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Caption, Icon, Label, Meta, Row, Swap, Tap, dark, measure, useStill, type Rect } from '../../design';
import { accountIn, askMissing, personIn, whose } from '../../services/agent';
import {
  AIRTIME,
  BILL_AMOUNTS,
  airtimeAt,
  airtimeFrom,
  DISCOS,
  groupMeter,
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
  type AskFound,
  type AskPanel,
  type AskValues,
  type Beneficiaries,
  type MeterKind,
  type Network,
  type Plan,
} from '../../services';
import { amountIn } from '../../services/agent';
import { dataIn, groupPhoneNumber } from '../../services/nigeria';
import { naira } from '../../lib/format';
import type { AskState } from './conversation';

export type SavedKind = 'person' | 'line' | 'meter';

/** What the pill says. */
export function askWord(state: AskState, missing: number): string {
  if (state === 'done') return 'Filled';
  if (state === 'busy') return 'Checking';
  return missing ? 'Needs a bit' : 'Ready';
}

const SAVED_LINE: Record<SavedKind, string> = { person: 'Someone you have paid before', line: 'A number you have topped up', meter: 'A meter you have paid' };

export function AskPanelView({
  ask,
  state,
  saved,
  onFill,
  onContinue,
  onSaved,
  onFocus,
}: {
  ask: AskPanel;
  state: AskState;
  saved?: Beneficiaries;
  onFill: (values: AskValues, found?: AskFound) => void;
  onContinue: () => void;
  /** the line under the fields: the list, grown from where the line is */
  onSaved?: (kind: SavedKind, at: Rect) => void;
  /** a field took the keyboard */
  onFocus?: () => void;
}) {
  const missing = askMissing(ask);
  const open = state === 'open';
  const link = useRef<View>(null);
  const v = ask.values;
  const network = v.number ? networkOf(v.number) : null;
  const line = v.number ? saved?.lines.find(l => l.number === v.number) : undefined;
  const prefilled = useRef(Object.values(v).some(x => x !== undefined && x !== '')).current;
  const lead = ask.note ?? (prefilled ? 'Check the parts I filled in before it goes' : 'I need a few things first');
  const set = (values: AskValues, found?: AskFound) => {
    if (open) onFill(values, found);
  };
  return (
    <View style={s.panel} testID="ask">
      <View style={s.head}>
        <View style={s.icon} testID="ask-icon">
          <Icon name={ask.icon} size={16} colour="#ffffff" />
        </View>
        <Label style={{ flex: 1, color: '#ffffff' }}>{ask.title}</Label>
        <View style={s.pill} testID="ask-pill">
          <View style={[s.dot, { backgroundColor: missing.length && open ? '#f5a524' : '#34c759' }]} />
          <Swap value={askWord(state, missing.length)}>{w => <Caption style={{ color: dark.pillText, fontWeight: '600' }}>{w}</Caption>}</Swap>
        </View>
      </View>
      <View style={[s.body, !open && { opacity: 0.72 }]} pointerEvents={open ? 'auto' : 'none'}>
        <Caption style={{ color: ask.note ? '#ffd48a' : dark.textSoft }} testID="ask-lead">
          {lead}
        </Caption>
        {ask.fields.map(f => {
          switch (f) {
            case 'who':
              return <WhoField key={f} value={v.who ?? ''} found={ask.found?.person} onChange={(who, person) => set({ who }, { person })} onFocus={onFocus} />;
            case 'amount':
              return ask.tool === 'airtime' ? (
                <AirtimeField key={f} value={v.amount} usual={line?.amount} onChange={amount => set({ amount })} onFocus={onFocus} />
              ) : (
                <AmountField key={f} value={v.amount} chips={ask.tool === 'pay' ? BILL_AMOUNTS : undefined} units={v.meterKind !== 'postpaid'} onChange={amount => set({ amount })} onFocus={onFocus} />
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
        {ask.saved && onSaved && open ? (
          <Tap
            ref={link}
            accessibilityRole="button"
            accessibilityLabel={SAVED_LINE[ask.saved]}
            onPress={async () => {
              const at = await measure(link);
              onSaved(ask.saved!, at);
            }}
            style={s.link}
            testID="ask-saved"
          >
            <Caption style={{ color: '#9fb0ff' }}>{SAVED_LINE[ask.saved]}</Caption>
            <Icon name="chevron" size={12} colour="#9fb0ff" />
          </Tap>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
        <Tap
          accessibilityRole="button"
          accessibilityLabel={state === 'done' ? 'Filled' : state === 'busy' ? 'Checking' : 'Continue'}
          disabled={!open || missing.length > 0}
          onPress={onContinue}
          style={[s.action, (!open || missing.length > 0) && { opacity: 0.55 }]}
        >
          <Swap value={state === 'done' ? 'Filled' : state === 'busy' ? 'Checking…' : 'Continue'}>{label => <Row style={{ color: '#ffffff' }}>{label}</Row>}</Swap>
        </Tap>
      </View>
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

const inputStyle = { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '600' as const, paddingVertical: 0, height: 46 };

function WhoField({
  value,
  found,
  onChange,
  onFocus,
}: {
  value: string;
  found?: import('../../services').Person | null;
  onChange: (who: string, person: import('../../services').Person | null) => void;
  onFocus?: () => void;
}) {
  const change = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const number = accountIn(text) ?? (digits.length === 10 && /^\d[\d\s-]*$/.test(text.trim()) ? digits : null);
    const person = number ? whose(number) : text.trim().length > 1 ? personIn(text) : null;
    onChange(text, person);
  };
  const under = found
    ? `${found.name} · ${found.bank}`
    : value.trim()
      ? /^\d/.test(value.trim())
        ? 'Ten digits, and I will find whose it is'
        : 'Nobody I know by that name; their account number would do'
      : null;
  return (
    <Field label="Who to" under={under} tone={found ? 'good' : 'soft'} testID="ask-who">
      <Box>
        <TextInput
          value={value}
          onChangeText={change}
          onFocus={onFocus}
          placeholder="A name I know, or ten digits"
          placeholderTextColor={dark.label}
          style={inputStyle}
          accessibilityLabel="Who to"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </Box>
    </Field>
  );
}

/** Digits with their thousands, as typed. */
const withCommas = (n: number) => Math.floor(n).toLocaleString('en-NG');

function AmountField({ value, chips, units, onChange, onFocus }: { value?: number; chips?: readonly number[]; units?: boolean; onChange: (amount: number | undefined) => void; onFocus?: () => void }) {
  const [text, setText] = useState(value ? withCommas(value) : '');
  useEffect(() => {
    const typed = amountIn(text.replace(/,/g, '')) ?? undefined;
    if (typed !== value) setText(value ? withCommas(value) : '');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const change = (t: string) => {
    const digits = t.replace(/[^\d]/g, '');
    setText(digits ? withCommas(Number(digits)) : '');
    onChange(digits ? Number(digits) : undefined);
  };
  return (
    <Field label="Amount" testID="ask-amount">
      <Box>
        <Row style={{ color: text ? '#ffffff' : dark.label }}>₦</Row>
        <TextInput value={text} onChangeText={change} onFocus={onFocus} placeholder="0" placeholderTextColor={dark.label} style={inputStyle} accessibilityLabel="Amount" keyboardType="number-pad" />
      </Box>
      {chips ? (
        <View style={s.chips}>
          {chips.map(c => (
            <Chip key={c} on={value === c} label={naira(c)} sub={units ? `About ${unitsFor(c)} kWh` : undefined} onPress={() => onChange(c)} />
          ))}
        </View>
      ) : null}
    </Field>
  );
}

/** Airtime: the amount, and a slider to set it by feel. */
function AirtimeField({ value, usual, onChange, onFocus }: { value?: number; usual?: number; onChange: (amount: number | undefined) => void; onFocus?: () => void }) {
  return (
    <View style={{ gap: 8 }}>
      <AmountField value={value} onChange={onChange} onFocus={onFocus} />
      <Slider value={value ?? usual ?? AIRTIME.min} onChange={onChange} />
    </View>
  );
}

function Slider({ value, onChange }: { value: number; onChange: (amount: number) => void }) {
  const still = useStill();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (!w) return;
    const px = airtimeAt(value) * w;
    x.value = still ? px : withTiming(px, { duration: 160 });
  }, [value, w, still, x]);
  const commit = (px: number) => {
    if (w) onChange(airtimeFrom(px / w));
  };
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate(e => {
      x.value = Math.min(Math.max(e.x, 0), w);
    })
    .onEnd(e => runOnJS(commit)(e.x));
  const tap = Gesture.Tap().onEnd(e => runOnJS(commit)(e.x));
  const fill = useAnimatedStyle(() => ({ width: x.value }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - 12 }] }));
  const stops = AIRTIME.stops;
  return (
    <View style={{ gap: 2, marginHorizontal: 8 }} testID="ask-slider">
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          style={{ height: 40, justifyContent: 'center' }}
          onLayout={e => setW(e.nativeEvent.layout.width)}
          accessibilityRole="adjustable"
          accessibilityLabel="Amount slider"
          accessibilityValue={{ min: AIRTIME.min, max: AIRTIME.max, now: value, text: naira(value) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e => onChange(Math.min(AIRTIME.max, Math.max(AIRTIME.min, value + (e.nativeEvent.actionName === 'increment' ? AIRTIME.step : -AIRTIME.step))))}
        >
          <View style={s.track} />
          <Animated.View style={[s.trackOn, fill]} />
          {stops.map(m => (
            <View key={m} style={[s.tick, { left: airtimeAt(m) * w - 1 }]} />
          ))}
          <Animated.View style={[s.knob, knob]} />
        </View>
      </GestureDetector>
      <View style={{ height: 16 }}>
        {stops.map(m => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityLabel={`Airtime ${naira(m)}`}
            onPress={() => onChange(m)}
            hitSlop={6}
            style={{ position: 'absolute', left: airtimeAt(m) * w - 24, width: 48, alignItems: 'center' }}
          >
            <Caption style={{ color: value === m ? '#ffffff' : dark.label }}>{m >= 1000 ? `${m / 1000}k` : String(m)}</Caption>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function NetworkBadge({ network }: { network: Network }) {
  const info = networkInfo(network);
  return (
    <View style={[s.badge, { backgroundColor: info.colour }]} testID="network">
      <Caption style={{ color: info.ink, fontWeight: '600' }}>{network}</Caption>
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
            <Row style={{ color: '#ffffff' }}>{groupPhoneNumber(value)}</Row>
            {whoseLine ? <Caption style={{ color: dark.textSoft }}>{whoseLine}</Caption> : null}
          </View>
          {network ? <NetworkBadge network={network} /> : null}
          <Tap accessibilityRole="button" accessibilityLabel="Change the number" onPress={() => setEditing(true)} style={s.tertiary} hitSlop={6}>
            <Caption style={{ color: '#9fb0ff', fontWeight: '600' }}>Change</Caption>
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
              <Caption style={{ color: '#9fb0ff' }}>All {network} plans</Caption>
              <Icon name="chevron" size={12} colour="#9fb0ff" />
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
              <Label style={{ color: on ? '#000000' : dark.text }}>{k === 'prepaid' ? 'Prepaid' : 'Postpaid'}</Label>
            </Tap>
          );
        })}
      </View>
    </Field>
  );
}

function DiscoField({ value, onChange }: { value?: string; onChange: (disco: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? DISCOS : DISCOS.slice(0, 5);
  return (
    <Field label="Company" testID="ask-disco">
      <View style={s.wrap}>
        {shown.map(d => (
          <Chip key={d.id} on={value === d.id} label={d.short} small onPress={() => onChange(d.id)} />
        ))}
        {!all ? (
          <Tap accessibilityRole="button" accessibilityLabel="More companies" onPress={() => setAll(true)} style={[s.chip, s.chipSmall]}>
            <Caption style={{ color: dark.textSoft }}>More…</Caption>
          </Tap>
        ) : null}
      </View>
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
function Chip({ on, label, sub, small, onPress }: { on: boolean; label: string; sub?: string; small?: boolean; onPress: () => void }) {
  return (
    <Tap
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      scale={0.96}
      style={[s.chip, small && s.chipSmall, on && s.chipOn]}
    >
      <Label style={{ color: on ? '#000000' : '#ffffff' }}>{label}</Label>
      {sub ? <Caption style={{ color: on ? '#3a3a3c' : dark.textSoft }}>{sub}</Caption> : null}
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
  chipOn: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  segments: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 24, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong },
  segment: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: '#ffffff' },
  track: { height: 4, borderRadius: 2, backgroundColor: dark.edgeStrong },
  trackOn: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: '#ffffff' },
  tick: { position: 'absolute', width: 2, height: 8, marginLeft: -1, borderRadius: 1, backgroundColor: dark.label },
  knob: {
    position: 'absolute',
    left: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, alignSelf: 'flex-start' },
  action: {
    height: 52,
    borderRadius: 26,
    backgroundColor: dark.edge,
    borderWidth: 1,
    borderColor: dark.edgeStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
