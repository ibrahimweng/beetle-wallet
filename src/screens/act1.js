/* Act One — it goes wrong.
   The screens the whole project is arguing for. Wording is the design's. */

import {
  el, Screen, Dock, Sheet, PageHead, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Between, Divider, Spacer, Glyph, ListRow, ActionRow,
  Button, Ghost, Bubble, Said, ToolPanel, Banner, Note, Timeline, Keypad, Pips,
  PassPad, Slide, toast, naira, nairaFull,
} from '../ui.js';
import { transfer as seedTransfer, contacts, me } from '../data.js';
import { get } from '../store.js';
import * as act from '../actions.js';
import { draft, set } from '../flow.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

/* A big struck-through-looking amount with a line under it, as on the failure screens. */
const BigAmount = (amount, under, tone = '') =>
  e('div', { class: 'stack gap-1' },
    e('div', { class: 't-display ' + tone }, amount),
    Meta(under, 'c-3'));

/* The three-part "what I read against what it might be" comparison. */
const Compare = rows =>
  Card(...rows.map((r, i) => e('div', null,
    i ? Divider() : null,
    e('div', { class: 'row between', style: { padding: '10px 0' } },
      e('div', { class: 't-body c-2' }, r.k),
      e('div', { class: 't-row ' + (r.tone || '') }, r.v)))));

/* ---------------------------------------------------------------- *
 * When it is not sure
 * ---------------------------------------------------------------- */

export const checking = {
  title: 'Checking',
  render: () => Screen([
    PageHead('Before I filled this in', 'What I checked, and the one part I am unsure of'),
    ToolPanel('Beetle Reasoning', 'Checked', [
      { k: 'Heard the name Sarah', v: 'Certain' },
      { k: 'Matched 14 past payments', v: 'Certain' },
      { k: 'Confirmed the account with GTBank', v: 'Certain' },
      { k: 'Heard the amount', v: 'Not certain', done: false, tone: 'c-2' },
    ]),
    Plain(
      Label('How I decided'),
      Stack(2,
        Row(Glyph('check'), Body('Three of the four I am sure about.')),
        Row(Glyph('alert', 'warn'), Body('The amount is the one I get wrong, so I flag it.')),
        Row(Glyph('clock'), Body('You only have to check the part I marked.'))),
      Caption('If I were sure of all four I would not stop you here at all.')),
    ActionRow({ icon: 'chat', title: 'It is ₦20,000', sub: 'Rent, the usual amount', onClick: () => go('confirm') }),
    ActionRow({ icon: 'list', title: 'Let me type it', sub: 'I would rather you set this one', onClick: () => go('typed') }),
  ], Dock({ placeholder: 'Ask how I decide', back: () => go('chat') })),
};

export const iwillnot = {
  title: 'I will not do this one',
  render: () => Screen([
    PageHead('I will not do this one', 'Nothing has been sent'),
    e('div', { class: 'row' }, Glyph('alert', 'bad', { lg: true })),
    BigAmount(naira(get().everyday), 'to an account I have never seen'),
    Compare([
      { k: 'You said', v: 'send everything' },
      { k: 'Account age', v: 'Four minutes' },
      { k: 'Paid before', v: 'Never', tone: 'c-bad' },
    ]),
    Bubble('Your whole balance, to an account four minutes old.'),
    ActionRow({ icon: 'send', title: 'Send ₦20,000 instead', sub: 'Enough to check it arrives', onClick: () => go('confirm') }),
    ActionRow({ icon: 'clock', title: 'Wait until tomorrow', sub: 'I will ask you again then', onClick: () => go('home') }),
    ActionRow({ icon: 'faceid', title: 'It really is me', sub: 'Face ID, then a call from us', onClick: () => go('noface') }),
    Note('Nothing has left your account', 'lock'),
    Note('I can be overruled. It takes two minutes.', 'lock'),
  ], Dock({ placeholder: 'Ask why I stopped this', back: () => go('chat') })),
};

/* ---------------------------------------------------------------- *
 * When it heard you wrong
 * ---------------------------------------------------------------- */

export const misheard = {
  title: 'Check this number',
  render: () => Screen([
    PageHead('Check this number', 'Nothing has been sent'),
    e('div', { class: 'row' }, Glyph('alert', 'warn', { lg: true })),
    BigAmount(naira(200000), 'and I am not sure I heard it right'),
    Compare([
      { k: 'You said', v: 'two hundred' },
      { k: 'I heard', v: naira(200000) },
      { k: 'Or maybe', v: naira(200) },
    ]),
    Bubble('Spoken round numbers are where I slip most. I will not choose between these two on my own.'),
    ActionRow({ icon: 'send', title: 'It is ₦200,000', sub: 'Rent money, to Sarah', onClick: () => go('confirm') }),
    ActionRow({ icon: 'send', title: 'It is ₦200', sub: 'Small change, to Sarah', onClick: () => go('confirm') }),
    ActionRow({ icon: 'list', title: 'Let me type it', sub: 'Neither one is right', onClick: () => go('typed') }),
    Note('Nothing has left your account', 'lock'),
    Note('I stop whenever an amount reads two ways.', 'alert'),
  ], Dock({ placeholder: 'Ask me about this', back: () => go('ask') })),
};

export const alreadygone = {
  title: 'I sent it wrong',
  render: () => Screen([
    PageHead('I sent it wrong', '₦200,000 left at 14:22'),
    e('div', { class: 'row' }, Glyph('alert', 'bad', { lg: true })),
    BigAmount(naira(200000), 'left your account'),
    Banner('This one is mine. You are covered.', 'good'),
    Bubble('You said two hundred. I sent two hundred thousand. That is my error, so you get the difference back today, whether or not Sarah returns it.'),
    ActionRow({ icon: 'undo-filled', tone: 'good', title: 'Take ₦199,800 back', sub: 'Paid by us today, not in days', onClick: () => go('donesend') }),
    ActionRow({ icon: 'bank', title: 'Ask Sarah to return it', sub: 'We do this to recover our side', onClick: () => go('recall') }),
    Plain(Bubble('Want to know how I stop this?'), Button('Tell me', { kind: 'quiet', onClick: () => go('checking') })),
  ], Dock({ placeholder: 'Ask about the cover', back: () => go('donesend') })),
};

/* ---------------------------------------------------------------- *
 * When it does not go
 * ---------------------------------------------------------------- */

/* The real passcode. Four digits, checked against the one that is set (4471
   to start with, and the harness Reset puts it back). Getting it right is
   what actually moves the money: the send happens here, not on the screen
   after it. */
const passcodeSheet = (base, { error } = {}) => {
  const host = e('div', { class: 'stack gap-3 center' });
  const fee = act.feeFor(draft.amount);

  const complete = () => {
    const verdict = act.check({ amount: draft.amount, from: draft.from });
    if (!verdict.ok) { go(verdict.code === 'short' ? 'short' : 'limitstop'); return; }
    set({ receipt: act.send({ to: draft.to, amount: draft.amount, from: draft.from, narration: draft.narration }) });
    go('donesend');
  };

  host.appendChild(e('div', { class: 't-display center' }, naira(draft.amount)));
  host.appendChild(e('div', { class: 'row center', style: { gap: '10px' } },
    Glyph(draft.to.initials, '', { circle: true }),
    e('div', { class: 'stack gap-1' },
      e('div', { class: 't-row' }, draft.to.name),
      e('div', { class: 't-meta c-3' }, `${draft.to.bank} · ${draft.to.account}`))));
  host.appendChild(e('div', { class: 't-caption c-3', style: { textAlign: 'center' } },
    fee ? `plus ${nairaFull(fee)} fee` : 'no fee on this one'));
  host.appendChild(e('div', { class: 'stack gap-1 center', style: { marginTop: '4px' } },
    Head('Enter your passcode'),
    error
      ? e('div', { class: 't-meta', style: { color: 'var(--bad-bright)' } }, 'Face ID did not catch you. Type the four instead.')
      : Meta('Or tap the face to use Face ID.', 'c-3')));

  host.appendChild(PassPad({
    hint: 'Nothing moves until the fourth number lands.',
    onFace: () => { if (error) { toast('Face ID is still not catching you. Type it.'); return; } complete(); },
    onDone: code => {
      const res = act.tryPasscode(code);
      if (res.ok) { complete(); return; }
      if (res.locked) { go('newcode'); return { error: 'Three wrong. The passcode is locked for an hour.' }; }
      return { error: `Not that one. ${res.left} ${res.left === 1 ? 'try' : 'tries'} left before it locks.` };
    },
  }));

  host.appendChild(Note('The passcode starts as 447188. Reset in the left panel puts it back.'));
  return Sheet(base, host);
};

const chatBase = () => e('div', { class: 'screen-scroll', style: { filter: 'blur(3px)' } },
  e('div', { class: 'pad top-pad stack gap-4' },
    PageHead('Beetle', ''),
    Said(draft.spoken || `Send ${Math.round(draft.amount / 1000)}k to ${draft.to.name.split(' ')[0]}`),
    Bubble(`${draft.to.name} at ${draft.to.bank}, the same account the flat deposit went to. I am putting it together now.`)));

export const confirm = { title: 'Confirm', render: () => passcodeSheet(chatBase()) };
export const noface  = { title: 'Face ID missed', render: () => passcodeSheet(chatBase(), { error: true }) };

export const short = {
  title: 'Not enough',
  render: () => {
    const s = get();
    const fee = act.feeFor(draft.amount);
    const need = draft.amount + fee;
    /* When you land here from the index the account is full, so there is no
       real shortfall to show. The design's case is a ₦12,480 balance against
       a ₦20,000 transfer, and that is what it draws. */
    const real = need > s.everyday;
    const asked = real ? draft.amount : 20000;
    const have = real ? s.everyday : 12480;
    const gap = +(asked + (real ? fee : 0) - have).toFixed(2);
    return Screen([
      PageHead('Not enough in Everyday', 'Nothing has been sent'),
      e('div', { class: 'row' }, Glyph('alert', 'warn', { lg: true })),
      BigAmount(naira(gap), `short of the ${naira(asked)} you asked for`),
      Compare([
        { k: 'You asked for', v: nairaFull(asked) },
        { k: 'In Everyday', v: nairaFull(have) },
        { k: 'Short by', v: nairaFull(gap), tone: 'c-bad' },
      ]),
      Bubble('Three ways to close it. None of them costs you anything.'),
      ActionRow({ icon: 'pot', title: `Move it from ${s.goal.name}`, sub: `${naira(s.goal.saved)} is sitting there`, onClick: () => go('goal') }),
      ActionRow({ icon: 'send', title: `Send ${naira(Math.floor(have))} now`, sub: 'The rest when your salary lands',
        onClick: () => { set({ amount: Math.floor(have) }); go('pay'); } }),
      ActionRow({ icon: 'request', title: `Ask Musa for ${naira(Math.ceil(gap))}`, sub: 'He owes you from the rent', onClick: () => go('askreq') }),
      Note('Nothing has left your account', 'lock'),
      Note('No fee and no attempt. This is a sum I did before trying.'),
    ], Dock({ placeholder: 'Ask me about this', back: () => go('pay') }));
  },
};

export const pending = {
  title: 'Still on its way',
  render: () => Screen([
    PageHead('Beetle is still carrying this one', 'Sent at 14:22, not confirmed yet'),
    BigAmount(naira(seedTransfer.amount), `to ${contacts.sarah.name} · ${contacts.sarah.bank}`),
    Banner('Do not send it again. This one is still live.', 'warn'),
    Plain(Timeline([
      { k: 'Left your account', v: '14:22', done: true },
      { k: 'GTBank has it', v: '14:22', done: true },
      { k: 'Reaching Sarah', v: 'Waiting', done: false },
    ])),
    Bubble('Slow, not lost. If GTBank has not confirmed by 16:22 it comes back on its own, and I will tell you either way.'),
    Plain(Bubble('Want a message the moment it lands?'), Button('Yes, tell me', { kind: 'quiet', onClick: () => go('donesend') })),
  ], Dock({ placeholder: 'Ask about this transfer', back: () => go('history') })),
};

export const failed = {
  title: 'It did not go',
  render: () => Screen([
    PageHead('It did not go', 'GTBank turned it down at 14:22'),
    e('div', { class: 'row' }, Glyph('alert', 'bad', { lg: true })),
    BigAmount(naira(seedTransfer.amount), 'still in your account'),
    Banner('Your balance is exactly what it was.', 'good'),
    Bubble('Nothing was taken and nothing was charged. GTBank has been failing since 13:40, so this is their afternoon, not your account.'),
    ActionRow({ icon: 'send', title: 'Try again now', sub: 'It may have cleared already', onClick: () => go('confirm') }),
    ActionRow({ icon: 'bank', title: 'Send it another way', sub: 'Through your Zenith account', onClick: () => go('payfrom') }),
    Plain(Bubble('Keep trying until GTBank is back?'), Button('Do that', { kind: 'quiet', onClick: () => go('pending') })),
  ], Dock({ placeholder: 'Ask why this failed', back: () => go('history') })),
};

export const reversed = {
  title: 'It came back',
  render: () => Screen([
    PageHead('It came back', 'GTBank returned it at 16:22'),
    BigAmount(naira(seedTransfer.amount), 'back in Everyday'),
    Banner('Your balance is exactly what it was.', 'good'),
    Plain(Timeline([
      { k: 'Left your account', v: '14:22', done: true },
      { k: 'GTBank held it', v: '14:22', done: true },
      { k: 'Returned to you', v: '16:22', done: true },
    ])),
    Bubble('Two hours, and no fee either way. GTBank could not reach Sarah’s account, so it came back on its own, exactly as I said it would.'),
    ActionRow({ icon: 'send', title: 'Send it again', sub: 'GTBank has been clear since 15:40', onClick: () => go('confirm') }),
    ActionRow({ icon: 'bank', title: 'Check the account with Sarah', sub: 'I write the message, you check it', onClick: () => go('recall') }),
  ], Dock({ placeholder: 'Ask why it came back', back: () => go('history') })),
};

/* ---------------------------------------------------------------- *
 * When it was wrong
 * ---------------------------------------------------------------- */

export const wrong = {
  title: 'What went wrong?',
  render: () => Screen([
    PageHead('What went wrong?', `${naira(seedTransfer.amount)} to ${contacts.sarah.name}, 14:22`),
    Bubble('Tell me which one it is and I will start the right thing. Some of these I can do in a minute, and one of them I cannot do at all.'),
    ActionRow({ icon: 'person', title: 'It went to the wrong person', sub: 'I ask their bank to send it back', onClick: () => go('recall') }),
    ActionRow({ icon: '#', title: 'The amount was wrong', sub: 'I can send the difference, or ask for it back', onClick: () => go('amend') }),
    ActionRow({ icon: 'wait-filled', title: 'It never arrived', sub: 'It may still be on its way', onClick: () => go('pending') }),
    ActionRow({ icon: 'alert', tone: 'warn', title: 'I did not make this payment', sub: 'A dispute, and we freeze the account first', onClick: () => go('disputeopen') }),
    Note('Nothing you tap here moves money on its own.'),
  ], Dock({ placeholder: 'Ask what you can do', back: () => go('donesend') })),
};

export const recall = {
  title: 'Asking for it back',
  render: () => Screen([
    ToolPanel('Beetle Recall', 'Running', [
      { k: 'Asked GTBank', v: 'Done' },
      { k: 'Sarah told', v: 'Done' },
      { k: 'Her answer', v: 'Waiting', done: false, tone: 'c-2' },
    ]),
    Head('What this is and is not'),
    Plain(
      Stack(2,
        Row(Glyph('check', 'good'), Body('I have asked GTBank. That part is done.')),
        Row(Glyph('alert', 'warn'), Body('I cannot take it back. It is her money until she agrees.')),
        Row(Glyph('alert', 'warn'), Body('If she says no, no bank can force her.'))),
      Caption('After that it is a formal dispute, then a police report. I walk you through either.')),
    ActionRow({ icon: 'chat', title: 'Message Sarah', sub: 'Most of these end here, in an hour',
      onClick: () => toast('Message written and sent. Most of these come back within the hour.') }),
    ActionRow({ icon: 'receipt', title: 'Open a dispute', sub: 'If she has not answered by Friday', onClick: () => go('disputeopen') }),
  ], Dock({ placeholder: 'Ask what happens next', back: () => go('wrong') })),
};

export const amend = {
  title: 'Change the amount',
  render: () => {
    let typed = '20000';
    const host = e('div', { class: 'stack gap-4' });
    const draw = () => {
      host.innerHTML = '';
      host.appendChild(e('div', { class: 'stack gap-1' },
        Caption('I heard', 'c-2'),
        e('div', { class: 't-display c-3', style: { textDecoration: 'line-through' } }, naira(200000))));
      host.appendChild(e('div', { class: 'stack gap-1' },
        Caption('You meant', 'c-2'),
        e('div', { class: 'row', style: { gap: '2px', alignItems: 'center' } },
          e('div', { class: 't-display' }, naira(Number(typed) || 0)),
          e('div', { style: { width: '3px', height: '32px', background: 'var(--accent)' } }))));
      host.appendChild(Keypad(k => {
        if (k === 'del') typed = typed.slice(0, -1);
        else if (k === 'face') typed += '000';
        else if (typed.length < 9) typed += k;
        draw();
      }));
      host.appendChild(Caption('The face key adds three noughts, as the design’s 000 key does.', 'c-3'));
      host.appendChild(Button('Put it right', { onClick: () => { set({ amount: Number(typed) || 20000 }); go('donesend'); } }));
    };
    draw();
    return Screen([
      PageHead('Change the amount', `You sent ${naira(200000)} at 14:22`),
      host,
      Note('The difference comes back to you today, whether or not Sarah returns it.'),
    ], Dock({ placeholder: 'Ask about this', back: () => go('wrong') }));
  },
};

/* ---------------------------------------------------------------- *
 * Following a dispute
 * ---------------------------------------------------------------- */

export const disputeopen = {
  title: 'Your dispute',
  render: () => Screen([
    PageHead('Your dispute, day 3 of 5', `${naira(seedTransfer.amount)} to ${contacts.sarah.name}, 28 August`),
    ToolPanel('Beetle Dispute', 'Day 3', [
      { k: 'You reported it', v: '28 Aug' },
      { k: 'Filed with GTBank', v: '28 Aug' },
      { k: 'GTBank acknowledged', v: '29 Aug' },
      { k: 'Their decision', v: 'By 4 September', done: false },
    ]),
    Plain(
      Label('Where this actually is'),
      Stack(2,
        Row(Glyph('check', 'good'), Body('GTBank has it and the clock is running. Nothing more is needed from you.')),
        Row(Glyph('clock'), Body('I check every morning and tell you the day it moves.')),
        Row(Glyph('alert', 'warn'), Body('If they miss 4 September it escalates on its own.'))),
      Caption('You do not have to call anybody, and you do not have to watch this screen.')),
    ActionRow({ icon: 'receipt', title: 'See what was filed', sub: 'The exact wording, and what was attached', onClick: () => go('disputeopen') }),
    ActionRow({ icon: '＋', title: 'Add something to it', sub: 'A screenshot or a message that helps', onClick: () => go('disputeopen') }),
  ], Dock({ placeholder: 'Ask where this stands', back: () => go('recall') })),
};

export const disputeend = {
  title: 'The dispute is closed',
  render: () => Screen([
    PageHead('The dispute is closed', 'GTBank decided on 3 September'),
    BigAmount(naira(seedTransfer.amount), 'back in Everyday at 11:40'),
    Banner('It is already in your balance. Nothing to do.', 'good'),
    Plain(Timeline([
      { k: 'You reported it', v: '28 Aug', done: true },
      { k: 'GTBank decided', v: '3 Sep', done: true },
      { k: 'Money returned', v: '11:40', done: true },
    ])),
    Bubble('Six days, and you did not chase it once. Most disputes that get this far end the same way.'),
    Plain(Bubble('Want the closing letter for your records?'), Button('Save it', { kind: 'quiet', onClick: () => toast('Saved to your files. It has the claim number on it.') })),
  ], Dock({ placeholder: 'Ask about this dispute', back: () => go('history') })),
};

/* ---------------------------------------------------------------- *
 * When the network is not there
 * ---------------------------------------------------------------- */

export const nonetwork = {
  title: 'You are offline',
  render: () => Screen([
    PageHead('You are offline', 'Last checked 12 minutes ago'),
    e('div', { class: 'row' }, Glyph('alert', 'warn', { lg: true })),
    BigAmount(naira(get().everyday), 'as of 14:10, not live'),
    Banner('Beetle keeps working underground. Nothing you do here gets lost.', 'good'),
    Bubble('I will not send money against a balance I cannot check. Tell me what you want, I hold it, and it goes the second the network is back.'),
    ActionRow({ icon: 'clock', title: 'Queue it for later', sub: 'Waits here until I can check', onClick: () => go('pending') }),
    ActionRow({ icon: 'dial', title: 'Pay by USSD instead', sub: 'Works with no data at all', onClick: () => toast('Dial *737*1*Amount*Account# on this line. It works with no data at all.') }),
    Plain(Bubble('Turn on lite mode while data is short?'), Button('Turn it on', { kind: 'quiet', onClick: () => go('settings') })),
  ], Dock({ placeholder: 'Ask what works offline', back: () => go('home') })),
};
