/* Act Two, what it decides for you. Standing instructions, the caps, what it
   takes to open the app, and what happens when the phone is in the wrong
   hands. Built from the frames in "What runs on its own", "What you set" and
   "When the phone is gone". */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  AgentSay,
  Aside,
  Banner,
  BigStatus,
  BottomBar,
  Button,
  CapRow,
  Card,
  ChoiceRow,
  Choices,
  DeviceRow,
  Dock,
  Facts,
  FootNote,
  Icon,
  PageHead,
  Screen,
  SectionLabel,
  SettingRow,
  ToggleRow,
  Usage,
  Caption,
  Head,
  Label,
  Meta,
  Row,
  colour,
  space,
} from '../design';
import { Route } from '../routes';
import { useStore } from '../state/live';
import * as act from '../state/actions.js';
import { update } from '../state/store.js';

type Nav = { go: (r: Route) => void; back: () => void };
const dock = (p: string, nav: Nav) => <Dock placeholder={p} onBack={nav.back} />;

/* ---- what runs without asking ---- */

export const Rule = ({ nav }: { nav: Nav }) => (
  <Screen dock={undefined}>
    <PageHead title="Set this up?" sub="Nothing is saved until you say yes" />
    <Facts
      rows={[
        ['What', 'Top up Ikeja Electric'],
        ['Meter', '4457 8891'],
        ['When', 'The day units run low'],
        ['Up to', '₦10,000'],
        ['Stops if', 'Everyday is under ₦15,000'],
      ]}
    />
    <AgentSay>Over ₦10,000 and I stop and ask you, every time. I never raise this on my own.</AgentSay>
    <FootNote
      title="You can stop it any time"
      sub="It sits in Standing instructions with a switch beside it. Or just tell me to stop and it stops."
    />
    <Button label="Set it up" onPress={() => nav.go('rules')} />
    <Pressable accessibilityRole="button" onPress={nav.back} style={{ alignSelf: 'center' }}>
      <Row>Not now</Row>
    </Pressable>
  </Screen>
);

export const Rules = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const tight = s.standing.find(r => r.name === 'Money is tight')?.on ?? false;
  const instruction = (title: string, when: string, log: string) => (
    <Card key={title} style={{ gap: space.s3 }}>
      <Row>{title}</Row>
      <Meta tone="secondary">{when}</Meta>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Meta tone="secondary" style={{ flex: 1 }}>
          {log}
        </Meta>
        <Pressable accessibilityRole="button" onPress={() => nav.go('history')}>
          <Label>See log</Label>
        </Pressable>
      </View>
    </Card>
  );
  return (
    <Screen dock={dock('Ask me to set one up', nav)}>
      <PageHead lead title="Standing instructions" sub="What I can do without asking you first" />
      <Card style={{ gap: space.s3 }}>
        <ToggleRow
          title="Money is tight this month"
          value={tight}
          onChange={v => act.setStanding('Money is tight', v)}
          sub="Turn this on and I stop moving money into savings, and I stop asking you to. Your goals wait where they are. Nothing is lost and nothing is charged."
        />
        <Caption tone="secondary">You can also just tell me, any time.</Caption>
      </Card>
      {instruction(
        'Move ₦20,000 to Holiday on payday',
        'The day your salary lands.',
        'Moved 4 times · ₦80,000 put aside',
      )}
      {instruction('Top up Ikeja Electric', 'When units run low, up to ₦10,000.', 'Paid 3 times · ₦22,400')}
      {instruction('Buy 5GB when my data runs out', 'Once a month at most.', 'Bought twice · ₦5,000')}
      <SectionLabel>I will always ask first</SectionLabel>
      <View style={{ gap: space.s5 }}>
        <Aside>Paying anyone you have not paid before</Aside>
        <Aside>Anything over ₦20,000</Aside>
        <Aside>Taking a loan on your behalf</Aside>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => nav.go('rule')}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Icon name="plus" size={18} />
        <Label>Add an instruction</Label>
      </Pressable>
    </Screen>
  );
};

/* ---- what you set ---- */

export const Settings = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask me to change something', nav)}>
    <PageHead lead title="Settings" />
    <Pressable accessibilityRole="button" onPress={() => nav.go('agentchat')}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.s5, paddingVertical: space.s4 }}>
        <Icon name="star" size={20} colour={colour.warn} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row>Get Beetle Plus</Row>
          <Meta tone="secondary">Higher daily limits and a human when you need one</Meta>
        </View>
        <Icon name="chevron" size={16} colour={colour.textTertiary} />
      </Card>
    </Pressable>

    <SectionLabel>What keeps the money yours</SectionLabel>
    <View style={{ gap: 32 }}>
      <SettingRow
        glyph="faceid-filled"
        title="Lock and privacy"
        value="Face ID"
        onPress={() => nav.go('lock')}
      />
      <SettingRow
        glyph="shield-filled"
        title="Spending limits"
        value="₦100,000 a day"
        onPress={() => nav.go('limits')}
      />
      <SettingRow title="Standing instructions" value="3 running" onPress={() => nav.go('rules')} />
      <SettingRow
        glyph="laptop-filled"
        title="Devices"
        value="3 signed in"
        onPress={() => nav.go('devices')}
      />
      <SettingRow
        glyph="key-filled"
        title="Keys and recovery"
        value="Set up"
        onPress={() => nav.go('lostphone')}
      />
    </View>

    <SectionLabel>Your account</SectionLabel>
    <View style={{ gap: 32 }}>
      <SettingRow title="Your details" onPress={() => nav.go('who')} />
      <SettingRow title="Notifications" onPress={() => nav.go('lock')} />
      <SettingRow glyph="gift-filled" title="Saved people" onPress={() => nav.go('ways')} />
      <SettingRow glyph="card-filled" title="Cards" value="1 virtual" onPress={() => nav.go('card')} />
    </View>

    <SectionLabel>About</SectionLabel>
    <View style={{ gap: 32 }}>
      <SettingRow glyph="chat-filled" title="Contact support" onPress={() => nav.go('agentchat')} />
      <SettingRow glyph="star-filled" title="Give feedback" onPress={() => nav.go('agentchat')} />
      <SettingRow glyph="lock-filled" title="Sign out" onPress={() => nav.go('start')} />
    </View>
    <Meta tone="tertiary" style={{ textAlign: 'center' }}>
      Version 1.0.4
    </Meta>
  </Screen>
);

export const Lock = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const on = (k: string) => s.toggles[k] === true;
  return (
    <Screen dock={dock('Ask me to lock something down', nav)}>
      <PageHead
        lead
        title="Lock and privacy"
        sub="What it takes to open this, and what shows once it is open"
      />
      <View style={{ gap: 32 }}>
        <ToggleRow
          glyph="faceid-filled"
          title="Face ID"
          value={on('faceId')}
          onChange={v => act.setToggle('faceId', v)}
        />
        <SettingRow glyph="key-filled" title="Passcode" value="6 digits" onPress={() => nav.go('newcode')} />
        <SettingRow
          glyph="clock-filled"
          title="Ask again after"
          value="2 minutes"
          onPress={() => nav.go('settings')}
        />
      </View>
      <Head>What other people can see</Head>
      <View style={{ gap: 32 }}>
        <ToggleRow
          glyph="eye-filled"
          title="Hide my balance"
          value={on('hideBalance')}
          onChange={v => act.setToggle('hideBalance', v)}
        />
        <ToggleRow
          glyph="camera-filled"
          title="Hide it in screenshots"
          value={on('hideScreenshots')}
          onChange={v => act.setToggle('hideScreenshots', v)}
        />
        <ToggleRow
          title="Amounts in notifications"
          value={on('notifAmounts')}
          onChange={v => act.setToggle('notifAmounts', v)}
        />
      </View>
      <Aside glyph="eye">
        With this on, your balance is dots until you look at the phone. Nobody standing behind you in a queue
        reads it over your shoulder.
      </Aside>
      <FootNote
        title="Your passcode is not on our servers"
        sub="It opens this phone and nothing else. If you lose it, recovery gives you a new one. Nobody, here or anywhere, can read the old one."
      />
    </Screen>
  );
};

export const Limits = ({ nav }: { nav: Nav }) => {
  const s = useStore();
  const money = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
  const left = Math.max(0, s.limits.day - s.outToday);
  return (
    <Screen dock={dock('Ask me to change a limit', nav)}>
      <PageHead lead title="Spending limits" sub="What you set, and where today stands" />
      <Usage
        out={money(s.outToday)}
        of={money(s.limits.day)}
        note={`${money(left)} left before I stop and ask you twice.`}
      />
      <Head>Your caps</Head>
      <View style={{ gap: 32 }}>
        <CapRow
          title="One transfer"
          sub="The most that can leave in a single go"
          value={money(s.limits.transfer)}
          onPress={() => nav.go('limitstop')}
        />
        <CapRow
          title="One day"
          sub="Midnight to midnight"
          value={money(s.limits.day)}
          onPress={() => nav.go('limitstop')}
        />
        <CapRow
          title="One month"
          sub="Resets on the first"
          value={money(s.limits.month)}
          onPress={() => nav.go('limitstop')}
        />
      </View>
      <SectionLabel>What happens at the line</SectionLabel>
      <View style={{ gap: space.s5 }}>
        <Aside glyph="key">Your passcode. Not your face, because a face can be held up to a phone.</Aside>
        <Aside glyph="list">Then you type Confirm this transaction in full. Three words, spelled out.</Aside>
      </View>
      <Meta tone="secondary">
        Two deliberate things, so a bad minute cannot carry you past a line you drew on a good one.
      </Meta>
      <Pressable
        accessibilityRole="button"
        onPress={() => nav.go('limitstop')}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Row>Show me what that looks like</Row>
        <Icon name="chevron" size={20} />
      </Pressable>
      <Aside glyph="clock">
        Raising a cap takes a day to come into force. Lowering one is immediate. That way nobody talks you
        into a bigger number in the moment.
      </Aside>
    </Screen>
  );
};

export const LimitStop = ({ nav }: { nav: Nav }) => {
  const [typed, setTyped] = useState('Confirm this transa');
  const want = 'Confirm this transaction';
  const left = want.length - typed.length;
  return (
    <Screen
      dock={
        <BottomBar onBack={nav.back}>
          <Button label="Send ₦120,000" disabled={left > 0} onPress={() => nav.go('confirm')} />
        </BottomBar>
      }
    >
      <PageHead title="Past your own limit" sub="Nothing has been sent" />
      <BigStatus
        glyph="warn-filled"
        tone={colour.good}
        amount="₦120,000"
        line="₦20,000 over the ₦100,000 you set for one transfer"
      />
      <Banner
        text="This is your limit, not the bank’s. Two things and it goes."
        glyph="warn-filled"
        ink={colour.good}
      />
      <Card style={{ gap: space.s5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <Icon name="check" size={16} colour={colour.good} />
          <Row style={{ flex: 1 }}>Your passcode</Row>
          <Caption style={{ fontWeight: '600' }}>Done</Caption>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
          <Icon name="step-todo" size={16} />
          <Row style={{ flex: 1 }}>Now type the words in full</Row>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setTyped(want)}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colour.surface,
              borderRadius: 12,
              padding: space.s3,
            }}
          >
            <Row>{typed}</Row>
            <Row tone="tertiary">{want.slice(typed.length)}</Row>
          </View>
        </Pressable>
        <Caption tone="secondary">
          {left > 0
            ? `${['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][left] ?? left} letters to go. Exactly those three words, nothing shorter.`
            : 'That is it. It can go now.'}
        </Caption>
      </Card>
      <Choices>
        <ChoiceRow
          glyph="send"
          title="Send ₦100,000 instead"
          sub="The rest tomorrow, no typing"
          onPress={() => nav.go('confirm')}
        />
      </Choices>
    </Screen>
  );
};

export const Devices = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask about a device', nav)}>
    <PageHead lead title="Devices" sub="Everywhere this account is open" />
    <Card style={{ gap: space.s4 }}>
      <DeviceRow glyph="airtime" title="iPhone 13" where="Lagos · open now" tag="This one" />
      <DeviceRow glyph="airtime" title="Tecno Spark 10" where="Lagos · 3 days ago" />
      <DeviceRow glyph="laptop" title="Chrome on Windows" where="Abuja · 12 August" tag="Odd one" odd />
    </Card>
    <AgentSay>
      The Windows one signed in from Abuja on 12 August and has not been back. If that was not you, sign it
      out and change your passcode. I will not do either without you.
    </AgentSay>
    <Button
      label="Sign out everywhere else"
      full={false}
      style={{ alignSelf: 'center' }}
      onPress={() => nav.go('settings')}
    />
    <Aside>
      Signing a device out never touches your money. It only means that device has to ask for your passcode
      again.
    </Aside>
  </Screen>
);

/* ---- when the phone is gone ---- */

export const LostPhone = ({ nav }: { nav: Nav }) => (
  <Screen dock={dock('Ask what freezing does', nav)}>
    <PageHead title="Not your phone" sub="Signed in on a device I do not know" />
    <Card style={{ gap: space.s4 }}>
      <DeviceRow
        glyph="airtime"
        title="Freeze the money"
        where="Nothing can leave"
        tag="Do this"
        onPress={() => {
          update((s: { frozen?: boolean }) => {
            s.frozen = true;
          });
          nav.go('newcode');
        }}
      />
      <DeviceRow glyph="airtime" title="Infinix Hot 40" where="Ikeja · signing in now" />
      <DeviceRow glyph="laptop" title="iPhone 13" where="Lagos · seen 09:14" tag="Yours" />
    </Card>
    <AgentSay>
      You are on a device this account has never seen. I will not open the money here until you prove it is
      you. Freezing costs nothing and lifts in a minute.
    </AgentSay>
    <Button
      label="Freeze it, then prove it is me"
      full={false}
      style={{ alignSelf: 'center' }}
      onPress={() => nav.go('newcode')}
    />
    <Aside>
      Freezing stops money leaving. It does not stop money arriving, and it never touches what you already
      have.
    </Aside>
  </Screen>
);
