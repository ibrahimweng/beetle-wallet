/* Asking someone for money: what you said (or what the camera read), then
   Beetle Requests at work on a light panel — the person, where it reaches
   them, the amount, what it is for, and when it lapses — with the word on
   who it found on the line under the panel (a form has no bubble from
   Beetle: see DESIGN.md), then the lock line that says asking cannot move
   money.
   Reached from "ask musa for 20k" at home, from a photo of the message,
   from Ask someone on the Receive sheet and Ask for money on Three ways.
   What is missing is asked for, and a tap on its row fills it where it is:
   the person from those who have paid before or somebody new, the amount
   on the picker (no cap: anyone can be asked for anything), what it is for
   in a word or two. Send the request sits in the foot beside Back.
   Sending files the request, and the page that says so takes its place. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AmountPicker, Avatar, Button, Head, Icon, Label, LightPanel, Meta, PageHead, Row, Screen, Sheet, Tap, YouTyped, colour, font } from '../../design';
import { phoneIn } from '../../services/nigeria';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { clock, useChats } from '../agent/chats';
import { turn } from '../agent/conversation';
import { LAB } from '../../lab/enabled';
import { groupPhone, initialsOf, naira } from '../../lib/format';
import { PAYERS, firstOf, lineEnding, objectOf, type Payer } from './people';
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
  const [said, setSaid] = useState<Said[]>(() => (demo ? [{ id: 1, who: 'you', text: demo.said, photo: !!demo.read }] : []));
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
      if (d.who !== undefined) setWho(d.who);
      if (d.amount !== undefined) setAmount(d.amount);
      if (d.note !== undefined) setNote(d.note);
      if (d.read) setRead(d.read);
      if (d.said) say({ who: 'you', text: d.said, photo: d.read === 'photo' });
    }, [say]),
  );

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

  /** the sheet up over the page: the amount, or what it is for */
  const [sheet, setSheet] = useState<null | 'amount' | 'for'>(null);
  const [pickAmount, setPickAmount] = useState(0);
  const [pickNote, setPickNote] = useState('');
  /** somebody new, typed into the person sheet */
  const [fresh, setFresh] = useState<{ open: boolean; name: string; number: string }>({ open: false, name: '', number: '' });
  const freshPhone = phoneIn(fresh.number);
  const askFresh = () => {
    if (!freshPhone) return;
    const name = fresh.name.trim().replace(/\b\w/g, c => c.toUpperCase()) || groupPhone(freshPhone);
    const p: Payer = { name, phone: freshPhone, pronoun: 'they', note: 'new' };
    setWho(p);
    setPicking(false);
    setFresh({ open: false, name: '', number: '' });
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

  const first = who ? firstOf(who.name) : '';
  /* the foot: Back, and Send the request beside it once there is someone, an amount and a date */
  useFoot({ kind: 'button', label: busy ? `Asking ${first}…` : 'Send the request', disabled: !dated || busy, onPress: send, veil: picking || sheet ? 'away' : undefined });
  if (!ok || !account) return null;
  const status = busy ? 'Sending' : !complete ? 'Waiting' : dated ? 'Ready' : 'Running';
  const yours = [...said].reverse().find(t => t.who === 'you');
  return (
    <Screen head={<PageHead lead title="Request money" sub="They get it on WhatsApp and by text" />}>
      {yours ? <YouTyped said={yours.text} /> : null}
      <View style={{ gap: 12 }}>
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
            {
              label: 'Amount',
              value: amount ? naira(amount) : 'Pick it',
              done: amount > 0,
              onPress: () => {
                setPickAmount(amount);
                setSheet('amount');
              },
              chevron: true,
            },
            {
              label: 'For',
              value: note || 'Anything, or nothing',
              done: !!note,
              onPress: () => {
                setPickNote(note);
                setSheet('for');
              },
              chevron: !note,
            },
            { label: 'Expires', value: dated ? 'In 7 days' : 'Picking a date', done: dated, working: complete && !dated },
          ]}
        />
        {/* what the bubble used to say, under the panel it is about */}
        <Meta tone="secondary" style={{ paddingHorizontal: 4 }} testID="request-note">
          {lineFor(who, amount)}
        </Meta>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }} testID="lock-line">
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
            People who have paid you before, or somebody new.
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
            {fresh.open ? (
              <View style={[s.fresh, s.hairTop]} testID="someone-new">
                <TextInput
                  value={fresh.name}
                  onChangeText={v => setFresh(f => ({ ...f, name: v }))}
                  placeholder="Their name"
                  placeholderTextColor={colour.textTertiary}
                  style={s.input}
                  accessibilityLabel="Their name"
                  autoFocus
                />
                <TextInput
                  value={fresh.number}
                  onChangeText={v => setFresh(f => ({ ...f, number: v }))}
                  placeholder="Their phone number"
                  placeholderTextColor={colour.textTertiary}
                  keyboardType="phone-pad"
                  style={s.input}
                  accessibilityLabel="Their phone number"
                />
                <Button label={fresh.name.trim() ? `Ask ${firstOf(fresh.name.trim())}` : 'Ask them'} size={48} disabled={!freshPhone} onPress={askFresh} />
              </View>
            ) : (
              <Tap accessibilityRole="button" accessibilityLabel="Somebody new" onPress={() => setFresh(f => ({ ...f, open: true }))} style={[s.person, s.hairTop]}>
                <View style={s.plusDisc}>
                  <Icon name="plus" size={18} colour={colour.ink} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row>Somebody new</Row>
                  <Meta tone="secondary">A name and a phone number</Meta>
                </View>
                <Icon name="chevron" size={16} colour={colour.textTertiary} />
              </Tap>
            )}
          </View>
        </Sheet>
      ) : null}
      {sheet === 'amount' ? (
        <Sheet onDismiss={() => setSheet(null)} testID="pick-amount">
          <Head>{who ? `How much should ${firstOf(who.name)} pay?` : 'How much?'}</Head>
          <Meta tone="secondary" style={{ marginTop: 8 }}>
            Ask for anything. They choose whether to pay.
          </Meta>
          <View style={{ marginTop: 20 }}>
            <AmountPicker value={pickAmount} onChange={setPickAmount} chips={[5_000, 10_000, 20_000, 50_000]} />
          </View>
          <View style={{ marginTop: 20 }}>
            <Button
              label={pickAmount ? `Ask for ${naira(pickAmount)}` : 'Ask for it'}
              disabled={!pickAmount}
              onPress={() => {
                setAmount(pickAmount);
                setSheet(null);
              }}
            />
          </View>
        </Sheet>
      ) : null}
      {sheet === 'for' ? (
        <Sheet onDismiss={() => setSheet(null)} testID="pick-note">
          <Head>What is it for?</Head>
          <Meta tone="secondary" style={{ marginTop: 8 }}>
            {who ? `${firstOf(who.name)} sees it with the request.` : 'They see it with the request.'}
          </Meta>
          <TextInput
            value={pickNote}
            onChangeText={setPickNote}
            placeholder="Rent balance, lunch, the tickets…"
            placeholderTextColor={colour.textTertiary}
            style={[s.input, { marginTop: 16 }]}
            accessibilityLabel="What it is for"
            autoFocus
          />
          <View style={s.notes}>
            {['Rent balance', 'Lunch', 'Transport', 'What you owe me'].map(n => (
              <Tap key={n} accessibilityRole="button" accessibilityLabel={n} onPress={() => setPickNote(n)} style={[s.note, pickNote === n ? s.noteOn : null]}>
                <Label tone={pickNote === n ? 'inverse' : 'ink'}>{n}</Label>
              </Tap>
            ))}
          </View>
          <View style={{ marginTop: 20 }}>
            <Button
              label="Done"
              onPress={() => {
                setNote(pickNote.trim());
                setSheet(null);
              }}
            />
          </View>
        </Sheet>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  plusDisc: { width: 40, height: 40, borderRadius: 20, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  fresh: { gap: 12, paddingTop: 16 },
  input: { height: 48, borderRadius: 16, backgroundColor: colour.surface2, paddingHorizontal: 16, fontSize: 16, ...font('400'), color: colour.ink, outlineWidth: 0 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  note: { height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  noteOn: { backgroundColor: colour.ink },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
});
