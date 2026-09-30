/* A top-up from a message, from its frame: what the camera read (or what
   was typed) as a black pill, Beetle's word on whose line it is and why
   it priced the bundle it did, and Beetle Data at work on a light panel
   — the line, whose, the plan, the price, and whether there is anything
   cheaper, which it checks — with Confirm under the rows; then the lock
   line that says nothing leaves before the face and the passcode.
   Reached from Read from your photo over the camera when the message
   asks for data or airtime. Confirm leads to the passcode, the line goes
   into the day, Beetle files the chat with the receipt's card in it, and
   the receipt opens. A reply in the bar at the foot changes the bundle. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Head, Icon, LightPanel, Meta, Row, Say, Screen, Tap, colour, toast } from '../../design';
import { amountIn } from '../../services/agent';
import { DEMO_SAVED, airtimePanelFor, dataIn, dataPanelFor, groupPhoneNumber, planById, planFor, planName, planSize, type LinePaid, type Plan } from '../../services';
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

/** Beetle's word on the line and the bundle it priced. */
export function topupLine(line: LinePaid | null, plan: Plan | null, asked: Plan | null, airtime: number | undefined): string {
  if (!line) return 'Whose line is it? Tap the row to pick one you have topped up, or type a number.';
  const whose = `${line.label}'s ${line.network} line, the one ending ${line.number.slice(-3)}.`;
  if (airtime) return `${whose} ${naira(airtime)} of airtime, as the message asks.`;
  if (!plan) return `${whose} Which bundle? Say a size, or a figure.`;
  if (asked && plan.price > asked.price) return `${whose} ${pronounOf(line.label)} ran dry eleven days early last month, so I have priced the bigger bundle too.`;
  return `${whose} ${planName(plan)} for ${naira(plan.price)}, as last time.`;
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
  const [said, setSaid] = useState<Said[]>(() =>
    demo
      ? [
          { id: 1, who: 'you', text: DEMO.said!, photo: true },
          { id: 2, who: 'beetle', text: topupLine(DEMO.line!, planById(DEMO.line!.plan!), planFor(DEMO.line!.network, { amount: DEMO.asked }), undefined) },
        ]
      : [],
  );
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
      say({ who: 'beetle', text: topupLine(l, p, wanted, d.amount) });
    }, [line, askedPlan, say]),
  );
  /* nothing handed and nothing said, once the hand-off has had its moment: Beetle opens */
  useEffect(() => {
    const t = setTimeout(() => {
      if (!handed.current && said.length === 0) say({ who: 'beetle', text: topupLine(null, null, null, undefined) });
    }, 60);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* a reply in the bar: a size, a figure, or airtime */
  const reply = (q: string) => {
    say({ who: 'you', text: q });
    if (!line) {
      say({ who: 'beetle', text: 'Tap the line row first, so I know whose it is.' });
      return;
    }
    const gb = dataIn(q);
    const figure = amountIn(q);
    if (/\bairtime\b|\bcredit\b/i.test(q) && figure) {
      setAirtime(figure);
      setPlan(null);
      say({ who: 'beetle', text: `${naira(figure)} of airtime on ${line.label}'s line, then.` });
      return;
    }
    const p = planFor(line.network, { gb, amount: figure });
    if (!p) {
      say({ who: 'beetle', text: 'I did not catch a bundle in that. Try "2GB", or a figure like "₦1,000".' });
      return;
    }
    setAirtime(undefined);
    setPlan(p);
    say({ who: 'beetle', text: `${planName(p)} for ${naira(p.price)}, then.` });
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
    router.replace(`/receipt/${row.id}`);
  };

  useFoot({ kind: 'ask', placeholder: 'Reply, or just keep typing', onAsk: reply, onScan: () => router.push('/scan'), veil: guard ? 'away' : undefined });
  if (!ok || !account) return null;
  const status = busy ? 'Buying' : !complete ? 'Waiting' : checked ? 'Ready' : 'Running';
  const cheaper = askedPlan && plan && askedPlan.price < plan.price ? askedPlan : null;
  const ready = complete && checked && !busy;
  return (
    <>
      <Screen>
        {/* the frame's head: Beetle's mark and its name in the middle; Back keeps its place at the foot */}
        <View style={s.head} testID="chat-head">
          <Icon name="mark" size={24} colour={colour.accent} />
          <Head>Beetle</Head>
        </View>
        <View style={{ gap: 16, marginTop: -4 }} testID="said">
          {said.map(t =>
            t.who === 'you' ? (
              <View key={t.id} style={{ alignItems: 'flex-end' }}>
                <View style={s.pill} testID="you-said">
                  {t.photo ? <Icon name="camera" size={16} colour={colour.textInverse} /> : null}
                  <Row tone="inverse">{t.text}</Row>
                </View>
              </View>
            ) : (
              <Say key={t.id} testID="say">
                {t.text}
              </Say>
            ),
          )}
        </View>
        <View style={{ marginTop: -14 }}>
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
              airtime ? { label: 'Airtime', value: naira(airtime), done: true } : { label: 'Plan', value: plan ? planName(plan) : 'Say a size', done: !!plan },
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
            foot={
              <Tap
                accessibilityRole="button"
                accessibilityLabel={`Confirm ${naira(price)}`}
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={confirm}
                style={[s.confirm, !ready ? s.confirmOff : null]}
              >
                <Row tone={!ready ? 'tertiary' : 'inverse'}>{busy ? 'Buying…' : `Confirm ${naira(price)}`}</Row>
              </Tap>
            }
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: -4 }} testID="lock-line">
          <View style={{ marginTop: 2 }}>
            <Icon name="lock" size={16} colour={colour.textTertiary} />
          </View>
          <Meta tone="secondary" style={{ flex: 1 }}>
            Face ID first. Nothing leaves your account until then.
          </Meta>
        </View>
      </Screen>
      {guard && line ? (
        <PasscodeSheet
          amount={naira(price)}
          name={airtime || !plan ? `${line.network} · Airtime` : `${line.network} · ${planSize(plan)}`}
          detail={`${line.label} · ${groupPhoneNumber(line.number)}`}
          glyph={airtime ? 'airtime' : 'data'}
          verify={app.checkPasscode}
          onDone={done}
          onCancel={() => setGuard(false)}
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  head: { height: 44, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 47, borderRadius: 24, backgroundColor: colour.ink, paddingLeft: 16, paddingRight: 19 },
  confirm: { height: 52, borderRadius: 26, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
  confirmOff: { backgroundColor: colour.surface2 },
});
