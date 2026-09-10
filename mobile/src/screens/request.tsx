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
  Display,
  Divider,
  EditRow,
  Head,
  Icon,
  Keyboard,
  Meta,
  PageHead,
  Picker,
  Said,
  Dock,
  SendButton,
  Screen,
  TypeOver,
  Sheet,
  ToolPanel,
  TopBar,
  TypedLine,
  colour,
  naira,
  space,
  toast,
  VoiceSheet,
} from '../design';
import { Nav, asked, dock } from './nav';
import { still } from './send';
import { Home } from './home';
import { Person } from '../state/live';
import { contacts } from '../state/data.js';
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
  <VoiceSheet
    said="Ask Musa for "
    tail="20k"
    seed={41}
    offers={['Who owes me money?', 'Show my code', 'Remind Musa again']}
    onOffer={(t: string) => asked(nav, t)}
    onNotThis={() => nav.go('typedask')}
    onStop={() => nav.go('home')}
    onSend={() => nav.go('request')}
    onClose={nav.back}
    behind={<Home nav={still} />}
  />
);

export const TypedAsk = ({ nav }: { nav: Nav }) => {
  const [text, setText] = useState('ask musa for 20k');
  const key = (k: string) => {
    if (k === 'send') return nav.go('request');
    if (k === 'del') return setText(t => t.slice(0, -1));
    if (k === 'shift' || k === '123') return;
    setText(t => t + k);
  };
  return <TypeOver behind={<Home nav={still} />} value={text} onKey={key} onSend={() => key('send')} />;
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
    <Screen
      thread
      dock={
        <Dock
          placeholder="Reply, or just keep talking"
          onAsk={q => asked(nav, q)}
          action={<SendButton onPress={() => nav.go('sent')} />}
        />
      }
    >
      <TopBar title="Beetle" onBack={nav.back} />
      <Said>{`Ask ${first} for ${Math.round(req.amount / 1000)}k`}</Said>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: space.s2 }}>
          <Icon name="mark" size={32} colour={colour.accent} />
          <View style={{ flex: 1 }}>
            <Bubble>
              {`${req.who.name}, the line ending 4471. He is the only ${first} who has ever paid you.`}
            </Bubble>
          </View>
        </View>
        <ToolPanel
          tool="Beetle Requests"
          state="Running"
          rows={[
            { k: 'Person', v: req.who.name, go: () => setEditing('who') },
            { k: 'Reaches him', v: 'WhatsApp and SMS' },
            { k: 'Amount', v: naira(req.amount), go: () => setEditing('amount') },
            { k: 'For', v: req.why, go: () => setEditing('why') },
            { k: 'Expires', v: 'Picking a date', done: 'work' as const },
          ]}
        >
          {/* edge to edge inside the panel, the way the frame draws it */}
          <View style={{ paddingTop: 19, paddingBottom: 9 }}>
            <Button
              label="Send the request"
              size={48}
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
          </View>
        </ToolPanel>
      </View>
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
