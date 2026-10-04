/* A top-up from a message: what the camera read (or what was typed), then
   Beetle Data at work on a light panel — the line, whose, the plan, the
   price, and whether there is anything cheaper, which it checks — with the
   word on whose line it is and why it priced the bundle it did on the line
   under the panel (a form has no bubble from Beetle: see DESIGN.md); then
   the lock line that says nothing leaves before the face and the passcode.
   Reached from Read from your photo over the camera when the message
   asks for data or airtime. Confirm leads to the passcode, the line goes
   into the day, Beetle files the chat with the receipt's card in it, and
   the receipt opens. A tap on the plan row changes the bundle where it
   is — the network's bundles in a list, or airtime on the amount picker —
   and Confirm sits in the foot beside Back. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Button, Head, Icon, Label, LightPanel, Meta, PageHead, Row, Screen, Sheet, Tap, YouTyped, colour, toast } from '../../design';
import { DEMO_SAVED, airtimePanelFor, dataPanelFor, groupPhoneNumber, planById, planFor, planName, planSize, plansFor, type LinePaid, type Plan } from '../../services';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/turns';
import { PasscodeSheet, lockedFor } from '../passcode';
import { LAB } from '../../lab/enabled';
import { naira } from '../../lib/format';
import { topupDraft, type TopupDraft } from './hand';

type Said = { id: number; who: 'you' | 'beetle'; text: string; photo?: boolean };

/** The frame's top-up, for the lab: Mum's message, read off the photo. */
const DEMO: TopupDraft = { line: DEMO_SAVED.lines[0]!, asked: 2_000, read: 'photo', said: '2k data for mum' };

/** She, he, they: whose line it is, as far as a label says. */
const pronounOf = (label: string) =>
  /^(mum|mummy|mother|sister|aunt|wife|kemi|bola|sarah)$/i.test(label) ? 'She' : /^(dad|daddy|father|brother|uncle|husband|tunde|musa|chidi)$/i.test(label) ? 'He' : 'They';

/** The word under the panel: whose line it is, and why the bundle is the one priced. */
export function topupLine(line: LinePaid | null, plan: Plan | null, asked: Plan | null, airtime: number | undefined): string {
  if (!line) return 'Pick the line from the ones you have topped up, or type a number.';
  const whose = `${line.label}'s ${line.network} line, ending ${line.number.slice(-3)}.`;
  if (airtime) return `${whose} ${naira(airtime)} of airtime, as the message asks.`;
  if (!plan) return `${whose} Pick a bundle: tap Plan.`;
  if (asked && plan.price > asked.price) return `${whose} ${pronounOf(line.label)} ran dry eleven days early last month, so this is the bigger bundle.`;
  return `${whose} ${planName(plan)}, as last time.`;
}

export function Topup() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string; guard?: string }>();
  const demo = LAB && asked.demo === '1';
  const account = app.session?.account;
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const balance = (account ? holdingsFor(account).everyday : 0) + balanceOf(moves);
  const { file } = useChats(account?.accountNumber, !!account?.demo);

  const [line, setLine] = useState<LinePaid | null>(demo ? DEMO.line! : null);
  /** the bundle the message asked for, by its figure */
  const [askedPlan, setAskedPlan] = useState<Plan | null>(() => (demo && DEMO.line ? planFor(DEMO.line.network, { amount: DEMO.asked }) : null));
  const [plan, setPlan] = useState<Plan | null>(() => (demo && DEMO.line?.plan ? planById(DEMO.line.plan) : null));
  const [airtime, setAirtime] = useState<number | undefined>(undefined);
  const [read, setRead] = useState<'photo' | undefined>(demo ? 'photo' : undefined);
  const [said, setSaid] = useState<Said[]>(() => (demo ? [{ id: 1, who: 'you', text: DEMO.said!, photo: true }] : []));
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [guard, setGuard] = useState(!!(LAB && asked.guard === '1'));
  const next = useRef(said.length);
  const say = useCallback((t: Omit<Said, 'id'>) => setSaid(s => [...s, { id: ++next.current, ...t }]), []);

  /* what the camera handed here: the line, and the bundle the message asked
     for — priced against the one she usually gets, where that is bigger */
  const handed = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const d = topupDraft.take();
      if (!d) return;
      handed.current = true;
      const l = d.line !== undefined ? d.line : line;
      const wanted = l && d.asked ? planFor(l.network, { amount: d.asked }) : askedPlan;
      const usual = l?.plan ? planById(l.plan) : null;
      const bigger = usual && wanted && usual.price > wanted.price ? usual : null;
      const p = d.amount ? null : (bigger ?? (d.plan !== undefined ? d.plan : (usual ?? wanted)));
      if (d.line !== undefined) setLine(d.line);
      setAskedPlan(wanted);
      setPlan(p);
      if (d.amount !== undefined) setAirtime(d.amount);
      if (d.read) setRead(d.read);
      if (d.said) say({ who: 'you', text: d.said, photo: d.read === 'photo' });
    }, [line, askedPlan, say]),
  );

  /* whether there is anything cheaper: checked once the line and the bundle are there */
  const complete = !!line && (!!plan || !!airtime);
  useEffect(() => {
    if (!complete) {
      setChecked(false);
      return;
    }
    const t = setTimeout(() => setChecked(true), demo ? 6000 : 1500);
    return () => clearTimeout(t);
  }, [complete, plan?.id, airtime]); // eslint-disable-line react-hooks/exhaustive-deps

  /** the bundles sheet: data by plan, or airtime on the picker */
  const [choosing, setChoosing] = useState(false);
  const [mode, setMode] = useState<'data' | 'airtime'>('data');
  const [pickAirtime, setPickAirtime] = useState(0);
  const choose = (p: Plan) => {
    setAirtime(undefined);
    setPlan(p);
    setChoosing(false);
  };
  const useAirtime = () => {
    if (!line || !pickAirtime) return;
    setAirtime(pickAirtime);
    setPlan(null);
    setChoosing(false);
  };
  const openChoosing = () => {
    if (!line) {
      router.push('/buy');
      return;
    }
    setMode(airtime ? 'airtime' : 'data');
    setPickAirtime(airtime ?? 1_000);
    setChoosing(true);
  };

  const price = airtime ?? plan?.price ?? 0;
  const confirm = () => {
    if (!line || !price || busy) return;
    if (price > balance) {
      router.push(`/short?asked=${price}`);
      return;
    }
    const shut = lockedFor();
    if (shut) {
      toast(`That was three wrong tries. Give it ${shut} seconds and try again.`);
      return;
    }
    setGuard(true);
  };
  /* the passcode landed: the line goes into the day, the chat is filed with its card, and the receipt opens */
  const done = () => {
    if (!line || !account) return;
    setBusy(true);
    const at = clock();
    const phone = { number: line.number, network: line.network, label: line.label };
    const base = airtime || !plan ? airtimePanelFor(phone, price).move : dataPanelFor(phone, plan).move;
    if (!base) return;
    const row = rowFrom({ ...base, detail: `${base.detail} · ${at}`, read }, balance, 17 + moves.length);
    addMove(row);
    const what = airtime || !plan ? `${naira(price)} of airtime` : planSize(plan);
    file({
      id: `top-${row.id}`,
      startedBy: 'you',
      title: `${what} for ${line.label}`,
      detail: `${line.network} · ${naira(price)}`,
      time: at,
      day: 'today',
      turns: [
        turn.you(said.find(s => s.who === 'you')?.text ?? `${what} for ${line.label}`),
        turn.say(`Done. ${what} is on ${line.label}'s line.`),
        turn.receipt({ rowId: row.id, amount: naira(price), line: `${what} for ${line.label}`, status: 'Successful', time: at }),
      ],
      pending: null,
      lastAt: Date.now(),
    });
    setGuard(false);
    router.push(`/receipt/${row.id}?paid=1`);
  };

  const ready = complete && checked && !busy;
  /* the foot: Back, and Confirm beside it once the line, the bundle and the check are there */
  useFoot({ kind: 'button', label: busy ? 'Buying…' : price ? `Confirm ${naira(price)}` : 'Confirm', disabled: !ready, onPress: confirm, veil: guard || choosing ? 'away' : undefined });
  if (!ok || !account) return null;
  const status = busy ? 'Buying' : !complete ? 'Waiting' : checked ? 'Ready' : 'Running';
  const cheaper = askedPlan && plan && askedPlan.price < plan.price ? askedPlan : null;
  const yours = [...said].reverse().find(t => t.who === 'you');
  return (
    <>
      <Screen head={<PageHead lead title={airtime ? 'Buy airtime' : 'Buy data'} sub={read === 'photo' ? 'From the message on your photo' : 'From what you typed'} />}>
        {yours ? <YouTyped said={yours.text} /> : null}
        <View style={{ gap: 12 }}>
          <LightPanel
            glyph={airtime ? 'airtime' : 'data'}
            title={airtime ? 'Beetle Airtime' : 'Beetle Data'}
            status={status}
            centre
            disc={18}
            testID="topup-panel"
            rows={[
              { label: 'Line', value: line ? `${line.network} · ${groupPhoneNumber(line.number)}` : 'Pick one', done: !!line, onPress: () => router.push('/buy'), chevron: !line },
              { label: 'Whose', value: line ? line.label : 'Their name', done: !!line },
              airtime
                ? { label: 'Airtime', value: naira(airtime), done: true, onPress: openChoosing, chevron: true }
                : { label: 'Plan', value: plan ? planName(plan) : 'Pick one', done: !!plan, onPress: openChoosing, chevron: true },
              { label: 'Price', value: price ? naira(price) : 'To come', done: price > 0 },
              {
                label: 'Cheaper?',
                value: !complete
                  ? 'Once I have the rest'
                  : !checked
                    ? `Checking ${line?.network ?? ''} plans`
                    : cheaper
                      ? `${planSize(cheaper)} at ${naira(cheaper.price)} ran out early`
                      : 'No, this is the best price',
                done: checked,
                working: complete && !checked,
              },
            ]}
          />
          {/* what the bubble used to say, under the panel it is about */}
          <Meta tone="secondary" style={{ paddingHorizontal: 4 }} testID="topup-note">
            {topupLine(line, plan, askedPlan, airtime)}
          </Meta>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }} testID="lock-line">
          <View style={{ marginTop: 2 }}>
            <Icon name="lock" size={16} colour={colour.textTertiary} />
          </View>
          <Meta tone="secondary" style={{ flex: 1 }}>
            Face ID first. Nothing leaves your account until then.
          </Meta>
        </View>
      </Screen>
      {choosing && line ? (
        <Sheet onDismiss={() => setChoosing(false)} testID="pick-plan">
          <Head>{mode === 'data' ? `Which bundle for ${line.label}?` : `How much airtime for ${line.label}?`}</Head>
          <View style={s.modes}>
            {(['data', 'airtime'] as const).map(m => (
              <Tap
                key={m}
                accessibilityRole="button"
                accessibilityLabel={m === 'data' ? 'Data' : 'Airtime'}
                accessibilityState={{ selected: mode === m }}
                onPress={() => setMode(m)}
                style={[s.mode, mode === m ? s.modeOn : null]}
              >
                <Label tone={mode === m ? 'inverse' : 'ink'}>{m === 'data' ? 'Data' : 'Airtime'}</Label>
              </Tap>
            ))}
          </View>
          {mode === 'data' ? (
            <View style={{ marginTop: 8 }} testID="plans">
              {plansFor(line.network).map((p, i) => (
                <Tap key={p.id} accessibilityRole="button" accessibilityLabel={planName(p)} onPress={() => choose(p)} style={[s.plan, i ? s.hairTop : null]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row>{planSize(p)}</Row>
                    <Meta tone="secondary">{p.days === 1 ? 'A day' : p.days === 7 ? 'A week' : `${p.days} days`}</Meta>
                  </View>
                  <Label>{naira(p.price)}</Label>
                  {plan?.id === p.id ? <Icon name="check" size={18} colour={colour.ink} /> : <View style={{ width: 18 }} />}
                </Tap>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 20, gap: 20 }}>
              <AmountPicker value={pickAirtime} onChange={setPickAirtime} max={balance} note={`Everyday has ${naira(balance)}`} chips={[500, 1_000, 2_000, 5_000]} />
              <Button label={pickAirtime ? `${naira(pickAirtime)} of airtime` : 'Pick an amount'} disabled={!pickAirtime} onPress={useAirtime} />
            </View>
          )}
        </Sheet>
      ) : null}
      {guard && line ? (
        <PasscodeSheet
          amount={naira(price)}
          name={airtime || !plan ? `${line.network} · Airtime` : `${line.network} · ${planSize(plan)}`}
          detail={`${line.label} · ${groupPhoneNumber(line.number)}`}
          glyph={airtime ? 'airtime' : 'data'}
          rows={[
            airtime || !plan ? { label: 'Airtime', value: naira(price) } : { label: 'Plan', value: planName(plan) },
            { label: 'Lands', value: 'At once' },
            { label: 'Fee', value: 'Free' },
            { label: 'Leaves Everyday', value: naira(price), strong: true },
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
  modes: { flexDirection: 'row', gap: 8, marginTop: 16 },
  mode: { height: 36, borderRadius: 18, paddingHorizontal: 16, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  modeOn: { backgroundColor: colour.ink },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 60 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
});
