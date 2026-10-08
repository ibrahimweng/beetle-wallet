/* Logging in, and getting an account back, as stages of the way in (Round
   30, the owner's word). Easy for the owner, and no way through for anybody
   else:

   - On a phone that knows the account, Face ID alone (or its passkey).
   - Anywhere else, a code to the number or the email, then the password
     (Google or Apple can stand in for the code, never for the password),
     and the first time on that phone a live face scan. A password and a
     code taken off somebody are still not enough on a stranger's phone.
     Wrong passwords shut the gate for longer each time (passcode/check).

   - Lost the email, or the password: a code to the account's mobile
     number, its BVN, and a live face scan matched to the BVN's photo, all
     three, before anything can change. A new email gets its own code. Then
     for a day sending is capped at ₦20,000, nobody new is paid, and the old
     email and the phone are told, with This wasn't me on what they are
     sent, which freezes the account. Three wrong BVNs pause getting it back
     for a day. Without the phone, it is done by a person, never here. */
import React from 'react';
import { View } from 'react-native';
import { Aside, Avatar, Caption, Card, Icon, Label, Meta, More, Row as RowText, Tap, colour, night, space, toast, washes } from '../../design';
import { TextBox } from '../../design/TextBox';
import { auth, DEMO_PASSWORDS, MOCK, randomToken, type Account } from '../../services';
import { groupAccount, initialsOf, naira } from '../../lib/format';
import { checkCode } from '../passcode/check';
import { askBiometric } from '../passcode/biometric';
import { HOLD_CAP } from '../settings/gate';
import { holdAfterRecovery } from '../settings/prefs';
import { checkPhone, isEmail } from './validation';
import { isKnownHere, rememberHere } from './devices';
import { pauseRecovery, recoveryPaused } from './recovery';
import {
  DigitBody,
  NoteLine,
  Providers,
  WordsBody,
  code,
  maskPhone,
  meetsRules,
  openWith,
  passcodeView,
  passwordBody,
  refusePassword,
  scanFace,
  sendLogInCode,
  typing,
  TRIES,
  type Ctx,
  type StageView,
} from './views';

/* In: the session for the account, this phone known for it from now on, and home. A phone that does not have the
   account's passcode (Round 32: it opens the app and sends money when the face cannot) sets it first. */
async function letIn(c: Ctx, account: Account) {
  if (!(await c.app.hasPasscodeFor(account))) {
    c.setWho(account);
    c.go('newpasscode');
    return;
  }
  const s = await auth.signIn(account.phone, await randomToken());
  if (!s) {
    c.setNote({ text: 'The account could not be opened. Try again in a moment.', tone: 'bad' });
    return;
  }
  await rememberHere(account);
  c.toHome(() => c.app.signIn(s));
}

/** Proven (the code and the password, or Google or Apple): in on a phone that knows the account, or the face once on
    one that does not. */
export async function afterProof(c: Ctx, account: Account) {
  if (await isKnownHere(account.accountNumber)) await letIn(c, account);
  else c.go('signface');
}

/* ---- log in ---- */

function signin(c: Ctx): StageView {
  const known = c.known && !c.another ? c.known : null;
  /* a phone that knows the account: the face or the fingerprint, and in; where the phone cannot ask, or it does not
     take, the account's six digits (Round 32: nothing ever lets anybody in in its place) */
  if (known) {
    const usePasscode = async () => {
      const account = await auth.findAccount(known.phone);
      if (!account) {
        c.setAnother(true);
        return;
      }
      c.setWho(account);
      c.go('signpasscode');
    };
    const faceIn = async () => {
      c.setBusy(true);
      c.setNote(null);
      try {
        const account = await auth.findAccount(known.phone);
        if (!account) {
          c.setAnother(true);
          return;
        }
        const answer = await askBiometric(`Log in as ${known.firstName}`);
        if (answer === 'ok') {
          await letIn(c, account);
          return;
        }
        c.setWho(account);
        if (answer === 'unavailable') {
          c.go('signpasscode');
          return;
        }
        c.setNote({ text: `${c.bioName} did not take. Try again, or use your passcode.`, tone: 'bad' });
      } finally {
        c.setBusy(false);
      }
    };
    return {
      icon: 'mark',
      title: 'Log in',
      sub: `Welcome back, ${known.firstName}. This phone knows your account: ${c.bioName}, or your passcode.`,
      bodyKey: `signin:known:${known.accountNumber}`,
      body: (
        <View style={{ gap: 16 }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3 }} testID="known-account">
            <Avatar initials={initialsOf(known.firstName)} />
            <View style={{ gap: 2, flex: 1 }}>
              <RowText>{known.firstName}</RowText>
              <Meta tone="secondary">{maskPhone(known.phone)}</Meta>
            </View>
            {known.passkey ? <Caption tone="tertiary">Passkey</Caption> : null}
          </Card>
          {c.note ? <NoteLine note={c.note} /> : null}
          <More label="Use my passcode" onPress={() => void usePasscode()} />
          <More label="Use another account" onPress={() => c.setAnother(true)} />
        </View>
      ),
      bar: { label: c.busy ? 'Just a moment…' : known.passkey ? 'Log in with your passkey' : `Log in with ${c.bioName}`, onPress: faceIn, disabled: c.busy },
      back: () => c.go('welcome', -1),
    };
  }
  const passkeyIn = async () => {
    /* a passkey lives on the phone that made it: one here is the account this phone knows */
    const k = c.known;
    if (!k?.passkey) {
      c.setNote({ text: 'There is no Beetle passkey on this phone yet. Log in with your number, then save one.', tone: 'bad' });
      return;
    }
    c.setAnother(false);
  };
  return {
    icon: 'mark',
    title: 'Log in',
    sub: 'Your mobile number. A code comes next, then your password.',
    bodyKey: 'signin',
    body: (
      <DigitBody
        c={c}
        groups={[4, 3, 4]}
        footer={
          c.unknown ? (
            <More label="Open an account with it" onPress={() => openWith(c, c.digits)} />
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <More label="Use email instead" onPress={() => c.go('signemail')} />
                <More label="Log in with a passkey" onPress={passkeyIn} />
              </View>
              <Providers c={c} purpose="login" />
              <More label="Can’t get in? Recover your account" onPress={() => c.go('recover')} />
            </View>
          )
        }
      />
    ),
    keypad: key => {
      c.setUnknown(false);
      typing(c, 11, d => sendLogInCode(c, d))(key);
    },
    back: () => c.go('welcome', -1),
  };
}

function signemail(c: Ctx): StageView {
  const ok = isEmail(c.text);
  const send = async () => {
    if (!ok || c.busy) return;
    const to = c.text.trim().toLowerCase();
    c.setBusy(true);
    c.setNote({ text: 'Looking for the account…' });
    try {
      const account = await auth.findAccount(to);
      if (!account) {
        c.setNote({ text: 'No account has this email. If it was changed or lost, recover the account with its mobile number.', tone: 'bad' });
        c.setUnknown(true);
        return;
      }
      c.setContact(to);
      c.setWho(account);
      const r = await auth.requestCode(to);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.go('signcode');
    } catch {
      c.setNote({ text: 'The email could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'mail-filled',
    title: 'Log in with email',
    sub: 'The email on your account. A code goes to it, then your password.',
    bodyKey: 'signemail',
    words: true,
    body: (
      <WordsBody c={c} footer={c.unknown ? <More label="Recover my account" onPress={() => c.go('recover')} /> : <More label="Use mobile number instead" onPress={() => c.go('signin', -1)} />}>
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
    back: () => c.go('signin', -1),
  };
}

function signcode(c: Ctx): StageView {
  const to = c.contact;
  return code(c, {
    to,
    icon: /^\d+$/.test(to) ? 'phone-filled' : 'mail-filled',
    onVerified: async () => {
      const account = c.who ?? (await auth.findAccount(to));
      if (!account) {
        c.go('signin', -1);
        return;
      }
      c.setWho(account);
      /* an account opened with Google or Apple has no password (Round 32): it is that again, not a password */
      if (account.signInWith === 'google' || account.signInWith === 'apple') {
        c.setProvider(account.signInWith);
        c.setProviderFor('login');
        c.go('provider');
        return;
      }
      c.go('signpass');
    },
    back: () => c.go(/^\d+$/.test(to) ? 'signin' : 'signemail', -1),
  });
}

function signpass(c: Ctx): StageView {
  const account = c.who;
  const enter = async () => {
    if (!account || !c.text || c.busy) return;
    c.setBusy(true);
    c.setNote({ text: 'Checking…' });
    try {
      /* the same gate as the payments: three wrong and it shuts, for longer each time */
      const v = await checkCode(c.text, pw => c.app.passwordOpens(account, pw));
      if (v.ok) {
        await afterProof(c, account);
        return;
      }
      c.bump();
      c.setText('');
      if ('lockedFor' in v) c.setNote({ text: `Too many wrong. Try again in ${v.lockedFor < 90 ? `${v.lockedFor} seconds` : `${Math.ceil(v.lockedFor / 60)} minutes`}.`, tone: 'bad' });
      else c.setNote({ text: `That is not the password. ${v.triesLeft === 1 ? 'One more try' : `${v.triesLeft} more tries`} before it waits.`, tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'lock-filled',
    tint: washes.passcode.tone,
    title: 'Enter password',
    sub: account ? `The password for ${account.firstName}’s account.` : 'The password for your account.',
    bodyKey: 'signpass',
    words: true,
    body: (
      <WordsBody c={c} footer={<More label="Forgot password?" onPress={() => c.go('recover')} />}>
        <TextBox
          label="Password"
          value={c.text}
          onChangeText={t => {
            c.setText(t);
            c.setNote(null);
          }}
          secret
          autoFocus
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={enter}
          testID="password"
        />
      </WordsBody>
    ),
    bar: { label: c.busy ? 'Checking…' : 'Log in', onPress: enter, disabled: !c.text || c.busy },
    hint: MOCK && account?.demo ? `The demo account opens with ${DEMO_PASSWORDS[0]}.` : undefined,
    back: () => c.go('signin', -1),
  };
}

function signface(c: Ctx): StageView {
  const account = c.who;
  const failed = c.faceState === 'failed';
  const scan = async () => {
    if (!account) return;
    c.setFaceState('checking');
    if (!(await scanFace('Look at the phone'))) {
      c.setFaceState('failed');
      return;
    }
    c.setFaceState('done');
    await letIn(c, account);
  };
  return {
    icon: 'faceid-filled',
    tint: washes.face.tone,
    title: 'Face scan',
    sub: 'This phone is new to your account, so once, a live scan matched to your BVN photo. After this, Face ID alone opens it here.',
    bodyKey: 'signface',
    body: (
      <View style={{ gap: 20 }}>
        <View style={{ alignItems: 'center', gap: space.s5, paddingVertical: space.s4 }}>
          <Icon name={failed ? 'alert' : 'person'} size={56} colour={failed ? colour.bad : night.tertiary} />
          <Meta tone={failed ? 'bad' : 'secondary'}>{failed ? 'That did not take. Hold still and look at the camera.' : 'Hold still and look at the camera'}</Meta>
        </View>
        <Aside glyph="eye">The scan is checked and thrown away. It is not a profile picture and nobody sees it.</Aside>
      </View>
    ),
    bar: { label: c.faceState === 'checking' ? 'Hold still…' : failed ? 'Try again' : 'Scan my face', onPress: scan, disabled: c.faceState === 'checking' || c.faceState === 'done' },
    back: () => c.go('signpass', -1),
  };
}

/* ---- getting an account back ---- */

function recover(c: Ctx): StageView {
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
      const account = await auth.findAccount(check.phone);
      if (!account) {
        c.setNote({ text: 'There is no account on this number.', tone: 'bad' });
        return;
      }
      const paused = await recoveryPaused(account.accountNumber);
      if (paused) {
        c.setNote({ text: `Getting this account back is paused until ${paused} after three wrong BVNs. Its owner has been told.`, tone: 'bad' });
        return;
      }
      c.setRec({ account });
      const r = await auth.requestCode(check.phone);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.go('recovercode');
    } catch {
      c.setNote({ text: 'The text could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'shield-filled',
    title: 'Recover your account',
    sub: 'Lost the email or the password? Start with the mobile number on the account. Then your BVN and a face scan, so nobody else can.',
    bodyKey: 'recover',
    body: (
      <DigitBody
        c={c}
        groups={[4, 3, 4]}
        footer={
          <More
            label="I lost the phone too"
            onPress={() => toast('Without the phone, a person at Beetle checks your BVN and your face on a video call before anything changes. That is not in this build yet.')}
          />
        }
      />
    ),
    keypad: typing(c, 11, full),
    back: () => c.go('signin', -1),
  };
}

function recovercode(c: Ctx): StageView {
  const phone = c.rec.account?.phone ?? '';
  return code(c, {
    to: phone,
    icon: 'phone-filled',
    onVerified: async () => c.go('recoverbvn'),
    back: () => c.go('recover', -1),
  });
}

function recoverbvn(c: Ctx): StageView {
  const account = c.rec.account;
  const full = async (d: string) => {
    if (!account) return;
    c.setBusy(true);
    c.setNote({ text: 'Checking…' });
    let paused = false;
    try {
      await new Promise(r => setTimeout(r, 500));
      if (account.idNumber && d === account.idNumber) {
        c.setWrong(0);
        c.go('recoverface');
        return;
      }
      c.bump();
      c.setDigits('');
      const n = c.wrong + 1;
      c.setWrong(n);
      if (n >= TRIES) {
        const until = await pauseRecovery(account.accountNumber);
        c.setNote({ text: `Three that did not match. Getting this account back is paused until ${until}, and its owner has been told.`, tone: 'bad' });
        /* and the pad stays still: nothing more is tried from here */
        paused = true;
        return;
      }
      c.setNote({ text: `That is not the BVN on this account. ${TRIES - n === 1 ? 'One more try' : `${TRIES - n} more tries`}.`, tone: 'bad' });
    } finally {
      if (!paused) c.setBusy(false);
    }
  };
  return {
    icon: 'id-filled',
    tint: washes.nin.tone,
    title: 'BVN number',
    sub: 'The BVN the account was opened with. Dial *565*0# from the number your bank has to see it.',
    bodyKey: 'recoverbvn',
    body: <DigitBody c={c} groups={[4, 4, 3]} />,
    keypad: typing(c, 11, full),
    hint: MOCK && account?.demo ? `The demo account’s BVN is ${account.idNumber}.` : undefined,
    back: () => c.go('recover', -1),
  };
}

function recoverface(c: Ctx): StageView {
  const failed = c.faceState === 'failed';
  const scan = async () => {
    c.setFaceState('checking');
    if (!(await scanFace('Look at the phone'))) {
      c.setFaceState('failed');
      return;
    }
    c.setFaceState('done');
    c.go('recoverwhat');
  };
  return {
    icon: 'faceid-filled',
    tint: washes.face.tone,
    title: 'Face scan',
    sub: 'A live scan, matched to the photo on your BVN. A photo of you held up to the camera does not pass.',
    bodyKey: 'recoverface',
    body: (
      <View style={{ gap: 20 }}>
        <View style={{ alignItems: 'center', gap: space.s5, paddingVertical: space.s4 }}>
          <Icon name={failed ? 'alert' : 'person'} size={56} colour={failed ? colour.bad : night.tertiary} />
          <Meta tone={failed ? 'bad' : 'secondary'}>{failed ? 'That did not take. Hold still and look at the camera.' : 'Hold the phone at eye level, in good light'}</Meta>
        </View>
        <Aside glyph="eye">In this build the match is shown, not made. The real one checks a live face against the BVN register’s photo.</Aside>
      </View>
    ),
    bar: { label: c.faceState === 'checking' ? 'Hold still…' : failed ? 'Try again' : 'Scan my face', onPress: scan, disabled: c.faceState === 'checking' || c.faceState === 'done' },
    back: () => c.go('recoverbvn', -1),
  };
}

function recoverwhat(c: Ctx): StageView {
  const account = c.rec.account;
  const keep = async () => {
    if (!account || c.busy) return;
    c.setBusy(true);
    try {
      await letIn(c, account);
    } finally {
      c.setBusy(false);
    }
  };
  const row = (label: string, sub: string, onPress: () => void, testID: string) => (
    <Tap accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, gap: space.s3 }}>
        <View style={{ flex: 1 }}>
          <Label>{label}</Label>
          <Caption tone="tertiary">{sub}</Caption>
        </View>
        <Icon name="chevron" size={16} colour={night.tertiary} />
      </View>
    </Tap>
  );
  return {
    icon: 'mail-filled',
    title: 'Your email',
    sub: 'It is you. This is the email on the account: keep it, or change it.',
    bodyKey: 'recoverwhat',
    body: account ? (
      <View style={{ gap: 12 }}>
        <Card style={{ gap: 4 }} testID="found-email">
          <RowText>{account.email ?? 'No email on the account yet'}</RowText>
          <Meta tone="secondary">
            {account.firstName} {account.lastName} · {groupAccount(account.accountNumber)}
          </Meta>
        </Card>
        <View>
          {row('Change the email', 'A new one, checked with its own code', () => c.go('newemail'), 'change-email')}
          <View style={{ height: 1, backgroundColor: night.rule }} />
          {row('Change the password', 'Letters and a number, eight or more', () => c.go('newpassword'), 'change-password')}
        </View>
      </View>
    ) : null,
    bar: { label: c.busy ? 'Just a moment…' : 'Keep it and log in', onPress: keep, disabled: c.busy },
    /* out of getting it back, to Log in: going back to the face scan would only ask for it again */
    back: () => c.go('signin', -1),
  };
}

function newemail(c: Ctx): StageView {
  const ok = isEmail(c.text);
  const send = async () => {
    if (!ok || c.busy) return;
    const to = c.text.trim().toLowerCase();
    c.setBusy(true);
    c.setNote({ text: 'Sending the code…' });
    try {
      const owner = await auth.findAccount(to);
      if (owner && owner.accountNumber !== c.rec.account?.accountNumber) {
        c.setNote({ text: 'Another account has this email. Use one that is only yours.', tone: 'bad' });
        return;
      }
      c.setRec({ ...c.rec, email: to });
      const r = await auth.requestCode(to);
      c.setWait(r.resendAfterSeconds);
      c.setWrong(0);
      c.go('newemailcode');
    } catch {
      c.setNote({ text: 'The email could not be sent. Check the network and try again.', tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'mail-filled',
    title: 'Enter new email',
    sub: 'A code goes to it, to check it is yours. The old one is told it was changed.',
    bodyKey: 'newemail',
    words: true,
    body: (
      <WordsBody c={c}>
        <TextBox
          label="New email"
          value={c.text}
          onChangeText={t => {
            c.setText(t);
            c.setNote(null);
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
    back: () => c.go('recoverwhat', -1),
  };
}

function newemailcode(c: Ctx): StageView {
  const to = c.rec.email ?? '';
  return code(c, {
    to,
    icon: 'mail-filled',
    onVerified: async () => {
      const account = c.rec.account;
      if (!account) return;
      const changed = await auth.changeEmail(account.accountNumber, to);
      await holdAfterRecovery(account.accountNumber, 'email');
      c.setRec({ account: changed, changed: 'email', email: to });
      c.go('recovered');
    },
    back: () => c.go('newemail', -1),
  });
}

function newpassword(c: Ctx): StageView {
  const account = c.rec.account;
  const save = async () => {
    if (!account || !meetsRules(c.text) || c.busy) return;
    const refused = refusePassword(c, account);
    if (refused) {
      c.setNote({ text: refused, tone: 'bad' });
      c.bump();
      return;
    }
    c.setBusy(true);
    try {
      await c.app.resetPassword(account, c.text);
      await holdAfterRecovery(account.accountNumber, 'password');
      c.setRec({ account, changed: 'password' });
      c.go('recovered');
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'lock-filled',
    tint: washes.passcode.tone,
    title: 'New password',
    sub: 'At least eight letters and numbers, and not your name or your birthday.',
    bodyKey: 'newpassword',
    words: true,
    body: passwordBody(c, 'New password'),
    bar: { label: 'Save it', onPress: save, disabled: !meetsRules(c.text) || c.busy },
    back: () => c.go('recoverwhat', -1),
  };
}

function recovered(c: Ctx): StageView {
  const account = c.rec.account;
  const what = c.rec.changed === 'password' ? 'password' : 'email';
  const SAFE = [
    `For a day, no more than ${naira(HOLD_CAP)} can leave`,
    'For a day, nobody new is paid and nothing new is added',
    `Your ${what === 'email' ? 'old email' : 'email'} and your phone were told, with This wasn’t me`,
  ];
  const take = async () => {
    if (!account || c.busy) return;
    c.setBusy(true);
    try {
      await letIn(c, account);
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'tick',
    small: true,
    inline: true,
    title: `Your ${what} is changed`,
    sub: what === 'email' ? `The account’s email is ${c.rec.email ?? account?.email ?? ''} now.` : 'Use the new one to log in from now on.',
    bodyKey: 'recovered',
    body: (
      <View style={{ gap: 12, paddingTop: 4 }}>
        <Card style={{ paddingTop: 4, paddingBottom: 0, paddingHorizontal: 16, gap: 0 }} testID="hold">
          {SAFE.map((text, i) => (
            <View
              key={text}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.s3, minHeight: 50, paddingVertical: 10, borderBottomWidth: i < SAFE.length - 1 ? 1 : 0, borderBottomColor: night.rule }}
            >
              <Icon name="shield-filled" size={20} colour={night.ink} />
              <Meta tone="ink" style={{ flex: 1 }}>
                {text}
              </Meta>
            </View>
          ))}
        </Card>
        <Meta tone="secondary">If somebody else did this, This wasn’t me on what was sent freezes the account, and nothing leaves it.</Meta>
      </View>
    ),
    bar: { label: c.busy ? 'Just a moment…' : 'Take me in', onPress: take, disabled: c.busy },
  };
}

/* A phone that knows the account, the face not to hand: its six digits, through the same gate as payments (three wrong
   and it waits, for longer each time). */
function signpasscode(c: Ctx): StageView {
  const account = c.who;
  const full = async (d: string) => {
    if (!account) return;
    c.setBusy(true);
    c.setNote({ text: 'Checking…' });
    try {
      const v = await checkCode(d, code => c.app.passcodeOpensFor(account, code));
      if (v.ok) {
        await letIn(c, account);
        return;
      }
      c.bump();
      c.setDigits('');
      if ('lockedFor' in v) c.setNote({ text: `Too many wrong. Try again in ${v.lockedFor < 90 ? `${v.lockedFor} seconds` : `${Math.ceil(v.lockedFor / 60)} minutes`}.`, tone: 'bad' });
      else c.setNote({ text: `Not it. ${v.triesLeft === 1 ? 'One more try' : `${v.triesLeft} more tries`}.`, tone: 'bad' });
    } finally {
      c.setBusy(false);
    }
  };
  return {
    icon: 'lock-filled',
    tint: washes.passcode.tone,
    title: 'Enter your passcode',
    sub: account ? `The six digits for ${account.firstName}’s account on this phone.` : 'The six digits for your account on this phone.',
    bodyKey: 'signpasscode',
    body: (
      <DigitBody
        c={c}
        groups={[6]}
        max={6}
        secret
        footer={
          <More
            label="Forgot passcode? Log in with your number"
            onPress={() => {
              c.go('signin', -1);
              c.setAnother(true);
            }}
          />
        }
      />
    ),
    keypad: typing(c, 6, full),
    hint: MOCK && account?.demo ? 'The demo account opens with 654321.' : undefined,
    back: () => c.go('signin', -1),
  };
}

/* A phone without the account's passcode, after logging in: the six digits, twice, and in. */
function newpasscode(c: Ctx): StageView {
  const account = c.who;
  return passcodeView(c, {
    save: async code => {
      if (!account) return;
      await c.app.setPasscodeFor(account, code);
      await letIn(c, account);
    },
    back: () => c.go('signin', -1),
  });
}

export function signViews(c: Ctx): StageView {
  switch (c.stage) {
    case 'newpasscode':
      return newpasscode(c);
    case 'signpasscode':
      return signpasscode(c);
    case 'signin':
      return signin(c);
    case 'signemail':
      return signemail(c);
    case 'signcode':
      return signcode(c);
    case 'signpass':
      return signpass(c);
    case 'signface':
      return signface(c);
    case 'recover':
      return recover(c);
    case 'recovercode':
      return recovercode(c);
    case 'recoverbvn':
      return recoverbvn(c);
    case 'recoverface':
      return recoverface(c);
    case 'recoverwhat':
      return recoverwhat(c);
    case 'newemail':
      return newemail(c);
    case 'newemailcode':
      return newemailcode(c);
    case 'newpassword':
      return newpassword(c);
    default:
      return recovered(c);
  }
}
