/* Act Four, after the account is open — finishing the checks, the first day,
   and the two screens that have nothing in them yet.

   Frames 316:9491, 316:9538, and the frames for where your money comes from,
   everything on, the first home, the first question, and the two empties. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ActionRow,
  Aside,
  Avatar,
  Bubble,
  Button,
  Card,
  Caption,
  Chip,
  ChipRow,
  Dock,
  Display,
  Divider,
  Empty,
  Ghost,
  Head,
  Icon,
  Label,
  Meta,
  PageHead,
  Picker,
  Row,
  Screen,
  Shortcuts,
  StatusPill,
  StepTrail,
  Tick,
  Tile,
  TrailStep,
  colour,
  naira,
  space,
  toast,
} from '../design';
import { Nav, dock } from './nav';
import { answer } from '../state/agent';
import { goal, me, onboarding } from '../state/data.js';

const WHERE: TrailStep = { icon: 'home-filled', label: 'Where you live' };
const ID: TrailStep = { icon: 'id-filled', label: 'A photo of an ID' };
const INCOME: TrailStep = { icon: 'chart', label: 'Where your money comes from' };

const OPENS = ['Send up to ₦1,000,000 a day', 'Hold dollars', 'Borrow against your history'];

/* ---- finishing the checks ---- */

export const Finish = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask what this unlocks', nav, 'ready')}>
    <PageHead
      title="Where you live"
      sub="Street, town and state. No utility bill, and nothing arrives in the post."
    />
    <Card style={{ gap: 4 }}>
      <Row>12 Bode Thomas Street</Row>
      <Row tone="tertiary">Surulere, Lagos State</Row>
    </Card>
    <View style={{ gap: 4 }}>
      <Head style={{ fontSize: 32, lineHeight: 40, color: colour.textTertiary }}>A photo of an ID</Head>
      <Head style={{ fontSize: 32, lineHeight: 40, color: colour.textTertiary }}>
        Where your money comes from
      </Head>
    </View>
    <Head>What it opens</Head>
    <Card style={{ gap: space.s3 }}>
      {OPENS.map((t, i) => (
        <View key={t}>
          {i ? (
            <View style={{ paddingBottom: space.s3 }}>
              <Divider />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Icon name="check" size={18} />
            <Meta style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>{t}</Meta>
          </View>
        </View>
      ))}
    </Card>
    <Button label="Next" onPress={() => nav.go('idcard')} />
    <Aside>This is the same check every Nigerian bank runs. We ask once, and we do not sell it.</Aside>
  </Screen>
);

export const IdCard = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask what happens to the photo', nav, 'finish')}>
    <StepTrail done={[WHERE]} />
    <PageHead
      title="A photo of an ID"
      sub="A driver’s licence, a passport or a voter’s card. Any of the three will do."
    />
    <View style={{ alignItems: 'center', gap: space.s3 }}>
      <View
        style={{
          width: '100%',
          height: 190,
          borderRadius: 16,
          backgroundColor: colour.surface2,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colour.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="id" size={52} colour={colour.textTertiary} />
      </View>
      <Caption tone="secondary">Lay it flat and fill the frame</Caption>
    </View>
    <Button label="Use this photo" onPress={() => nav.go('income')} />
    <Aside>
      I read the name and the number off it and keep nothing else. The photo does not leave your phone.
    </Aside>
    <Head style={{ fontSize: 32, lineHeight: 40, color: colour.textTertiary }}>
      Where your money comes from
    </Head>
  </Screen>
);

export const Income = ({ nav }: { nav: Nav }) => {
  const [pick, setPick] = useState('salary');
  return (
    <Screen dock={dock('Ask why this is asked', nav, 'idcard')}>
      <StepTrail done={[WHERE, ID]} />
      <PageHead
        title="Where your money comes from"
        sub="One tap. It is the last question, and every bank has to ask it."
      />
      <Picker
        value={pick}
        options={[
          { id: 'salary', label: 'A salary' },
          { id: 'business', label: 'My own business' },
          { id: 'family', label: 'Family or friends' },
          { id: 'other', label: 'Something else' },
        ]}
        onChange={id => {
          setPick(id);
          nav.go('full');
        }}
      />
    </Screen>
  );
};

export const Full = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about my limits', nav, 'income')}>
    <StepTrail done={[WHERE, ID, INCOME]} />
    <PageHead title="Everything is on" sub="You can send a million naira a day and hold dollars now." />
    <Card style={{ gap: space.s3 }}>
      {OPENS.map((t, i) => (
        <View key={t}>
          {i ? (
            <View style={{ paddingBottom: space.s3 }}>
              <Divider />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Tick on />
            <Meta style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>{t}</Meta>
            <StatusPill label="New" tone={colour.good} />
          </View>
        </View>
      ))}
    </Card>
    <Head>Everything you could already do</Head>
    <Card style={{ gap: space.s3 }}>
      {(onboarding.ready as { t: string; on: boolean }[])
        .filter(r => r.on)
        .map((r, i) => (
          <View key={r.t}>
            {i ? (
              <View style={{ paddingBottom: space.s3 }}>
                <Divider />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
              <Tick on />
              <Meta style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>{r.t}</Meta>
            </View>
          </View>
        ))}
    </Card>
    <Button label="Go to my account" onPress={() => nav.go('firsthome')} />
  </Screen>
);

/* ---- the first day ---- */

export const FirstHome = ({ nav }: { nav: Nav }) => (
  <Screen
    dock={
      <Dock
        onAsk={q => {
          first = q;
          nav.go('firstask');
        }}
        onScan={() => nav.go('scan')}
      />
    }
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Avatar initials="B" />
      <Label style={{ flex: 1, textAlign: 'center' }}>Wallet</Label>
      <StatusPill label="New account" />
    </View>
    <View style={{ alignItems: 'center', gap: space.s2, paddingTop: 10 }}>
      <Caption tone="secondary">Total balance</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Display>₦0</Display>
        <Head tone="tertiary">.00</Head>
      </View>
      <Button label="Receive" leading="receive-filled" full={false} onPress={() => nav.go('receive')} />
    </View>
    <Shortcuts
      items={[
        { glyph: 'airtime-tone', label: 'Airtime', onPress: () => nav.go('airtime') },
        { glyph: 'power-tone', label: 'Bills', onPress: () => nav.go('bills') },
        { glyph: 'pot-tone', label: 'Savings', onPress: () => nav.go('emptygoal') },
        { glyph: 'grid-tone', label: 'Services', onPress: () => nav.go('services') },
      ]}
    />
    <Tile
      onPress={() => nav.go('ways')}
      lead={
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colour.surface3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Head>₦</Head>
        </View>
      }
      title="Nothing has moved yet"
      sub="Your first transfer shows up here"
    />
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Head style={{ flex: 1 }}>Activities</Head>
      <Pressable accessibilityRole="button" onPress={() => nav.go('emptyactivity')}>
        <Row>See all</Row>
      </Pressable>
    </View>
    <Meta tone="secondary">Nothing to notice yet.</Meta>
    <ChipRow>
      {['All', 'Insights', 'In', 'Out'].map(f => (
        <Chip key={f} label={f} on={f === 'All'} />
      ))}
    </ChipRow>
    <Empty
      glyph="wait-filled"
      body="Beetle has nothing to carry yet"
      note="Every naira in and out will show up here, in the order it moved."
    />
    <ActionRow
      icon="copy"
      title="Copy your account number"
      sub={`${me.account} · Beetle`}
      onPress={() => toast(`${me.account} copied.`)}
    />
    <ActionRow
      icon="bank"
      title="Move money from another bank"
      sub="Takes a few seconds"
      onPress={() => nav.go('ways')}
    />
    <ActionRow
      icon="data"
      title="Buy airtime with a card"
      sub="You do not need a balance for this"
      onPress={() => nav.go('airtime')}
    />
  </Screen>
);

/* the question typed on the first home, picked up by the first chat */
let first: string | null = null;

const STARTERS = [
  'How do I get money in?',
  'What can I do before I add my ID?',
  'What does a transfer cost?',
  'What do you do with my NIN?',
];

export const FirstAsk = ({ nav }: { nav: Nav }) => {
  const [thread, setThread] = useState<{ me: boolean; text: string }[]>(() => {
    const q = first;
    first = null;
    return q
      ? [
          { me: true, text: q },
          { me: false, text: reply(q) },
        ]
      : [];
  });
  const say = (q: string) => setThread(t => [...t, { me: true, text: q }, { me: false, text: reply(q) }]);
  return (
    <Screen dock={<Dock placeholder="Ask me anything" onBack={() => nav.go('firsthome')} onAsk={say} />}>
      <PageHead title="Beetle" sub="Your first question" />
      {thread.length === 0 ? (
        <>
          <Bubble>
            I only tell you things I have seen in your own money. I have not seen any yet, so ask me how
            something works and I will answer that honestly.
          </Bubble>
          <View style={{ gap: space.s2 }}>
            {STARTERS.map(s => (
              <Button key={s} label={s} tone="grey" size={48} onPress={() => say(s)} />
            ))}
          </View>
        </>
      ) : null}
      {thread.map((m, i) => (
        <View key={i} style={m.me ? { alignSelf: 'flex-end' } : { flexDirection: 'row', gap: space.s2 }}>
          {m.me ? (
            <Bubble who="You">{m.text}</Bubble>
          ) : (
            <>
              <Icon name="mark" size={32} colour={colour.accent} />
              <View style={{ flex: 1 }}>
                <Bubble>{m.text}</Bubble>
              </View>
            </>
          )}
        </View>
      ))}
    </Screen>
  );
};

/* A brand new account has nothing to read, so these four are answered from
   how the thing works rather than from figures that do not exist yet. */
const NEW: [RegExp, string][] = [
  [
    /money in|get money|put money|fund/i,
    'Your account number is ' +
      me.account +
      ' at Beetle. Send to it from any bank app, or hand out your code and let somebody pay you with a camera.',
  ],
  [
    /before .* id|without .* id|can i do/i,
    'Receive from any Nigerian bank, send up to ₦50,000 a day, and buy airtime, data and bills. Dollars and the million a day cap need the ID.',
  ],
  [
    /cost|fee|charge/i,
    'Transfers under ₦10,000 are free. Above that it is ₦25 to NIP plus 7.5% VAT, which is ₦26.88. Airtime and bills carry nothing.',
  ],
  [
    /nin|bvn|data|privacy/i,
    'It goes once to the identity service to bring back your name, and never leaves this phone again. We do not sell it and we do not keep a copy for anything else.',
  ],
];

const reply = (q: string) => NEW.find(([re]) => re.test(q))?.[1] ?? answer(q);

/* ---- nothing here yet ---- */

export const EmptyActivity = ({ nav }: { nav: Nav }) => {
  const [filter, setFilter] = useState('All');
  return (
    <Screen dock={dock('Ask what shows up here', nav, 'firsthome')}>
      <PageHead lead title="Activities" sub="Nothing has moved yet" />
      <ChipRow>
        {['All', 'In', 'Out'].map(f => (
          <Chip key={f} label={f} on={f === filter} onPress={() => setFilter(f)} />
        ))}
      </ChipRow>
      <Empty
        glyph="wait-filled"
        title="Nothing to carry yet"
        body="When money moves, it lands here with the reason, the time, and what I made of it."
      />
      <View style={{ gap: space.s2 }}>
        <Label>What will show here</Label>
        <View style={{ gap: space.s2 }}>
          {(
            [
              ['send', 'Every payment, with who and why'],
              ['mark', 'What I noticed, in the same feed'],
              ['undo-filled', 'Anything that failed, and what I did about it'],
            ] as [string, string][]
          ).map(([g, t]) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
              <Icon name={g as 'send'} size={20} />
              <Meta style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>{t}</Meta>
            </View>
          ))}
        </View>
        <Caption tone="secondary">
          I do not fill this with adverts. If there is nothing to say, it stays empty.
        </Caption>
      </View>
      <Button label="Put money in" onPress={() => nav.go('receive')} />
    </Screen>
  );
};

export const EmptyGoal = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about saving', nav, 'firsthome')}>
    <PageHead lead title="Savings" sub="You have not set one yet" />
    <Empty
      glyph="pot"
      title="Nothing put away"
      body="A beetle will shift many times its own weight, given something to push. A goal is a name and a number, and I work out the rest."
    />
    <Head>Ones people start with</Head>
    <ActionRow
      icon="gift"
      title={goal.name}
      sub={`${naira(goal.target)} by ${goal.by}`}
      onPress={() => nav.go('goal')}
    />
    <ActionRow
      icon="shield"
      title="Rainy day"
      sub="Three months of your outgoings"
      onPress={() => nav.go('goal')}
    />
    <ActionRow
      icon="home-filled"
      title="Rent"
      sub="Put a twelfth aside each month"
      onPress={() => nav.go('goal')}
    />
    <Bubble>Nothing here is locked. Take it back whenever you need it.</Bubble>
    <Ghost label="What should I be saving for?" onPress={() => nav.go('agentchat')} />
  </Screen>
);
