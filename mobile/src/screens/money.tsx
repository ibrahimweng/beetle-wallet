/* Sending money — the ways in that are not the voice sheet, and the form the
   transfer is checked on before it goes.

   Built from frames 209:2 (the camera), 209:209 (typed), 332:9851 (the send
   form), 301:9464 (which account it leaves) and 301:9565 (leaving in
   dollars). The form opens a sheet to change one part at a time, which is
   what the file draws; it never sends you to a screen that is not in it. */
import React, { useState } from 'react';
import { View } from 'react-native';
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
  Slip,
  BottomBar,
  Screen,
  TypeOver,
  Sheet,
  SlideToSend,
  Tick,
  TypedLine,
  colour,
  naira,
  nairaFull,
  space,
  toast,
  Badge,
  Tap,
} from '../design';
import { Nav, asked } from './nav';
import { still } from './send';
import { check, useDraft, useForm, useStore, Person } from '../state/live';
import { contacts, me, transfer, dollarSend } from '../state/data.js';
import { dollarsInNaira } from '../state/store.js';
import * as act from '../state/actions.js';
import { start } from '../state/flow.js';
import { Home } from './home';

const PEOPLE: Person[] = [contacts.sarah, contacts.musa, contacts.chidi, contacts.john];

/* ---- pointing a camera at an account number ---- */

export const Scan = ({ nav }: { nav: Nav }) => (
  <CameraScreen
    title="Point at an account number"
    sub="A QR code works too. So does a screenshot."
    foot="Or send a screenshot straight to Beetle from WhatsApp."
    onClose={nav.back}
    onShutter={() => {
      start({
        to: contacts.sarah,
        amount: 20000,
        narration: 'Rent part payment',
        spoken: 'the account in the photo',
      });
      nav.go('chat');
    }}
    read={
      <ReadCard
        who="Musa · Agent"
        when="2:14 PM"
        kind="Good afternoon sir. Rent part payment:"
        lines={[naira(20000), contacts.sarah.bank, contacts.sarah.account]}
        unsure="Sarah A."
      />
    }
  >
    {/* what it took the number to be, on a dark pill with a green tick */}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2d2d2f',
        borderRadius: 999,
        paddingLeft: 8,
        paddingRight: 18,
        paddingVertical: 7,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colour.good,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={13} colour={colour.textInverse} />
      </View>
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
      /* the Draft frame is this same screen a moment later, with the three
         things it has made of the line sitting over the keyboard */
      nav.go('draft');
      return;
    }
    if (k === 'del') return setText(t => t.slice(0, -1));
    if (k === 'shift' || k === '123') return;
    setText(t => t + k);
  };
  return <TypeOver behind={<Home nav={still} />} value={text} onKey={key} onSend={() => key('send')} />;
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
  /* A cap is not a wall. The Spending limits frame says ₦36,000 is left
     "before I stop and ask you twice", and asking twice is what limitstop is:
     your passcode, then the words typed out in full. So past a cap the slide
     is still there and leads through that screen. Only money that is not in
     the account stops it. */
  const past = !verdict.ok && (verdict.code === 'day-limit' || verdict.code === 'transfer-limit');
  const canSend = verdict.ok || past;
  const close = () => setEditing(null);

  /* The frame stacks the three things it filled in as white cards inside one
     grey block, each with a chevron, and hangs the slide off the dock rather
     than putting it at the end of the column. */
  const form = (
    <Screen
      dock={
        <BottomBar onBack={() => nav.go('home')}>
          {canSend ? (
            <SlideToSend
              label={`Slide to send ${naira(d.amount)}`}
              onDone={() => nav.go(past ? 'limitstop' : 'confirm')}
            />
          ) : verdict.code === 'short' ? (
            <Button label="See how to close it" tone="grey" onPress={() => nav.go('short')} />
          ) : (
            <Button label="Put an amount in" tone="grey" onPress={() => setEditing('amount')} />
          )}
        </BottomBar>
      }
    >
      <PageHead lead title="Send money" sub={`To ${d.to.name}`} />
      <View style={{ gap: 4 }}>
        <Caption tone="secondary">You said</Caption>
        <Tap accessibilityRole="button" onPress={() => nav.go('ask')}>
          <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
            {d.spoken || `send ${d.to.name.split(' ')[0]} ${Math.round(d.amount / 1000)}k`}
          </Meta>
        </Tap>
      </View>
      <Bubble>Here it is, ready to go. Check the three parts I filled in.</Bubble>

      <Card style={{ gap: space.s2, paddingVertical: space.s3, paddingHorizontal: space.s3 }}>
        <Slip onPress={() => setEditing('amount')}>
          <BigMoney amount={naira(d.amount)} note="I took this from your message" />
        </Slip>
        <Slip onPress={() => setEditing('to')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Avatar initials={d.to.initials} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row>{d.to.name}</Row>
              <Meta tone="secondary">
                {d.to.bank} · {d.to.account}
              </Meta>
            </View>
            <Icon name="chevron" size={18} colour={colour.textTertiary} />
          </View>
          {d.to.note ? <Caption tone="tertiary">{d.to.note}</Caption> : null}
        </Slip>
        <Slip onPress={() => setEditing('why')}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Meta tone="secondary" style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>
              Reference
            </Meta>
            <Row>{d.narration || 'None'}</Row>
          </View>
          <Caption tone="tertiary">I took this from your message</Caption>
        </Slip>
        <View style={{ paddingHorizontal: space.s3, gap: space.s3, paddingVertical: space.s3 }}>
          <EditRow
            label="From"
            value={d.from === 'dollars' ? 'Dollars' : `Everyday · ${naira(s.everyday).replace('.00', '')}`}
            onPress={() => setEditing('from')}
          />
          <Between label="Arrives" value="In a few seconds" />
          <Between label="Fee" value={fee ? nairaFull(fee) : 'Free'} tone={fee ? 'ink' : 'good'} />
        </View>
      </Card>

      {canSend ? <Aside>Nothing moves until you slide.</Aside> : <Banner text={verdict.why} />}
      {past ? <Aside glyph="key">This is your limit, not the bank’s. Two things and it goes.</Aside> : null}

      <Ghost label="How I decided" onPress={() => nav.go('checking')} />
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
    <Tap
      accessibilityRole="button"
      accessibilityState={{ selected: d.from === id }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}
    >
      <Icon name={glyph} size={20} />
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{title}</Row>
        <Meta tone="secondary">{sub}</Meta>
      </View>
      <Tick on={d.from === id} />
    </Tap>
  );
  return (
    <Sheet onClose={() => nav.go('pay')} behind={<Pay nav={still} />}>
      <View style={{ alignItems: 'flex-start' }}>
        <Badge glyph="send" size={44} />
      </View>
      <View style={{ gap: 4 }}>
        <Head>Pay from</Head>
        <Meta tone="tertiary">Two places the money can leave</Meta>
      </View>
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
      <Bubble>
        Sarah is paid in naira either way. From dollars I convert at the rate on the next screen, and you see
        it before anything moves.
      </Bubble>
      <Button label="Done" tone="grey" onPress={() => nav.go('pay')} />
    </Sheet>
  );
};

/* ---- leaving in dollars ---- */

export const PayDollars = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const [d, setDraft] = useForm();
  const inDollars = +(d.amount / s.rate).toFixed(2);
  const enough = s.dollars >= inDollars;
  return (
    <Screen
      dock={
        <BottomBar onBack={() => nav.go('payfrom')}>
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
        </BottomBar>
      }
    >
      <PageHead lead title="Send money" sub={`To ${d.to.name}`} />
      <View style={{ gap: 4 }}>
        <Caption tone="secondary">You said</Caption>
        <Meta tone="secondary" style={{ fontSize: 16, lineHeight: 24 }}>
          {dollarSend.spoken}
        </Meta>
      </View>
      <Bubble>Here it is, ready to go. Check the three parts I filled in.</Bubble>
      <Card style={{ gap: space.s2, paddingVertical: space.s3, paddingHorizontal: space.s3 }}>
        <Slip>
          <BigMoney
            amount={naira(d.amount)}
            note={`About $${inDollars.toFixed(2)} from your dollars, at ₦${s.rate.toLocaleString('en-NG')} to $1`}
          />
        </Slip>
        <Slip>
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
        </Slip>
        <Slip>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Meta tone="secondary" style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>
              Reference
            </Meta>
            <Row>{d.narration || dollarSend.reference}</Row>
          </View>
          <Caption tone="tertiary">I took this from your message</Caption>
        </Slip>
        <View style={{ paddingHorizontal: space.s3, gap: space.s3, paddingVertical: space.s3 }}>
          <Between label="From" value={`Dollars · $${s.dollars.toFixed(2)}`} />
          <Between label="Arrives" value="In a few seconds" />
          <Between label="Fee" value="Free" tone="good" />
        </View>
      </Card>
      <Aside glyph="clock">{dollarSend.holdNote}</Aside>
    </Screen>
  );
};

/* ---- the note only you see ---- */

/* The frame for this one is the home with the keyboard up and the three things
   it has already made of the line sitting over it: the amount, the person, and
   the account it would leave from. Nothing has been sent. */
export const DraftNote = ({ nav }: { nav: Nav }) => {
  const [d] = useDraft();
  const [text, setText] = useState('send sarah 20k');
  const key = (k: string) => {
    if (k === 'send') return nav.go('chat');
    if (k === 'del') return setText(t => t.slice(0, -1));
    if (k === 'shift' || k === '123') return;
    setText(t => t + k);
  };
  return (
    <TypeOver
      behind={<Home nav={still} />}
      value={text}
      chips={[nairaFull(d.amount), d.to.name, 'Everyday']}
      onKey={key}
      onSend={() => key('send')}
    />
  );
};

/* home is where the ask bar on these screens goes when nothing else fits */
export const askHere = asked;
export const whoAmI = me;
