/* Act Three, part two — being paid, services, the record, habits, saving, dollars. */

import {
  el, Icon, Screen, Dock, Sheet, PageHead, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Divider, Spacer, Glyph, ListRow, ActionRow, Field,
  Button, Ghost, Chip, Bubble, Said, ToolPanel, Banner, Note, Pill, Meter, Timeline,
  Toggle, ChipRow, AmountPad, TextPad, Slide, Picker, EditRow, toast,
  naira, nairaFull, signed,
} from '../ui.js';
import {
  me, balances, contacts, services, bills, goal as seedGoal, loan, card as seedCard,
  dollarSend, limits as seedLimits, insights, ledgerFooter,
} from '../data.js';
import { get, byDay, dollarsInNaira, leftToday, stamp } from '../store.js';
import * as act from '../actions.js';
import * as flow from '../flow.js';
import { receiptBody, shareSheet, quietReceipt, setPlan, blurredHome } from './act3a.js';
import { setQuestion, entryRow } from './home.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

/* the note on the draft screen, which you can actually write */
let note = 'Rent, second half. Ask about the receipt for the first.';
let writing = false;

/* ---------------------------------------------------------------- *
 * Be paid
 * ---------------------------------------------------------------- */

export const receive = {
  title: 'Receive',
  render: () => Sheet(
    blurredHome(),
    e('div', { class: 'stack gap-1 center' },
      Glyph('receive-filled', 'accent', { lg: true, circle: true }),
      Head('How money reaches you')),
    Card(...[
      ['bank', 'Bank transfer', `Your number, ${me.account}`, 'ways'],
      ['card', 'From a card', 'Any Nigerian debit card', 'ways'],
      ['request', 'Ask someone', 'Send a request they pay in one tap', 'askreq'],
      ['dollar', 'In dollars', 'Hold it steady, or convert it now', 'dollars'],
    ].map(([i, t, s, to], n) => e('div', null,
      n ? Divider() : null,
      e('div', { class: 'listrow press', role: 'button', onClick: () => go(to) },
        Glyph(i),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, t),
          e('div', { class: 'listrow-sub' }, s)),
        e('div', { class: 'chev' }, Icon('chevron', { size: 20 })))))),
    Button('Done', { kind: 'quiet', onClick: () => go('home') })),
};

export const ways = {
  title: 'Three ways to be paid',
  render: () => Screen([
    PageHead('Three ways to be paid', 'All of them safe to hand out', { big: true }),
    Bubble('You cannot receive by talking. What I can do is hand you the two things money reaches you by, and write the message that asks.'),
    Card(
      Caption('Your account number', 'c-2'),
      e('div', { class: 't-row' }, `${me.bank} · ${me.name}`),
      e('div', { class: 't-title' }, me.account),
      Button('Copy it', { kind: 'quiet', onClick: () => toast(`${me.account} copied. Paste it anywhere.`) })),
    Card(
      Caption('Your code', 'c-2'),
      e('div', { class: 't-row' }, 'Works with any bank app'),
      Meta('Point a camera at it', 'c-3'),
      Button('Show it', { kind: 'quiet', onClick: () => go('mycode') })),
    Card(
      Caption('Ask somebody', 'c-2'),
      e('div', { class: 't-row' }, 'I write it, you check it'),
      Meta('On WhatsApp and SMS', 'c-3'),
      Button('Ask for money', { kind: 'quiet', onClick: () => go('askreq') })),
    Plain(
      Label('None of these can take anything'),
      Caption('A number and a code can only be paid into. Neither carries your balance.', 'c-2')),
  ], Dock({ placeholder: 'Ask about getting paid', back: () => go('home') })),
};

/* A 21x21 code drawn to the shape of a real one: three finders with their
   separators, both timing rows, and filler in between. It is a picture of a
   code, not an encoder, so nothing here claims to scan. */
const qr = () => {
  const N = 21;
  const grid = Array.from({ length: N }, () => Array(N).fill(null));

  const finder = (ox, oy) => {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const gx = ox + x, gy = oy + y;
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue;
      const ring = x === 0 || x === 6 || y === 0 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      const inside = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      grid[gy][gx] = inside ? (ring || core) : false;   // false is the separator
    }
  };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);

  for (let i = 8; i < N - 8; i++) { grid[6][i] = i % 2 === 0; grid[i][6] = i % 2 === 0; }
  grid[N - 8][8] = true;   // the dark module every code carries

  let s = 99;
  const cells = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const on = grid[y][x] === null ? (s % 100) > 47 : grid[y][x];
    if (on) cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#000"/>`);
  }

  return e('div', { style: { background: '#fff', padding: '14px', borderRadius: '16px', alignSelf: 'center' } },
    e('svg', { width: '176', height: '176', viewBox: '-1 -1 23 23', 'shape-rendering': 'crispEdges', html: cells.join('') }));
};

export const mycode = {
  title: 'Your code',
  render: () => Screen([
    PageHead('Your code', 'Point their camera at this and the money reaches you', { big: true }),
    qr(),
    e('div', { class: 'row center', style: { gap: '10px' } },
      Glyph(me.initials, 'accent', { circle: true }),
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-row' }, me.name),
        Meta(`${me.bank} · ${me.account}`, 'c-3'))),
    e('div', { class: 'row', style: { gap: '10px' } },
      e('button', { class: 'btn btn-primary grow press', onClick: () => toast('Ready to send, wherever you share things.') }, 'Share it'),
      e('button', { class: 'btn btn-quiet grow press', onClick: () => toast('Saved to your photos.') }, 'Save it')),
    Note('Anyone can pay you with this. Nobody can take anything with it, and it does not carry your balance.'),
  ], Dock({ placeholder: 'Ask about your code', back: () => go('ways') })),
};

/* ---------------------------------------------------------------- *
 * The services drawer
 * ---------------------------------------------------------------- */

export const servicesScreen = {
  title: 'All services',
  render: () => Screen([
    PageHead('You use these most', null, { big: true }),
    e('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap' } },
      ...[['airtime', 'Airtime'], ['data', 'Data'], ['power', 'Power'], ['send', 'Send']].map(([i, t]) =>
        e('button', { class: 'stack gap-2 center press', style: { border: 0, background: 'none', cursor: 'pointer', flex: '1 0 20%' },
          onClick: () => go(i === 'send' ? 'pay' : i === 'power' ? 'bills' : 'airtime') },
          Glyph(i, '', { lg: true }), Caption(t, 'c-2')))),
    e('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap' } },
      ...[['tv', 'Cable TV'], ['bet', 'Betting'], ['loan', 'Loan'], ['card', 'Cards']].map(([i, t]) =>
        e('button', { class: 'stack gap-2 center press', style: { border: 0, background: 'none', cursor: 'pointer', flex: '1 0 20%' },
          onClick: () => go(i === 'loan' ? 'loan' : i === 'card' ? 'card' : 'bills') },
          Glyph(i, '', { lg: true }), Caption(t, 'c-2')))),
    Head('Bills'),
    Card(...[
      ['globe', 'Internet', 'Spectranet, Smile, Starlink', 'bills'],
      ['water', 'Water', 'State water boards', 'bills'],
      ['waste', 'Waste', 'LAWMA and others', 'bills'],
      ['school', 'School fees', 'WAEC, JAMB, tuition', 'bills'],
    ].map(([i, t, s, to], n) => e('div', null,
      n ? Divider() : null,
      e('div', { class: 'listrow press', role: 'button', onClick: () => go(to) },
        Glyph(i),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, t),
          e('div', { class: 'listrow-sub' }, s)),
        e('div', { class: 'chev' }, Icon('chevron', { size: 20 })))))),
    Head('Save and borrow'),
    Card(...[
      ['pot', 'Savings pot', 'Put money away, take it back any time', 'goal'],
      ['loan', 'Borrow', 'Up to ₦150,000 over 90 days', 'loan'],
      ['dollar', 'Dollars', 'Hold it steady, or convert', 'dollars'],
    ].map(([i, t, s, to], n) => e('div', null,
      n ? Divider() : null,
      e('div', { class: 'listrow press', role: 'button', onClick: () => go(to) },
        Glyph(i),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, t),
          e('div', { class: 'listrow-sub' }, s)),
        e('div', { class: 'chev' }, Icon('chevron', { size: 20 })))))),
  ], Dock({ placeholder: 'Ask for a service', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } })),
};

export const airtime = {
  title: 'Buy data',
  render: () => {
    const BUNDLES = [['1GB', 800], ['2GB', 2000], ['10GB', 4000]];
    return Screen([
      Caption('You said', 'c-2'),
      Said('2k data for mum'),
      Card(
        e('div', { class: 'listrow' },
          Glyph(contacts.mum.initials, 'accent', { circle: true }),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, 'Mum'),
            e('div', { class: 'listrow-sub' }, `${contacts.mum.account} · MTN`))),
        Caption('The number you top up most', 'c-3')),
      Card(
        e('div', { class: 'row between' },
          e('div', { class: 'stack gap-1' },
            e('div', { class: 't-row' }, '5GB for 30 days'),
            e('div', { class: 't-caption c-3' }, 'It will not renew on its own')),
          Label(naira(2500))),
        Caption('The bundle you bought last month', 'c-3')),
      Card(
        e('div', { class: 'row between' }, Caption('From', 'c-2'), Label(`Everyday · ${me.account}`)),
        e('div', { class: 'row between' }, Caption('Goes to your Holiday goal', 'c-2'), Label(naira(25)))),
      Head('Other bundles'),
      e('div', { class: 'row', style: { gap: '8px' } },
        ...BUNDLES.map(([t, v]) =>
          e('button', { class: 'card press', style: { flex: 1, padding: '12px', cursor: 'pointer', textAlign: 'left' },
            onClick: () => { setPlan(v === 800 ? 1000 : v === 2000 ? 2500 : 4000); go('buy'); } },
            e('div', { class: 't-row' }, t),
            e('div', { class: 't-caption c-3' }, naira(v))))),
      Caption('You also top up', 'c-3'),
      Slide('Slide to buy ' + naira(2500), () => { setPlan(2500); go('confirmbuy'); }),
    ], Dock({ placeholder: 'Ask for a plan', back: () => go('services'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

let borrow = loan.principal;

export const loanScreen = {
  title: 'Borrow',
  render: () => {
    const interest = Math.round(borrow * 0.04 * 3);
    const fee = 1500;
    const total = borrow + interest + fee;
    const per = Math.round(total / 3);
    return Screen([
      PageHead('How much you want', null, { big: true }),
      e('div', { class: 'stack gap-2' },
        e('div', { class: 't-display' }, naira(borrow)),
        e('input', {
          type: 'range', class: 'slider', min: '10000', max: String(loan.ceiling), step: '10000',
          value: String(borrow), 'aria-label': 'How much you want',
          oninput: ev => { borrow = Number(ev.target.value); repaint(); },
        }),
        e('div', { class: 'row between' },
          Caption(naira(10000), 'c-3'),
          Caption(naira(loan.ceiling) + ' is your limit', 'c-3'))),
      Card(
        ...[
          ['You get today', naira(borrow)],
          ['Interest, 4% a month', naira(interest)],
          ['One off fee', naira(fee)],
          ['You pay back in all', naira(total)],
          ['Three payments of', naira(per)],
          ['First payment', loan.firstPayment],
        ].map(([k, v], i) => e('div', null,
          i ? Divider() : null,
          e('div', { class: 'row between', style: { padding: '9px 0' } },
            e('div', { class: 't-body c-2' }, k),
            e('div', { class: 't-row' }, v))))),
      /* Four per cent a month is not the rate people hear. The design does not
         say this; it was added when the pricing was made honest. */
      e('div', { class: 'card', style: { background: '#fdf2dd' } },
        e('div', { class: 't-label', style: { color: '#7a5b12', marginBottom: '4px' } }, 'What that is, as a rate'),
        e('div', { class: 'row between' },
          e('div', { class: 't-body', style: { color: '#7a5b12' } }, 'Nominal APR'),
          e('div', { class: 't-row', style: { color: '#7a5b12' } }, loan.nominalApr + '%')),
        e('div', { class: 'row between' },
          e('div', { class: 't-body', style: { color: '#7a5b12' } }, 'Compounded'),
          e('div', { class: 't-row', style: { color: '#7a5b12' } }, loan.effectiveApr + '%')),
        e('div', { class: 't-caption', style: { color: '#7a5b12', marginTop: '6px' } },
          'Four per cent a month sounds small. Because you repay in three parts while interest is charged on the whole amount, the real rate is the one above.')),
      Slide('Slide to take ' + naira(borrow), () => {
        act.borrow({ principal: borrow, total, instalments: 3, perInstalment: per });
        toast(`${naira(borrow)} is in Everyday. First payment on ${loan.firstPayment}.`);
        repaint();
      }),
      Note(loan.lateFee, 'alert'),
    ], Dock({ placeholder: 'Ask what this really costs', back: () => go('services'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const cardScreen = {
  title: 'Virtual card',
  render: () => {
    const c = get().card;
    const left = seedCard.ceiling - c.spent;
    return Screen([
      e('div', { style: { background: 'linear-gradient(150deg,#213aca,#101a5c)', borderRadius: '20px', padding: '22px', color: '#fff' } },
        e('div', { class: 'row between', style: { marginBottom: '30px' } },
          e('div', { style: { font: '600 12px var(--font)', letterSpacing: '.08em' } }, seedCard.only),
          Icon('card', { size: 22 })),
        e('div', { style: { font: '500 19px/1.3 var(--font)', letterSpacing: '.06em', marginBottom: '16px' } }, seedCard.number),
        e('div', { class: 'row between' },
          e('div', { class: 'stack gap-1' },
            e('div', { style: { font: '400 10px var(--font)', opacity: .7, letterSpacing: '.08em' } }, 'CARD HOLDER'),
            e('div', { style: { font: '400 13px var(--font)' } }, seedCard.name)),
          e('div', { class: 'stack gap-1' },
            e('div', { style: { font: '400 10px var(--font)', opacity: .7, letterSpacing: '.08em' } }, 'EXPIRES'),
            e('div', { style: { font: '400 13px var(--font)' } }, seedCard.expiry)))),
      e('div', { class: 'row', style: { gap: '8px' } },
        ...[
          ['eye', 'Reveal', () => toast('Held down to show. It hides again in ten seconds.')],
          ['freeze', c.frozen ? 'Unfreeze' : 'Freeze', () => { const now = !c.frozen; act.freezeCard(now); toast(now ? 'Card frozen. Nothing can be charged to it.' : 'Card is live again.'); repaint(); }],
          ['plus', 'Fund', () => toast('Moved from Everyday. It only ever holds what you put on it.')],
          ['list', 'Rules', () => go('rules')],
        ].map(([i, t, fn]) =>
          e('button', { class: 'stack gap-2 center press', style: { flex: 1, border: 0, background: 'none', cursor: 'pointer' }, onClick: fn },
            Glyph(i), Caption(t, 'c-2')))),
      c.frozen ? Banner('This card is frozen. Nothing can be charged to it.', 'warn') : null,
      Card(
        e('div', { class: 'row between' }, Caption('Spent this month', 'c-2'), Label(`${naira(c.spent)} of ${naira(seedCard.ceiling)}`)),
        Meter(c.spent / seedCard.ceiling * 100),
        Caption(`${naira(left)} left before it stops working`, 'c-3')),
      Bubble('This card only ever holds what you move onto it. If somebody takes the number, the most they can reach is that.'),
      Button('Make another card', { kind: 'quiet', icon: 'plus', onClick: () => toast('A second card, with its own ceiling and its own rules.') }),
    ], Dock({ placeholder: 'Ask about the card', back: () => go('services'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

/* ---------------------------------------------------------------- *
 * Look at what happened
 * ---------------------------------------------------------------- */

export const historyScreen = {
  title: 'History',
  render: () => {
    const s = get();
    const f = s.filter === 'insights' ? 'all' : s.filter;
    const pick = rows => f === 'in' ? rows.filter(r => r.amount > 0) : f === 'out' ? rows.filter(r => r.amount < 0) : rows;
    const today = pick(byDay('today'));
    const yesterday = pick(byDay('yesterday'));

    const body = [
      PageHead('History', 'Everything that moved, newest first', { big: true }),
      ChipRow([{ id: 'all', label: 'All' }, { id: 'in', label: 'In' }, { id: 'out', label: 'Out' }], f,
        id => { act.setFilter(id); repaint(); }),
    ];

    if (today.length) { body.push(Meta('Today', 'c-3')); body.push(...today.map(entryRow)); }
    if (yesterday.length) { body.push(Meta('Yesterday', 'c-3')); body.push(...yesterday.map(entryRow)); }
    if (!today.length && !yesterday.length)
      body.push(e('div', { class: 'card-plain stack gap-2 center', style: { padding: '30px 16px' } },
        Icon('wait-filled', { size: 30 }),
        Body('Nothing here under that filter', 'c-2')));

    body.push(Card(Bubble(ledgerFooter)));

    return Screen(body, Dock({
      placeholder: 'Ask about any of these',
      back: () => go('home'),
      onAsk: q => { setQuestion(q); go('agentchat'); },
    }));
  },
};

export const answer = {
  title: 'Airtime and data',
  render: () => Screen([
    PageHead('Airtime and data', 'Last month, and the month before', { big: true }),
    e('div', { class: 'stack gap-1' },
      e('div', { class: 't-display' }, naira(18900)),
      Meta('spent on airtime and data last month', 'c-3')),
    Card(
      ...[['June', 11200, 59], ['July', 14400, 76], ['August', 18900, 100]].map(([m, v, pct]) =>
        e('div', { class: 'stack gap-1', style: { padding: '6px 0' } },
          e('div', { class: 'row between' }, Caption(m, 'c-2'), e('div', { class: 't-label' }, naira(v))),
          Meter(pct, m === 'August' ? 'var(--bad-bright)' : 'var(--accent)')))),
    Bubble('That is your highest month this year. Three of the four top ups were the same 5GB plan bought separately. The 10GB plan covers the same use for ₦2,000 less a month.'),
    ActionRow({ icon: 'data', title: 'Move to the 10GB plan', sub: 'Saves about ₦2,000 a month', onClick: () => go('airtime') }),
    ActionRow({ icon: 'power', title: 'Let me top up automatically', sub: 'Only when the data actually runs out', onClick: () => go('rule') }),
  ], Dock({ placeholder: 'Ask about your spending', back: () => go('history'), onAsk: q => { setQuestion(q); go('agentchat'); } })),
};

export const donein = {
  title: 'Money in',
  render: () => Screen([
    ...receiptBody({
      head: 'Money in', sub: '27 August 2026 at 4:40 PM',
      amount: naira(640000), line: 'From Pagrin Limited', tone: 'good', icon: 'receive-filled',
      fields: [
        ['From', 'Pagrin Limited', 'GTBank · 0119 8842 03'],
        ['To', 'Everyday', me.account],
        ['Narration', 'August salary'],
        ['Amount', nairaFull(640000)],
        ['Fee', 'Free'],
        ['Balance after', nairaFull(679374.51)],
      ],
      session: '000014 260827 164003 118402 774301',
    }),
    Bubble('Your salary landed on the same day it has for six months. I moved ₦20,000 into Holiday, as your standing instruction says.'),
    Button('Share receipt', { icon: 'share', onClick: () => go('sharein') }),
  ], Dock({ placeholder: 'Ask about this payment', back: () => go('history') })),
};

export const sharein = {
  title: 'Share',
  render: () => shareSheet(
    quietReceipt([PageHead('Money in', ''), e('div', { class: 't-display' }, naira(640000))]),
    `${naira(640000)} from Pagrin Limited, 4:40 PM`,
    () => go('donein')),
};

/* The four receipts the design draws for a line in the feed, word for word.
   Each one is a past payment, so the figures are the design's and do not move
   with the live balance. */
const pastReceipt = ({ head, at, amount, line, fields, session, sessionLabel = 'Session ID', nudge, nudgeAction, nudgeTo, wrong, wrongTo, share, back }) => ({
  render: () => Screen([
    ...receiptBody({ head, sub: at, amount, line, fields, session, sessionLabel }),
    Button('Share receipt', { icon: 'share', onClick: () => go(share) }),
    Plain(Bubble(nudge), Button(nudgeAction, { kind: 'quiet', onClick: () => go(nudgeTo) })),
    Ghost(wrong, () => go(wrongTo)),
  ], Dock({ placeholder: back, back: () => go('history'), onAsk: q => { setQuestion(q); go('agentchat'); } })),
});

export const doneflat = Object.assign({ title: 'Flat deposit' }, pastReceipt({
  head: 'All done', at: '28 August 2026 at 9:14 AM', amount: naira(50000), line: 'Sent to Sarah Adeyemi',
  fields: [
    ['To', 'Sarah Adeyemi', 'GTBank · 0234 5678 90'],
    ['From', 'Everyday', me.account],
    ['Narration', 'Flat deposit'],
    ['Amount', nairaFull(50000)],
    ['Fee', nairaFull(26.88), 'Transfers under ₦10,000 carry none'],
    ['Total charged', nairaFull(50026.88)],
    ['Balance after', nairaFull(606820.75)],
  ],
  session: '000016 260828 091402 338291 774022',
  nudge: 'She has it. The same on the first of every month?', nudgeAction: 'Set it up', nudgeTo: 'rule',
  wrong: 'Something wrong with this?', wrongTo: 'wrong',
  share: 'shareflat', back: 'Ask about this transfer',
}));

export const doneshop = Object.assign({ title: 'Grocery shopping' }, pastReceipt({
  head: 'All done', at: '28 August 2026 at 10:45 AM', amount: naira(8000), line: 'Sent to John Doe',
  fields: [
    ['To', 'John Doe', 'Access Bank · 0044 8821'],
    ['From', 'Everyday', me.account],
    ['Narration', 'Grocery shopping'],
    ['Amount', nairaFull(8000)],
    ['Fee', 'Free', 'Because it is under ₦10,000'],
    ['Total charged', nairaFull(8000)],
    ['Balance after', nairaFull(598820.75)],
  ],
  session: '000016 260828 104511 902744 118635',
  nudge: 'Grocery money every Friday?', nudgeAction: 'Set it up', nudgeTo: 'rule',
  wrong: 'Something wrong with this?', wrongTo: 'wrong',
  share: 'shareshop', back: 'Ask about this transfer',
}));

export const donesub = Object.assign({ title: 'Netflix subscription' }, pastReceipt({
  head: 'All done', at: '28 August 2026 at 12:00 PM', amount: naira(3500), line: 'Netflix',
  fields: [
    ['To', 'Netflix', 'netflix.com'],
    ['From', 'Virtual card', '•••• 4471'],
    ['What', 'Monthly subscription', 'Renews 28 September'],
    ['Amount', nairaFull(3500)],
    ['Fee', 'Free'],
    ['Total charged', nairaFull(3500)],
    ['Balance after', nairaFull(595320.75)],
  ],
  session: 'NFX 4471 8823 1104', sessionLabel: 'Card reference',
  nudge: 'Netflix takes this every month. Stop it?', nudgeAction: 'Open the card', nudgeTo: 'card',
  wrong: 'You did not make this payment?', wrongTo: 'wrong',
  share: 'sharesub', back: 'Ask about this payment',
}));

export const donecard = Object.assign({ title: 'Card payment' }, pastReceipt({
  head: 'All done', at: '27 August 2026 at 9:00 AM', amount: naira(5200), line: 'Netflix',
  fields: [
    ['To', 'Netflix', 'netflix.com'],
    ['From', 'Virtual card', '•••• 4471'],
    ['What', 'Monthly subscription', 'Renews 27 September'],
    ['Amount', nairaFull(5200)],
    ['Fee', 'Free'],
    ['Total charged', nairaFull(5200)],
    ['Balance after', nairaFull(47654.51)],
  ],
  session: 'NFX 4471 8823 0195', sessionLabel: 'Card reference',
  nudge: 'Freeze this card, or see what else it pays?', nudgeAction: 'Open the card', nudgeTo: 'card',
  wrong: 'You did not make this payment?', wrongTo: 'wrong',
  share: 'sharecard', back: 'Ask about this payment',
}));

/* Their share sheets, which differ only in the line at the top. */
const pastShare = (title, amount, line, back) => ({
  title,
  render: () => shareSheet(
    quietReceipt([PageHead('All done', ''), e('div', { class: 't-display' }, amount)]),
    line, () => go(back)),
});

export const shareflat = pastShare('Share', naira(50000), '₦50,000 to Sarah Adeyemi, 9:14 AM', 'doneflat');
export const shareshop = pastShare('Share', naira(8000), '₦8,000 to John Doe, 10:45 AM', 'doneshop');
export const sharesub  = pastShare('Share', naira(3500), '₦3,500 to Netflix, 12:00 PM', 'donesub');
export const sharecard = pastShare('Share', naira(5200), '₦5,200 to Netflix, 9:00 AM', 'donecard');

/* ---------------------------------------------------------------- *
 * The button
 * ---------------------------------------------------------------- */

export const actions = {
  title: 'The button',
  /* The design has no sheet here. The home screen fades out, the five actions
     stand right aligned against it with their own coloured glyph, and the
     button you pressed stays where it is so it can close what it opened.
     Tapping anywhere else closes it too. */
  render: () => {
    const close = () => go('home');
    /* each action carries its own colour in the design, the way the tone
       glyphs on the home screen do */
    const item = (icon, label, to, colour) =>
      e('button', {
        class: 'fab-item press',
        onClick: ev => { ev.stopPropagation(); go(to); },
      }, e('span', { class: 't-head' }, label),
        e('span', { style: { color: colour, display: 'flex' } }, Icon(icon, { size: 40 })));

    return e('div', { class: 'fab-menu', role: 'button', 'aria-label': 'Close', onClick: close },
      blurredHome(),
      e('div', { class: 'fab-menu-veil' }),
      e('div', { class: 'fab-menu-items' },
        item('voice-filled', 'Voice', 'ask', 'var(--warn)'),
        item('send-filled', 'Send money', 'pay', 'var(--accent)'),
        item('receive-filled', 'Receive', 'ways', 'var(--good)'),
        item('history-filled', 'History', 'history', '#AF52DE'),
        item('settings-filled', 'Settings', 'settings', 'var(--ink)')),
      e('button', { class: 'fab fab-close press', 'aria-label': 'Close',
        onClick: ev => { ev.stopPropagation(); close(); } }, Icon('fab-plus', { size: 24 })));
  },
};

export const draft = {
  title: 'Draft',
  render: () => {
    const base = Screen([
      PageHead('Before it goes', 'A note only you will see'),
      Card(
        Field('What', `Send ${naira(flow.draft.amount)} to ${flow.draft.to.name}`),
        Divider(),
        EditRow('Note to yourself', note, null, () => { writing = true; repaint(); })),
      Bubble('I keep this against the payment in your history. Nobody receiving the money ever sees it.'),
      Button('Save and send', { onClick: () => { toast('Kept against this payment.'); go('confirm'); } }),
      Ghost('Just send it', () => go('confirm')),
    ], Dock({ placeholder: 'Ask about notes', back: () => go('actions') }));

    if (!writing) return base;
    const pad = TextPad({
      value: note, placeholder: 'What is this one really for?',
      onSend: t => { note = t || note; writing = false; repaint(); }, sendLabel: 'done',
    });
    return e('div', { class: 'screen-scroll' },
      e('div', { class: 'pad top-pad stack gap-3' },
        Caption('Note to yourself', 'c-2'), pad.line,
        Meta('Only you ever see this.', 'c-3')),
      pad.kb);
  },
};

export const health = {
  title: 'Money health',
  render: () => {
    const st = get();
    const MOVES = [
      ['check', 'You check before you send', 'Every transfer read before it left', '9 of 9', 'good'],
      ['pot', 'You save on payday', 'Before it can go anywhere else', '3 months', ''],
      ['shield', 'Your balance stays covered', 'Never under what your bills need', 'On', 'good'],
    ];
    return Screen([
      PageHead('Money health', 'One number for how you are handling it', { big: true }),
      Card(e('div', { class: 'stack gap-2 center' },
        e('svg', { width: '150', height: '150', viewBox: '0 0 36 36', html:
          `<circle cx="18" cy="18" r="15.5" fill="none" stroke="#dedee3" stroke-width="3.4"/>
           <circle cx="18" cy="18" r="15.5" fill="none" stroke="#213aca" stroke-width="3.4"
                   stroke-linecap="round" stroke-dasharray="${st.health / 100 * 97.4} 97.4" transform="rotate(-90 18 18)"/>
           <text x="18" y="18.5" text-anchor="middle" font-size="8" font-weight="700" fill="#000">${st.health}</text>
           <text x="18" y="23" text-anchor="middle" font-size="2.6" fill="#8e8e93">out of 100</text>` }),
        e('div', { class: 't-label c-good' }, 'Up 4 since July'))),
      Head('What moves it'),
      Card(...MOVES.map(([i, t, s, right, tone], n) => e('div', null,
        n ? Divider() : null,
        e('div', { class: 'listrow' },
          Glyph(i, tone),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, t),
            e('div', { class: 'listrow-sub' }, s)),
          e('div', { class: 't-label ' + (tone === 'good' ? 'c-good' : '') }, right))))),
      Bubble('Steadier than you were. The one thing holding it down is spending, which is up 18% on last month. Everything else is going the right way.'),
      ActionRow({ icon: 'chart', title: 'Where the money went', sub: 'Last month, by category', onClick: () => go('answer') }),
    ], Dock({ placeholder: 'Ask me how to move it', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

/* ---------------------------------------------------------------- *
 * Putting money away
 * ---------------------------------------------------------------- */

let goalSheet = null;   // 'add' | 'take' | null

export const goalScreen = {
  title: 'Holiday',
  render: () => {
    const st = get();
    const g = st.goal;
    const pct = Math.min(100, Math.round(g.saved / g.target * 100));
    let amount = 5000;

    const base = Screen([
      PageHead(g.name, `${naira(g.target)} by ${g.by}`, { big: true }),
      Card(e('div', { class: 'stack gap-3 center' },
        e('svg', { width: '132', height: '132', viewBox: '0 0 36 36', html:
          `<circle cx="18" cy="18" r="15.5" fill="none" stroke="#dedee3" stroke-width="3.4"/>
           <circle cx="18" cy="18" r="15.5" fill="none" stroke="${g.paused ? '#f5a524' : '#213aca'}" stroke-width="3.4"
                   stroke-linecap="round" stroke-dasharray="${pct / 100 * 97.4} 97.4" transform="rotate(-90 18 18)"/>
           <text x="18" y="17.5" text-anchor="middle" font-size="7" font-weight="700" fill="#000">${pct}%</text>
           <text x="18" y="22.5" text-anchor="middle" font-size="2.6" fill="#8e8e93">of the way</text>` }),
        e('div', { class: 't-head' }, naira(g.saved)),
        Meta(`of ${naira(g.target)} put aside`, 'c-3'),
        g.paused ? Pill('Paused', 'warn') : null)),
      Bubble(pct >= 100
        ? 'You are there. Take it whenever you want it, and I will stop feeding this one.'
        : seedGoal.ahead),
      Head('What is feeding it'),
      Card(...seedGoal.feeders.map((f, i) => e('div', null,
        i ? Divider() : null,
        e('div', { class: 'listrow press', role: 'button', onClick: () => go('saverule') },
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, f.name),
            e('div', { class: 'listrow-sub' }, f.sub)),
          Label(naira(f.amount)))))),
      e('div', { class: 'row', style: { gap: '10px' } },
        e('button', { class: 'btn btn-primary grow press', onClick: () => { goalSheet = 'add'; repaint(); } }, 'Add money'),
        e('button', { class: 'btn btn-quiet grow press', onClick: () => { goalSheet = 'take'; repaint(); } }, 'Take some back')),
      Button(g.paused ? 'Start feeding it again' : 'Pause feeding it', {
        kind: 'quiet',
        onClick: () => { act.pauseGoal(!g.paused); toast(g.paused ? 'Feeding it again from your next salary.' : 'Paused. Nothing already saved was touched.'); repaint(); },
      }),
      Note(seedGoal.unlocked),
      Ghost('What happens if money gets tight?', () => go('paused')),
    ], Dock({ placeholder: 'Ask about this goal', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));

    if (!goalSheet) return base;
    const taking = goalSheet === 'take';
    return Sheet(base,
      e('div', { class: 'stack gap-1 center' },
        Head(taking ? 'Take how much back?' : 'Put how much away?'),
        Meta(taking ? `${naira(g.saved)} is in ${g.name}` : `${naira(st.everyday)} in Everyday`, 'c-3')),
      AmountPad({ value: 5000, onChange: v => { amount = v; } }),
      Button(taking ? 'Take it back' : 'Put it away', {
        onClick: () => {
          if (!amount) { toast('Put a figure in first.'); return; }
          if (taking && amount > g.saved) { toast(`Only ${naira(g.saved)} is in there.`); return; }
          if (!taking && amount > st.everyday) { toast('Not enough in Everyday for that.'); return; }
          if (taking) act.takeFromGoal(amount); else act.saveToGoal(amount);
          goalSheet = null;
          toast(taking ? `${naira(amount)} is back in Everyday.` : `${naira(amount)} put away. Nothing is locked.`);
          repaint();
        },
      }),
      Button('Never mind', { kind: 'quiet', onClick: () => { goalSheet = null; repaint(); } }));
  },
};

export const saverule = {
  title: 'The rule that feeds it',
  render: () => {
    const g = get().goal;
    const pct = Math.min(100, Math.round(g.saved / g.target * 100));
    const FEEDERS = [
      ['A slice of payday', '10% the day your salary lands', '₦20,000 a month', 'Payday transfer'],
      ['Round ups', 'The change from every card payment', '₦2,280 a month', 'Round ups'],
      ['Money back on top ups', 'Cash back comes here instead of out', '₦120 a month', 'Money back on top ups'],
    ];
    return Screen([
      Card(e('div', { class: 'stack gap-2 center' },
        e('div', { class: 't-display' }, pct + '%'),
        Caption('of the way', 'c-3'),
        e('div', { class: 't-head' }, naira(g.saved)),
        Meta(`of ${naira(g.target)} put aside`, 'c-3'))),
      PageHead(`Feed the ${g.name} goal`, 'Pick something that runs without you thinking about it'),
      e('div', { class: 'stack gap-2' },
        ...FEEDERS.map(([t, s, amt, rule]) =>
          e('button', { class: 'card press', style: { padding: '14px', cursor: 'pointer', textAlign: 'left' },
            onClick: () => { act.setStanding(rule, true); toast(`${t} is feeding ${g.name}.`); go('goal'); } },
            e('div', { class: 'row between' },
              e('div', { class: 'stack gap-1 grow' },
                e('div', { class: 't-row' }, t),
                e('div', { class: 't-caption c-3' }, s)),
              Label(amt))))),
      e('button', { class: 'card press', style: { padding: '14px', cursor: 'pointer', textAlign: 'left' }, onClick: () => go('goal') },
        e('div', { class: 'row between' },
          e('div', { class: 'stack gap-1 grow' },
            e('div', { class: 't-row' }, 'A fixed amount'),
            e('div', { class: 't-caption c-3' }, 'You pick the day and the sum')),
          e('div', { class: 'edit-hint' }, 'Set it'))),
      Head('What is feeding it'),
      Card(...seedGoal.feeders.map((f, i) => e('div', null,
        i ? Divider() : null,
        e('div', { class: 'listrow' },
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, f.name),
            e('div', { class: 'listrow-sub' }, f.sub)),
          Label(naira(f.amount)))))),
    ], Dock({ placeholder: 'Ask about this rule', back: () => go('goal'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const paused = {
  title: 'Paused',
  render: () => {
    const g = get().goal;
    const pct = Math.min(100, Math.round(g.saved / g.target * 100));
    return Screen([
      Card(e('div', { class: 'stack gap-2 center' },
        e('div', { class: 't-display' }, pct + '%'),
        Caption('of the way', 'c-3'),
        e('div', { class: 't-head' }, naira(g.saved)),
        Meta(`of ${naira(g.target)}, holding steady`, 'c-3'))),
      Head('Waiting for you'),
      Card(...['Payday transfer', 'Round ups'].map((t, i) => e('div', null,
        i ? Divider() : null,
        e('div', { class: 'listrow' },
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, t),
            e('div', { class: 'listrow-sub' }, 'Paused since 3 August')),
          Pill('Paused', 'warn'))))),
      Bubble('Money is tight this month, so I stopped feeding it rather than let it overdraw you. The goal is intact and the date moves, not the money.'),
      Button('Start it again', { onClick: () => { act.pauseGoal(false); toast('Feeding it again.'); go('goal'); } }),
      Ghost('Take the money back out', () => { goalSheet = 'take'; go('goal'); }),
      Note('Pausing never touches what is already saved.'),
    ], Dock({ placeholder: 'Ask about pausing', back: () => go('goal'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

/* ---------------------------------------------------------------- *
 * Dollars
 * ---------------------------------------------------------------- */

export const dollars = {
  title: 'Dollars',
  render: () => {
    const st = get();
    const CAME = [
      ['Converted from naira', '+$180.00', '12 August · at ₦1,534'],
      ['From Musa Danjuma', '+$120.00', '28 July · for the generator'],
      ['Converted from naira', '+$112.60', '3 March · at ₦1,410'],
    ];
    return Screen([
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-display' }, '$' + st.dollars.toFixed(2)),
        Meta(`${naira(dollarsInNaira())} at today’s rate`, 'c-3')),
      e('div', { class: 'row', style: { gap: '10px' } },
        e('button', { class: 'btn btn-primary grow press', onClick: () => go('convert') }, 'Convert'),
        e('button', { class: 'btn btn-quiet grow press', onClick: () => go('paydollars') }, 'Spend it')),
      Head('Where they came from'),
      Card(...CAME.map(([t, amt, when], i) => e('div', null,
        i ? Divider() : null,
        e('div', { class: 'listrow' },
          Glyph('dollar'),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, t),
            e('div', { class: 'listrow-sub' }, when)),
          e('div', { class: 't-label c-good' }, amt))))),
      Bubble('The rate moved ₦18 in your favour this week. I am telling you because you asked me to, not because I think you should act on it.'),
      Plain(
        Label('Where these actually sit'),
        Caption('Your dollars sit in a domiciliary account at our partner bank, under CBN rules. Beetle moves them when you say so and cannot move them when you do not.', 'c-2')),
    ], Dock({ placeholder: 'Ask about dollars', back: () => go('home'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

let fx = { direction: 'to-dollars', amount: 155200, editing: false, receipt: null };

export const convert = {
  title: 'Convert',
  render: () => {
    const st = get();
    const toDollars = fx.direction === 'to-dollars';
    const gets = toDollars ? (fx.amount / st.rate) : Math.round(fx.amount * st.rate);
    const enough = toDollars ? st.everyday >= fx.amount : st.dollars >= fx.amount;

    const base = Screen([
      Card(
        e('div', { class: 'row between', style: { padding: '4px 0' } },
          e('div', { class: 'stack gap-1' }, Caption('From', 'c-2'), e('div', { class: 't-row' }, toDollars ? 'Everyday' : 'Dollars')),
          Caption(toDollars ? `${naira(st.everyday)} there` : `$${st.dollars.toFixed(2)} there`, 'c-3')),
        e('div', { class: 'row center' },
          e('button', { class: 'chip press', 'aria-label': 'Swap',
            onClick: () => { fx.direction = toDollars ? 'to-naira' : 'to-dollars'; fx.amount = toDollars ? 100 : 155200; repaint(); } },
            Icon('swap', { size: 18 }))),
        e('div', { class: 'row between', style: { padding: '4px 0' } },
          e('div', { class: 'stack gap-1' }, Caption('To', 'c-2'), e('div', { class: 't-row' }, toDollars ? 'Dollars' : 'Everyday')),
          Caption(toDollars ? `$${st.dollars.toFixed(2)} there` : `${naira(st.everyday)} there`, 'c-3'))),
      e('div', { class: 'stack gap-1' },
        Caption('You are converting', 'c-2'),
        e('button', { class: 'row press', style: { border: 0, background: 'none', cursor: 'pointer', gap: '8px', padding: 0 },
          onClick: () => { fx.editing = true; repaint(); } },
          e('div', { class: 't-display' }, toDollars ? naira(fx.amount) : '$' + fx.amount.toFixed(2)),
          e('div', { class: 'edit-hint' }, 'Change')),
        Meta(`You get about ${toDollars ? '$' + gets.toFixed(2) : naira(gets)}`, 'c-3')),
      Card(
        e('div', { class: 'row between' }, Caption('Rate', 'c-2'), Label(`₦${st.rate} to $1`)),
        e('div', { class: 'row between' }, Caption('Our fee', 'c-2'), e('div', { class: 't-label c-good' }, 'Free under $500')),
        Divider(),
        e('div', { class: 'row between' }, Caption('You get', 'c-2'),
          e('div', { class: 't-row' }, toDollars ? '$' + gets.toFixed(2) : nairaFull(gets)))),
      Note('The rate is held for sixty seconds once you slide.'),
      enough
        ? Slide('Slide to convert', () => { fx.receipt = act.convert({ direction: fx.direction, amount: fx.amount }); go('converted'); })
        : Banner(toDollars ? 'Not enough in Everyday for that.' : 'You do not hold that many dollars.', 'warn'),
    ], Dock({ placeholder: 'Ask about the rate', back: () => go('dollars'), onAsk: q => { setQuestion(q); go('agentchat'); } }));

    if (!fx.editing) return base;
    return Sheet(base,
      e('div', { class: 'stack gap-1 center' },
        Head('How much?'),
        Meta(toDollars ? `${naira(st.everyday)} in Everyday` : `$${st.dollars.toFixed(2)} held`, 'c-3')),
      AmountPad({ value: fx.amount, prefix: toDollars ? '₦' : '$', onChange: v => { fx.amount = v; } }),
      Button('Use this', { onClick: () => { fx.editing = false; repaint(); } }));
  },
};

export const converted = {
  title: 'Converted',
  render: () => {
    const st = get();
    /* the figures the design shows, for when this screen is opened on its own */
    const r = fx.receipt || { gave: 155200, got: 100, rate: st.rate, unit: '$', at: '9 September 2026 at 4:23 PM' };
    const toDollars = r.unit === '$';
    return Screen([
      ...receiptBody({
        head: 'Converted', sub: r.at,
        amount: toDollars ? '$' + r.got.toFixed(2) : nairaFull(r.got),
        line: toDollars ? 'Converted from naira' : 'Converted from dollars', tone: 'good',
        fields: [
          ['From', toDollars ? 'Everyday' : 'Dollars', toDollars ? nairaFull(r.gave) : '$' + r.gave.toFixed(2)],
          ['To', toDollars ? 'Dollars' : 'Everyday', toDollars ? '$' + r.got.toFixed(2) : nairaFull(r.got)],
          ['Rate', `₦${r.rate} to $1`],
          ['Our margin', naira(Math.round((toDollars ? r.gave : r.got) * 0.01)), '1.0%, shown before you slid'],
        ],
        /* a receipt reference is fixed once the conversion is done, so work it
           out from the conversion rather than rolling a new one each draw */
        session: 'FX ' + String(41000000000 + Math.round(r.gave * 100) + Math.round(r.rate))
          .replace(/(\d{4})(?=\d)/g, '$1 ').trim(),
      }),
      Bubble(`You now hold $${st.dollars.toFixed(2)}, and ${naira(st.everyday)} in Everyday. Nothing else moved.`),
      Button('Done', { kind: 'quiet', onClick: () => go('dollars') }),
    ], Dock({ placeholder: 'Ask about this conversion', back: () => go('dollars'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const payfrom = {
  title: 'Pay from',
  render: () => {
    const st = get();
    const d = flow.draft;
    return Screen([
      Caption('You said', 'c-2'),
      Said(dollarSend.spoken),
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-display' }, naira(d.amount)),
        Caption('I took this from your message', 'c-3')),
      Card(
        e('div', { class: 'listrow' },
          Glyph(d.to.initials, 'accent', { circle: true }),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, d.to.name),
            e('div', { class: 'listrow-sub' }, `${d.to.bank} · ${d.to.account}`))),
        d.to.note ? Caption(d.to.note, 'c-3') : null),
      Head('Pay from'),
      Caption('Two places the money can leave', 'c-3'),
      Card(
        e('div', { class: 'listrow press', role: 'button', onClick: () => { flow.set({ from: 'everyday' }); repaint(); } },
          Glyph('bank'),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, 'Everyday'),
            e('div', { class: 'listrow-sub' }, `${naira(st.everyday)} in naira`)),
          e('div', { class: 'tick ' + (d.from === 'everyday' ? '' : 'tick-wait') }, d.from === 'everyday' ? Icon('check', { size: 13 }) : null)),
        Divider(),
        e('div', { class: 'listrow press', role: 'button', onClick: () => { flow.set({ from: 'dollars' }); go('paydollars'); } },
          Glyph('dollar'),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, 'Dollars'),
            e('div', { class: 'listrow-sub' }, `$${st.dollars.toFixed(2)}, about ${naira(dollarsInNaira())} today`)),
          e('div', { class: 'tick ' + (d.from === 'dollars' ? '' : 'tick-wait') }, d.from === 'dollars' ? Icon('check', { size: 13 }) : null))),
      Card(
        Field('Reference', d.narration || dollarSend.reference, 'I took this from your message'),
        Divider(),
        e('div', { class: 'row between', style: { padding: '4px 0' } },
          Caption('From', 'c-2'),
          Label(d.from === 'dollars' ? `Dollars · $${st.dollars.toFixed(2)}` : `Everyday · ${naira(st.everyday)}`)),
        Divider(),
        e('div', { class: 'row between', style: { padding: '4px 0' } }, Caption('Arrives', 'c-2'), Label('In a few seconds')),
        Divider(),
        e('div', { class: 'row between', style: { padding: '4px 0' } }, Caption('Fee', 'c-2'), e('div', { class: 't-label c-good' }, 'Free'))),
      Note('Nothing moves until you slide.'),
      Slide('Slide to send ' + naira(d.amount), () => go(d.from === 'dollars' ? 'paydollars' : 'confirm')),
    ], Dock({ placeholder: 'Ask where it should come from', back: () => go('pay'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};

export const paydollars = {
  title: 'Send from dollars',
  render: () => {
    const st = get();
    const d = flow.draft;
    const inDollars = +(d.amount / st.rate).toFixed(2);
    const enough = st.dollars >= inDollars;
    return Screen([
      PageHead('Send money', `To ${d.to.name}`, { big: true }),
      Caption('You said', 'c-2'),
      Said(dollarSend.spoken),
      Bubble('Here it is, ready to go. Check the three parts I filled in.'),
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-display' }, naira(d.amount)),
        Meta(`About $${inDollars.toFixed(2)} from your dollars, at ₦${st.rate} to $1`, 'c-3')),
      Card(
        Field('To', d.to.name, `${d.to.bank} · ${d.to.account}`),
        Divider(),
        Field('Reference', d.narration || dollarSend.reference),
        Divider(),
        Field('From', 'Dollars', `$${st.dollars.toFixed(2)} held`),
        Divider(),
        Field('Arrives', 'In a few seconds'),
        Divider(),
        Field('Fee', 'Free')),
      Note(dollarSend.holdNote),
      enough
        ? Slide('Slide to send ' + naira(d.amount), () => { flow.set({ from: 'dollars' }); go('confirm'); })
        : Banner(`You hold $${st.dollars.toFixed(2)}, and this needs $${inDollars.toFixed(2)}.`, 'warn'),
    ], Dock({ placeholder: 'Ask about the rate', back: () => go('payfrom'), onAsk: q => { setQuestion(q); go('agentchat'); } }));
  },
};
