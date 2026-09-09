/* Act Three, part one — sending, buying, asking to be paid, and bills.
   Four ways in, one path through. */

import {
  el, Icon, AgentMark, Screen, Dock, Sheet, PageHead, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Divider, Spacer, Glyph, ListRow, ActionRow, Field,
  Button, Ghost, Chip, Bubble, Said, ToolPanel, Banner, Note, Pill, Waveform,
  Keyboard, AmountPad, TextPad, Picker, EditRow, Slide, PassPad, toast,
  naira, nairaFull,
} from '../ui.js';
import { transfer as seedTransfer, contacts, me, bills, meterBill, insights } from '../data.js';
import { get, dollarsInNaira } from '../store.js';
import * as act from '../actions.js';
import { draft, start, set } from '../flow.js';
import { setQuestion } from './home.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

/* The send form opens a sheet to change one field at a time, rather than
   sending you to a screen that is not in the design. */
let editing = null;
const edit = what => { editing = what; repaint(); };
const stopEditing = () => { editing = null; repaint(); };

/* A receipt, used by every "it is done" screen. */
/* A receipt, laid out the way the design draws one: two columns, with a
   dashed rule between the identity, the money, and the totals. A narration
   runs the full width. Used by every "it is done" screen. */
export const receiptBody = ({ head, sub, amount, line, fields, session, sessionLabel = 'Session ID', tone = 'good', icon = 'check' }) => {
  const WIDE = ['Narration', 'What', 'For'];
  const RULE_BEFORE = ['Amount', 'Total charged'];

  const cells = [];
  fields.forEach(f => {
    if (RULE_BEFORE.includes(f[0])) cells.push(e('div', { class: 'receipt-rule' }));
    cells.push(e('div', { class: 'receipt-cell' + (WIDE.includes(f[0]) ? ' wide' : '') },
      e('div', { class: 't-caption c-2' }, f[0]),
      e('div', { class: 't-row' }, f[1]),
      f[2] ? e('div', { class: 't-caption c-3' }, f[2]) : null));
  });

  return [
    PageHead(head, sub),
    e('div', { class: 'row', style: { gap: '12px', alignItems: 'center' } },
      Glyph(icon, tone, { lg: true, circle: true }),
      e('div', { class: 'stack gap-1 grow' },
        e('div', { class: 't-display' }, amount),
        Meta(line, 'c-3')),
      Pill('Successful', 'good')),
    e('div', { class: 'card receipt' }, ...cells),
    session && e('div', { class: 'card-plain row between' },
      e('div', { class: 'stack gap-1 grow' },
        e('div', { class: 't-caption c-2' }, sessionLabel),
        e('div', { class: 't-meta', style: { wordBreak: 'break-all' } }, session)),
      e('button', { class: 'copy-btn press', 'aria-label': 'Copy', onClick: () => toast(sessionLabel + ' copied.') },
        Icon('copy', { size: 18 }))),
  ];
};

/* ---------------------------------------------------------------- *
 * Sending money — the four ways in
 * ---------------------------------------------------------------- */

const blurredHome = () => e('div', { class: 'screen-scroll', style: { filter: 'blur(4px)', opacity: .6 } },
  e('div', { class: 'pad top-pad stack gap-4' },
    e('div', { class: 'row between' }, Glyph('mark', 'accent', { circle: true }), Label('Wallet'), Icon('bell', { size: 22 })),
    e('div', { class: 'stack gap-2 center' },
      Caption('Total balance', 'c-2'),
      e('div', { class: 't-display' }, naira(get().everyday)),
      e('button', { class: 'btn btn-primary', style: { width: 'auto', padding: '13px 26px' } }, Icon('receive-filled', { size: 18 }), 'Receive')),
    e('div', { class: 'row' }, ...['airtime-tone', 'power-tone', 'pot-tone', 'grid-tone'].map(i =>
      e('div', { class: 'center', style: { flex: 1 } }, Icon(i, { size: 24 }))))));

export const ask = {
  title: 'Ask (voice)',
  render: () => Sheet(blurredHome(),
    e('div', { class: 'row', style: { gap: '8px' } }, AgentMark(), e('div', { class: 't-label c-accent' }, 'Listening')),
    e('div', { class: 't-title' }, e('span', null, 'Send 20k to '), e('span', { class: 'c-3' }, 'Sarah')),
    Waveform(30, 11),
    Meta('Or try one of these', 'c-3'),
    Stack(2,
      ...['Pay my light bill', 'How much did I spend on data?', 'What can I borrow?'].map(t =>
        e('button', { class: 'btn btn-quiet', onClick: () => { setQuestion(t); go('agentchat'); } }, t))),
    Ghost('Not what I said', () => go('misheard')),
    e('div', { class: 'row', style: { gap: '10px' } },
      e('button', { class: 'btn btn-accent grow press', onClick: () => { start({ to: contacts.sarah, amount: 20000, narration: seedTransfer.narration, spoken: seedTransfer.spoken }); go('chat'); } }, 'Release to send'),
      e('button', { class: 'key', style: { width: '56px', height: '56px', flex: 'none' }, 'aria-label': 'Stop', onClick: () => go('home') }, Icon('close', { size: 22 })))),
};

export const scan = {
  title: 'Scan (photo)',
  render: () => e('div', { class: 'screen-scroll', style: { background: '#101216' } },
    e('div', { class: 'pad top-pad stack gap-4 center', style: { color: '#fff' } },
      e('div', { class: 't-head c-inv' }, 'Point at an account number'),
      Meta('A QR code works too. So does a screenshot.', 'c-3'),
      e('div', { style: { background: '#fff', borderRadius: '16px', padding: '14px', width: '100%', textAlign: 'left' } },
        e('div', { class: 'row between', style: { marginBottom: '8px' } },
          e('div', { class: 'row', style: { gap: '8px' } }, Glyph('MA'), e('div', { class: 't-caption c-2' }, 'Musa · Agent')),
          e('div', { class: 't-caption c-3' }, '2:14 PM')),
        e('div', { class: 't-body', style: { marginBottom: '10px' } }, 'Good afternoon sir. Rent part payment:'),
        e('div', { class: 'stack gap-2' },
          ...[naira(20000), contacts.sarah.bank, contacts.sarah.account].map(t =>
            e('span', { style: { background: 'var(--accent-wash)', color: 'var(--accent-deep)', borderRadius: '6px', padding: '4px 8px', font: '600 14px var(--font)', alignSelf: 'flex-start' } }, t)),
          /* the design flags the one it is not certain of */
          e('div', { class: 'row', style: { gap: '6px' } },
            e('span', { style: { background: '#fdf2dd', color: '#7a5b12', borderRadius: '6px', padding: '4px 8px', font: '600 14px var(--font)' } }, 'Sarah A.'),
            e('span', { class: 't-caption', style: { color: '#7a5b12' } }, 'not sure')))),
      e('div', { class: 'row', style: { background: 'var(--good)', color: '#fff', borderRadius: '999px', padding: '8px 16px', font: '600 14px var(--font)', gap: '6px' } },
        Icon('check', { size: 16 }), contacts.sarah.account),
      Spacer(10),
      e('div', { class: 'row center', style: { gap: '30px' } },
        e('div', { style: { opacity: .7 } }, Icon('grid', { size: 24 })),
        e('button', { class: 'press', style: { width: '68px', height: '68px', borderRadius: '999px', background: '#fff', border: '5px solid #4b5160', cursor: 'pointer' }, 'aria-label': 'Take the photo',
          onClick: () => { start({ to: contacts.sarah, amount: 20000, narration: 'Rent part payment', spoken: 'the account in the photo' }); go('chat'); } }),
        e('div', { style: { opacity: .7 } }, Icon('power', { size: 24 }))),
      Caption('Or send a screenshot straight to Beetle from WhatsApp.', 'c-3'))),
};

const PEOPLE = [contacts.sarah, contacts.musa, contacts.chidi, contacts.john];

/* Typing understands the shorthand people actually use: a name it knows and
   an amount, with k and m for thousands and millions. What it worked out is
   shown as chips before you send, so nothing is guessed silently. */
const readTyped = text => {
  const t = text.toLowerCase();
  const who = PEOPLE.find(c => t.includes(c.name.split(' ')[0].toLowerCase()));
  const m = t.match(/(\d+(?:\.\d+)?)\s*([km])?/);
  let amount = null;
  if (m) {
    amount = Number(m[1]);
    if (m[2] === 'k') amount *= 1000;
    if (m[2] === 'm') amount *= 1000000;
  }
  return { who, amount };
};

export const typed = {
  title: 'Typed',
  render: () => {
    const chips = e('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap', minHeight: '34px' } });
    const said = e('div');

    const show = text => {
      const { who, amount } = readTyped(text);
      chips.innerHTML = '';
      if (amount) chips.appendChild(Chip(naira(amount), true));
      if (who) chips.appendChild(Chip(who.name, true));
      if (amount || who) chips.appendChild(Chip(draft.from === 'dollars' ? 'Dollars' : 'Everyday', true));
      if (!amount && !who) chips.appendChild(e('div', { class: 't-caption c-3' }, 'A name and an amount is all I need.'));
    };

    const pad = TextPad({
      value: 'send sarah 20k', placeholder: 'send sarah 20k',
      onChange: show,
      onSend: text => {
        const { who, amount } = readTyped(text);
        if (!who || !amount) { toast('I need a name I know and an amount.'); return; }
        start({ to: who, amount, narration: seedTransfer.narration, spoken: text });
        go('chat');
      },
    });
    said.appendChild(Said('send sarah 20k'));

    return e('div', { class: 'screen-scroll' },
      e('div', { class: 'pad top-pad stack gap-3', style: { paddingBottom: '10px' } },
        said, pad.line, chips,
        Meta('Try: send chidi 5k, or john 250', 'c-3')),
      pad.kb);
  },
};

const editSheet = base => {
  if (editing === 'amount') {
    return Sheet(base,
      e('div', { class: 'stack gap-1 center' },
        Head('How much?'),
        Meta(`${naira(get().everyday)} in Everyday`, 'c-3')),
      AmountPad({ value: draft.amount, onChange: v => set({ amount: v }) }),
      Button('Use this amount', { onClick: stopEditing }));
  }
  if (editing === 'to') {
    return Sheet(base,
      Head('Who is it going to?'),
      Picker(PEOPLE.map(c => ({ id: c.account, label: c.name, sub: `${c.bank} · ${c.account}` })), draft.to.account,
        id => { set({ to: PEOPLE.find(c => c.account === id) }); stopEditing(); }),
      Button('Close', { kind: 'quiet', onClick: stopEditing }));
  }
  if (editing === 'from') {
    return Sheet(base,
      Head('Pay from which one?'),
      Picker([
        { id: 'everyday', label: 'Everyday', sub: `${naira(get().everyday)} in naira` },
        { id: 'dollars', label: 'Dollars', sub: `$${get().dollars.toFixed(2)}, about ${naira(dollarsInNaira())}` },
      ], draft.from, id => { set({ from: id }); stopEditing(); }),
      Button('Close', { kind: 'quiet', onClick: stopEditing }));
  }
  if (editing === 'why') {
    const pad = TextPad({
      value: draft.narration, placeholder: 'What is it for?',
      onSend: t => { set({ narration: t }); stopEditing(); }, sendLabel: 'done',
    });
    return e('div', { class: 'screen-scroll' },
      e('div', { class: 'pad top-pad stack gap-3' },
        Caption('Reference', 'c-2'), pad.line,
        Meta('Both of you see this on the receipt.', 'c-3')),
      pad.kb);
  }
  return base;
};

export const pay = {
  title: 'Send money (form)',
  render: () => {
    const s = get();
    const verdict = act.check({ amount: draft.amount, from: draft.from });
    const fee = act.feeFor(draft.amount);

    const base = Screen([
      PageHead('Send money', `To ${draft.to.name}`, { big: true }),
      Card(
        EditRow('To', draft.to.name, `${draft.to.bank} · ${draft.to.account}`, () => edit('to')),
        Divider(),
        EditRow('Amount', nairaFull(draft.amount), null, () => edit('amount')),
        Divider(),
        EditRow('From', draft.from === 'dollars' ? 'Dollars' : 'Everyday',
          draft.from === 'dollars' ? `$${s.dollars.toFixed(2)} held` : `${naira(s.everyday)} in naira`, () => edit('from')),
        Divider(),
        EditRow('Reference', draft.narration || 'None', null, () => edit('why'))),
      Card(
        e('div', { class: 'row between' },
          Caption('Fee', 'c-2'),
          e('div', { class: 't-label ' + (fee ? '' : 'c-good') }, fee ? nairaFull(fee) : 'Free')),
        e('div', { class: 'row between' },
          Caption('Total leaving', 'c-2'), Label(nairaFull(draft.amount + fee))),
        e('div', { class: 'row between' },
          Caption('Arrives', 'c-2'), Label('In a few seconds')),
        fee ? Caption('₦25 to NIP plus 7.5% VAT. Under ₦10,000 carries none.', 'c-3') : null),

      verdict.ok
        ? Note('Nothing moves until you slide.')
        : Banner(verdict.why, 'warn'),

      verdict.ok
        ? Slide('Slide to send ' + naira(draft.amount), () => go('confirm'))
        : verdict.code === 'short' ? Button('See how to close it', { kind: 'quiet', onClick: () => go('short') })
        : verdict.code === 'day-limit' || verdict.code === 'transfer-limit' ? Button('Why I stopped', { kind: 'quiet', onClick: () => go('limitstop') })
        : Button('Put an amount in', { kind: 'quiet', onClick: () => edit('amount') }),
    ], Dock({ placeholder: 'Ask about this transfer', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));

    return editSheet(base);
  },
};

export const chat = {
  title: 'Chat',
  render: () => {
    const verdict = act.check({ amount: draft.amount, from: draft.from });
    const fee = act.feeFor(draft.amount);
    return Screen([
      PageHead('Beetle', ''),
      Said(draft.spoken || `Send ${Math.round(draft.amount / 1000)}k to ${draft.to.name.split(' ')[0]}`, { spoken: true }),
      Bubble(`${draft.to.name} at ${draft.to.bank}, the same account the flat deposit went to. I am putting it together now.`),
      ToolPanel('Beetle Transfers', 'Running', [
        { k: 'Recipient', v: draft.to.name },
        { k: 'Bank', v: `${draft.to.bank} · ${draft.to.account}` },
        { k: 'Amount', v: naira(draft.amount) },
        { k: 'Fee', v: fee ? nairaFull(fee) : 'Free', tone: fee ? '' : 'c-good' },
        { k: 'Arrives', v: 'Checking with ' + draft.to.bank, done: false, tone: 'c-2' },
      ]),
      verdict.ok
        ? Button('Confirm ' + naira(draft.amount), { onClick: () => go('confirm') })
        : Banner(verdict.why, 'warn'),
      verdict.ok ? null : Button('Change it', { kind: 'quiet', onClick: () => go('pay') }),
      Ghost('Change something first', () => go('pay')),
      Note('Face ID first. Nothing leaves your account until then.'),
    ], Dock({ placeholder: 'Reply, or just keep talking', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

/* The receipt of whatever was last sent. If you land here without having
   sent anything — straight from the index — it shows the transfer the design
   is written around, so the screen is never blank. */
export const lastReceipt = () => draft.receipt || {
  to: contacts.sarah, amount: seedTransfer.amount, fee: seedTransfer.fee,
  from: 'everyday', narration: seedTransfer.narration,
  total: seedTransfer.total, balanceAfter: seedTransfer.balanceAfter,
  at: seedTransfer.at, session: seedTransfer.session,
};

export const donesend = {
  title: 'All done',
  render: () => {
    const r = lastReceipt();
    return Screen([
      ...receiptBody({
        head: 'All done', sub: r.at,
        amount: naira(r.amount), line: `Sent to ${r.to.name}`,
        fields: [
          ['To', r.to.name, `${r.to.bank} · ${r.to.account}`],
          ['From', r.from === 'dollars' ? 'Dollars' : 'Everyday', me.account],
          ['Narration', r.narration || 'None'],
          ['Amount', nairaFull(r.amount)],
          ['Fee', r.fee ? nairaFull(r.fee) : 'Free', r.fee ? '₦25 to NIP plus 7.5% VAT' : 'Transfers under ₦10,000 carry none'],
          ['Total charged', nairaFull(r.total)],
          ['Balance after', nairaFull(r.balanceAfter)],
        ],
        session: r.session,
      }),
      Button('Share receipt', { icon: 'share', onClick: () => go('share') }),
      Ghost('Something is wrong with this', () => go('wrong')),
    ], Dock({ placeholder: 'Ask about this transfer', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const shareSheet = (base, line, back) => Sheet(base,
  e('div', { class: 'stack gap-3 center' },
    Glyph('share', '', { lg: true }),
    e('div', { class: 't-head' }, 'Share this receipt'),
    Meta(line, 'c-3')),
  Card(
    ...[
      ['chat', 'WhatsApp', 'The picture, ready to send'],
      ['camera', 'Save to photos', 'It stays on this phone'],
      ['receipt', 'Save as PDF', 'The full record, for an office'],
      ['grid', 'Somewhere else', 'Messages, mail, anywhere you share'],
    ].map(([i, t, s], n) => e('div', null,
      n ? Divider() : null,
      e('div', { class: 'listrow' }, Glyph(i),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, t),
          e('div', { class: 'listrow-sub' }, s)),
        e('div', { class: 'chev' }, '›'))))),
  Note('Your balance and the full account numbers are left off every copy that leaves the phone.', 'eye'),
  Button('Done', { kind: 'quiet', onClick: back }));

export const quietReceipt = fields => e('div', { class: 'screen-scroll', style: { filter: 'blur(3px)', opacity: .55 } },
  e('div', { class: 'pad top-pad stack gap-4' }, ...fields));

export const share = {
  title: 'Share',
  render: () => {
    const r = lastReceipt();
    return shareSheet(
      quietReceipt([PageHead('All done', r.at), e('div', { class: 't-display' }, naira(r.amount))]),
      `${naira(r.amount)} to ${r.to.name}`,
      () => go('donesend'));
  },
};

/* ---------------------------------------------------------------- *
 * Buying something
 * ---------------------------------------------------------------- */

export const asksvc = {
  title: 'Ask (voice)',
  render: () => Sheet(blurredHome(),
    e('div', { class: 'row', style: { gap: '8px' } }, AgentMark(), e('div', { class: 't-label c-accent' }, 'Listening')),
    e('div', { class: 't-title' }, e('span', null, 'Buy 5GB for '), e('span', { class: 'c-3' }, 'Mum')),
    Waveform(30, 23),
    Meta('Or try one of these', 'c-3'),
    Stack(2, ...['Buy me airtime', 'Top up my light', 'What data plan is cheapest?'].map(t =>
      e('button', { class: 'btn btn-quiet', onClick: () => { setQuestion(t); go('agentchat'); } }, t))),
    e('button', { class: 'btn btn-accent press', onClick: () => go('buy') }, 'Release to send')),
};

export const typedbuy = {
  title: 'Typed',
  render: () => e('div', { class: 'screen-scroll' },
    e('div', { class: 'pad top-pad stack gap-3', style: { paddingBottom: '10px' } },
      Said('5gb for mum'),
      e('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
        Chip('5GB', true), Chip('MTN', true), Chip('Mum', true))),
    Keyboard(k => { if (k === 'send') go('buy'); })),
};

const PLANS = [
  { id: '1gb',  label: '1.5GB for 30 days', price: 1000 },
  { id: '5gb',  label: '5GB for 30 days',   price: 2500 },
  { id: '10gb', label: '10GB for 30 days',  price: 4000 },
  { id: 'air',  label: 'Airtime, no plan',  price: 1000 },
];

let plan = PLANS[1];
/* The services drawer lists the same plans, so it sets this one. */
export const setPlan = price => { plan = PLANS.find(x => x.price === price) || plan; };
export const currentPlan = () => plan;

export const buy = {
  title: 'Buy data',
  render: () => Screen([
    PageHead('Buy data', 'Everything I filled in, before it goes'),
    Said(plan.label.split(' for ')[0] + ' for Mum'),
    Bubble(`Mum’s line is MTN, and ${plan.label.toLowerCase()} is ${naira(plan.price)}. ${plan.id === '5gb' ? 'That is the same plan you bought last month.' : 'You have not bought this one before.'}`),
    ToolPanel('Beetle Airtime', 'Running', [
      { k: 'Line', v: contacts.mum.account },
      { k: 'Whose', v: 'Mum' },
      { k: 'Plan', v: plan.label },
      { k: 'Price', v: naira(plan.price) },
      { k: 'Cheaper?', v: plan.id === '10gb' ? 'Best value per GB' : 'No, this is the best', tone: 'c-good' },
    ]),
    Head('Change the plan'),
    Picker(PLANS.map(x => ({ id: x.id, label: x.label, sub: naira(x.price) })), plan.id,
      id => { plan = PLANS.find(x => x.id === id); repaint(); }),
    get().everyday >= plan.price
      ? Button('Confirm ' + naira(plan.price), { onClick: () => go('confirmbuy') })
      : Banner('Not enough in Everyday for that plan.', 'warn'),
    Note('Face ID first. Nothing leaves your account until then.'),
  ], Dock({ placeholder: 'Reply, or just keep talking', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } })),
};

let buyReceipt = null;

export const confirmbuy = {
  title: 'Confirm',
  render: () => Sheet(
    quietReceipt([PageHead('Buy data', ''), e('div', { class: 't-display' }, naira(plan.price))]),
    e('div', { class: 'stack gap-3 center' },
      e('div', { class: 't-display' }, naira(plan.price)),
      e('div', { class: 't-row' }, 'MTN · ' + plan.label.split(' for ')[0]),
      Meta('Mum · ' + contacts.mum.account, 'c-3'),
      Head('Enter your passcode'),
      PassPad({
        hint: 'Nothing moves until the fourth number lands.',
        onFace: () => { buyReceipt = act.buy({ network: 'MTN', line: contacts.mum.account, amount: plan.price, label: plan.label }); go('done'); },
        onDone: code => {
          const res = act.tryPasscode(code);
          if (res.ok) { buyReceipt = act.buy({ network: 'MTN', line: contacts.mum.account, amount: plan.price, label: plan.label }); go('done'); return; }
          if (res.locked) { go('newcode'); return { error: 'Three wrong. The passcode is locked for an hour.' }; }
          return { error: `Not that one. ${res.left} ${res.left === 1 ? 'try' : 'tries'} left.` };
        },
      }))),
};

export const done = {
  title: 'All done',
  render: () => {
    const r = buyReceipt || { amount: plan.price, label: plan.label, at: '28 August 2026 at 8:02 AM', session: 'MTN 88231 4471 0395', balanceAfter: get().everyday };
    return Screen([
      ...receiptBody({
        head: 'All done', sub: r.at,
        amount: naira(r.amount), line: `${r.label.split(' for ')[0]} sent to Mum`,
        fields: [
          ['To', 'Mum', `${contacts.mum.account} · MTN`],
          ['From', 'Everyday', me.account],
          ['What', r.label, 'Valid for 30 days'],
          ['Amount', nairaFull(r.amount)],
          ['Fee', 'Free'],
          ['Total charged', nairaFull(r.amount)],
          ['Balance after', nairaFull(r.balanceAfter)],
        ],
        session: r.session,
      }),
      Button('Share receipt', { icon: 'share', onClick: () => go('sharebuy') }),
    ], Dock({ placeholder: 'Ask about this purchase', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const sharebuy = {
  title: 'Share',
  render: () => shareSheet(
    quietReceipt([PageHead('All done', ''), e('div', { class: 't-display' }, naira(plan.price))]),
    `${naira(plan.price)} to Mum`,
    () => go('done')),
};

/* ---------------------------------------------------------------- *
 * Asking to be paid
 * ---------------------------------------------------------------- */

export const askreq = {
  title: 'Ask (voice)',
  render: () => Sheet(blurredHome(),
    e('div', { class: 'row', style: { gap: '8px' } }, AgentMark(), e('div', { class: 't-label c-accent' }, 'Listening')),
    e('div', { class: 't-title' }, e('span', null, 'Ask Musa for '), e('span', { class: 'c-3' }, '20k')),
    Waveform(30, 41),
    Meta('Or try one of these', 'c-3'),
    Stack(2, ...['Ask Sarah for the rent', 'Remind John about last week', 'Who owes me money?'].map(t =>
      e('button', { class: 'btn btn-quiet', onClick: () => { setQuestion(t); go('agentchat'); } }, t))),
    e('button', { class: 'btn btn-accent', onClick: () => go('request') }, 'Release to send')),
};

export const typedask = {
  title: 'Typed',
  render: () => e('div', { class: 'screen-scroll' },
    e('div', { class: 'pad top-pad stack gap-3', style: { paddingBottom: '10px' } },
      Said('ask musa for 20k'),
      e('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
        Chip(naira(20000), true), Chip('Musa Danjuma', true))),
    Keyboard(k => { if (k === 'send') go('request'); }, 'ask')),
};

let req = { who: contacts.musa, amount: 20000, why: 'Rent, the part you owe from August', ref: null, editing: null };
const REQ_PEOPLE = [contacts.musa, contacts.sarah, contacts.chidi, contacts.john];

export const request = {
  title: 'Request',
  render: () => {
    const base = Screen([
      PageHead('Ask to be paid', 'What they see, before it goes'),
      Card(
        EditRow('Who', req.who.name, `${req.who.bank} · ${req.who.account}`, () => { req.editing = 'who'; repaint(); }),
        Divider(),
        EditRow('How much', nairaFull(req.amount), null, () => { req.editing = 'amount'; repaint(); }),
        Divider(),
        EditRow('What for', req.why, null, () => { req.editing = 'why'; repaint(); })),
      Bubble('I write it, you check it. It goes as a message with a button in it, so they pay in one tap without typing your account number.'),
      Plain(
        Label(`What ${req.who.name.split(' ')[0]} gets`),
        e('div', { class: 'bubble', style: { maxWidth: 'none' } },
          `${me.name.split(' ')[0]} is asking you for ${naira(req.amount)} for ${req.why.toLowerCase()}. Tap to pay.`)),
      Button('Send the request', { onClick: () => { req.ref = 'REQ ' + Math.floor(1e12 + Math.random() * 8e12).toString().replace(/(\d{4})(?=\d)/g, '$1 ').trim(); go('sent'); } }),
      Note('Asking never moves money on its own. They have to agree.'),
    ], Dock({ placeholder: 'Ask about requests', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));

    if (req.editing === 'amount') return Sheet(base,
      Head('How much are you asking for?'),
      AmountPad({ value: req.amount, onChange: v => { req.amount = v; } }),
      Button('Use this', { onClick: () => { req.editing = null; repaint(); } }));

    if (req.editing === 'who') return Sheet(base,
      Head('Who are you asking?'),
      Picker(REQ_PEOPLE.map(c => ({ id: c.account, label: c.name, sub: `${c.bank} · ${c.account}` })), req.who.account,
        id => { req.who = REQ_PEOPLE.find(c => c.account === id); req.editing = null; repaint(); }),
      Button('Close', { kind: 'quiet', onClick: () => { req.editing = null; repaint(); } }));

    if (req.editing === 'why') {
      const pad = TextPad({
        value: req.why, placeholder: 'What is it for?',
        onSend: t => { req.why = t || req.why; req.editing = null; repaint(); }, sendLabel: 'done',
      });
      return e('div', { class: 'screen-scroll' },
        e('div', { class: 'pad top-pad stack gap-3' }, Caption('What for', 'c-2'), pad.line,
          Meta('They see this word for word.', 'c-3')),
        pad.kb);
    }
    return base;
  },
};

export const sent = {
  title: 'Request sent',
  render: () => Screen([
    PageHead('Request sent', `${req.who.name.split(' ')[0]} has it on WhatsApp and in a text`),
    e('div', { class: 'row', style: { gap: '12px' } },
      Glyph('request', 'good', { lg: true, circle: true }),
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-display' }, naira(req.amount)),
        Meta('Asked ' + req.who.name, 'c-3'))),
    Card(
      Field('For', req.why),
      Divider(),
      Field('Expires', 'In 7 days'),
      Divider(),
      Field('Reference', req.ref || 'REQ-40112-8873')),
    Bubble('I will tell you the moment it lands. You do not have to watch for it.'),
    Plain(
      Bubble('Want me to remind him if nothing comes by Friday?'),
      Button('Set that up', { kind: 'quiet', onClick: () => { toast('I will nudge him on Friday morning.'); } })),
    Button('Pretend they just paid', {
      kind: 'quiet',
      onClick: () => {
        act.receive({ from: req.who.name, amount: req.amount, detail: req.why });
        toast(`${naira(req.amount)} from ${req.who.name.split(' ')[0]}. It is in your balance.`);
        setTimeout(() => go('donein'), 900);
      },
    }),
    Note('That last button is here so you can see what happens next. In the real thing it is them, not you.'),
  ], Dock({ placeholder: 'Ask about this request', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } })),
};

/* ---------------------------------------------------------------- *
 * Bills — from a photo, and the ordinary way
 * ---------------------------------------------------------------- */

export const scanbill = {
  title: 'Scan a bill',
  render: () => e('div', { class: 'screen-scroll', style: { background: '#101216' } },
    e('div', { class: 'pad top-pad stack gap-4 center', style: { color: '#fff' } },
      e('div', { class: 't-head c-inv' }, 'Point at a bill or a meter'),
      Meta('The number on the card works too.', 'c-3'),
      e('div', { style: { background: '#fff', borderRadius: '16px', padding: '14px', width: '100%', textAlign: 'left' } },
        e('div', { class: 'row between', style: { marginBottom: '8px' } },
          e('div', { class: 'row', style: { gap: '8px' } }, Glyph('IE', 'warn'), e('div', { class: 't-caption c-2' }, 'Bill photo')),
          e('div', { class: 't-caption c-3' }, '4:02 PM')),
        e('div', { class: 't-caption c-2', style: { marginBottom: '8px' } }, meterBill.kind),
        e('div', { class: 'stack gap-2' },
          ...[`Meter ${meterBill.meter}`, naira(meterBill.amount), meterBill.address].map(t =>
            e('span', { style: { background: 'var(--accent-wash)', color: 'var(--accent-deep)', borderRadius: '6px', padding: '4px 8px', font: '600 14px var(--font)', alignSelf: 'flex-start' } }, t))),
        e('div', { class: 't-caption c-3', style: { marginTop: '8px' } }, meterBill.slip)),
      Spacer(10),
      e('div', { class: 'row center', style: { gap: '30px' } },
        e('div', { style: { opacity: .7 } }, Icon('grid', { size: 24 })),
        e('button', { class: 'press', style: { width: '68px', height: '68px', borderRadius: '999px', background: '#fff', border: '5px solid #4b5160', cursor: 'pointer' }, 'aria-label': 'Take the photo', onClick: () => go('meter') }),
        e('div', { style: { opacity: .7 } }, Icon('power', { size: 24 }))))),
};

export const startBill = (b, amount) => { bill = { biller: b.name, meter: b.sub.split('· ')[1] || meterBill.meter, amount, icon: b.icon, receipt: null, editing: false }; };

/* The bill being paid, whichever way you came in. */
let bill = { biller: meterBill.disco, meter: meterBill.meter, amount: meterBill.amount, icon: 'power', receipt: null, editing: false };

export const meter = {
  title: 'What I read',
  render: () => Screen([
    Card(
      e('div', { class: 'row between' },
        e('div', { class: 'row', style: { gap: '8px' } }, Glyph('IE', 'warn'), Label('Bill photo')),
        Caption(meterBill.readAt.split(', ')[1] || '4:02 PM', 'c-3')),
      Plain(
        Caption(meterBill.kind, 'c-2'),
        ...[`Meter ${meterBill.meter}`, naira(meterBill.amount), meterBill.address].map(t =>
          e('span', { style: { background: 'var(--accent-wash)', color: 'var(--accent-deep)', borderRadius: '6px', padding: '4px 8px', font: '600 14px var(--font)', alignSelf: 'flex-start' } }, t)),
        Caption(meterBill.slip, 'c-3'))),
    Head('What I read'),
    Card(
      e('div', { class: 'row between', style: { padding: '6px 0' } },
        e('div', { class: 'stack gap-1' }, Caption('Amount', 'c-2'), Caption('from the photo', 'c-3')),
        e('div', { class: 't-row' }, naira(meterBill.amount))),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('Meter', 'c-2'), e('div', { class: 't-row' }, meterBill.meter)),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('Disco', 'c-2'), e('div', { class: 't-row' }, meterBill.disco))),
    Plain(
      Row(Glyph('alert', 'warn'), e('div', { class: 't-row' }, 'Is this your meter?')),
      Card(
        e('div', { class: 'row between' }, Caption('On the bill', 'c-2'), Label('Meter ' + meterBill.meter)),
        e('div', { class: 'row between' }, Caption('Ikeja Electric says', 'c-2'), Label(meterBill.address))),
      e('div', { class: 'row', style: { gap: '10px' } },
        e('button', { class: 'btn btn-primary grow press', onClick: () => { bill = { biller: meterBill.disco, meter: meterBill.meter, amount: meterBill.amount, icon: 'power', receipt: null, editing: false }; go('confirmmeter'); } }, 'Yes, that is mine'),
        e('button', { class: 'btn btn-quiet press', style: { width: 'auto', padding: '15px 24px' }, onClick: () => go('bills') }, 'No'))),
  ], Dock({ placeholder: 'Ask about this bill', back: () => go('scanbill'), onAsk: q => { setQuestion(q); go('agentchat'); } })),
};

export const confirmmeter = {
  title: 'Confirm',
  render: () => Sheet(
    quietReceipt([PageHead('What I found', meterBill.readAt), e('div', { class: 't-display' }, naira(bill.amount))]),
    e('div', { class: 'stack gap-3 center' },
      e('div', { class: 't-display' }, naira(bill.amount)),
      e('div', { class: 't-row' }, bill.biller),
      Meta('Meter ' + bill.meter, 'c-3'),
      Head('Enter your passcode'),
      PassPad({
        hint: 'Nothing moves until the fourth number lands.',
        onFace: () => { bill.receipt = act.payBill(bill); go('power'); },
        onDone: code => {
          const res = act.tryPasscode(code);
          if (res.ok) { bill.receipt = act.payBill(bill); go('power'); return; }
          if (res.locked) { go('newcode'); return { error: 'Three wrong. The passcode is locked for an hour.' }; }
          return { error: `Not that one. ${res.left} ${res.left === 1 ? 'try' : 'tries'} left.` };
        },
      }))),
};

export const billsScreen = {
  title: 'Bills',
  render: () => Screen([
    PageHead('Bills', 'The four you pay, and what each one cost last', { big: true }),
    Card(...bills.map((b, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'listrow press', role: 'button', onClick: () => { startBill(b, b.last); go('powerpay'); } },
        Glyph(b.icon),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, b.name),
          e('div', { class: 'listrow-sub' }, b.sub)),
        e('div', { class: 't-label' }, naira(b.last)),
        e('div', { class: 'chev' }, '›'))))),
    Bubble('I keep the meter and account numbers, so you never type them again. If a bill jumps by more than a third I tell you before I pay it.'),
    Button('Add another bill', { kind: 'quiet', onClick: () => go('bills') }),
  ], Dock({ placeholder: 'Ask me to pay one', back: () => go('services') })),
};

export const powerpay = {
  title: 'Pay a bill',
  render: () => {
    const s = get();
    const enough = s.everyday >= bill.amount;
    const kwh = a => `About ${Math.round(a / 62.5)} kWh`;
    const base = Screen([
      Caption('You said', 'c-2'),
      Said('pay my light bill'),
      Card(
        e('div', { class: 'listrow' },
          Glyph('power'),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, bill.biller),
            e('div', { class: 'listrow-sub' }, `Prepaid · ${bill.meter}`))),
        Caption('The meter you paid last month', 'c-3')),
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-display' }, naira(bill.amount)),
        Meta('About what you used last month', 'c-3')),
      Card(
        e('div', { class: 'row between' }, Caption('From', 'c-2'), Label(`Everyday · ${me.account}`)),
        e('div', { class: 'row between' }, Caption('Token arrives', 'c-2'), Label('In a few seconds'))),
      Head('Or pick an amount'),
      e('div', { class: 'row', style: { gap: '8px' } },
        ...[8000, 15000, 3000].map(v =>
          e('button', {
            class: 'card press', style: { flex: 1, padding: '12px', cursor: 'pointer', textAlign: 'left', border: v === bill.amount ? '2px solid var(--accent)' : '2px solid transparent' },
            onClick: () => { bill.amount = v; repaint(); },
          },
            e('div', { class: 't-row' }, naira(v)),
            e('div', { class: 't-caption c-3' }, kwh(v))))),
      Caption('The token appears here and in your messages.', 'c-3'),
      enough ? Slide('Slide to pay ' + naira(bill.amount), () => go('confirmmeter'))
             : Banner('Not enough in Everyday for that.', 'warn'),
    ], Dock({ placeholder: 'Ask about this bill', back: () => go('bills'), onAsk: q => { setQuestion(q); go('agentchat'); } }));

    if (!bill.editing) return base;
    return Sheet(base,
      e('div', { class: 'stack gap-1 center' }, Head('How much?'), Meta(`${naira(s.everyday)} in Everyday`, 'c-3')),
      AmountPad({ value: bill.amount, onChange: v => { bill.amount = v; } }),
      Button('Use this amount', { onClick: () => { bill.editing = false; repaint(); } }));
  },
};

export const power = {
  title: 'Bill paid',
  render: () => {
    const r = bill.receipt || {
      biller: bill.biller, meter: bill.meter, amount: bill.amount,
      units: +(bill.amount / 62.5).toFixed(1), token: meterBill.token,
      at: '28 August 2026 at 11:22 AM', session: 'IKJ 4457 8891 2208', balanceAfter: get().everyday,
    };
    return Screen([
      ...receiptBody({
        head: 'Bill paid', sub: r.at,
        amount: naira(r.amount), line: r.biller,
        fields: [
          ['To', r.biller, 'Meter ' + r.meter],
          ['From', 'Everyday', me.account],
          ['Units', r.units + ' kWh'],
          ['Amount', nairaFull(r.amount)],
          ['Fee', 'Free'],
          ['Total charged', nairaFull(r.amount)],
          ['Balance after', nairaFull(r.balanceAfter)],
        ],
        session: r.session,
      }),
      Plain(
        Label('Your token'),
        e('div', { class: 't-title', style: { letterSpacing: '.04em' } }, r.token || meterBill.token),
        Caption('Type this into the meter. I keep a copy in your history.', 'c-2')),
      Button('Share receipt', { icon: 'share', onClick: () => go('sharepower') }),
    ], Dock({ placeholder: 'Ask about this bill', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const sharepower = {
  title: 'Share',
  render: () => shareSheet(
    quietReceipt([PageHead('Bill paid', ''), e('div', { class: 't-display' }, naira(bill.amount))]),
    `${naira(bill.amount)} to ${bill.biller}`,
    () => go('power')),
};
