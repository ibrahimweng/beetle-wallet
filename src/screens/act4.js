/* Act Four — getting in.
   Opening an account, the digits not matching, finishing the setup, the first
   day, and coming back. Every heading, every line and every step name is the
   Figma file's, word for word. */

import {
  el, Icon, AgentMark, Screen, Dock, Sheet, PageHead, Display, Title, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Between, Divider, Spacer, Glyph, ListRow, ActionRow, TxRow, Field,
  Button, Ghost, Chip, Bubble, Said, Typing, ToolPanel, Banner, Note, Pill,
  Timeline, Meter, Pips, Keypad, Keyboard, PassPad, Picker, toast, naira,
} from '../ui.js';
import { me, onboarding, balances, limits, goal } from '../data.js';
import { get } from '../store.js';
import * as act from '../actions.js';
import { ask } from '../agent.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

/* The design carries the steps you have already done above the heading, as
   plain grey words, rather than a progress bar. */
/* The steps already behind you. The design draws these small and indented,
   not as headings the size of the one you are on. */
const Trail = (...done) =>
  done.length ? e('div', { class: 'stack', style: { gap: '20px' } },
    ...done.map(s => e('div', { class: 't-body c-3', style: { paddingLeft: '36px' } }, s))) : null;

/* A field the person is filling in, drawn as a box with a caret. */
const Entry = (label, value, { note } = {}) =>
  e('div', { class: 'card stack gap-1' },
    label ? e('div', { class: 't-caption c-2' }, label) : null,
    e('div', { class: 'row', style: { gap: '2px' } },
      e('div', { class: 't-title' }, value),
      e('div', { style: { width: '2px', height: '24px', background: 'var(--accent)' } })),
    note ? e('div', { class: 't-caption c-3' }, note) : null);

/* A pad that types real digits into a field. */
const DigitEntry = ({ value, groups, max, onDone, doneLabel, label }) => {
  let digits = value;
  const host = e('div', { class: 'stack gap-4' });
  const group = d => groups
    ? groups.reduce((out, n) => {
        const part = d.slice(out.used, out.used + n);
        return part ? { used: out.used + n, parts: [...out.parts, part] } : out;
      }, { used: 0, parts: [] }).parts.join(' ')
    : d;

  const draw = () => {
    host.innerHTML = '';
    host.appendChild(Entry(label, group(digits) || '0'));
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

/* ---------------------------------------------------------------- *
 * Opening an account
 * ---------------------------------------------------------------- */

export const start = {
  title: 'Opening one',
  render: () => e('div', { class: 'screen-scroll' },
    e('div', { class: 'pad top-pad bottom-pad stack gap-5', style: { minHeight: '100%', justifyContent: 'space-between' } },
      e('div', { class: 'stack gap-1' },
        ...['Save', 'Send', 'Spend'].map(w => e('div', { class: 't-display c-3' }, w)),
        e('div', { class: 't-display' }, 'Ask')),
      e('div', { class: 'stack gap-4' },
        e('div', { class: 'row', style: { gap: '10px' } }, Icon('mark', { size: 34 }), e('div', { class: 't-title' }, 'Beetle')),
        Body('A bank that answers when you ask it something. Opening one takes about a minute, and all it needs is your number and your NIN.', 'c-2'),
        Button('Open an account', { onClick: () => go('number') }),
        e('div', { class: 'row center', style: { gap: '6px' } },
          Caption('Already have one?', 'c-3'),
          e('button', { class: 'btn btn-ghost press', style: { width: 'auto', padding: 0 }, onClick: () => go('signin') }, 'Sign in')))),
  ),
};

export const number = {
  title: 'Your number',
  render: () => Screen([
    PageHead('Your number', 'I will text you six digits to check the number is yours.'),
    DigitEntry({
      value: '08032144471', groups: [4, 3, 4], max: 11,
      doneLabel: 'Send me the code', onDone: () => go('code'),
    }),
  ], Dock({ placeholder: 'Ask why this is needed', back: () => go('start') })),
};

export const code = {
  title: 'The code',
  render: () => Screen([
    PageHead('Your number', `Six digits, sent to ${me.phone} a moment ago.`),
    PassPad({
      length: 6, allowFace: false,
      hint: 'Any six will do here.',
      onDone: () => { toast('Checked.'); setTimeout(() => go('nin'), 250); },
    }),
    e('button', { class: 'btn btn-ghost press', onClick: () => toast('Sent again. It can take up to a minute.') }, 'I did not get it'),
  ], Dock({ placeholder: 'It did not arrive', back: () => go('number') })),
};

export const nin = {
  title: 'Who you are',
  render: () => Screen([
    Trail('Your number'),
    PageHead('Who you are', 'Eleven digits from your NIN or your BVN, whichever you know. Your name comes back with them.'),
    DigitEntry({
      value: '123456789', groups: [4, 4, 2], max: 11,
      doneLabel: 'Check them',
      onDone: d => go(d === '12345678900' ? 'who' : 'nomatch'),
    }),
    Note('The one on the record is 1234 5678 900. Anything else takes you to the screen that says nothing came back.'),
  ], Dock({ placeholder: 'Ask why this is needed', back: () => go('code') })),
};

export const who = {
  title: 'Is this you?',
  render: () => Screen([
    Trail('Your number'),
    PageHead('Who you are', 'This came back from the record against those digits. I did not type it.'),
    Card(
      e('div', { class: 'row', style: { gap: '12px' } },
        Glyph(me.initials, 'accent', { lg: true, circle: true }),
        e('div', { class: 'stack gap-1 grow' },
          e('div', { class: 't-head' }, me.name),
          e('div', { class: 't-meta c-3' }, me.born))),
      Divider(),
      e('div', { class: 'stack gap-1' },
        Caption('On the record as', 'c-2'),
        e('div', { class: 't-row', style: { letterSpacing: '.04em' } }, 'IBRAHIM MUSA WENG'))),
    Button('Yes, that is me', { onClick: () => go('face') }),
    Ghost('Something here is wrong', () => go('nomatch')),
  ], Dock({ placeholder: 'Ask about this record', back: () => go('nin') })),
};

export const face = {
  title: 'Your face',
  render: () => Screen([
    Trail('Your number', 'Who you are'),
    PageHead('Your face', 'One photo, checked against the same record, so that only you can open this again.'),
    e('div', { class: 'stack gap-3 center' },
      e('div', { style: {
        width: '190px', height: '190px', borderRadius: '999px',
        background: 'var(--surface-2)', border: '2px dashed var(--accent)',
        display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)',
      } }, Icon('faceid', { size: 52 })),
      Caption('Hold still and look at the camera', 'c-2')),
    Button('Take the photo', { onClick: () => go('passcode') }),
    Note('The photo is kept on this phone. It is not a profile picture and nobody else sees it.'),
  ], Dock({ placeholder: 'Ask what happens to the photo', back: () => go('who') })),
};

export const passcode = {
  title: 'A passcode',
  render: () => {
    let first = null;
    const host = e('div', { class: 'stack gap-3 center' });
    const draw = () => {
      host.innerHTML = '';
      if (first) host.appendChild(Head('Type it once more'));
      host.appendChild(PassPad({
        length: 6, allowFace: false,
        hint: first ? 'The same six, so I know it was not a slip.' : 'Not your year of birth, and not 123456.',
        onDone: c => {
          if (!first) {
            if (['123456', '000000', '111111', '199600'].includes(c))
              return { error: 'Not that one. It is the first thing anybody tries.' };
            first = c; draw(); return;
          }
          if (c !== first) { first = null; draw(); return { error: 'Those two did not match. Start again.' }; }
          act.setPasscode(c);
          toast('Set. That is what will send money from now on.');
          setTimeout(() => go('ready'), 700);
        },
      }));
    };
    draw();
    return Screen([
      Trail('Your number', 'Who you are', 'Your face'),
      PageHead('A passcode', 'Six digits. These are what send your money, so pick something nobody watching could guess.'),
      host,
    ], Dock({ placeholder: 'Ask about the passcode', back: () => go('face') }));
  },
};

export const ready = {
  title: 'It is ready',
  render: () => Screen([
    Trail('Your number', 'Who you are', 'Your face', 'A passcode'),
    PageHead('Your account is ready', `Your number is ${me.account}, and money can reach it now.`),
    Card(...onboarding.ready.map((r, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'row', style: { padding: '8px 0' } },
        e('div', { class: 'tick ' + (r.on ? '' : 'tick-wait') }, r.on ? Icon('check', { size: 13 }) : null),
        e('div', { class: 'grow t-body ' + (r.on ? '' : 'c-3') }, r.t))))),
    Button('Finish setting up', { onClick: () => go('finish') }),
    Caption('Two minutes, and the last two come on', 'c-3'),
    Ghost('Go to my account', () => go('firsthome')),
  ], Dock({ placeholder: 'Ask what I can do now', back: () => go('passcode') })),
};

/* ---------------------------------------------------------------- *
 * When the digits do not match
 * ---------------------------------------------------------------- */

export const nomatch = {
  title: 'Nothing came back',
  render: () => Screen([
    Trail('Your number'),
    PageHead('Who you are', 'Eleven digits from your NIN or your BVN. These ones did not match anything.'),
    e('div', { class: 'row' }, Glyph('alert', 'warn', { lg: true })),
    e('div', { class: 'stack gap-1' },
      Head('Nothing came back'),
      Body('No record matches 1234 5678 90. One wrong digit is the usual reason, so it is worth reading them again.', 'c-2')),
    Button('Type them again', { onClick: () => go('nin') }),
    Ghost('Talk to someone', () => toast('Somebody will call this number within the hour.')),
  ], Dock({ placeholder: 'Ask what went wrong', back: () => go('nin') })),
};

/* ---------------------------------------------------------------- *
 * Finishing setting up
 * ---------------------------------------------------------------- */

const OPENS = [
  'Send up to ₦1,000,000 a day',
  'Hold dollars',
  'Borrow against your history',
];

export const finish = {
  title: 'Where you live',
  render: () => Screen([
    PageHead('Where you live', 'Street, town and state. No utility bill, and nothing arrives in the post.'),
    Card(
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-row' }, '12 Bode Thomas Street'),
        e('div', { class: 't-row c-3' }, 'Surulere, Lagos State'))),
    e('div', { class: 'stack gap-1' },
      e('div', { class: 't-title c-3' }, 'A photo of an ID'),
      e('div', { class: 't-title c-3' }, 'Where your money comes from')),
    Head('What it opens'),
    Card(...OPENS.map((t, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'row', style: { padding: '8px 0' } },
        Icon('check', { size: 18 }),
        e('div', { class: 'grow t-body' }, t))))),
    Button('Next', { onClick: () => go('idcard') }),
    Note('This is the same check every Nigerian bank runs. We ask once, and we do not sell it.'),
  ], Dock({ placeholder: 'Ask what this unlocks', back: () => go('ready') })),
};

export const idcard = {
  title: 'A photo of an ID',
  render: () => Screen([
    Trail('Where you live'),
    PageHead('A photo of an ID', 'A driver’s licence, a passport or a voter’s card. Any of the three will do.'),
    e('div', { class: 'stack gap-3 center' },
      e('div', { style: {
        width: '100%', height: '190px', borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)', border: '2px dashed var(--accent)',
        display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)',
      } }, Icon('id', { size: 52 })),
      Caption('Lay it flat and fill the frame', 'c-2')),
    Button('Use this photo', { onClick: () => go('income') }),
    Note('I read the name and the number off it and keep nothing else. The photo does not leave your phone.'),
    e('div', { class: 't-title c-3' }, 'Where your money comes from'),
  ], Dock({ placeholder: 'Ask what happens to the photo', back: () => go('finish') })),
};

export const income = {
  title: 'Where your money comes from',
  render: () => {
    const OPTIONS = [
      { id: 'salary', label: 'A salary' },
      { id: 'business', label: 'My own business' },
      { id: 'family', label: 'Family or friends' },
      { id: 'other', label: 'Something else' },
    ];
    return Screen([
      Trail('Where you live', 'A photo of an ID'),
      PageHead('Where your money comes from', 'One tap. It is the last question, and every bank has to ask it.'),
      Picker(OPTIONS, 'salary', () => go('full')),
    ], Dock({ placeholder: 'Ask why this is asked', back: () => go('idcard') }));
  },
};

export const full = {
  title: 'Everything is on',
  render: () => Screen([
    Trail('Where you live', 'A photo of an ID', 'Where your money comes from'),
    PageHead('Everything is on', 'You can send a million naira a day and hold dollars now.'),
    Card(...OPENS.map((t, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'row', style: { padding: '8px 0' } },
        e('div', { class: 'tick' }, Icon('check', { size: 13 })),
        e('div', { class: 'grow t-body' }, t),
        Pill('New', 'good'))))),
    Head('Everything you could already do'),
    Card(...onboarding.ready.filter(r => r.on).map((r, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'row', style: { padding: '8px 0' } },
        e('div', { class: 'tick' }, Icon('check', { size: 13 })),
        e('div', { class: 'grow t-body' }, r.t))))),
    Button('Go to my account', { onClick: () => go('firsthome') }),
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
      Pill('New account', 'accent')),
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
      const put = t => { holder.innerHTML = ''; holder.appendChild(AgentMark()); holder.appendChild(e('div', { class: 'bubble' }, t)); };
      ask(q, { context: 'a brand new account with a ₦0.00 balance, opened this morning, no transactions yet', onText: put })
        .then(t => { put(t); const s = thread.closest('.screen-scroll'); s && s.scrollTo({ top: 1e6, behavior: 'smooth' }); });
    };
    const first = window.beetleAskFirst; window.beetleAskFirst = null;
    if (first) setTimeout(() => say(first), 60);
    else {
      thread.appendChild(Bubble('I only tell you things I have seen in your own money. I have not seen any yet, so ask me how something works and I will answer that honestly.'));
      thread.appendChild(e('div', { class: 'stack gap-2' },
        ...['How do I get money in?', 'What can I do before I add my ID?', 'What does a transfer cost?', 'What do you do with my NIN?']
          .map(s => e('button', { class: 'btn btn-quiet press', style: { justifyContent: 'flex-start' }, onClick: () => say(s) }, s))));
    }
    return Screen([PageHead('Beetle', 'Your first question'), thread],
      Dock({ placeholder: 'Ask me anything', back: () => go('firsthome'), onAsk: say }));
  },
};

export const emptyactivity = {
  title: 'Nothing yet',
  render: () => Screen([
    PageHead('Activities', 'Nothing has moved yet', { big: true }),
    e('div', { class: 'row', style: { gap: '8px' } }, Chip('All', true), Chip('In', false), Chip('Out', false)),
    e('div', { class: 'card-plain stack gap-3 center', style: { padding: '34px 18px' } },
      Icon('wait-filled', { size: 34 }),
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
      Icon('pot', { size: 34 }),
      Head('Nothing put away'),
      Body('A beetle will shift many times its own weight, given something to push. A goal is a name and a number, and I work out the rest.', 'c-2')),
    Head('Ones people start with'),
    ActionRow({ icon: 'gift', title: goal.name, sub: `${naira(goal.target)} by ${goal.by}`, onClick: () => go('goal') }),
    ActionRow({ icon: 'shield', title: 'Rainy day', sub: 'Three months of your outgoings', onClick: () => go('goal') }),
    ActionRow({ icon: 'home-filled', title: 'Rent', sub: 'Put a twelfth aside each month', onClick: () => go('goal') }),
    Bubble('Nothing here is locked. Take it back whenever you need it.'),
    Ghost('What should I be saving for?', () => go('agentchat')),
  ], Dock({ placeholder: 'Ask about saving', back: () => go('firsthome') })),
};

/* ---------------------------------------------------------------- *
 * Signing in again
 * ---------------------------------------------------------------- */

export const signin = {
  title: 'Welcome back',
  render: () => Screen([
    PageHead('Welcome back', 'Your number, and then six digits from a text. Nothing else, because the account is already yours.'),
    DigitEntry({
      value: '08032144471', groups: [4, 3, 4], max: 11,
      doneLabel: 'Send me the code', onDone: () => go('signcode'),
    }),
  ], Dock({ placeholder: 'Ask about signing in', back: () => go('start') })),
};

export const signcode = {
  title: 'Six digits',
  render: () => Screen([
    PageHead('Six digits', `Sent to ${me.phone} a moment ago. On a phone I already know, your passcode alone would have been enough.`),
    PassPad({
      length: 6, allowFace: false,
      hint: 'Any six will do here.',
      onDone: () => { toast('Welcome back.'); setTimeout(() => go('home'), 300); },
    }),
    e('button', { class: 'btn btn-ghost press', onClick: () => toast('Sent again. It can take up to a minute.') }, 'I did not get it'),
  ], Dock({ placeholder: 'Ask about signing in', back: () => go('signin') })),
};
