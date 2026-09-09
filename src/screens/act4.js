/* Act Four — getting in.
   Opening an account, the digits not matching, finishing the setup,
   the first day with nothing in it, and coming back. */

import {
  el, Icon, AgentMark, Screen, Dock, Sheet, PageHead, Display, Title, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Between, Divider, Spacer, Glyph, ListRow, ActionRow, TxRow,
  Button, Ghost, Chip, Bubble, Said, Typing, ToolPanel, Banner, Note, Pill,
  Timeline, Meter, Pips, Keypad, Keyboard, Waveform, PassPad, toast, naira,
} from '../ui.js';
import { me, onboarding, balances, limits, goal } from '../data.js';
import { get } from '../store.js';
import * as act from '../actions.js';
import { ask } from '../agent.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

/* A pad that types real digits into a field, used for the number and the NIN. */
const DigitEntry = ({ label, value, note, groups, max, onDone, doneLabel }) => {
  let digits = value;
  const host = e('div', { class: 'stack gap-4' });
  const group = d => groups ? groups.reduce((out, n) => {
    const part = d.slice(out.used, out.used + n);
    return part ? { used: out.used + n, parts: [...out.parts, part] } : out;
  }, { used: 0, parts: [] }).parts.join(' ') : d;

  const draw = () => {
    host.innerHTML = '';
    host.appendChild(Entry(label, group(digits) || '0', { note: `${max - digits.length} more to go` }));
    host.appendChild(Keypad(k => {
      if (k === 'del') digits = digits.slice(0, -1);
      else if (k === 'face') return;
      else if (digits.length < max) digits += k;
      draw();
    }));
    host.appendChild(Button(doneLabel, {
      onClick: () => digits.length === max ? onDone(digits) : toast(`${max - digits.length} digits still missing.`),
    }));
  };
  draw();
  return host;
};

/* A field the person is filling in, drawn as a box with a caret. */
const Entry = (label, value, { note, caret = true, tone = '' } = {}) =>
  e('div', { class: 'card stack gap-1' },
    e('div', { class: 't-caption c-2' }, label),
    e('div', { class: 'row', style: { gap: '2px' } },
      e('div', { class: 't-title ' + tone }, value),
      caret ? e('div', { style: { width: '2px', height: '24px', background: 'var(--accent)' } }) : null),
    note ? e('div', { class: 't-caption c-3' }, note) : null);

/* The step counter the whole opening flow carries. */
const Steps = (at, total = 5) =>
  e('div', { class: 'stack gap-2' },
    e('div', { class: 'row', style: { gap: '6px' } },
      ...Array.from({ length: total }, (_, i) =>
        e('div', { style: {
          height: '3px', flex: 1, borderRadius: '999px',
          background: i < at ? 'var(--accent)' : 'var(--rule)',
        } }))),
    e('div', { class: 't-caption c-3' }, `Step ${at} of ${total}`));

/* The camera viewfinder used for the face check and the ID photo. */
const Viewfinder = (caption, { round = false, tone = 'var(--accent)' } = {}) =>
  e('div', { class: 'stack gap-3 center' },
    e('div', { style: {
      width: round ? '190px' : '100%', height: round ? '190px' : '190px',
      borderRadius: round ? '999px' : 'var(--r-md)',
      background: 'var(--surface-2)', border: `2px dashed ${tone}`,
      display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)',
    } }, Icon(round ? 'faceid' : 'id', { size: 52 })),
    Caption(caption, 'c-3'));

/* ---------------------------------------------------------------- *
 * Opening an account
 * ---------------------------------------------------------------- */

export const start = {
  title: 'Opening one',
  render: () => e('div', { class: 'screen-scroll' },
    e('div', { class: 'pad top-pad bottom-pad stack gap-5', style: { minHeight: '100%', justifyContent: 'space-between' } },
      e('div', { class: 'stack gap-4' },
        e('div', { class: 'row' }, Glyph('mark', 'accent', { lg: true, circle: true })),
        Display('Beetle'),
        e('div', { class: 't-title c-2' }, onboarding.tagline),
        Body(onboarding.blurb, 'c-2')),
      e('div', { class: 'stack gap-4' },
        Plain(
          Label('What it will ask you for'),
          Stack(2,
            Row(Glyph('airtime'), Body('Your phone number, to send one code')),
            Row(Glyph('#'), Body('Your NIN, because the law asks for it')),
            Row(Glyph('faceid'), Body('Your face once, to prove you are you'))),
          Caption('Nothing else. No address, no utility bill, no branch.')),
        Button('Open an account', { onClick: () => go('number') }),
        Button('I already have one', { kind: 'quiet', onClick: () => go('signin') }),
        Note('Deposits are held by a partner bank and insured to ₦5,000,000 by the NDIC.', 'lock'))),
  ),
};

export const number = {
  title: 'Your number',
  render: () => Screen([
    Steps(1),
    PageHead('What is your number?', 'The code comes to this line'),
    DigitEntry({
      label: 'Phone number', value: '08032144471', groups: [4, 3, 4], max: 11,
      doneLabel: 'Send me the code', onDone: () => go('code'),
    }),
    Bubble('One code, one time. I will not text you again unless something moves in your account.'),
    Note('We never sell your number, and no marketing messages are ever sent to it.'),
  ], Dock({ placeholder: 'Ask why this is needed', back: () => go('start') })),
};

export const code = {
  title: 'The code',
  render: () => Screen([
    Steps(1),
    PageHead('Type the six digits', `Sent to ${me.phone}`),
    PassPad({
      length: 6, allowFace: false,
      hint: 'It arrives in a few seconds. Any six will do here.',
      onDone: () => { toast('Checked.'); setTimeout(() => go('nin'), 250); },
    }),
    e('button', { class: 'btn btn-ghost press', onClick: () => toast('Sent again. It can take up to a minute.') }, 'Send it again'),
  ], Dock({ placeholder: 'It did not arrive', back: () => go('number') })),
};

export const nin = {
  title: 'Your NIN',
  render: () => Screen([
    Steps(2),
    PageHead('Your NIN', 'Eleven digits, from your national ID'),
    DigitEntry({
      label: 'National identity number', value: '447188320', groups: [4, 3, 4], max: 11,
      doneLabel: 'Check it',
      onDone: d => go(d === '44718832019' ? 'who' : 'nomatch'),
    }),
    Bubble('The law asks every Nigerian bank for this. I check it against NIMC, and I do not keep the image of your card.'),
    Plain(
      Label('What happens with it'),
      Stack(2,
        Row(Glyph('check'), Body('Checked once against NIMC, right now')),
        Row(Glyph('lock'), Body('Stored encrypted, never shown back in full')),
        Row(Glyph('del'), Body('Deleted with your account if you close it'))),
      Caption('The one NIMC has on file is 4471 883 2019. Anything else takes you to the screen that tells the three reasons apart.')),
  ], Dock({ placeholder: 'Ask why my NIN is needed', back: () => go('code') })),
};

export const who = {
  title: 'Is this you?',
  render: () => Screen([
    Steps(3),
    PageHead('Is this you?', 'What NIMC has against that number'),
    Card(
      e('div', { class: 'row', style: { gap: '12px' } },
        Glyph(me.initials, 'accent', { lg: true, circle: true }),
        e('div', { class: 'stack gap-1 grow' },
          e('div', { class: 't-head' }, me.name),
          e('div', { class: 't-meta c-3' }, me.born),
          e('div', { class: 't-meta c-3' }, 'Lagos, Nigeria'))),
      Divider(),
      e('div', { class: 'row between' },
        Caption('NIN', 'c-2'), e('div', { class: 't-row' }, '4471 883 2019 ·· '),
        Pill('Matched', 'good'))),
    Bubble('This came back from NIMC, not from anything you typed. If the name is wrong, the record is wrong, and I would rather stop here than open an account in it.'),
    Button('Yes, that is me', { onClick: () => go('face') }),
    Button('That is not me', { kind: 'quiet', onClick: () => go('nomatch') }),
  ], Dock({ placeholder: 'Ask about this record', back: () => go('nin') })),
};

export const face = {
  title: 'Your face, once',
  render: () => Screen([
    Steps(4),
    PageHead('Look at the camera', 'One photo, matched against your NIN record'),
    Viewfinder('Hold still. Good light helps.', { round: true }),
    ToolPanel('Beetle Reasoning', 'Checking', [
      { k: 'Found a face', v: 'Certain' },
      { k: 'It is a live person, not a photo', v: 'Certain' },
      { k: 'Matched to the NIMC record', v: 'Checking', done: false, tone: 'c-2' },
    ]),
    Bubble('This is the only time I ask for your face to prove who you are. After today it just opens the app.'),
    Button('Take the photo', { onClick: () => go('passcode') }),
    Note('The photo is compared and then discarded. We do not keep a face database.'),
  ], Dock({ placeholder: 'Ask what happens to the photo', back: () => go('who') })),
};

export const passcode = {
  title: 'Set a passcode',
  render: () => {
    let first = null;
    const host = e('div', { class: 'stack gap-3 center' });
    const draw = () => {
      host.innerHTML = '';
      host.appendChild(Head(first ? 'Type it once more' : 'Choose four digits'));
      host.appendChild(PassPad({
        allowFace: false,
        hint: first ? 'The same four, so I know it was not a slip.' : 'Not 1234, and not your year of birth.',
        onDone: code => {
          if (!first) {
            if (['1234', '0000', '1111', '1996'].includes(code))
              return { error: 'Not that one. It is the first thing anybody tries.' };
            first = code; draw(); return;
          }
          if (code !== first) { first = null; draw(); return { error: 'Those two did not match. Start again.' }; }
          act.setPasscode(code);
          toast('Set. That is what will send money from now on.');
          setTimeout(() => go('ready'), 700);
        },
      }));
      draw.done = true;
    };
    draw();
    return Screen([
      Steps(5),
      PageHead('Set a passcode', 'This is what sends money, not your face'),
      host,
      Plain(
        Label('Why two things'),
        Stack(2,
          Row(Glyph('faceid'), Body('Your face opens the app')),
          Row(Glyph('key'), Body('Your passcode moves money'))),
        Caption('A face can be held up to a phone by somebody else. Four digits in your head cannot.')),
    ], Dock({ placeholder: 'Ask about the passcode', back: () => go('face') }));
  },
};

export const ready = {
  title: 'It is open',
  render: () => Screen([
    e('div', { class: 'row' }, Glyph('check', 'good', { lg: true })),
    PageHead('Your account is open', 'It took fifty-one seconds'),
    Card(
      e('div', { class: 'row between' },
        e('div', { class: 'stack gap-1' },
          Caption('Your account number', 'c-2'),
          e('div', { class: 't-title' }, me.account)),
        Glyph('copy', 'accent', { circle: true })),
      Divider(),
      e('div', { class: 'row between' }, Caption('Name', 'c-2'), e('div', { class: 't-row' }, me.name)),
      e('div', { class: 'row between' }, Caption('Bank', 'c-2'), e('div', { class: 't-row' }, 'Beetle'))),
    Head('What works today'),
    Card(...onboarding.ready.map((r, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'row', style: { padding: '8px 0' } },
        e('div', { class: 'tick ' + (r.on ? '' : 'tick-wait') }, r.on ? Icon('check', { size: 13 }) : null),
        e('div', { class: 'grow t-body ' + (r.on ? '' : 'c-3') }, r.t),
        r.on ? null : e('div', { class: 't-caption c-3' }, 'Needs ID'))))),
    Bubble('You can use it now. The two greyed lines open when you add a photo of your ID, which takes another minute whenever you have one to hand.'),
    Button('Go to my account', { onClick: () => go('firsthome') }),
    Button('Finish setting up now', { kind: 'quiet', onClick: () => go('finish') }),
  ], Dock({ placeholder: 'Ask what I can do now', back: () => go('passcode') })),
};

/* ---------------------------------------------------------------- *
 * When the digits do not match
 * ---------------------------------------------------------------- */

export const nomatch = {
  title: 'That did not match',
  render: () => Screen([
    PageHead('That did not match', 'Nothing has been opened'),
    e('div', { class: 'row' }, Glyph('alert', 'warn', { lg: true })),
    Card(
      e('div', { class: 'row between', style: { padding: '6px 0' } },
        Body('You typed', 'c-2'), e('div', { class: 't-row' }, '4471 883 2019')),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } },
        Body('NIMC has', 'c-2'), e('div', { class: 't-row c-3' }, 'No record')),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } },
        Body('Checked at', 'c-2'), e('div', { class: 't-row' }, '7:52 AM'))),
    Bubble('This is one of three things, and I can tell them apart. It is not a judgement about you.'),
    ActionRow({ icon: 'list', title: 'A digit is off', sub: 'Type the eleven again', onClick: () => go('nin') }),
    ActionRow({ icon: 'person', title: 'Your name changed', sub: 'Marriage, spelling, a correction at NIMC', onClick: () => go('who') }),
    ActionRow({ icon: 'bank', tone: 'warn', title: 'NIMC is down', sub: 'Their side, not yours. Try in an hour.', onClick: () => toast('I will keep checking and tell you the moment they are back. Nothing is lost.') }),
    Note('Three failed checks in a day pauses the check, not your ability to open one later.'),
  ], Dock({ placeholder: 'Ask what went wrong', back: () => go('nin') })),
};

/* ---------------------------------------------------------------- *
 * Finishing setting up
 * ---------------------------------------------------------------- */

export const finish = {
  title: 'Finish setting up',
  render: () => Screen([
    PageHead('Two things left', 'They lift your limits and open dollars', { big: true }),
    Card(
      e('div', { class: 'row between' }, Caption('Where you are', 'c-2'), Caption('2 of 4 done', 'c-3')),
      Meter(50),
      Caption('About a minute for both.', 'c-2')),
    Timeline([
      { k: 'Your number', v: 'Done', done: true },
      { k: 'Your NIN and face', v: 'Done', done: true },
      { k: 'A photo of your ID', v: '40 seconds', done: false },
      { k: 'What you earn', v: '20 seconds', done: false },
    ]),
    Head('What they open'),
    Card(
      e('div', { class: 'row between', style: { padding: '8px 0' } },
        e('div', { class: 'stack gap-1 grow' },
          e('div', { class: 't-row' }, 'Send up to ₦1,000,000 a day'),
          e('div', { class: 't-caption c-3' }, `Today you can send ${naira(limits.day)}`)),
        Glyph('send')),
      Divider(),
      e('div', { class: 'row between', style: { padding: '8px 0' } },
        e('div', { class: 'stack gap-1 grow' },
          e('div', { class: 't-row' }, 'Hold dollars'),
          e('div', { class: 't-caption c-3' }, 'Convert at the rate you see')),
        Glyph('$'))),
    Button('Take the photo', { onClick: () => go('idcard') }),
    Button('Not now', { kind: 'quiet', onClick: () => go('firsthome') }),
    Note('Your account keeps working either way. Nothing is switched off for waiting.'),
  ], Dock({ placeholder: 'Ask what this unlocks', back: () => go('ready') })),
};

export const idcard = {
  title: 'A photo of your ID',
  render: () => Screen([
    PageHead('Photograph your ID', 'NIN slip, driver’s licence, or passport'),
    Viewfinder('Lay it flat. All four corners in frame.'),
    ToolPanel('Beetle Reasoning', 'Reading', [
      { k: 'Found all four corners', v: 'Certain' },
      { k: 'Read the name', v: 'Ibrahim Musa' },
      { k: 'Read the number', v: '4471 883 2019' },
      { k: 'Not expired', v: 'Checking', done: false, tone: 'c-2' },
    ]),
    Bubble('I read it here on your phone and send only the numbers. The photo does not leave the device.'),
    Button('Use this photo', { onClick: () => go('income') }),
    Button('Take it again', { kind: 'quiet', onClick: () => toast('Camera again. Lay it flat, all four corners in frame.') }),
  ], Dock({ placeholder: 'Ask what happens to the photo', back: () => go('finish') })),
};

export const income = {
  title: 'What you earn',
  render: () => Screen([
    PageHead('Roughly what do you earn?', 'A band is enough. No payslip.'),
    e('div', { class: 'stack gap-2' },
      ...[
        ['Under ₦150,000 a month', false],
        ['₦150,000 to ₦500,000', false],
        ['₦500,000 to ₦1,500,000', true],
        ['Over ₦1,500,000', false],
      ].map(([t, on]) => e('button', {
        class: 'card', style: { padding: '14px', cursor: 'pointer', border: on ? '2px solid var(--accent)' : '2px solid transparent', textAlign: 'left' },
        onClick: () => go('full'),
      },
        e('div', { class: 'row between' },
          e('div', { class: 't-row' }, t),
          e('div', { class: 'tick ' + (on ? '' : 'tick-wait') }, on ? Icon('check', { size: 13 }) : null))))),
    Bubble('This sets the ceiling the regulator allows on your account. It is not a credit check, and it does not change what I charge you.'),
    Button('That is right', { onClick: () => go('full') }),
    Note('You can change this later in Settings without redoing anything else.'),
  ], Dock({ placeholder: 'Ask why this is asked', back: () => go('idcard') })),
};

export const full = {
  title: 'Fully open',
  render: () => Screen([
    e('div', { class: 'row' }, Glyph('check', 'good', { lg: true })),
    PageHead('Everything is open', 'Your limits went up just now'),
    Card(...onboarding.ready.map((r, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'row', style: { padding: '8px 0' } },
        e('div', { class: 'tick' }, Icon('check', { size: 13 })),
        e('div', { class: 'grow t-body' }, r.t),
        r.on ? null : Pill('New', 'good'))))),
    Card(
      e('div', { class: 'row between', style: { padding: '4px 0' } },
        Caption('One transfer', 'c-2'),
        e('div', { class: 't-row' }, e('span', { class: 'c-3' }, naira(limits.transfer) + '  →  '), naira(500000))),
      Divider(),
      e('div', { class: 'row between', style: { padding: '4px 0' } },
        Caption('One day', 'c-2'),
        e('div', { class: 't-row' }, e('span', { class: 'c-3' }, naira(limits.day) + '  →  '), naira(1000000)))),
    Bubble('You set these ceilings, I do not. If you want them lower than the maximum, say so and I will hold you to it.'),
    Button('Go to my account', { onClick: () => go('firsthome') }),
    Button('Set my own limits', { kind: 'quiet', onClick: () => go('limits') }),
  ], Dock({ placeholder: 'Ask about my limits', back: () => go('income') })),
};

/* ---------------------------------------------------------------- *
 * The first day
 * ---------------------------------------------------------------- */

export const firsthome = {
  title: 'The first home',
  render: () => Screen([
    e('div', { class: 'row between' },
      Glyph('mark', 'accent', { circle: true }),
      Label('Wallet'),
      Icon('bell', { size: 22 })),
    e('div', { class: 'stack gap-2 center', style: { padding: '10px 0 4px' } },
      Caption('Total balance', 'c-2'),
      Display('₦0.00'),
      Button('Receive', { icon: Icon('receive-filled', { size: 18 }), onClick: () => go('receive') })),
    Bubble('Nothing has moved yet, so there is nothing for me to tell you. Put something in and I will start noticing things.'),
    ActionRow({ icon: 'copy', tone: 'accent', title: 'Copy your account number', sub: me.account + ' · Beetle', onClick: () => toast(`${me.account} copied.`) }),
    ActionRow({ icon: 'bank', title: 'Move money from another bank', sub: 'Takes a few seconds', onClick: () => go('ways') }),
    ActionRow({ icon: 'data', title: 'Buy airtime with a card', sub: 'You do not need a balance for this', onClick: () => go('airtime') }),
    Head('Activities'),
    e('div', { class: 'card-plain stack gap-2 center', style: { padding: '28px 16px' } },
      Icon('wait-filled', { size: 30 }),
      Body('Beetle has nothing to carry yet', 'c-2'),
      Caption('Every naira in and out will show up here, in the order it moved.', 'c-3')),
  ], Dock({ onAsk: q => { window.beetleAskFirst = q; go('firstask'); }, onFab: () => go('actions') })),
};

export const firstask = {
  title: 'The first question',
  render: () => {
    const thread = e('div', { class: 'stack gap-4' });
    const say = q => {
      thread.appendChild(Said(q));
      const holder = Typing();
      thread.appendChild(holder);
      ask(q, {
        context: 'a brand new account with a ₦0.00 balance, opened this morning, no transactions yet',
        onText: t => { holder.innerHTML = ''; holder.appendChild(AgentMark()); holder.appendChild(e('div', { class: 'bubble' }, t)); },
      }).then(t => {
        holder.innerHTML = '';
        holder.appendChild(AgentMark());
        holder.appendChild(e('div', { class: 'bubble' }, t));
        const scroll = thread.closest('.screen-scroll');
        scroll && scroll.scrollTo({ top: 1e6, behavior: 'smooth' });
      });
    };
    const first = window.beetleAskFirst; window.beetleAskFirst = null;
    if (first) setTimeout(() => say(first), 60);
    else {
      thread.appendChild(Bubble('Beetle has nothing to go on yet, so I will not pretend I know your money. Ask me how something works and I will answer that honestly.'));
      thread.appendChild(e('div', { class: 'stack gap-2' },
        ...['How do I get money in?', 'What can I do before I add my ID?', 'What does a transfer cost?', 'What do you do with my NIN?']
          .map(s => e('button', { class: 'btn btn-quiet', style: { justifyContent: 'flex-start' }, onClick: () => say(s) }, s))));
    }
    return Screen([PageHead('Beetle', 'Your first question'), thread],
      Dock({ placeholder: 'Ask me anything', back: () => go('firsthome'), onAsk: say }));
  },
};

export const emptyactivity = {
  title: 'Nothing yet',
  render: () => Screen([
    PageHead('Activities', 'Nothing has moved yet', { big: true }),
    e('div', { class: 'row', style: { gap: '8px' } },
      Chip('All', true), Chip('Insights', false), Chip('In', false), Chip('Out', false)),
    e('div', { class: 'card-plain stack gap-3 center', style: { padding: '34px 18px' } },
      Icon('wait-filled', { size: 30 }),
      Head('Nothing to carry yet'),
      Body('When money moves, it lands here with the reason, the time, and what I made of it.', 'c-2')),
    Plain(
      Label('What will show here'),
      Stack(2,
        Row(Glyph('send'), Body('Every payment, with who and why')),
        Row(Glyph('mark'), Body('What I noticed, in the same feed')),
        Row(Glyph('undo-filled'), Body('Anything that failed, and what I did about it'))),
      Caption('I do not fill this with adverts. If there is nothing to say, it stays empty.')),
    Button('Put money in', { onClick: () => go('receive') }),
  ], Dock({ placeholder: 'Ask what goes here', back: () => go('firsthome') })),
};

export const emptygoal = {
  title: 'No goal yet',
  render: () => Screen([
    PageHead('Savings', 'You have not set one yet', { big: true }),
    e('div', { class: 'card-plain stack gap-3 center', style: { padding: '30px 18px' } },
      Icon('pot', { size: 30 }),
      Head('Nothing put away'),
      Body('A beetle will shift many times its own weight, given something to push. A goal is a name and a number, and I work out the rest.', 'c-2')),
    Head('Ones people start with'),
    ActionRow({ icon: 'gift', title: goal.name, sub: `${naira(goal.target)} by ${goal.by}`, onClick: () => go('goal') }),
    ActionRow({ icon: 'shield', title: 'Rainy day', sub: 'Three months of your outgoings', onClick: () => go('goal') }),
    ActionRow({ icon: 'home-filled', title: 'Rent', sub: 'Put a twelfth aside each month', onClick: () => go('goal') }),
    Bubble('Nothing here is ever locked. If you need it back on a bad Tuesday, you take it back on that Tuesday.'),
    Button('Set my own', { onClick: () => go('saverule') }),
  ], Dock({ placeholder: 'Ask me to start one', back: () => go('firsthome') })),
};

/* ---------------------------------------------------------------- *
 * Signing in again
 * ---------------------------------------------------------------- */

export const signin = {
  title: 'Welcome back',
  render: () => e('div', { class: 'screen-scroll' },
    e('div', { class: 'pad top-pad bottom-pad stack gap-5', style: { minHeight: '100%', justifyContent: 'space-between' } },
      e('div', { class: 'stack gap-4' },
        e('div', { class: 'row' }, Glyph('mark', 'accent', { lg: true, circle: true })),
        Display('Welcome back'),
        Body(`Signing in as ${me.name}`, 'c-2')),
      e('div', { class: 'stack gap-4 center' },
        e('div', { style: {
          width: '92px', height: '92px', borderRadius: '999px', background: 'var(--accent-wash)',
          display: 'grid', placeItems: 'center', color: 'var(--accent)',
        } }, Icon('faceid', { size: 44 })),
        Caption('Look at the phone to open it', 'c-2'),
        Button('Use Face ID', { onClick: () => go('home') }),
        Button('Use my passcode instead', { kind: 'quiet', onClick: () => go('signcode') }),
        e('button', { class: 'btn btn-ghost', onClick: () => go('lostphone') }, 'This is not my phone'))),
  ),
};

export const signcode = {
  title: 'Your passcode',
  render: () => Screen([
    PageHead('Your passcode', 'Four digits, the ones you set'),
    PassPad({
      onFace: () => go('home'),
      hint: 'Three wrong tries locks it for an hour. Your money is not touched by that.',
      onDone: code => {
        const res = act.tryPasscode(code);
        if (res.ok) { go('home'); return; }
        if (res.locked) { go('newcode'); return { error: 'Three wrong. Locked for an hour.' }; }
        return { error: `Not that one. ${res.left} ${res.left === 1 ? 'try' : 'tries'} left.` };
      },
    }),
    e('button', { class: 'btn btn-ghost press', onClick: () => go('newcode') }, 'I have forgotten it'),
    Note('It starts as 4471. The Reset in the left panel puts it back.'),
  ], Dock({ placeholder: 'Ask about signing in', back: () => go('signin') })),
};
