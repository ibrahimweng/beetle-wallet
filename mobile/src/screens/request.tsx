/* Asking to be paid — the voice sheet, the typed way in, the message the
   agent writes for you to check, and what it looks like once it has gone.

   Frames 225:1551, 225:1928, 225:1606 and 239:8294. Asking never moves money
   on its own, which is the line the last frame ends on. */
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  AmountPad,
  Aside,
  Badge,
  Bubble,
  Button,
  Card,
  Caption,
  Chip,
  ChipRow,
  Display,
  Divider,
  EditRow,
  Head,
  Icon,
  Keyboard,
  Label,
  Meta,
  PageHead,
  Picker,
  Said,
  Screen,
  Sheet,
  TypedLine,
  colour,
  naira,
  nairaFull,
  space,
  toast,
} from '../design';
import { Nav, dock } from './nav';
import { Person } from '../state/live';
import { Wave } from './buy';
import { contacts, me } from '../state/data.js';
import * as act from '../state/actions.js';

const PEOPLE: Person[] = [contacts.musa, contacts.sarah, contacts.chidi, contacts.john];

/* The request being written. It survives leaving the screen, because the
   sent screen reads the same one. */
let req = {
  who: contacts.musa as Person,
  amount: 20000,
  why: 'Rent balance',
  ref: null as string | null,
};

export const AskReq = ({ nav }: { nav: Nav }) => (
  <Sheet onClose={nav.back}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name="mark" size={20} colour={colour.accent} />
      <Label tone="accent">Listening</Label>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <Head style={{ fontSize: 32, lineHeight: 40 }}>Ask Musa for </Head>
      <Head style={{ fontSize: 32, lineHeight: 40, color: colour.textTertiary }}>20k</Head>
    </View>
    <Wave seed={41} />
    <Meta tone="tertiary">Or try one of these</Meta>
    <View style={{ gap: space.s2 }}>
      {['Who owes me money?', 'Show my code', 'Remind Musa again'].map(t => (
        <Button key={t} label={t} tone="grey" size={48} onPress={() => nav.go('request')} />
      ))}
    </View>
    <Button label="Release to send" tone="blue" onPress={() => nav.go('request')} />
    <Button label="Not what I said" tone="white" onPress={() => nav.go('typedask')} />
  </Sheet>
);

export const TypedAsk = ({ nav }: { nav: Nav }) => {
  const [text, setText] = useState('ask musa for 20k');
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 72, gap: space.s3 }}>
        <Said>ask musa for 20k</Said>
        <TypedLine value={text} placeholder="ask musa for 20k" />
        <ChipRow>
          <Chip label={naira(20000)} on />
          <Chip label="Musa Danjuma" on />
        </ChipRow>
      </View>
      <Keyboard
        action="ask"
        onKey={k => {
          if (k === 'ask') return nav.go('request');
          if (k === 'del') return setText(t => t.slice(0, -1));
          if (k === 'shift' || k === '123') return;
          setText(t => t + k);
        }}
      />
    </View>
  );
};

type Editing = null | 'who' | 'amount' | 'why';

export const Request = ({ nav }: { nav: Nav }) => {
  const [, tick] = useState(0);
  const [editing, setEditing] = useState<Editing>(null);
  const [why, setWhy] = useState(req.why);
  const redraw = () => tick(n => n + 1);
  const close = () => setEditing(null);
  const first = req.who.name.split(' ')[0] ?? req.who.name;

  const base = (
    <Screen dock={dock('Ask about requests', nav, 'home')}>
      <PageHead title="Ask to be paid" sub="What they see, before it goes" />
      <Card style={{ gap: space.s3 }}>
        <EditRow
          label="Who"
          value={req.who.name}
          sub={`${req.who.bank} · ${req.who.account}`}
          onPress={() => setEditing('who')}
        />
        <Divider />
        <EditRow label="How much" value={nairaFull(req.amount)} onPress={() => setEditing('amount')} />
        <Divider />
        <EditRow label="What for" value={req.why} onPress={() => setEditing('why')} />
      </Card>
      <Bubble>
        I write it, you check it. It goes as a message with a button in it, so they pay in one tap without
        typing your account number.
      </Bubble>
      <View style={{ gap: space.s2 }}>
        <Label>{`What ${first} gets`}</Label>
        <Bubble>
          {`${me.name.split(' ')[0]} is asking you for ${naira(req.amount)} for ${req.why.toLowerCase()}. Tap to pay.`}
        </Bubble>
      </View>
      <Button
        label="Send the request"
        onPress={() => {
          req.ref =
            'REQ ' +
            Math.floor(1e12 + Math.random() * 8e12)
              .toString()
              .replace(/(\d{4})(?=\d)/g, '$1 ')
              .trim();
          nav.go('sent');
        }}
      />
      <Aside>
        Asking cannot move money. Nothing can leave your account because somebody was asked to pay into it.
      </Aside>
    </Screen>
  );

  if (editing === 'who')
    return (
      <Sheet onClose={close} behind={base}>
        <Head>Who are you asking?</Head>
        <Picker
          value={req.who.account}
          options={PEOPLE.map(c => ({ id: c.account, label: c.name, sub: `${c.bank} · ${c.account}` }))}
          onChange={id => {
            req.who = PEOPLE.find(c => c.account === id) ?? req.who;
            close();
            redraw();
          }}
        />
        <Button label="Close" tone="grey" onPress={close} />
      </Sheet>
    );

  if (editing === 'amount')
    return (
      <Sheet onClose={close} behind={base}>
        <Head>How much are you asking for?</Head>
        <AmountPad
          value={req.amount}
          onChange={v => {
            req.amount = v;
            redraw();
          }}
        />
        <Button label="Use this" onPress={close} />
      </Sheet>
    );

  if (editing === 'why')
    return (
      <View style={{ flex: 1, backgroundColor: colour.surface }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 72, gap: space.s3 }}>
          <Caption tone="secondary">What for</Caption>
          <TypedLine value={why} placeholder="What is it for?" />
          <Meta tone="tertiary">They see this word for word.</Meta>
        </View>
        <Keyboard
          action="done"
          onKey={k => {
            if (k === 'done') {
              req.why = why || req.why;
              close();
              redraw();
              return;
            }
            if (k === 'del') return setWhy(t => t.slice(0, -1));
            if (k === 'shift' || k === '123') return;
            setWhy(t => t + k);
          }}
        />
      </View>
    );

  return base;
};

export const Sent = ({ nav }: { nav: Nav }) => {
  const first = req.who.name.split(' ')[0] ?? req.who.name;
  return (
    <Screen dock={dock('Ask about this request', nav, 'home')}>
      <PageHead title="Request sent" sub={`${first} has it on WhatsApp and in a text`} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
        <Badge glyph="request" size={52} tone={colour.good} ink={colour.textInverse} />
        <View style={{ gap: 4 }}>
          <Display>{naira(req.amount)}</Display>
          <Meta tone="tertiary">{`Asked ${req.who.name}`}</Meta>
        </View>
      </View>
      <Card style={{ gap: space.s3 }}>
        <EditRow label="For" value={req.why} />
        <Divider />
        <EditRow label="Expires" value="In 7 days" />
        <Divider />
        <EditRow label="Reference" value={req.ref ?? 'REQ-40112-8873'} />
      </Card>
      <Bubble>I will tell you the moment it lands. You do not have to watch for it.</Bubble>
      <Bubble>Want me to remind him if nothing comes by Friday?</Bubble>
      <Button label="Set that up" tone="grey" onPress={() => toast('I will nudge him on Friday morning.')} />
      <Button
        label="Pretend they just paid"
        tone="grey"
        onPress={() => {
          act.receive({ from: req.who.name, amount: req.amount, detail: req.why });
          toast(`${naira(req.amount)} from ${first}. It is in your balance.`);
          nav.go('donein');
        }}
      />
      <Aside>
        That last button is here so you can see what happens next. In the real thing it is them, not you.
      </Aside>
    </Screen>
  );
};

/* the request the receipt screen reads */
export const currentRequest = () => req;
