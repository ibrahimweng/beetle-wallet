/* Asking someone for money, from its frame: what you said (or what the
   camera read) as a black pill, Beetle's word on who it found, and Beetle
   Requests at work on a light panel — the person, where it reaches them,
   the amount, what it is for, and when it lapses, with Send the request
   under them — then the lock line that says asking cannot move money.
   Reached from "ask musa for 20k" at home, from a photo of the message,
   from Ask someone on the Receive sheet and Ask for money on Three ways.
   What is missing is asked for: a tap on the row, or a reply in the bar at
   the foot beside Back, fills it. Sending files the request, and the page
   that says so takes its place. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Head, Icon, Label, LightPanel, Meta, Row, Say, Screen, Sheet, Tap, colour } from '../../design';
import { amountIn } from '../../services/agent';
import { phoneIn } from '../../services/nigeria';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/conversation';
import { LAB } from '../../lab/enabled';
import { groupPhone, initialsOf, naira } from '../../lib/format';
import { PAYERS, firstOf, lineEnding, noteIn, objectOf, payerIn, type Payer } from './people';
import { requestDraft } from './hand';
import { lineFor, shortMoney } from './words';
import { requestFrom, useRequests } from './requests';

type Said = { id: number; who: 'you' | 'beetle'; text: string; photo?: boolean };

/** The frame's request, for the lab: from the photo, or typed. */
const DEMO: Record<string, { who: Payer; amount: number; note: string; read?: 'photo'; said: string }> = {
  photo: { who: PAYERS[0]!, amount: 20_000, note: 'Rent balance', read: 'photo', said: 'Ask Musa for 20k' },
  typed: { who: PAYERS[0]!, amount: 20_000, note: 'Rent balance', said: 'ask musa for 20k for the rent balance' },
};

export function Request() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const demo = LAB && asked.demo ? DEMO[asked.demo] : undefined;
  const account = app.session?.account;
  const { add } = useRequests(account?.accountNumber);
  const { file } = useChats(account?.accountNumber, !!account?.demo);

  const [who, setWho] = useState<Payer | null>(demo?.who ?? null);
  const [amount, setAmount] = useState(demo?.amount ?? 0);
  const [note, setNote] = useState(demo?.note ?? '');
  const [read, setRead] = useState<'photo' | undefined>(demo?.read);
  const [said, setSaid] = useState<Said[]>(() =>
    demo
      ? [
          { id: 1, who: 'you', text: demo.said, photo: !!demo.read },
          { id: 2, who: 'beetle', text: lineFor(demo.who, demo.amount) },
        ]
      : [],
  );
  const [dated, setDated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const next = useRef(said.length);
  const say = useCallback((line: Omit<Said, 'id'>) => setSaid(s => [...s, { id: ++next.current, ...line }]), []);

  /* what was handed here: the words typed at home, a photo read on the
     camera, the keypad handing an amount back */
  useFocusEffect(
    useCallback(() => {
      const d = requestDraft.take();
      if (!d) return;
      let w = who;
      let a = amount;
      if (d.who !== undefined) {
        w = d.who;
        setWho(d.who);
      }
      if (d.amount !== undefined) {
        a = d.amount;
        setAmount(d.amount);
      }
      if (d.note !== undefined) setNote(d.note);
      if (d.read) setRead(d.read);
      if (d.said) say({ who: 'you', text: d.said, photo: d.read === 'photo' });
      if (d.said || d.who !== undefined || d.amount !== undefined) say({ who: 'beetle', text: lineFor(w, a) });
    }, [who, amount, say]),
  );
  /* nothing was handed and nothing said: Beetle opens */
  useEffect(() => {
    if (said.length === 0) say({ who: 'beetle', text: lineFor(null, 0) });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* the date is picked once the person and the amount are there */
  const complete = !!who && amount > 0;
  useEffect(() => {
    if (!complete) {
      setDated(false);
      return;
    }
    /* the lab holds the frame's moment, the date still being picked, a while longer */
    const t = setTimeout(() => setDated(true), demo ? 6000 : 1200);
    return () => clearTimeout(t);
  }, [complete]); // eslint-disable-line react-hooks/exhaustive-deps

  /* a reply in the bar: a name, a figure, what it is for, a new line */
  const reply = (q: string) => {
    say({ who: 'you', text: q });
    let w = who;
    let a = amount;
    let got = false;
    const p = payerIn(q);
    if (p) {
      w = p;
      got = true;
    } else {
      const phone = phoneIn(q);
      if (phone) {
        const name = q
          .replace(/[\d\s+\-()]{7,}/g, ' ')
          .replace(/\b(ask|for|and|at|on|the|number|line)\b/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        w = { name: name ? name.replace(/\b\w/g, c => c.toUpperCase()) : groupPhone(phone), phone, pronoun: 'they', note: 'new' };
        got = true;
      }
    }
    const figure = amountIn(q);
    if (figure) {
      a = figure;
      got = true;
    }
    const what = noteIn(q);
    if (what) {
      setNote(what);
      got = true;
    }
    setWho(w);
    setAmount(a);
    say({ who: 'beetle', text: got ? lineFor(w, a) : 'I did not catch a name or a figure in that. Try "Musa" or "20k", or tap a row.' });
  };

  const send = () => {
    if (!who || !amount || !dated || busy) return;
    setBusy(true);
    setTimeout(() => {
      const r = requestFrom(who, amount, note, read);
      add(r);
      const first = firstOf(who.name);
      const at = clock();
      file({
        id: `req-${r.id}`,
        startedBy: 'beetle',
        title: `${naira(amount)} asked of ${first}`,
        detail: `On WhatsApp and in a text · ${r.reference}`,
        time: at,
        day: 'today',
        turns: [
          turn.you(said.find(s => s.who === 'you')?.text ?? `Ask ${first} for ${shortMoney(amount)}`),
          turn.say('I will tell you the moment it lands. You do not have to watch for it.'),
          turn.receipt({ rowId: r.id, amount: naira(amount), line: `Asked ${who.name}`, status: 'Sent', time: at, to: `/asked/${r.id}`, kind: 'request' }),
        ],
        pending: null,
        lastAt: Date.now(),
      });
      router.replace(`/asked/${r.id}` as never);
    }, 900);
  };

  useFoot({ kind: 'ask', placeholder: 'Reply, or just keep typing', onAsk: reply, onScan: () => router.push('/scan'), veil: picking ? 'away' : undefined });
  if (!ok || !account) return null;
  const first = who ? firstOf(who.name) : '';
  const status = busy ? 'Sending' : !complete ? 'Waiting' : dated ? 'Ready' : 'Running';
  return (
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
          glyph="up"
          title="Beetle Requests"
          status={status}
          centre
          disc={18}
          testID="request-panel"
          rows={[
            { label: 'Person', value: who ? who.name : 'Pick someone', done: !!who, onPress: () => setPicking(true), chevron: !who },
            { label: who ? `Reaches ${objectOf(who.pronoun)}` : 'Reaches them', value: who ? 'WhatsApp and SMS' : 'Their line', done: !!who },
            { label: 'Amount', value: amount ? naira(amount) : 'Type it', done: amount > 0, onPress: () => router.push(`/amend?amount=${amount || ''}&to=request`), chevron: true },
            { label: 'For', value: note || 'Anything, or nothing', done: !!note },
            { label: 'Expires', value: dated ? 'In 7 days' : 'Picking a date', done: dated, working: complete && !dated },
          ]}
          foot={
            <Tap
              accessibilityRole="button"
              accessibilityLabel="Send the request"
              accessibilityState={{ disabled: !dated || busy }}
              disabled={!dated || busy}
              onPress={send}
              style={[s.send, !dated || busy ? s.sendOff : null]}
            >
              <Row tone={!dated || busy ? 'tertiary' : 'inverse'}>{busy ? `Asking ${first}…` : 'Send the request'}</Row>
            </Tap>
          }
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: -4 }} testID="lock-line">
        <View style={{ marginTop: 2 }}>
          <Icon name="lock" size={16} colour={colour.textTertiary} />
        </View>
        <Meta tone="secondary" style={{ flex: 1 }}>
          Asking cannot move money. Nothing can leave your account because somebody was asked to pay into it.
        </Meta>
      </View>
      {picking ? (
        <Sheet onDismiss={() => setPicking(false)} testID="pick-person">
          <Head>Who should I ask?</Head>
          <Meta tone="secondary" style={{ marginTop: 8 }}>
            People who have paid you before. Somebody else: type their name and number in the bar.
          </Meta>
          <View style={{ marginTop: 12 }}>
            {PAYERS.map((p, i) => (
              <Tap
                key={p.phone}
                accessibilityRole="button"
                accessibilityLabel={p.name}
                onPress={() => {
                  setWho(p);
                  setPicking(false);
                  say({ who: 'beetle', text: lineFor(p, amount) });
                }}
                style={[s.person, i ? s.hairTop : null]}
              >
                <Avatar initials={initialsOf(p.name)} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Row>{p.name}</Row>
                  <Meta tone="secondary">{`${p.note.charAt(0).toUpperCase() + p.note.slice(1)} · line ending ${lineEnding(p.phone)}`}</Meta>
                </View>
                <Icon name="chevron" size={16} colour={colour.textTertiary} />
              </Tap>
            ))}
          </View>
        </Sheet>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { height: 44, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 47, borderRadius: 24, backgroundColor: colour.ink, paddingLeft: 16, paddingRight: 19 },
  send: { height: 52, borderRadius: 26, backgroundColor: colour.ink, alignItems: 'center', justifyContent: 'center' },
  sendOff: { backgroundColor: colour.surface2 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
});
