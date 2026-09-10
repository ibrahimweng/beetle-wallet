/* Sending money — the ways in that are not the voice sheet, and the form the
   transfer is checked on before it goes.

   Built from frames 209:2 (the camera), 209:209 (typed), 332:9851 (the send
   form), 301:9464 (which account it leaves) and 301:9565 (leaving in
   dollars). The form opens a sheet to change one part at a time, which is
   what the file draws; it never sends you to a screen that is not in it. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  AmountPad,
  Aside,
  Avatar,
  Between,
  Banner,
  BigMoney,
  Bubble,
  Button,
  Card,
  Caption,
  Chip,
  ChipRow,
  CameraScreen,
  Divider,
  EditRow,
  Ghost,
  Head,
  Icon,
  Keyboard,
  Label,
  Meta,
  PageHead,
  Picker,
  ReadCard,
  Row,
  Said,
  Screen,
  Sheet,
  SlideToSend,
  Tick,
  TypedLine,
  colour,
  naira,
  nairaFull,
  space,
  toast,
} from '../design';
import { Nav, asked, dock } from './nav';
import { check, useDraft, useForm, useStore, Person } from '../state/live';
import { contacts, me, transfer, dollarSend } from '../state/data.js';
import { dollarsInNaira } from '../state/store.js';
import * as act from '../state/actions.js';
import { start } from '../state/flow.js';

const PEOPLE: Person[] = [contacts.sarah, contacts.musa, contacts.chidi, contacts.john];

/* ---- pointing a camera at an account number ---- */

export const Scan = ({ nav }: { nav: Nav }) => (
  <CameraScreen
    title="Point at an account number"
    sub="A QR code works too. So does a screenshot."
    foot="Or send a screenshot straight to Beetle from WhatsApp."
    onShutter={() => {
      start({
        to: contacts.sarah,
        amount: 20000,
        narration: 'Rent part payment',
        spoken: 'the account in the photo',
      });
      nav.go('chat');
    }}
  >
    <ReadCard
      who="Musa · Agent"
      when="2:14 PM"
      kind="Good afternoon sir. Rent part payment:"
      lines={[naira(20000), contacts.sarah.bank, contacts.sarah.account]}
      unsure="Sarah A."
    />
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colour.good,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Icon name="check" size={16} colour={colour.textInverse} />
      <Label tone="inverse">{contacts.sarah.account}</Label>
    </View>
  </CameraScreen>
);

/* ---- typing it ---- */

/* The shorthand people actually use: a name it knows and an amount, with k
   and m for thousands and millions. What it worked out shows as chips before
   anything is sent, so nothing is guessed silently. */
export const read = (text: string) => {
  const t = text.toLowerCase();
  const who = PEOPLE.find(c => t.includes((c.name.split(' ')[0] ?? '').toLowerCase()));
  const m = t.match(/(\d+(?:\.\d+)?)\s*([km])?/);
  let amount: number | null = null;
  if (m && m[1]) {
    amount = Number(m[1]);
    if (m[2] === 'k') amount *= 1000;
    if (m[2] === 'm') amount *= 1000000;
  }
  return { who, amount };
};

export const Typed = ({ nav }: { nav: Nav }) => {
  const [text, setText] = useState('send sarah 20k');
  const { who, amount } = read(text);
  const key = (k: string) => {
    if (k === 'send') {
      if (!who || !amount) {
        toast('I need a name I know and an amount.');
        return;
      }
      start({ to: who, amount, narration: transfer.narration, spoken: text });
      nav.go('chat');
      return;
    }
    if (k === 'del') return setText(t => t.slice(0, -1));
    if (k === 'shift' || k === '123') return;
    setText(t => t + k);
  };
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 72, gap: space.s3 }}>
        <Said>send sarah 20k</Said>
        <TypedLine value={text} placeholder="send sarah 20k" />
        <ChipRow>
          {amount ? <Chip key="a" label={naira(amount)} on /> : null}
          {who ? <Chip key="w" label={who.name} on /> : null}
          {amount || who ? <Chip key="f" label="Everyday" on /> : null}
          {!amount && !who ? (
            <Caption key="n" tone="tertiary">
              A name and an amount is all I need.
            </Caption>
          ) : null}
        </ChipRow>
        <Meta tone="tertiary">Try: send chidi 5k, or john 250</Meta>
      </View>
      <Keyboard onKey={key} />
    </View>
  );
};

/* ---- the form ---- */

type Editing = null | 'amount' | 'to' | 'from' | 'why';

export const Pay = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [d, setDraft] = useForm();
  const [editing, setEditing] = useState<Editing>(null);
  const [why, setWhy] = useState(d.narration);
  const verdict = check({ amount: d.amount, from: d.from });
  const fee = act.feeFor(d.amount);
  const close = () => setEditing(null);

  const form = (
    <Screen dock={dock('Ask about this transfer', nav, 'home')}>
      <PageHead lead title="Send money" sub={`To ${d.to.name}`} />
      <Caption tone="secondary">You said</Caption>
      <Said onPress={() => nav.go('ask')}>
        {d.spoken || `send ${d.to.name.split(' ')[0]} ${Math.round(d.amount / 1000)}k`}
      </Said>
      <Bubble>Here it is, ready to go. Check the three parts I filled in.</Bubble>

      <BigMoney
        amount={naira(d.amount)}
        change="Change"
        note="I took this from your message"
        onPress={() => setEditing('amount')}
      />

      <Pressable accessibilityRole="button" onPress={() => setEditing('to')}>
        <Card style={{ gap: space.s3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Avatar initials={d.to.initials} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{d.to.name}</Row>
              <Meta tone="secondary">
                {d.to.bank} · {d.to.account}
              </Meta>
            </View>
            <Label tone="accent">Change</Label>
          </View>
          {d.to.note ? <Caption tone="tertiary">{d.to.note}</Caption> : null}
        </Card>
      </Pressable>

      <Card style={{ gap: space.s3 }}>
        <EditRow
          label="Reference"
          value={d.narration || 'None'}
          sub="I took this from your message"
          onPress={() => setEditing('why')}
        />
        <Divider />
        <EditRow
          label="From"
          value={d.from === 'dollars' ? 'Dollars' : 'Everyday'}
          sub={d.from === 'dollars' ? `$${s.dollars.toFixed(2)} held` : `Everyday · ${naira(s.everyday)}`}
          onPress={() => setEditing('from')}
        />
        <Divider />
        <EditRow label="Note to yourself" value="Only you will see it" onPress={() => nav.go('draft')} />
        <Divider />
        <Between label="Arrives" value="In a few seconds" />
        <Divider />
        <Between label="Fee" value={fee ? nairaFull(fee) : 'Free'} tone={fee ? 'ink' : 'good'} />
      </Card>

      {verdict.ok ? <Aside>Nothing moves until you slide.</Aside> : <Banner text={verdict.why} />}

      <Ghost label="How I decided" onPress={() => nav.go('checking')} />

      {verdict.ok ? (
        <SlideToSend label={`Slide to send ${naira(d.amount)}`} onDone={() => nav.go('confirm')} />
      ) : verdict.code === 'short' ? (
        <Button label="See how to close it" tone="grey" onPress={() => nav.go('short')} />
      ) : verdict.code === 'day-limit' || verdict.code === 'transfer-limit' ? (
        <Button label="Why I stopped" tone="grey" onPress={() => nav.go('limitstop')} />
      ) : (
        <Button label="Put an amount in" tone="grey" onPress={() => setEditing('amount')} />
      )}
    </Screen>
  );

  if (editing === 'amount')
    return (
      <Sheet onClose={close} behind={form}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Head>How much?</Head>
          <Meta tone="tertiary">{naira(s.everyday)} in Everyday</Meta>
        </View>
        <AmountPad value={d.amount} onChange={v => setDraft({ amount: v })} />
        <Button label="Use this amount" onPress={close} />
      </Sheet>
    );

  if (editing === 'to')
    return (
      <Sheet onClose={close} behind={form}>
        <Head>Who is it going to?</Head>
        <Picker
          value={d.to.account}
          options={PEOPLE.map(c => ({ id: c.account, label: c.name, sub: `${c.bank} · ${c.account}` }))}
          onChange={id => {
            const p = PEOPLE.find(c => c.account === id);
            if (p) setDraft({ to: p });
            close();
          }}
        />
        <Button label="Close" tone="grey" onPress={close} />
      </Sheet>
    );

  if (editing === 'from')
    return (
      <Sheet onClose={close} behind={form}>
        <Head>Pay from which one?</Head>
        <Picker
          value={d.from}
          options={[
            { id: 'everyday', label: 'Everyday', sub: `${naira(s.everyday)} in naira` },
            {
              id: 'dollars',
              label: 'Dollars',
              sub: `$${s.dollars.toFixed(2)}, about ${naira(dollarsInNaira())}`,
            },
          ]}
          onChange={id => {
            setDraft({ from: id as 'everyday' | 'dollars' });
            close();
          }}
        />
        <Button label="Close" tone="grey" onPress={close} />
      </Sheet>
    );

  if (editing === 'why')
    return (
      <View style={{ flex: 1, backgroundColor: colour.surface }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 72, gap: space.s3 }}>
          <Caption tone="secondary">Reference</Caption>
          <TypedLine value={why} placeholder="What is it for?" />
          <Meta tone="tertiary">Both of you see this on the receipt.</Meta>
        </View>
        <Keyboard
          action="done"
          onKey={k => {
            if (k === 'done') {
              setDraft({ narration: why });
              close();
              return;
            }
            if (k === 'del') return setWhy(t => t.slice(0, -1));
            if (k === 'shift' || k === '123') return;
            setWhy(t => t + k);
          }}
        />
      </View>
    );

  return form;
};

/* ---- which account it leaves ---- */

export const PayFrom = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [d, setDraft] = useForm();
  const way = (
    id: 'everyday' | 'dollars',
    glyph: 'bank' | 'dollar',
    title: string,
    sub: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s3,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={glyph} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Tick on={d.from === id} />
    </Pressable>
  );
  return (
    <Screen dock={dock('Ask where it should come from', nav, 'pay')}>
      <Caption tone="secondary">You said</Caption>
      <Said>{dollarSend.spoken}</Said>
      <BigMoney amount={naira(d.amount)} note="I took this from your message" />
      <Card style={{ gap: space.s3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <Avatar initials={d.to.initials} />
          <View style={{ flex: 1, gap: 2 }}>
            <Row>{d.to.name}</Row>
            <Meta tone="secondary">
              {d.to.bank} · {d.to.account}
            </Meta>
          </View>
        </View>
        {d.to.note ? <Caption tone="tertiary">{d.to.note}</Caption> : null}
      </Card>
      <View style={{ gap: 4 }}>
        <Head>Pay from</Head>
        <Caption tone="tertiary">Two places the money can leave</Caption>
      </View>
      <Card style={{ gap: space.s3 }}>
        {way('everyday', 'bank', 'Everyday', `${naira(s.everyday)} in naira`, () =>
          setDraft({ from: 'everyday' }),
        )}
        <Divider />
        {way(
          'dollars',
          'dollar',
          'Dollars',
          `$${s.dollars.toFixed(2)}, about ${naira(dollarsInNaira())} today`,
          () => {
            setDraft({ from: 'dollars' });
            nav.go('paydollars');
          },
        )}
      </Card>
      <Card style={{ gap: space.s3 }}>
        <EditRow
          label="Reference"
          value={d.narration || dollarSend.reference}
          sub="I took this from your message"
        />
        <Divider />
        <Between
          label="From"
          value={
            d.from === 'dollars' ? `Dollars · $${s.dollars.toFixed(2)}` : `Everyday · ${naira(s.everyday)}`
          }
        />
        <Divider />
        <Between label="Arrives" value="In a few seconds" />
        <Divider />
        <Between label="Fee" value="Free" tone="good" />
      </Card>
      <Aside>Nothing moves until you slide.</Aside>
      <SlideToSend
        label={`Slide to send ${naira(d.amount)}`}
        onDone={() => nav.go(d.from === 'dollars' ? 'paydollars' : 'confirm')}
      />
    </Screen>
  );
};

/* ---- leaving in dollars ---- */

export const PayDollars = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [d, setDraft] = useForm();
  const inDollars = +(d.amount / s.rate).toFixed(2);
  const enough = s.dollars >= inDollars;
  return (
    <Screen dock={dock('Ask about the rate', nav, 'payfrom')}>
      <PageHead lead title="Send money" sub={`To ${d.to.name}`} />
      <Caption tone="secondary">You said</Caption>
      <Said>{dollarSend.spoken}</Said>
      <Bubble>Here it is, ready to go. Check the three parts I filled in.</Bubble>
      <Card style={{ gap: space.s3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <Avatar initials={d.to.initials} />
          <View style={{ flex: 1, gap: 2 }}>
            <Row>{d.to.name}</Row>
            <Meta tone="secondary">
              {d.to.bank} · {d.to.account}
            </Meta>
          </View>
        </View>
        {d.to.note ? <Caption tone="tertiary">{d.to.note}</Caption> : null}
      </Card>
      <BigMoney
        amount={naira(d.amount)}
        note={`About $${inDollars.toFixed(2)} from your dollars, at ₦${s.rate.toLocaleString('en-NG')} to $1`}
      />
      <Card style={{ gap: space.s3 }}>
        <EditRow label="To" value={d.to.name} sub={`${d.to.bank} · ${d.to.account}`} />
        <Divider />
        <EditRow
          label="Reference"
          value={d.narration || dollarSend.reference}
          sub="I took this from your message"
        />
        <Divider />
        <EditRow label="From" value={`Dollars · $${s.dollars.toFixed(2)}`} />
        <Divider />
        <Between label="Arrives" value="In a few seconds" />
        <Divider />
        <Between label="Fee" value="Free" tone="good" />
      </Card>
      <Aside glyph="clock">{dollarSend.holdNote}</Aside>
      {enough ? (
        <SlideToSend
          label={`Slide to send ${naira(d.amount)}`}
          onDone={() => {
            setDraft({ from: 'dollars' });
            nav.go('confirm');
          }}
        />
      ) : (
        <Banner text={`You hold $${s.dollars.toFixed(2)}, and this needs $${inDollars.toFixed(2)}.`} />
      )}
    </Screen>
  );
};

/* ---- the note only you see ---- */

export const DraftNote = ({ nav }: { nav: Nav }) => {
  const [d] = useDraft();
  const [note, setNote] = useState('Rent, second half. Ask about the receipt for the first.');
  const [writing, setWriting] = useState(false);
  if (writing)
    return (
      <View style={{ flex: 1, backgroundColor: colour.surface }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 72, gap: space.s3 }}>
          <Caption tone="secondary">Note to yourself</Caption>
          <TypedLine value={note} placeholder="What is this one really for?" />
          <Meta tone="tertiary">Only you ever see this.</Meta>
        </View>
        <Keyboard
          action="done"
          onKey={k => {
            if (k === 'done') return setWriting(false);
            if (k === 'del') return setNote(t => t.slice(0, -1));
            if (k === 'shift' || k === '123') return;
            setNote(t => t + k);
          }}
        />
      </View>
    );
  return (
    <Screen dock={dock('Ask about notes', nav, 'actions')}>
      <PageHead title="Before it goes" sub="A note only you will see" />
      <Card style={{ gap: space.s3 }}>
        <EditRow label="What" value={naira(d.amount)} sub={d.to.name} />
        <Divider />
        <EditRow label="From" value="Everyday" />
        <Divider />
        <EditRow label="Note to yourself" value={note} onPress={() => setWriting(true)} />
      </Card>
      <Bubble>
        I keep this against the payment in your history. Nobody receiving the money ever sees it.
      </Bubble>
      <Button
        label="Save and send"
        onPress={() => {
          toast('Kept against this payment.');
          nav.go('confirm');
        }}
      />
      <Ghost label="Just send it" onPress={() => nav.go('confirm')} />
    </Screen>
  );
};

/* home is where the ask bar on these screens goes when nothing else fits */
export const askHere = asked;
export const whoAmI = me;
