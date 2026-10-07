/* What each stage of the way in shows: the glyph and its colour, the wash,
   the title and the line under it, what sits beneath, what waits at the
   bottom, and what a tap does. Every stage is a plain function of the
   screen's state, so the choreography in WayIn.tsx can move the pieces
   without knowing which step they belong to. The rules and the mock
   services are the same ones the separate screens used. */
import React, { ReactNode, useEffect } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Aside, Avatar, Body, Caption, Card, Display, Field, Icon, Label, Meta, More, Pips, Row as RowText, Say, Swap, Tap, Tick, colour, motion, space, toast, useStill, washes } from '../../design';
import type { IconName } from '../../icons';
import { auth, identity, DEMO_PASSCODES, MOCK, MOCK_CODE } from '../../services';
import { LAB } from '../../lab/enabled';
import { groupAccount, groupDigits, groupPhone, initialsOf, longDate } from '../../lib/format';
import { checkPhone, passcodeProblem, PASSCODE_WORDS } from './validation';
import type { useApp } from './store';
import type { Stage } from './stages';
import type { Income, Setup } from '../setup/setup';
import { address, full, idcard, income } from './setupViews';

export type Note = { text: string; tone?: 'secondary' | 'bad' | 'accent' } | null;
export type Bar = { label: string; onPress: () => void; disabled?: boolean; /** Back at the bottom left, beside the button, where a frame draws it there */ back?: () => void };

export type StageView = {
  /** the glyph above the title, and the colour it and the wash carry */
  icon: IconName | 'tick';
  tint?: string;
  wash?: { tone: string; height?: number };
  title: string;
  /** the ready screen's title is the smaller one, as the frame draws it */
  small?: boolean;
  sub: string;
  /** what the stack holds instead of steps, on the welcome */
  above?: ReactNode;
  /** what sits under the title, and a key that changes when it should be replaced */
  bodyKey: string;
  body: ReactNode;
  /** a stage that takes digits gets the keypad */
  keypad?: (key: string) => void;
  /** the welcome's mark is 40, the other glyphs 32 */
  iconSize?: number;
  /** the ready screen puts its tick beside the title */
  inline?: boolean;
  /** the welcome's line is body size */
  subBody?: boolean;
  /** a line at the top for the demo build: which digits it lets through */
  hint?: string;
  /** the black button at the bottom */
  bar?: Bar;
  /** the welcome's two ways in, instead of a bar */
  welcome?: boolean;
  back?: () => void;
};

export type Ctx = {
  stage: Stage;
  app: ReturnType<typeof useApp>;
  still: boolean;
  digits: string;
  setDigits: (d: string) => void;
  note: Note;
  setNote: (n: Note) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  shake: number;
  bump: () => void;
  wrong: number;
  setWrong: (n: number) => void;
  wait: number;
  setWait: (n: number) => void;
  first: string | null;
  setFirst: (s: string | null) => void;
  faceState: 'idle' | 'checking' | 'failed';
  setFaceState: (s: 'idle' | 'checking' | 'failed') => void;
  unknown: boolean;
  setUnknown: (b: boolean) => void;
  phoneIn: string;
  setPhoneIn: (p: string) => void;
  lastNumber: string;
  setLastNumber: (n: string) => void;
  words: number;
  /* finishing setting up: what is typed and picked on its stages, and what is kept */
  setup: Setup;
  setSetup: (patch: Partial<Setup>) => void;
  street: string;
  setStreet: (s: string) => void;
  area: string;
  setArea: (s: string) => void;
  idState: 'idle' | 'checking';
  /** the camera on a phone, a moment on the web; the reading comes back through the hand-off */
  takeId: () => void;
  income: Income | null;
  setIncome: (i: Income) => void;
  /** out of setting up: back to the ready screen, or to the page that opened it */
  exit: () => void;
  go: (next: Stage, direction?: 1 | -1) => void;
  /** leave the screen for home, after doing something */
  toHome: (after?: () => Promise<void>) => void;
};

const WORDS = [
  { word: 'Save', icon: 'pot' },
  { word: 'Send', icon: 'send' },
  { word: 'Spend', icon: 'card' },
  { word: 'Ask', icon: 'mark' },
] as const;

const TRIES = 3;

/* ---- pieces the stages share ---- */

/* The digits, shaking when they are refused. */
function Shake({ n, children }: { n: number; children: ReactNode }) {
  const still = useStill();
  const x = useSharedValue(0);
  useEffect(() => {
    if (!n || still) return;
    x.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }));
  }, [n, still, x]);
  const shaking = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={shaking}>{children}</Animated.View>;
}

/* The line under the field: what went wrong, or what is happening. */
function NoteLine({ note, style }: { note: Note; style?: StyleProp<ViewStyle> }) {
  const tone = note?.tone === 'bad' ? 'bad' : note?.tone === 'accent' ? 'accent' : 'secondary';
  return (
    <View style={[{ minHeight: 20 }, style]}>
      <Swap value={note?.text ?? ''}>
        {shown =>
          shown ? (
            <Meta tone={tone} accessibilityLiveRegion="polite">
              {shown}
            </Meta>
          ) : null
        }
      </Swap>
    </View>
  );
}

/* What a stage that takes digits shows under its title. */
function DigitBody({ c, groups, secret = false, max = 11, footer }: { c: Ctx; groups: number[]; secret?: boolean; max?: number; footer?: ReactNode }) {
  /* the frames set 12 between the field and what follows it, and nothing
     between the dots and the row under them, which carries its own room;
     the line under either has room only when there is something to say */
  return (
    <View style={{ gap: secret ? 0 : 12 }}>
      <Shake n={c.shake}>
        {secret ? (
          <View style={{ height: 14, justifyContent: 'center' }}>
            <Pips of={max} filled={c.digits.length} align="left" />
          </View>
        ) : (
          <Field value={groupDigits(c.digits, groups) || ' '} caret={!c.busy} />
        )}
      </Shake>
      {c.note ? <NoteLine note={c.note} style={secret ? { marginTop: 8 } : undefined} /> : null}
      {footer}
    </View>
  );
}

/* A key on the pad: one more digit, or one fewer, and the moment the last
   one lands the stage takes it from there. */
const typing = (c: Ctx, max: number, full: (d: string) => void) => (key: string) => {
  if (c.busy) return;
  const d = key === 'del' ? c.digits.slice(0, -1) : (c.digits + key).slice(0, max);
  c.setDigits(d);
  c.setNote(null);
  if (d.length === max) full(d);
};

/* ---- the stages ---- */

function welcome(c: Ctx): StageView {
  return {
    icon: 'mark',
    iconSize: 40,
    small: true,
    subBody: true,
    wash: washes.start,
    title: 'Beetle',
    sub: 'A bank that answers when you ask it something. Opening one takes about a minute, and all it needs is your number and your NIN.',
    /* the frame's rows: 42 tall, the glyph 28 with 7 above and below, and 20
       under the last to the mark; on the grid that is 44, and 8 here with
       the band's own 12 */
    above: (
      <View style={{ paddingBottom: 8 }}>
        {WORDS.map((w, i) => (
          <View key={w.word} style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
            <View style={{ width: 36 }}>{i === c.words ? <Icon name={w.icon} size={28} colour={colour.accent} /> : null}</View>
            <Display tone={i === c.words ? 'ink' : 'tertiary'}>{w.word}</Display>
          </View>
        ))}
      </View>
    ),
    bodyKey: 'welcome',
    body: null,
    welcome: true,
  };
}

function number(c: Ctx): StageView {
  const full = async (d: string) => {
    const check = checkPhone(d);
    if (!check.ok) {
      c.setNote({ text: 'That is not a Nigerian mobile number. They start 070, 080, 081, 090 or 091.', tone: 'bad' });
      c.bump();
      return;
    }
    c.setBusy(true);
    c.setNote({ text: 'Sending the six digits…' });
    try {
      await c.app.setPhone(check.phone);
      const r = await auth.requestCode(check.phone);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.go('code');
    } catch {
      c.setNote({ text: 'The text could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'phone-filled',
    tint: washes.number.tone,
    wash: washes.number,
    title: 'Your number',
    sub: 'I will text you six digits to check the number is yours.',
    bodyKey: 'number',
    body: <DigitBody c={c} groups={[4, 3, 4]} />,
    keypad: typing(c, 11, full),
    back: () => c.go('welcome', -1),
  };
}

/* Six digits from a text, on the way in and on the way back in. */
function code(
  c: Ctx,
  o: { phone: string; icon: IconName; tint?: string; wash: { tone: string; height?: number }; title: string; sub: string; onVerified: (token: string) => Promise<void>; back: () => void },
): StageView {
  const resend = async (why?: string) => {
    c.setBusy(true);
    c.setNote({ text: why ?? 'Sending another…' });
    try {
      const r = await auth.requestCode(o.phone);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.setDigits('');
      c.setNote({ text: `Another six digits are on their way to ${groupPhone(o.phone)}.` });
    } catch {
      c.setNote({ text: 'It could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  const full = async (d: string) => {
    c.setBusy(true);
    c.setNote({ text: 'Checking…' });
    try {
      const r = await auth.verifyCode(o.phone, d);
      if (r.ok) {
        c.setNote({ text: 'That is the one.', tone: 'accent' });
        await o.onVerified(r.token);
        return;
      }
      c.bump();
      c.setDigits('');
      if (r.reason === 'expired') c.setNote({ text: 'Those six have expired. Ask for another.', tone: 'bad' });
      else if (r.reason === 'too-many') await resend('Too many tries. A fresh code is on its way.');
      else {
        const n = c.wrong + 1;
        c.setWrong(n);
        if (n >= TRIES) await resend('Three that did not match. A fresh code is on its way.');
        else c.setNote({ text: `Those six did not match. ${TRIES - n === 1 ? 'One more try' : `${TRIES - n} more tries`} before I send another.`, tone: 'bad' });
      }
    } catch {
      c.setNote({ text: 'I could not check them. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: o.icon,
    tint: o.tint,
    wash: o.wash,
    title: o.title,
    sub: o.sub,
    bodyKey: `code:${o.phone}`,
    body: (
      <DigitBody
        c={c}
        groups={[6]}
        max={6}
        secret
        footer={
          <>
            <View style={{ height: 38, justifyContent: 'center' }}>
              {c.wait > 0 ? <Caption tone="tertiary">Send it again in {c.wait}s</Caption> : <More label="I did not get it" onPress={() => resend()} />}
            </View>
          </>
        }
      />
    ),
    keypad: typing(c, 6, full),
    hint: MOCK ? `This build accepts ${MOCK_CODE}. Nothing is texted.` : undefined,
    back: o.back,
  };
}

function numberCode(c: Ctx): StageView {
  const phone = c.app.progress.phone ?? '';
  return code(c, {
    phone,
    icon: 'phone-filled',
    tint: washes.code.tone,
    wash: washes.code,
    title: 'Your number',
    sub: `Six digits, sent to ${groupPhone(phone)} a moment ago.`,
    onVerified: async () => {
      await c.app.markVerified();
      c.go('identity');
    },
    back: () => c.go('number', -1),
  });
}

function who(c: Ctx): StageView {
  const full = async (d: string) => {
    c.setBusy(true);
    c.setNote({ text: 'Asking the register…' });
    try {
      const r = await identity.lookup(d);
      if (r.found) {
        await c.app.setIdentity(d, r.record);
        c.go('confirm');
      } else {
        c.setLastNumber(d);
        c.go('nomatch');
      }
    } catch {
      c.setNote({ text: 'The register did not answer. Try again in a moment.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'id-filled',
    tint: washes.nin.tone,
    wash: washes.nin,
    title: 'Who you are',
    sub: 'Eleven digits from your NIN or your BVN, whichever you know. Your name comes back with them.',
    bodyKey: 'identity',
    body: <DigitBody c={c} groups={[4, 4, 3]} />,
    keypad: typing(c, 11, full),
  };
}

function confirm(c: Ctx): StageView {
  const id = c.app.progress.identity;
  const record = id?.record;
  const name = record ? `${record.firstName} ${record.lastName}` : '';
  return {
    icon: 'id-filled',
    tint: washes.who.tone,
    wash: washes.who,
    title: 'Who you are',
    sub: 'This came back from the record against those digits. I did not type it.',
    bodyKey: 'confirm',
    body: record ? (
      <View style={{ gap: 20 }}>
        <Card style={{ gap: space.s4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Avatar initials={initialsOf(name)} />
            <View style={{ gap: 2 }}>
              <RowText>{name}</RowText>
              <Meta tone="secondary">Born {longDate(record.born)}</Meta>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s3 }}>
            <Body tone="secondary">On the record as</Body>
            <RowText>{record.recordName}</RowText>
          </View>
        </Card>
        <More
          label="Something here is wrong"
          onPress={() => {
            c.setLastNumber(id?.number ?? '');
            c.go('nomatch');
          }}
        />
      </View>
    ) : null,
    bar: {
      label: 'Yes, that is me',
      onPress: async () => {
        await c.app.confirmIdentity();
        c.go('face');
      },
    },
  };
}

function nomatch(c: Ctx): StageView {
  const shown = c.lastNumber ? groupDigits(c.lastNumber, [4, 4, 3]) : 'those digits';
  return {
    icon: 'id-filled',
    tint: washes.nomatch.tone,
    wash: washes.nomatch,
    title: 'Who you are',
    sub: 'Eleven digits from your NIN or your BVN. These ones did not match anything.',
    bodyKey: 'nomatch',
    body: (
      <View style={{ gap: 20 }}>
        <Card style={{ gap: space.s4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4 }}>
            <Icon name="warn-filled" size={28} colour={colour.warn} />
            <RowText>Nothing came back</RowText>
          </View>
          <Meta tone="secondary">No record matches {shown}. One wrong digit is the usual reason, so it is worth reading them again.</Meta>
        </Card>
        <Say>If the digits are right and it still says this, your BVN will work instead. It is the same eleven digits from a different register.</Say>
        <More label="Talk to someone" onPress={() => toast('Talking to a person is not in Beetle yet. Your BVN is the quickest way past this.')} />
      </View>
    ),
    bar: { label: 'Try again', onPress: () => c.go('identity') },
  };
}

function face(c: Ctx): StageView {
  const take = async () => {
    c.setFaceState('checking');
    try {
      /* on a phone this is the device's own face check; on the web, a moment */
      if (Platform.OS !== 'web') {
        const can = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
        if (can) {
          const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Look at the phone', cancelLabel: 'Not now', disableDeviceFallback: true });
          if (!r.success) {
            c.setFaceState('failed');
            return;
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 900));
      }
      await c.app.setFace('enrolled');
      c.go('passcode');
    } catch {
      c.setFaceState('failed');
    }
  };
  const later = async () => {
    await c.app.setFace('later');
    c.go('passcode');
  };
  const failed = c.faceState === 'failed';
  return {
    icon: 'faceid-filled',
    tint: washes.face.tone,
    wash: washes.face,
    title: 'Your face',
    sub: 'One photo, checked against the same record, so that only you can open this again.',
    bodyKey: 'face',
    body: (
      <View style={{ gap: 20 }}>
        <View style={{ alignItems: 'center', gap: space.s5, paddingVertical: space.s6 }}>
          <Icon name={failed ? 'alert' : 'person'} size={56} colour={failed ? colour.bad : colour.textTertiary} />
          <Meta tone={failed ? 'bad' : 'secondary'}>{failed ? 'That did not take. Hold still and look at the camera.' : 'Hold still and look at the camera'}</Meta>
        </View>
        <Aside glyph="eye">The photo is kept on this phone. It is not a profile picture and nobody else sees it.</Aside>
        <More label="Do it later" onPress={later} />
      </View>
    ),
    bar: { label: c.faceState === 'checking' ? 'Hold still…' : failed ? 'Try again' : 'Take it', disabled: c.faceState === 'checking', onPress: take },
  };
}

function passcode(c: Ctx): StageView {
  const birthYear = c.app.progress.identity?.record.birthYear;
  const again = c.first !== null;
  const full = async (d: string) => {
    if (c.first === null) {
      /* the build's keys pass the rules only in the lab: a real account never gets 123456 as its passcode */
      const problem = MOCK && LAB && DEMO_PASSCODES.includes(d) ? null : passcodeProblem(d, { birthYear });
      if (problem) {
        c.setNote({ text: PASSCODE_WORDS[problem], tone: 'bad' });
        c.bump();
        c.setDigits('');
        return;
      }
      c.setFirst(d);
      c.setDigits('');
      return;
    }
    if (d !== c.first) {
      c.setNote({ text: 'They did not match. Start again.', tone: 'bad' });
      c.bump();
      c.setFirst(null);
      c.setDigits('');
      return;
    }
    c.setBusy(true);
    c.setNote({ text: 'Opening your account…' });
    try {
      await c.app.finish(d);
      c.go('ready');
    } catch {
      c.setNote({ text: 'The account could not be opened. Check the network and try again.', tone: 'bad' });
      c.setFirst(null);
      c.setDigits('');
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'lock-filled',
    tint: washes.passcode.tone,
    wash: washes.passcode,
    title: again ? 'Once more' : 'A passcode',
    sub: again ? 'The same six, to be sure.' : 'Six digits. These are what send your money, so pick something nobody watching could guess.',
    bodyKey: 'passcode',
    body: (
      <DigitBody
        c={c}
        groups={[6]}
        max={6}
        secret
        footer={
          /* the frame's row: 8 under the dots, and the line's 20 to the dock */
          <View style={{ paddingTop: 8 }}>
            <Aside>Not your year of birth, and not 123456.</Aside>
          </View>
        }
      />
    ),
    keypad: typing(c, 6, full),
    hint: MOCK && LAB ? `The lab lets ${DEMO_PASSCODES.join(' and ')} through all the same.` : undefined,
    back: again
      ? () => {
          c.setFirst(null);
          c.setDigits('');
        }
      : undefined,
  };
}

/** What the account can do: the last two come on with finishing setting up. */
const canDo = (done: boolean): { text: string; on: boolean }[] => [
  { text: 'Receive money from any Nigerian bank', on: true },
  { text: 'Send up to ₦50,000 a day', on: true },
  { text: 'Buy airtime, data and pay bills', on: true },
  { text: 'Hold dollars', on: done },
  { text: 'Send up to ₦1,000,000 a day', on: done },
];

function ready(c: Ctx): StageView {
  const number = c.app.session ? groupAccount(c.app.session.account.accountNumber) : '';
  const CAN = canDo(c.setup.done);
  return {
    icon: 'tick',
    title: 'Your account is ready',
    small: true,
    inline: true,
    sub: `Your number is ${number}, and money can reach it now.`,
    bodyKey: 'ready',
    body: (
      <View style={{ gap: 12, paddingTop: 4 }}>
        {/* the frame's card: 4 above the first row, the rows 50 with a rule
            drawn inside each but the last, nothing below */}
        <Card style={{ paddingTop: 4, paddingBottom: 0, paddingHorizontal: 16, gap: 0 }}>
          {CAN.map((can, i) => (
            <View key={can.text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, height: 50, borderBottomWidth: i < CAN.length - 1 ? 1 : 0, borderBottomColor: colour.rule }}>
              <Tick on={can.on} size={20} delay={motion.markWait + 90 * (i + 1)} />
              <Meta tone={can.on ? 'ink' : 'tertiary'} style={{ flex: 1 }}>
                {can.text}
              </Meta>
            </View>
          ))}
        </Card>
        <Tap accessibilityRole="button" accessibilityLabel={c.setup.done ? 'Everything is on' : 'Finish setting up'} onPress={() => (c.setup.done ? c.go('full') : c.go('address'))}>
          <Card outline style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4, paddingVertical: space.s3, paddingHorizontal: space.s4, borderRadius: 16 }}>
            <Icon name="shield-filled" size={24} colour={colour.ink} />
            <View style={{ flex: 1 }}>
              <Label>{c.setup.done ? 'Everything is on' : 'Finish setting up'}</Label>
              <Caption tone="tertiary">{c.setup.done ? 'A million a day, dollars and borrowing' : 'Two minutes, and the last two come on'}</Caption>
            </View>
            <Icon name="chevron" size={16} colour={colour.textTertiary} />
          </Card>
        </Tap>
      </View>
    ),
    bar: { label: 'Take me in', onPress: () => c.toHome(() => c.app.startOver()) },
  };
}

function signin(c: Ctx): StageView {
  const full = async (d: string) => {
    const check = checkPhone(d);
    if (!check.ok) {
      c.setNote({ text: 'That is not a Nigerian mobile number.', tone: 'bad' });
      c.bump();
      return;
    }
    c.setBusy(true);
    c.setNote({ text: 'Looking for the account…' });
    try {
      if (!(await auth.knownPhone(check.phone))) {
        c.setNote({ text: 'I do not know this number yet.', tone: 'bad' });
        c.setUnknown(true);
        return;
      }
      c.setPhoneIn(check.phone);
      const r = await auth.requestCode(check.phone);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.go('signcode');
    } catch {
      c.setNote({ text: 'The text could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'mark',
    wash: washes.signin,
    title: 'Welcome back',
    sub: 'Your number, and then six digits from a text. Nothing else, because the account is already yours.',
    bodyKey: 'signin',
    body: <DigitBody c={c} groups={[4, 3, 4]} footer={c.unknown ? <More label="Open an account with it" onPress={() => c.go('number')} /> : undefined} />,
    keypad: (key: string) => {
      c.setUnknown(false);
      typing(c, 11, full)(key);
    },
    back: () => c.go('welcome', -1),
  };
}

function signcode(c: Ctx): StageView {
  const phone = c.phoneIn;
  return code(c, {
    phone,
    icon: 'mark',
    wash: washes.signcode,
    title: 'Six digits',
    sub: `Sent to ${groupPhone(phone)} a moment ago. On a phone I already know, your passcode alone would have been enough.`,
    onVerified: async token => {
      const s = await auth.signIn(phone, token);
      if (!s) {
        c.go('signin', -1);
        return;
      }
      c.toHome(() => c.app.signIn(s));
    },
    back: () => c.go('signin', -1),
  });
}

export function buildView(c: Ctx): StageView {
  switch (c.stage) {
    case 'welcome':
      return welcome(c);
    case 'number':
      return number(c);
    case 'code':
      return numberCode(c);
    case 'identity':
      return who(c);
    case 'confirm':
      return confirm(c);
    case 'nomatch':
      return nomatch(c);
    case 'face':
      return face(c);
    case 'passcode':
      return passcode(c);
    case 'ready':
      return ready(c);
    case 'signin':
      return signin(c);
    case 'signcode':
      return signcode(c);
    case 'address':
      return address(c);
    case 'idcard':
      return idcard(c);
    case 'income':
      return income(c);
    case 'full':
      return full(c);
  }
}
