/* Act Four, after the account is open — finishing the checks, the first day,
   and the two screens that have nothing in them yet.

   Frames 316:9491, 316:9538, and the frames for where your money comes from,
   everything on, the first home, the first question, and the two empties. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  ActionRow,
  AgentSay,
  Badge,
  Aside,
  BottomBar,
  Bubble,
  Balance,
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
  Said,
  Screen,
  SendButton,
  Shortcuts,
  StepHead,
  StepTrail,
  StepsAhead,
  Tick,
  Tile,
  TopBar,
  TrailStep,
  colour,
  space,
  toast,
  washes,
  WalletHeader,
} from '../design';
import { Nav, dock } from './nav';
import { answer } from '../state/agent';
import { me } from '../state/data.js';

const WHERE: TrailStep = { icon: 'home-filled', label: 'Where you live' };
const ID: TrailStep = { icon: 'id-filled', label: 'A photo of an ID' };
const INCOME: TrailStep = { icon: 'down', label: 'Where your money comes from' };

const OPENS = ['Send up to ₦1,000,000 a day', 'Hold dollars', 'Borrow against your history'];

/* ---- finishing the checks ---- */

export const Finish = ({ nav }: { nav: Nav }) => (
  <Screen
    sink
    wash={washes.finish}
    dock={
      <BottomBar onBack={nav.back}>
        <Button label="Continue" onPress={() => nav.go('idcard')} />
      </BottomBar>
    }
  >
    <StepHead
      icon="home-filled"
      tint={washes.finish.tone}
      title="Where you live"
      sub="Street, town and state. No utility bill, and nothing arrives in the post."
    />
    <Card style={{ gap: 4 }}>
      <Row>12 Bode Thomas Street</Row>
      <Row tone="tertiary">Surulere, Lagos State</Row>
    </Card>
    <StepsAhead done={[ID, INCOME]} />
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
            {/* nothing is unlocked until the last step, so these are empty rings */}
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colour.ruleStrong,
              }}
            />
            <Meta tone="secondary" style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>
              {t}
            </Meta>
          </View>
        </View>
      ))}
    </Card>
    <Aside>This is the same check every Nigerian bank runs. We ask once, and we do not sell it.</Aside>
  </Screen>
);

export const IdCard = ({ nav }: { nav: Nav }) => (
  <Screen
    sink
    wash={washes.idcard}
    dock={
      <BottomBar onBack={nav.back}>
        <Button label="Take it" onPress={() => nav.go('income')} />
      </BottomBar>
    }
  >
    <StepTrail done={[WHERE]} />
    <StepHead
      icon="camera-filled"
      tint={washes.idcard.tone}
      title="A photo of an ID"
      sub="A driver’s licence, a passport or a voter’s card. Any of the three will do."
    />
    {/* a grey plate with the shape of the card cut into it, the way the frame draws it */}
    <View
      style={{
        alignItems: 'center',
        gap: space.s3,
        backgroundColor: colour.surface2,
        borderRadius: 16,
        paddingVertical: 24,
      }}
    >
      <View
        style={{
          width: 248,
          height: 148,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colour.accent,
        }}
      />
      <Caption tone="secondary">Lay it flat and fill the frame</Caption>
    </View>
    <Aside>
      I read the name and the number off it and keep nothing else. The photo does not leave your phone.
    </Aside>
    <StepsAhead done={[INCOME]} />
  </Screen>
);

export const Income = ({ nav }: { nav: Nav }) => {
  const [pick, setPick] = useState('salary');
  return (
    <Screen
      sink
      wash={washes.income}
      dock={
        <BottomBar onBack={nav.back}>
          <Button label="Continue" onPress={() => nav.go('full')} />
        </BottomBar>
      }
    >
      <StepTrail done={[WHERE, ID]} />
      <StepHead
        icon="down"
        tint={washes.income.tone}
        title="Where your money comes from"
        sub="One tap. It is the last question, and every bank has to ask it."
      />
      <Picker
        plain
        value={pick}
        options={[
          { id: 'salary', label: 'A salary' },
          { id: 'business', label: 'My own business' },
          { id: 'family', label: 'Family or friends' },
          { id: 'other', label: 'Something else' },
        ]}
        onChange={setPick}
      />
    </Screen>
  );
};

export const Full = ({ nav }: { nav: Nav }) => (
  <Screen
    sink
    dock={
      <BottomBar onBack={nav.back}>
        <Button label="Take me in" onPress={() => nav.go('firsthome')} />
      </BottomBar>
    }
  >
    <StepTrail done={[WHERE, ID, INCOME]} />
    {/* the head is a row here, with the tick against it, because this is the
        end of the trail rather than the start of a page */}
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s3 }}>
      <Icon name="check" size={24} colour={colour.good} />
      <View style={{ flex: 1, gap: 8 }}>
        <Head>Everything is on</Head>
        <Meta tone="secondary">You can send a million naira a day and hold dollars now.</Meta>
      </View>
    </View>
    <Card style={{ gap: space.s3 }}>
      {[...OPENS, 'Everything you could already do'].map((t, i) => (
        <View key={t}>
          {i ? (
            <View style={{ paddingBottom: space.s3 }}>
              <Divider />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Tick on />
            <Meta style={{ flex: 1, fontSize: 16, lineHeight: 24 }}>{t}</Meta>
          </View>
        </View>
      ))}
    </Card>
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
    {/* the first home is the home screen with nothing in it yet, so it is the
        same head and the same balance block — the account's age is the pill
        beside the words, not something in the bar */}
    <WalletHeader onSettings={() => nav.go('settings')} onAlerts={() => nav.go('history')} />
    <Balance whole="₦0" kobo=".00" change="New account" />
    <View style={{ alignSelf: 'center' }}>
      <Button
        label="Receive"
        leading="receive-filled"
        badge
        size={40}
        full={false}
        onPress={() => nav.go('receive')}
      />
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
    <Screen
      dock={
        <Dock
          placeholder="Ask me anything"
          onAsk={say}
          action={<SendButton onPress={() => nav.go('firsthome')} />}
        />
      }
    >
      <TopBar mark title="Beetle" onBack={() => nav.go('firsthome')} />
      {thread.length === 0 ? (
        <>
          {/* the frame opens this one on a spoken question, and offers nothing
              under the answer: a new account has nothing to suggest from */}
          <Said>What can you do?</Said>
          <View style={{ flexDirection: 'row', gap: space.s2 }}>
            <Icon name="mark" size={32} colour={colour.accent} />
            <View style={{ flex: 1 }}>
              <Bubble>Very little yet, and I would rather say so. I have no history to read.</Bubble>
            </View>
          </View>
          <Aside>I only tell you things I have seen in your own money.</Aside>
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
  /* The frame for this one is nearly empty on purpose: the title, the three
     filters on their grey track, and one line saying what will land here. */
  return (
    <Screen dock={dock('Ask what shows up here', nav, 'firsthome', true)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
        <Badge glyph="clock" size={40} tone={colour.surface2} ink={colour.ink} />
        <Display>History</Display>
      </View>
      <Meta tone="tertiary">Nothing has moved yet</Meta>
      <View
        style={{
          flexDirection: 'row',
          alignSelf: 'center',
          backgroundColor: colour.surface2,
          borderRadius: 999,
          padding: 4,
        }}
      >
        {['All', 'In', 'Out'].map(f => (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: f === filter }}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 28,
              height: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: f === filter ? colour.surface : 'transparent',
            }}
          >
            <Label tone={f === filter ? 'ink' : 'secondary'}>{f}</Label>
          </Pressable>
        ))}
      </View>
      <AgentSay>Every line here will open a receipt you can keep, send on, or dispute.</AgentSay>
    </Screen>
  );
};

export const EmptyGoal = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about saving', nav, 'firsthome', true)}>
    <PageHead lead title="Goals" sub="Nothing put aside yet" />
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 }}>
      <Icon name="mark" size={32} colour={colour.accent} />
      <View style={{ flex: 1 }}>
        <Bubble>A goal works best when a rule feeds it. Tell me what you are saving for.</Bubble>
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: space.s2 }}>
      <View style={{ flex: 1 }}>
        <Button label="Start a goal" onPress={() => nav.go('goal')} />
      </View>
      <View style={{ flex: 1 }}>
        <Button label="Set it up" tone="grey" onPress={() => nav.go('rule')} />
      </View>
    </View>
    <Aside>Nothing here is locked. Take it back whenever you need it.</Aside>
    <Ghost label="What should I be saving for?" onPress={() => nav.go('agentchat')} />
  </Screen>
);
