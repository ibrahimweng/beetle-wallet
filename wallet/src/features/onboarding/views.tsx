/* What each stage of the way in shows: the glyph and its colour, the
   title and the line under it, what sits beneath, what waits at the
   bottom, and what a tap does. Every stage is a plain function of the
   screen's state, so the choreography in WayIn.tsx can move the pieces
   without knowing which step they belong to. The rules and the mock
   services are the same ones the separate screens used.

   Since Round 30 (the owner's word) each stage's title is the name of what
   it asks for (Enter mobile number, OTP verification, BVN number,
   Password, Face scan and username), and opening an account asks for no
   more than it has to: a mobile number or an email, its code, the BVN (or
   a NIN slip or a voter's card, which fill in the rest), a password, and
   last the face and the username together. Logging in and getting an
   account back are in signViews.tsx. */
import React, { ReactNode, useEffect } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import {
  Aside,
  Avatar,
  Body,
  Button,
  Caption,
  Card,
  Field,
  Icon,
  Label,
  Meta,
  More,
  Pips,
  Row as RowText,
  Say,
  Swap,
  Tap,
  Tick,
  Toggle,
  colour,
  motion,
  night,
  space,
  toast,
  useStill,
  washes,
} from '../../design';
import { TextBox } from '../../design/TextBox';
import type { IconName } from '../../icons';
import { auth, identity, DEMO_ACCOUNT, DEMO_PASSWORDS, MOCK, MOCK_CODE, type Account } from '../../services';
import type { DocumentKind } from '../../services/identity';
import { LAB } from '../../lab/enabled';
import { groupAccount, groupDigits, groupPhone, initialsOf, longDate } from '../../lib/format';
import { checkPhone, isEmail, passwordProblem, PASSWORD_RULES, PASSWORD_WORDS, usernameProblem } from './validation';
import type { useApp } from './store';
import type { Stage } from './stages';
import type { Known } from './devices';
import type { Income, Setup } from '../setup/setup';
import { address, full, idcard, income } from './setupViews';
import { putSetup } from '../setup/store';
import { signViews } from './signViews';

export type Note = { text: string; tone?: 'secondary' | 'bad' | 'accent' } | null;
export type Bar = { label: string; onPress: () => void; disabled?: boolean; /** Back at the bottom left, beside the button, where a frame draws it there */ back?: () => void };

export type StageView = {
  /** the glyph above the title, and its colour; the welcome has none (Round 27). The washes of colour at the top are
      gone (Round 28, the owner's word): the coin rises into their place */
  icon: IconName | 'tick' | 'none';
  tint?: string;
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
  /** a stage that takes words gets the phone's keyboard, and the screen rides up over it so the box being typed into and
      the button stay in view (Round 30) */
  words?: boolean;
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

export type FaceState = 'idle' | 'checking' | 'failed' | 'done';
export type Free = 'checking' | 'free' | 'taken' | 'bad' | null;

export type Ctx = {
  stage: Stage;
  app: ReturnType<typeof useApp>;
  still: boolean;
  digits: string;
  setDigits: (d: string) => void;
  /** what is typed into the stage's box: an email, a password, a username */
  text: string;
  setText: (s: string) => void;
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
  faceState: FaceState;
  setFaceState: (s: FaceState) => void;
  /** the number or email typed belongs to nobody (Log in), or to somebody already (Sign up) */
  unknown: boolean;
  setUnknown: (b: boolean) => void;
  /** Log in: the number or email the code went to, and the account it is */
  contact: string;
  setContact: (p: string) => void;
  who: Account | null;
  setWho: (a: Account | null) => void;
  /** the account this phone last knew, for Log in's Face ID; and whether somebody asked for another */
  known: Known | null;
  another: boolean;
  setAnother: (b: boolean) => void;
  lastNumber: string;
  setLastNumber: (n: string) => void;
  /** Google or Apple, on the stage that stands in for them */
  provider: 'google' | 'apple';
  setProvider: (p: 'google' | 'apple') => void;
  /** where Google or Apple was asked from: opening an account, or logging in */
  providerFor: 'signup' | 'login';
  setProviderFor: (p: 'signup' | 'login') => void;
  /** a NIN slip or a voter's card, and the photo of it being read */
  docKind: DocumentKind;
  setDocKind: (k: DocumentKind) => void;
  docState: 'idle' | 'checking';
  takeDoc: () => void;
  /** the username's check, and whether a passkey is saved with the account */
  free: Free;
  setFree: (f: Free) => void;
  passkey: boolean;
  setPasskey: (b: boolean) => void;
  /** getting an account back: whose it is, what changed, and the new email on its way to its code */
  rec: { account?: Account; changed?: 'email' | 'password'; email?: string };
  setRec: (r: { account?: Account; changed?: 'email' | 'password'; email?: string }) => void;
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
  /** leave the screen for home, after doing something; `tour`: a new account, shown round home once it is there */
  toHome: (after?: () => Promise<void>, opts?: { tour?: boolean }) => void;
};

export const TRIES = 3;

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
export function NoteLine({ note, style }: { note: Note; style?: StyleProp<ViewStyle> }) {
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
export function DigitBody({ c, groups, secret = false, max = 11, footer }: { c: Ctx; groups: number[]; secret?: boolean; max?: number; footer?: ReactNode }) {
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

/* A box to type words into, with what went wrong under it: an email, a password, a username. */
export function WordsBody({ c, children, footer }: { c: Ctx; children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Shake n={c.shake}>{children}</Shake>
      {c.note ? <NoteLine note={c.note} /> : null}
      {footer}
    </View>
  );
}

/* A key on the pad: one more digit, or one fewer, and the moment the last
   one lands the stage takes it from there. */
export const typing = (c: Ctx, max: number, full: (d: string) => void) => (key: string) => {
  if (c.busy) return;
  /* a field already full takes no more digits: a digit pressed to correct it would otherwise send what is there again
     (Round 29: back on the number from the six digits, any key sent the old number off once more) */
  if (key !== 'del' && c.digits.length >= max) return;
  const d = key === 'del' ? c.digits.slice(0, -1) : (c.digits + key).slice(0, max);
  c.setDigits(d);
  c.setNote(null);
  if (d.length === max) full(d);
};

/** A mobile number or an email as it is shown: the number in its groups. */
export const shownContact = (to: string) => (/^\d{11}$/.test(to) ? groupPhone(to) : to);
/** A mobile number with its middle hidden, for a screen anybody holding the phone can see. */
export const maskPhone = (p: string) => `${p.slice(0, 4)} ••• ${p.slice(-4)}`;

/* The face: the phone's own check where it has one and it is set up, a moment where it has none (the web, a phone
   without Face ID). The live scan matched to the BVN's photo is the real service's; this build stands in for it. */
export async function scanFace(prompt: string): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      const can = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      if (can) {
        const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: 'Not now', disableDeviceFallback: true });
        return r.success;
      }
    }
    await new Promise(r => setTimeout(r, 900));
    return true;
  } catch {
    return false;
  }
}

/* Google and Apple, side by side: a stand-in in this build (see the provider stage). Apple is there because the App
   Store asks for it wherever Google is offered. */
export function Providers({ c, purpose }: { c: Ctx; purpose: 'signup' | 'login' }) {
  const pick = (p: 'google' | 'apple') => {
    c.setProvider(p);
    c.setProviderFor(purpose);
    c.go('provider');
  };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }} testID="with-google">
        <Button label="Google" tone="grey" size={44} onPress={() => pick('google')} />
      </View>
      <View style={{ flex: 1 }} testID="with-apple">
        <Button label="Apple" tone="grey" size={44} onPress={() => pick('apple')} />
      </View>
    </View>
  );
}

/* The rules a password has to meet, ticked as they are met. */
function Rules({ password }: { password: string }) {
  const met = (rule: (typeof PASSWORD_RULES)[number]['problem']) => (rule === 'short' ? password.length >= 8 : rule === 'letters' ? /[a-z]/i.test(password) : /\d/.test(password));
  return (
    <View style={{ gap: 8 }} testID="password-rules">
      {PASSWORD_RULES.map(r => (
        <View key={r.problem} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Tick on={met(r.problem)} size={18} />
          <Meta tone={met(r.problem) ? 'ink' : 'tertiary'}>{r.words}</Meta>
        </View>
      ))}
    </View>
  );
}
export const meetsRules = (pw: string) => pw.length >= 8 && /[a-z]/i.test(pw) && /\d/.test(pw);

/** The password box and its rules, for a new account and for a new password after getting one back. */
export function passwordBody(c: Ctx, label = 'Password') {
  return (
    <WordsBody c={c}>
      <View style={{ gap: 12 }}>
        <TextBox
          label={label}
          value={c.text}
          onChangeText={t => {
            c.setText(t);
            c.setNote(null);
          }}
          secret
          autoFocus
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="done"
          placeholder="Letters and a number"
          testID="password"
        />
        <Rules password={c.text} />
      </View>
    </WordsBody>
  );
}

/** What the password typed is refused for, in words, or null: the lab lets its two through. */
export function refusePassword(c: Ctx, record?: { firstName: string; lastName: string; birthYear?: number }): string | null {
  if (MOCK && LAB && DEMO_PASSWORDS.includes(c.text)) return null;
  const problem = passwordProblem(c.text, { names: record ? [record.firstName, record.lastName] : [], birthYear: record?.birthYear });
  return problem ? PASSWORD_WORDS[problem] : null;
}

/* Six digits from a text or an email, on the way in, on the way back in, and getting an account back. */
export function code(c: Ctx, o: { to: string; icon: IconName; tint?: string; title?: string; sub?: string; onVerified: (token: string) => Promise<void>; back?: () => void }): StageView {
  const where = shownContact(o.to);
  const resend = async (why?: string) => {
    c.setBusy(true);
    c.setNote({ text: why ?? 'Sending another…' });
    try {
      const r = await auth.requestCode(o.to);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.setDigits('');
      c.setNote({ text: `Another six digits are on their way to ${where}.` });
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
      const r = await auth.verifyCode(o.to, d);
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
    title: o.title ?? 'OTP verification',
    sub: o.sub ?? `Enter the six digits sent to ${where}.`,
    bodyKey: `code:${o.to}`,
    body: (
      <DigitBody
        c={c}
        groups={[6]}
        max={6}
        secret
        footer={
          <View style={{ height: 38, justifyContent: 'center' }}>
            {c.wait > 0 ? <Caption tone="tertiary">Send it again in {c.wait}s</Caption> : <More label="I did not get it" onPress={() => resend()} />}
          </View>
        }
      />
    ),
    keypad: typing(c, 6, full),
    hint: MOCK ? `This build accepts ${MOCK_CODE}. Nothing is sent.` : undefined,
    back: o.back,
  };
}

/* ---- opening an account ---- */

/* The first screen, to the owner's frame (1463:14533, Round 27): on the
   dark, the logo and its name at the top, the punch-hole coin turning in
   the room under them, then the title, its line, and since Round 30 the
   two ways in as two buttons, Sign up and Log in under it (WayIn.tsx). */
function welcome(_c: Ctx): StageView {
  return {
    icon: 'none',
    small: true,
    subBody: true,
    title: 'Intelligent finance',
    sub: 'A bank that answers when you ask it something. Opening one takes about a minute: your mobile number, a code and your BVN.',
    bodyKey: 'welcome',
    body: null,
    welcome: true,
  };
}

/** Is this number stage the mobile number added after an email, rather than the first thing asked? */
const adding = (c: Ctx) => !!c.app.progress.identityConfirmed && !c.app.progress.phoneVerified && c.app.progress.via !== undefined && c.app.progress.via !== 'phone';

function number(c: Ctx): StageView {
  const add = adding(c);
  const full = (d: string) => sendNumber(c, d);
  return {
    icon: 'phone-filled',
    tint: washes.number.tone,
    title: 'Enter mobile number',
    sub: add ? 'A BVN is tied to a mobile number, so I need yours as well. I will text it a code.' : 'I will text it a code to check the number is yours.',
    bodyKey: add ? 'number:add' : 'number',
    body: (
      <DigitBody
        c={c}
        groups={[4, 3, 4]}
        footer={
          c.unknown ? (
            /* the number has an account already: logging in is one tap, the number carried over */
            <More label="Log in with this number" onPress={() => logInWith(c, c.digits)} />
          ) : add ? undefined : (
            <View style={{ gap: 12 }}>
              <More label="Use email instead" onPress={() => c.go('email')} />
              <Providers c={c} purpose="signup" />
            </View>
          )
        }
      />
    ),
    keypad: key => {
      c.setUnknown(false);
      typing(c, 11, full)(key);
    },
    back: add ? () => c.go('details', -1) : () => c.go('welcome', -1),
  };
}

/** Log in with a number typed on Sign up: carried over, and its code sent. */
export function logInWith(c: Ctx, digits: string) {
  c.go('signin');
  c.setAnother(true);
  c.setDigits(digits);
  void sendLogInCode(c, digits);
}

/* The number typed, checked, and the six digits sent to it: the first thing asked, or the number added after an email;
   and from logging in with a number that has no account yet ("Open an account with it", which carries it over). */
export async function sendNumber(c: Ctx, d: string) {
  const check = checkPhone(d);
  if (!check.ok) {
    c.setNote({ text: 'That is not a Nigerian mobile number. They start 070, 080, 081, 090 or 091.', tone: 'bad' });
    c.bump();
    return;
  }
  c.setBusy(true);
  c.setNote({ text: 'Sending the code…' });
  try {
    /* one account to a number: a number that has one is asked to log in, never handed a second account */
    if (await auth.findAccount(check.phone)) {
      c.setNote({ text: 'This number already has a Beetle account.', tone: 'bad' });
      c.setUnknown(true);
      return;
    }
    if (adding(c)) await c.app.addPhone(check.phone);
    else await c.app.begin('phone', check.phone);
    const r = await auth.requestCode(check.phone);
    c.setWait(r.resendAfterSeconds);
    c.setWrong(0);
    c.go('code');
  } catch {
    c.setNote({ text: 'The text could not be sent. Check the network and try again.', tone: 'bad' });
  } finally {
    c.setBusy(false);
  }
}

function email(c: Ctx): StageView {
  const ok = isEmail(c.text);
  const send = async () => {
    if (!ok || c.busy) return;
    const to = c.text.trim().toLowerCase();
    c.setBusy(true);
    c.setNote({ text: 'Sending the code…' });
    try {
      if (await auth.findAccount(to)) {
        c.setNote({ text: 'This email already has a Beetle account. Log in with it instead.', tone: 'bad' });
        c.setUnknown(true);
        return;
      }
      await c.app.begin('email', to);
      const r = await auth.requestCode(to);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.go('code');
    } catch {
      c.setNote({ text: 'The email could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'mail-filled',
    tint: washes.number.tone,
    title: 'Enter email',
    sub: 'I will email it a code to check it is yours. Your mobile number comes later, with your BVN.',
    bodyKey: 'email',
    words: true,
    body: (
      <WordsBody
        c={c}
        footer={
          <View style={{ gap: 12 }}>
            {c.unknown ? (
              /* the email has an account already: logging in with it is one tap, the email carried over */
              <More
                label="Log in with this email"
                onPress={() => {
                  const to = c.text;
                  c.go('signemail');
                  c.setText(to);
                }}
              />
            ) : null}
            <More label="Use mobile number instead" onPress={() => c.go('number', -1)} />
            {c.unknown ? null : <Providers c={c} purpose="signup" />}
          </View>
        }
      >
        <TextBox
          label="Email"
          value={c.text}
          onChangeText={t => {
            c.setText(t);
            c.setNote(null);
            c.setUnknown(false);
          }}
          autoFocus
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={send}
          placeholder="you@example.com"
          testID="email"
        />
      </WordsBody>
    ),
    bar: { label: c.busy ? 'Sending…' : 'Send the code', onPress: send, disabled: !ok || c.busy },
    back: () => c.go('number', -1),
  };
}

/* Google or Apple. In this build a stand-in for their own sheet, showing what it hands over: a name and an email they
   have already checked, so there is no code for the email. The real one needs a development build of the app and
   Beetle's keys with Google and Apple; Expo Go cannot carry them. */
const providerName = (p: 'google' | 'apple') => (p === 'google' ? 'Google' : 'Apple');
export const PROVIDER_EMAIL = { google: 'ibrahim.musa@gmail.com', apple: 'ibrahim.musa@icloud.com' } as const;

function provider(c: Ctx): StageView {
  const name = providerName(c.provider);
  const login = c.providerFor === 'login';
  /* logging in, the stand-in hands over the email on the demo account, so it finds one */
  const handed = login ? (DEMO_ACCOUNT.email ?? '') : PROVIDER_EMAIL[c.provider];
  const go = async () => {
    c.setBusy(true);
    try {
      if (login) {
        const account = await auth.findAccount(handed);
        if (!account) {
          c.setNote({ text: `No Beetle account has this ${name} email. Open one, or log in with your number.`, tone: 'bad' });
          return;
        }
        /* Google or Apple stands in for the code; the password is still asked, and the face on a phone it has not seen */
        c.setContact(account.phone);
        c.setWho(account);
        c.go('signpass');
        return;
      }
      if (await auth.findAccount(handed)) {
        c.setNote({ text: `This ${name} email already has a Beetle account. Log in instead.`, tone: 'bad' });
        return;
      }
      await c.app.beginWith(c.provider, handed);
      c.go('bvn');
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'mail-filled',
    tint: washes.number.tone,
    title: `Continue with ${name}`,
    sub: `${name} has already checked the email, so there is no code for it. Beetle gets your name and email, nothing else.`,
    bodyKey: `provider:${c.provider}:${c.providerFor}`,
    body: (
      <View style={{ gap: 16 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }} testID="provider-account">
          <Avatar initials="IM" />
          <View style={{ gap: 2, flex: 1 }}>
            <RowText>Ibrahim Musa</RowText>
            <Meta tone="secondary">{handed}</Meta>
          </View>
        </Card>
        {c.note ? <NoteLine note={c.note} /> : null}
        <Aside glyph="eye">{`A stand-in for ${name}’s own sheet. The real one comes with the app’s own build and Beetle’s keys with ${name}.`}</Aside>
      </View>
    ),
    bar: { label: c.busy ? 'Just a moment…' : 'Continue as Ibrahim', onPress: go, disabled: c.busy },
    back: () => c.go(login ? 'signin' : 'number', -1),
  };
}

/* The code to the number or the email the way in began with, or to the number added after an email. */
function signupCode(c: Ctx): StageView {
  const p = c.app.progress;
  const phone = !!p.phone && !p.phoneVerified && (p.via === 'phone' || !!p.identityConfirmed);
  const to = phone ? (p.phone ?? '') : (p.email ?? '');
  return code(c, {
    to,
    icon: phone ? 'phone-filled' : 'mail-filled',
    tint: washes.code.tone,
    onVerified: async () => {
      await c.app.markVerified(phone ? 'phone' : 'email');
      c.go(phone && p.identityConfirmed ? 'password' : 'bvn');
    },
    back: () => c.go(phone ? 'number' : 'email', -1),
  });
}

function bvn(c: Ctx): StageView {
  const full = async (d: string) => {
    c.setBusy(true);
    c.setNote({ text: 'Asking the register…' });
    try {
      const r = await identity.lookup(d);
      if (r.found) {
        await c.app.setIdentity(d, r.record, 'bvn');
        c.go('details');
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
    title: 'BVN number',
    sub: 'Eleven digits. Dial *565*0# from the number your bank has to see it. Your name and date of birth come back with it.',
    bodyKey: 'bvn',
    body: <DigitBody c={c} groups={[4, 4, 3]} footer={<More label="Use my NIN slip or voter’s card instead" onPress={() => c.go('document')} />} />,
    keypad: typing(c, 11, full),
  };
}

/* The shortcut (the owner's word): a photo of a NIN slip or a voter's card stands in for the BVN and gives the rest of
   the record with it, the address and the email too, so finishing setting up is already done. */
function documentStage(c: Ctx): StageView {
  const reading = c.docState === 'checking';
  const kinds: { id: DocumentKind; label: string }[] = [
    { id: 'nin', label: 'NIN slip' },
    { id: 'voters', label: 'Voter’s card' },
  ];
  return {
    icon: 'camera-filled',
    tint: washes.idcard.tone,
    title: 'NIN slip or voter’s card',
    sub: 'A photo of either fills in your name, date of birth, address and email, and skips finishing setting up later.',
    bodyKey: 'document',
    body: (
      <View style={{ gap: 12 }}>
        <View testID="document-kinds">
          {kinds.map((k, i) => (
            <Tap
              key={k.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: c.docKind === k.id }}
              accessibilityLabel={k.label}
              onPress={() => c.setDocKind(k.id)}
              style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderBottomWidth: i < kinds.length - 1 ? 1 : 0, borderBottomColor: night.rule }}
            >
              <Body style={{ flex: 1 }}>{k.label}</Body>
              {c.docKind === k.id ? <Tick on size={22} /> : <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: night.ruleStrong }} />}
            </Tap>
          ))}
        </View>
        <Card style={{ paddingVertical: 12, alignItems: 'center', gap: 6 }} testID="docframe">
          <View style={{ width: 200, height: 124, borderRadius: 12, borderWidth: 2, borderColor: reading ? colour.good : colour.accent }} />
          <Meta tone="tertiary">{reading ? 'Reading it…' : 'Lay it flat and fill the frame'}</Meta>
        </Card>
        {c.note ? <NoteLine note={c.note} /> : null}
      </View>
    ),
    bar: { label: reading ? 'Reading…' : 'Take a photo', onPress: c.takeDoc, disabled: reading },
    back: () => c.go('bvn', -1),
  };
}

const FROM_WORDS = { bvn: 'BVN', nin: 'NIN slip', voters: 'voter’s card' } as const;

function details(c: Ctx): StageView {
  const id = c.app.progress.identity;
  const record = id?.record;
  const name = record ? `${record.firstName} ${record.lastName}` : '';
  const line = (label: string, value: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s4 }}>
      <Body tone="secondary" style={{ flexShrink: 0 }}>
        {label}
      </Body>
      <RowText style={{ flex: 1, textAlign: 'right' }}>{value}</RowText>
    </View>
  );
  return {
    icon: 'id-filled',
    tint: washes.who.tone,
    title: 'Confirm your details',
    sub: `This came back from the register against your ${FROM_WORDS[id?.from ?? 'bvn']}. I did not type it.`,
    bodyKey: 'details',
    body: record ? (
      <View style={{ gap: 20 }}>
        <Card style={{ gap: space.s4 }} testID="details">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }}>
            <Avatar initials={initialsOf(name)} />
            <View style={{ gap: 2 }}>
              <RowText>{name}</RowText>
              <Meta tone="secondary">Born {longDate(record.born)}</Meta>
            </View>
          </View>
          {line('On the record as', record.recordName)}
          {record.address ? line('Lives at', record.address) : null}
          {record.email && id?.from !== 'bvn' ? line('Email', record.email) : null}
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
        c.go(c.app.progress.phone ? 'password' : 'number');
      },
    },
  };
}

function nomatch(c: Ctx): StageView {
  const shown = c.lastNumber ? groupDigits(c.lastNumber, [4, 4, 3]) : 'those digits';
  return {
    icon: 'id-filled',
    tint: washes.nomatch.tone,
    title: 'BVN number',
    sub: 'Eleven digits from your bank. These ones did not match anything.',
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
        <Say>If the digits are right and it still says this, a photo of your NIN slip or voter’s card will do instead.</Say>
        <More label="Use my NIN slip or voter’s card instead" onPress={() => c.go('document')} />
      </View>
    ),
    bar: { label: 'Try again', onPress: () => c.go('bvn') },
  };
}

function password(c: Ctx): StageView {
  const record = c.app.progress.identity?.record;
  const save = async () => {
    if (!meetsRules(c.text) || c.busy) return;
    const refused = refusePassword(c, record);
    if (refused) {
      c.setNote({ text: refused, tone: 'bad' });
      c.bump();
      return;
    }
    c.setBusy(true);
    try {
      await c.app.setPassword(c.text);
      c.go('finish');
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'lock-filled',
    tint: washes.passcode.tone,
    title: 'Password',
    sub: 'At least eight letters and numbers. It opens Beetle and sends your money, so not your name or your birthday.',
    bodyKey: 'password',
    words: true,
    body: passwordBody(c),
    bar: { label: 'Continue', onPress: save, disabled: !meetsRules(c.text) || c.busy },
    hint: MOCK && LAB ? `The lab takes ${DEMO_PASSWORDS[1]} as well.` : undefined,
  };
}

/* The last step (the owner's word): the face and the username on one screen. The face is scanned live and matched to
   the BVN's photo, so only its owner can get the account back later; the username is the $tag people pay. */
function UsernameCheck({ c }: { c: Ctx }) {
  const name = c.text;
  useEffect(() => {
    const wrong = usernameProblem(name);
    if (wrong) {
      c.setFree(name ? 'bad' : null);
      return;
    }
    c.setFree('checking');
    let live = true;
    const t = setTimeout(() => {
      void auth.usernameFree(name).then(free => live && c.setFree(free ? 'free' : 'taken'));
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const USERNAME_WORDS = { short: 'At least three letters.', long: 'Twenty at most.', chars: 'Small letters, numbers and underscores, starting with a letter.' } as const;

function finish(c: Ctx): StageView {
  const p = c.app.progress;
  const face = c.faceState;
  const problem = usernameProblem(c.text);
  const note =
    c.free === 'checking'
      ? 'Checking…'
      : c.free === 'free'
        ? `$${c.text} is yours to take.`
        : c.free === 'taken'
          ? `$${c.text} is taken. Try another.`
          : problem && c.text
            ? USERNAME_WORDS[problem]
            : 'What people type to pay you.';
  const scan = async () => {
    c.setFaceState('checking');
    c.setFaceState((await scanFace('Look at the phone')) ? 'done' : 'failed');
  };
  const open = async () => {
    if (face !== 'done' || c.free !== 'free' || c.busy) return;
    c.setBusy(true);
    c.setNote({ text: 'Opening your account…' });
    try {
      const s = await c.app.finish({ username: c.text, passkey: c.passkey });
      /* a NIN slip or a voter's card gave the address and the ID: finishing setting up is done already */
      const id = p.identity;
      if (id && id.from && id.from !== 'bvn') {
        const [street, ...rest] = (id.record.address ?? '').split(', ');
        putSetup(s.account.accountNumber, { address: { street: street ?? '', area: rest.join(', ') }, id: { name: id.record.recordName, number: groupDigits(id.number, [4, 4, 3]) }, done: true });
      }
      c.go('ready');
    } catch {
      c.setNote({ text: 'The account could not be opened. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'faceid-filled',
    tint: washes.face.tone,
    title: 'Face scan and username',
    sub: 'The last step. Your face, matched to your BVN photo so only you can get back in, and the name people pay.',
    bodyKey: 'finish',
    words: true,
    body: (
      <View style={{ gap: 12 }}>
        <UsernameCheck c={c} />
        <Tap accessibilityRole="button" accessibilityLabel={face === 'done' ? 'Face scanned' : 'Scan my face'} onPress={face === 'done' || face === 'checking' ? undefined : scan} testID="scan-face">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4, paddingVertical: space.s3 }}>
            {face === 'done' ? <Tick on size={28} /> : <Icon name={face === 'failed' ? 'alert' : 'faceid-filled'} size={28} colour={face === 'failed' ? colour.bad : night.ink} />}
            <View style={{ flex: 1 }}>
              <Label>{face === 'done' ? 'Face scanned' : face === 'checking' ? 'Hold still…' : face === 'failed' ? 'That did not take' : 'Scan my face'}</Label>
              <Caption tone="tertiary">{face === 'done' ? 'Matched to your BVN photo' : 'Look at the phone in good light'}</Caption>
            </View>
            {face === 'done' ? null : <Icon name="chevron" size={16} colour={night.tertiary} />}
          </Card>
        </Tap>
        <TextBox
          label="Username"
          prefix="$"
          value={c.text}
          onChangeText={t => c.setText(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          autoComplete="username"
          textContentType="username"
          returnKeyType="done"
          maxLength={20}
          note={note}
          bad={c.free === 'taken' || c.free === 'bad'}
          testID="username"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }} testID="passkey-row">
          <View style={{ flex: 1 }}>
            <Label>Save a passkey on this phone</Label>
            <Caption tone="tertiary">Log in with Face ID next time, no password</Caption>
          </View>
          <Toggle value={c.passkey} onChange={c.setPasskey} label="Save a passkey on this phone" testID="passkey" />
        </View>
        {c.note ? <NoteLine note={c.note} /> : null}
      </View>
    ),
    bar: { label: c.busy ? 'Opening…' : 'Open my account', onPress: open, disabled: face !== 'done' || c.free !== 'free' || c.busy },
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
  const account = c.app.session?.account;
  const number = account ? groupAccount(account.accountNumber) : '';
  const CAN = canDo(c.setup.done);
  return {
    icon: 'tick',
    title: 'Your account is ready',
    small: true,
    inline: true,
    sub: account?.username ? `Your number is ${number}, and $${account.username} is yours. Money can reach either now.` : `Your number is ${number}, and money can reach it now.`,
    bodyKey: 'ready',
    body: (
      <View style={{ gap: 12, paddingTop: 4 }}>
        {/* the frame's card: 4 above the first row, the rows 50 with a rule
            drawn inside each but the last, nothing below */}
        <Card style={{ paddingTop: 4, paddingBottom: 0, paddingHorizontal: 16, gap: 0 }}>
          {CAN.map((can, i) => (
            <View key={can.text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, height: 50, borderBottomWidth: i < CAN.length - 1 ? 1 : 0, borderBottomColor: night.rule }}>
              <Tick on={can.on} size={20} delay={motion.markWait + 90 * (i + 1)} />
              <Meta tone={can.on ? 'ink' : 'tertiary'} style={{ flex: 1 }}>
                {can.text}
              </Meta>
            </View>
          ))}
        </Card>
        <Tap accessibilityRole="button" accessibilityLabel={c.setup.done ? 'Everything is on' : 'Finish setting up'} onPress={() => (c.setup.done ? c.go('full') : c.go('address'))}>
          <Card outline style={{ flexDirection: 'row', alignItems: 'center', gap: space.s4, paddingVertical: space.s3, paddingHorizontal: space.s4, borderRadius: 16 }}>
            <Icon name="shield-filled" size={24} colour={night.ink} />
            <View style={{ flex: 1 }}>
              <Label>{c.setup.done ? 'Everything is on' : 'Finish setting up'}</Label>
              <Caption tone="tertiary">{c.setup.done ? 'A million a day, dollars and borrowing' : 'Two minutes, and the last two come on'}</Caption>
            </View>
            <Icon name="chevron" size={16} colour={night.tertiary} />
          </Card>
        </Tap>
      </View>
    ),
    bar: { label: 'Take me in', onPress: () => c.toHome(() => c.app.startOver(), { tour: true }) },
  };
}

/** Somebody on Log in who tried a number with no account: open one with it, the number carried over. */
export function openWith(c: Ctx, digits: string) {
  c.go('number');
  c.setDigits(digits);
  void sendNumber(c, digits);
}

/** The code for Log in, to a number that has an account. */
export async function sendLogInCode(c: Ctx, d: string) {
  const check = checkPhone(d);
  if (!check.ok) {
    c.setNote({ text: 'That is not a Nigerian mobile number.', tone: 'bad' });
    c.bump();
    return;
  }
  c.setBusy(true);
  c.setNote({ text: 'Looking for the account…' });
  try {
    const account = await auth.findAccount(check.phone);
    if (!account) {
      c.setNote({ text: 'There is no account on this number yet.', tone: 'bad' });
      c.setUnknown(true);
      return;
    }
    c.setContact(check.phone);
    c.setWho(account);
    const r = await auth.requestCode(check.phone);
    c.setWait(r.resendAfterSeconds);
    c.setWrong(0);
    c.go('signcode');
  } catch {
    c.setNote({ text: 'The text could not be sent. Check the network and try again.', tone: 'bad' });
  } finally {
    c.setBusy(false);
  }
}

export function buildView(c: Ctx): StageView {
  switch (c.stage) {
    case 'welcome':
      return welcome(c);
    case 'number':
      return number(c);
    case 'email':
      return email(c);
    case 'provider':
      return provider(c);
    case 'code':
      return signupCode(c);
    case 'bvn':
      return bvn(c);
    case 'document':
      return documentStage(c);
    case 'details':
      return details(c);
    case 'nomatch':
      return nomatch(c);
    case 'password':
      return password(c);
    case 'finish':
      return finish(c);
    case 'ready':
      return ready(c);
    case 'address':
      return address(c);
    case 'idcard':
      return idcard(c);
    case 'income':
      return income(c);
    case 'full':
      return full(c);
    default:
      return signViews(c);
  }
}
