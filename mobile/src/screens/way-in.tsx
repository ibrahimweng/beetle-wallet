/* The way into the app, built from the frames in "Opening an account" and
   "Signing in again". Every size here is the frame's: the step glyph is 32,
   the title 32 bold, the line under it 14 regular, the entered number 32 bold,
   and the keypad is the file's own 3 by 4. */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  BottomBar,
  Bubble,
  Button,
  Card,
  Field,
  Icon,
  Keypad,
  Screen,
  StepHead,
  StepTrail,
  TrailStep,
  Body,
  Caption,
  Head,
  Label,
  Meta,
  Row,
  Wash,
  colour,
  space,
  washes,
} from '../design';
import { Rise, RevealAll, keys } from '../design/motion';
import { Route } from '../routes';

const NUMBER: TrailStep = { icon: 'phone-filled', label: 'Your number' };
const WHO: TrailStep = { icon: 'id-filled', label: 'Who you are' };
const FACE: TrailStep = { icon: 'faceid-filled', label: 'Your face' };
const PASS: TrailStep = { icon: 'lock-filled', label: 'A passcode' };

type Nav = { go: (r: Route) => void; back: () => void };

/* Type a number, then six digits. The same shape serves both the new account
   and the sign in, which is why they share this. */
function DigitScreen({
  trail,
  icon,
  title,
  sub,
  start,
  groups,
  max,
  done,
  footer,
  nav,
  placeholder,
  wash,
}: {
  trail: TrailStep[];
  icon: Parameters<typeof StepHead>[0]['icon'];
  title: string;
  sub: string;
  start: string;
  groups: number[];
  max: number;
  done: (digits: string) => void;
  footer?: React.ReactNode;
  nav: Nav;
  placeholder?: string;
  wash?: { tone: string; height?: number };
}) {
  const [digits, setDigits] = useState(start);
  const grouped = (() => {
    let i = 0;
    return groups
      .map(g => digits.slice(i, (i += g)))
      .filter(Boolean)
      .join(' ');
  })();
  /* The updater stays pure: React may run it more than once, and a navigation
     fired from inside it would happen twice. Finishing is watched instead. */
  /* A number that arrives already filled in must not send you onward before
     you have touched it, which is what happens if completion is judged on
     length alone. */
  const [touched, setTouched] = useState(false);
  const key = (k: string) => {
    setTouched(true);
    setDigits(d => (k === 'del' ? d.slice(0, -1) : (d + k).slice(0, max)));
  };
  React.useEffect(() => {
    if (!touched || digits.length < max) return;
    const t = setTimeout(() => done(digits), 140);
    return () => clearTimeout(t);
    /* what was typed is what finishes the step, not which screen asked for it */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, max, touched]);
  /* These frames do not scroll and carry no dock. The pad is what is pinned:
     it clears the bottom edge by 24, which puts its top row at 532 of 852, and
     the step hangs off the top of it rather than off the status bar. */
  return (
    <View style={{ flex: 1, backgroundColor: colour.surface }}>
      {wash ? <Wash tone={wash.tone} height={wash.height} /> : null}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 28, gap: 20 }}>
          <RevealAll>
            <StepTrail done={trail} />
            <StepHead icon={icon} title={title} sub={sub} tint={icon === 'mark' ? undefined : wash?.tone} />
            <Field value={grouped} />
            {footer}
          </RevealAll>
        </View>
        {/* the pad comes up under the step, the way a keyboard would */}
        <Rise spring={keys} from={120} delay={60}>
          <Keypad onKey={key} />
        </Rise>
        <View style={{ height: 24 }} />
      </View>
    </View>
  );
}

export const Number = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.number}
    trail={[]}
    icon="phone-filled"
    title="Your number"
    sub="I will text you six digits to check the number is yours."
    start="08032144471"
    groups={[4, 3, 4]}
    max={11}
    done={() => nav.go('code')}
    placeholder="Ask why this is needed"
  />
);

const didNotGet = (onPress: () => void) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
  >
    <Label>I did not get it</Label>
    <Icon name="chevron" size={12} colour={colour.ink} />
  </Pressable>
);

export const Code = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.code}
    trail={[]}
    icon="phone-filled"
    title="Your number"
    sub="Six digits, sent to 0803 214 4471 a moment ago."
    start=""
    groups={[6]}
    max={6}
    footer={didNotGet(() => nav.go('number'))}
    done={() => nav.go('nin')}
    placeholder="It did not arrive"
  />
);

export const Nin = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.nin}
    trail={[NUMBER]}
    icon="id-filled"
    title="Who you are"
    sub="Eleven digits from your NIN or your BVN, whichever you know. Your name comes back with them."
    start="1234567890"
    groups={[4, 4, 3]}
    max={11}
    done={d => nav.go(d === '12345678900' ? 'who' : 'nomatch')}
    placeholder="Ask why this is needed"
  />
);

export const Signin = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.signin}
    trail={[]}
    icon="mark"
    title="Welcome back"
    sub="Your number, and then six digits from a text. Nothing else, because the account is already yours."
    start="08032144471"
    groups={[4, 3, 4]}
    max={11}
    done={() => nav.go('signcode')}
    placeholder="Ask about signing in"
  />
);

export const Signcode = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.signcode}
    trail={[]}
    icon="mark"
    title="Six digits"
    sub="Sent to 0803 214 4471 a moment ago. On a phone I already know, your passcode alone would have been enough."
    start=""
    groups={[6]}
    max={6}
    footer={didNotGet(() => nav.go('signin'))}
    done={() => nav.go('home')}
    placeholder="Ask about signing in"
  />
);

export const Passcode = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.passcode}
    trail={[NUMBER, WHO, FACE]}
    icon="lock-filled"
    title="A passcode"
    sub="Six digits. These are what send your money, so pick something nobody watching could guess."
    start=""
    groups={[6]}
    max={6}
    footer={
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Not your year of birth, and not 123456.
        </Meta>
      </View>
    }
    done={() => nav.go('ready')}
    placeholder="Ask about the passcode"
  />
);

/* Is this you. The record comes back and you say yes or that it is wrong. */
export const Who = ({ nav }: { nav: Nav }) => (
  <Screen
    sink
    wash={washes.who}
    dock={
      <BottomBar onBack={nav.back}>
        <Button label="Yes, that is me" onPress={() => nav.go('face')} />
      </BottomBar>
    }
  >
    <StepTrail done={[NUMBER]} />
    <StepHead
      icon="id-filled"
      title="Who you are"
      sub="This came back from the record against those digits. I did not type it."
      tint={washes.who.tone}
    />
    <Card style={{ gap: space.s4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colour.surface3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Label>IM</Label>
        </View>
        <View style={{ gap: 2 }}>
          <Row>Ibrahim Musa</Row>
          <Meta tone="secondary">Born 14 June 1996</Meta>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Body tone="secondary">On the record as</Body>
        <Row>IBRAHIM MUSA WENG</Row>
      </View>
    </Card>
    <Pressable
      accessibilityRole="button"
      onPress={() => nav.go('nomatch')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <Label>Something here is wrong</Label>
      <Icon name="chevron" size={12} />
    </Pressable>
  </Screen>
);

/* One photo, and what happens to it. */
export const Face = ({ nav }: { nav: Nav }) => (
  <Screen
    sink
    wash={washes.face}
    dock={
      <BottomBar onBack={nav.back}>
        <Button label="Take it" onPress={() => nav.go('passcode')} />
      </BottomBar>
    }
  >
    <StepTrail done={[NUMBER, WHO]} />
    <StepHead
      icon="faceid-filled"
      title="Your face"
      sub="One photo, checked against the same record, so that only you can open this again."
      tint={washes.face.tone}
    />
    <View style={{ alignItems: 'center', gap: space.s5, paddingVertical: space.s6 }}>
      <Icon name="person" size={56} colour={colour.textTertiary} />
      <Meta tone="secondary">Hold still and look at the camera</Meta>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Icon name="eye" size={16} colour={colour.textTertiary} />
      <Meta tone="secondary" style={{ flex: 1 }}>
        The photo is kept on this phone. It is not a profile picture and nobody else sees it.
      </Meta>
    </View>
  </Screen>
);

/* The account exists. What it can do now, and what finishing unlocks. */
export const Ready = ({ nav }: { nav: Nav }) => {
  const can = (text: string, on: boolean) => (
    <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
      <Icon name="check" size={12} colour={on ? colour.good : colour.textTertiary} />
      <Meta tone={on ? 'ink' : 'tertiary'} style={{ flex: 1 }}>
        {text}
      </Meta>
    </View>
  );
  return (
    <Screen
      dock={
        <BottomBar>
          <Button label="Take me in" onPress={() => nav.go('firsthome')} />
        </BottomBar>
      }
    >
      <StepTrail done={[NUMBER, WHO, FACE, PASS]} />
      <View style={{ flexDirection: 'row', gap: space.s3 }}>
        <Icon name="check" size={12} colour={colour.good} />
        <View style={{ flex: 1, gap: 8 }}>
          <Head>Your account is ready</Head>
          <Meta tone="secondary">Your number is 0102 4457 88, and money can reach it now.</Meta>
        </View>
      </View>
      <View style={{ gap: space.s5 }}>
        {can('Receive money from any Nigerian bank', true)}
        {can('Send up to ₦50,000 a day', true)}
        {can('Buy airtime, data and pay bills', true)}
        {can('Hold dollars', false)}
        {can('Send up to ₦1,000,000 a day', false)}
      </View>
      <Pressable accessibilityRole="button" onPress={() => nav.go('finish')}>
        <Card
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, paddingVertical: space.s4 }}
        >
          <Icon name="shield-filled" size={29} colour={colour.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Label>Finish setting up</Label>
            <Caption tone="secondary">Two minutes, and the last two come on</Caption>
          </View>
          <Icon name="chevron" size={16} colour={colour.textTertiary} />
        </Card>
      </Pressable>
    </Screen>
  );
};

/* Setting a new passcode after a freeze. Same shape as the first one, with the
   trail the frame shows. */
export const NewCode = ({ nav }: { nav: Nav }) => (
  <DigitScreen
    nav={nav}
    wash={washes.newcode}
    trail={[
      { icon: 'phone-filled', label: 'Frozen' },
      { icon: 'id-filled', label: 'Your number' },
      { icon: 'faceid-filled', label: 'Your face' },
    ]}
    icon="lock-filled"
    title="A new passcode"
    sub="Six digits, and not the old ones. Sending stays locked for twelve hours."
    start=""
    groups={[6]}
    max={6}
    footer={
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Icon name="lock" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Money can still reach you. Only sending waits.
        </Meta>
      </View>
    }
    done={() => nav.go('home')}
  />
);

/* The record did not match. Nothing is wrong with the person, usually. */
export const NoMatch = ({ nav }: { nav: Nav }) => (
  <View style={{ flex: 1, backgroundColor: colour.surface }}>
    <Wash tone={washes.nomatch.tone} height={washes.nomatch.height} />
    <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 116, justifyContent: 'flex-end' }}>
      <View style={{ gap: 20 }}>
        <StepTrail done={[NUMBER]} />
        <StepHead
          icon="id-filled"
          title="Who you are"
          sub="Eleven digits from your NIN or your BVN. These ones did not match anything."
          tint={washes.nomatch.tone}
        />
        <Card style={{ gap: space.s4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4 }}>
            <Icon name="warn-filled" size={28} colour={colour.good} />
            <Row>Nothing came back</Row>
          </View>
          <Meta tone="secondary">
            No record matches 1234 5678 90. One wrong digit is the usual reason, so it is worth reading them
            again.
          </Meta>
        </Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 }}>
          <Icon name="mark" size={32} colour={colour.accent} />
          <View style={{ flex: 1 }}>
            <Bubble>
              If the digits are right and it still says this, your BVN will work instead. It is the same
              eleven digits from a different register.
            </Bubble>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.go('agentchat')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Label>Talk to someone</Label>
          <Icon name="chevron" size={12} />
        </Pressable>
      </View>
    </View>
    <BottomBar onBack={nav.back}>
      <Button label="Try again" onPress={() => nav.go('nin')} />
    </BottomBar>
  </View>
);
