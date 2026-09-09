/* The home screen, and the live chat the ask bar opens.
   Home reads the store, so anything you do anywhere shows up here. */

import {
  el, Screen, Dock, PageHead, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Between, Divider, Spacer, Glyph, TxRow, ListRow,
  Button, Chip, ChipRow, Bubble, Said, Typing, Meter, Note, Toggle, toast,
  naira, nairaFull, signed,
} from '../ui.js';
import { insights, me } from '../data.js';
import { get, dollarsInNaira, byDay } from '../store.js';
import { setFilter, setToggle } from '../actions.js';
import { ask } from '../agent.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

/* the ask bar hands whatever was typed to the live chat */
let pendingQuestion = null;
export const setQuestion = q => { pendingQuestion = q; };

const shortcut = (icon, label, to) =>
  e('button', { class: 'stack gap-2 center press', style: { border: 0, background: 'none', cursor: 'pointer', flex: 1 }, onClick: () => go(to) },
    e('div', { style: { fontSize: '22px' } }, icon),
    e('div', { class: 't-caption c-2' }, label));

const insightCard = ({ kicker, body, action, onAction, extra }) => {
  const card = Card(
    e('div', { class: 'row', style: { alignItems: 'flex-start', gap: '10px' } },
      e('div', { class: 'agent-mark' }, '◉'),
      e('div', { class: 't-row grow' }, kicker)),
    e('div', { class: 'bubble', style: { maxWidth: 'none' } }, body),
    extra || null,
    action && e('div', { class: 'row', style: { gap: '8px' } },
      e('button', { class: 'btn btn-primary grow press', onClick: onAction }, action),
      e('button', { class: 'chip press', title: 'Not now', onClick: () => { card.remove(); toast('Put away. Beetle will not raise it again today.'); } }, '×')));
  return card;
};

const ring = value =>
  e('div', { style: { position: 'relative', width: '36px', height: '36px', flex: 'none' } },
    e('svg', { width: '36', height: '36', viewBox: '0 0 36 36', html:
      `<circle cx="18" cy="18" r="15" fill="none" stroke="#dedee3" stroke-width="4"/>
       <circle cx="18" cy="18" r="15" fill="none" stroke="#213aca" stroke-width="4"
               stroke-linecap="round" stroke-dasharray="${(value / 100) * 94.2} 94.2"
               transform="rotate(-90 18 18)"/>` }),
    e('div', { style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', font: '600 12px var(--font)' } }, String(value)));

/* One ledger row, drawn from the store rather than written into the screen. */
export const entryRow = r => TxRow({
  icon: r.icon, name: r.name,
  detail: `${r.detail} · ${r.time}`,
  amount: signed(r.amount),
  amountClass: r.amount > 0 ? 'c-good' : r.tone === 'bad' ? 'c-bad' : '',
  onClick: () => go(r.to || 'receipt'),
});

const FILTERS = [
  { id: 'all', label: 'All' }, { id: 'insights', label: 'Insights' },
  { id: 'in', label: 'In' }, { id: 'out', label: 'Out' },
];

const applyFilter = (rows, f) =>
  f === 'in' ? rows.filter(r => r.amount > 0) : f === 'out' ? rows.filter(r => r.amount < 0) : rows;

export const home = {
  title: 'Home',
  render: () => {
    const s = get();
    const f = s.filter;
    const showRows = f !== 'insights';
    const showInsights = f === 'all' || f === 'insights';
    const hidden = s.toggles.hideBalance;

    const whole = Math.floor(s.everyday);
    const cents = (s.everyday - whole).toFixed(2).slice(1);

    const body = [
      /* wallet header */
      e('div', { class: 'row between' },
        Glyph('◉', 'accent', { circle: true }),
        Label('Wallet'),
        e('button', { class: 'chip press', style: { background: 'none', fontSize: '18px', padding: '4px' }, title: 'Notifications', onClick: () => go('history') }, '🔔')),

      /* balance */
      e('div', { class: 'stack gap-2 center', style: { padding: '10px 0 4px' } },
        e('div', { class: 'row center', style: { gap: '8px' } },
          Caption('Total balance', 'c-2'),
          e('span', { class: 'pill pill-good' }, '+9% this month')),
        e('button', {
          class: 'row center press', style: { gap: 0, alignItems: 'baseline', border: 0, background: 'none', cursor: 'pointer' },
          title: hidden ? 'Show it' : 'Hide it',
          onClick: () => { setToggle('hideBalance', !hidden); repaint(); },
        },
          hidden
            ? e('span', { class: 't-display c-3' }, '₦ • • • • • •')
            : e('span', { class: 't-display' }, '₦' + whole.toLocaleString('en-NG')),
          hidden ? null : e('span', { class: 't-head c-3' }, cents)),
        e('button', { class: 'btn btn-primary press', style: { width: 'auto', padding: '13px 26px' }, onClick: () => go('receive') }, '⤓  Receive')),

      /* shortcuts */
      e('div', { class: 'row', style: { padding: '6px 0 2px' } },
        shortcut('📱', 'Airtime', 'airtime'),
        shortcut('⚡', 'Bills', 'bills'),
        shortcut('🔒', 'Savings', 'goal'),
        shortcut('⠿', 'Services', 'services')),

      /* dollars */
      e('div', { class: 'card press', style: { padding: '10px 14px', cursor: 'pointer' }, role: 'button', onClick: () => go('dollars') },
        e('div', { class: 'listrow' },
          Glyph('$', 'accent', { circle: true }),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, 'Dollars'),
            e('div', { class: 'listrow-sub' }, `${naira(dollarsInNaira())} today`)),
          Label('$' + s.dollars.toFixed(2)),
          e('div', { class: 'chev' }, '›'))),

      /* money health */
      e('div', { class: 'card press', style: { padding: '10px 14px', cursor: 'pointer' }, role: 'button', onClick: () => go('health') },
        e('div', { class: 'listrow' },
          ring(s.health),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, 'Money health'),
            e('div', { class: 'listrow-sub c-good' }, 'Up 4 since July')),
          e('div', { class: 'chev' }, '›'))),

      /* activities */
      e('div', { class: 'row between', style: { paddingTop: '8px' } },
        Head('Activities'),
        e('button', { class: 'btn btn-ghost press', style: { width: 'auto', padding: 0 }, onClick: () => go('history') }, 'See all ›')),
      Meta('What I noticed, and every naira that moved.', 'c-3'),
      ChipRow(FILTERS, f, id => { setFilter(id); repaint(); }),
    ];

    const today = applyFilter(byDay('today'), f);
    const yesterday = applyFilter(byDay('yesterday'), f);

    body.push(Meta('Today', 'c-3'));
    if (showInsights) body.push(insightCard({ ...insights.topup, onAction: () => go('powerpay') }));
    if (showRows) body.push(...today.slice(0, 5).map(entryRow));
    if (showInsights) body.push(insightCard({
      ...insights.data,
      onAction: () => go('airtime'),
      extra: e('div', { class: 'card-plain' }, e('div', { class: 'listrow' },
        Glyph('≋'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, insights.data.offer.title),
          e('div', { class: 'listrow-sub' }, insights.data.offer.sub)),
        Label(insights.data.offer.price))),
    }));
    if (showRows) body.push(...today.slice(5).map(entryRow));
    if (showInsights) body.push(insightCard({ ...insights.changes, onAction: () => go('health') }));

    if (yesterday.length || showInsights) body.push(Meta('Yesterday', 'c-3'));
    if (showInsights) body.push(
      e('div', { class: 'card press', style: { padding: '10px 14px', cursor: 'pointer' }, role: 'button', onClick: () => go('card') },
        e('div', { class: 'listrow' },
          Glyph('▭'),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, insights.card.kicker),
            e('div', { class: 'listrow-sub' }, insights.card.sub)),
          e('div', { class: 'fab', style: { width: '34px', height: '34px', fontSize: '15px' } }, '›'))));
    if (showRows) body.push(...yesterday.map(entryRow));
    if (showInsights) body.push(insightCard({ ...insights.spend, onAction: () => go('answer') }));

    if (!today.length && !yesterday.length && showRows && !showInsights)
      body.push(e('div', { class: 'card-plain stack gap-2 center', style: { padding: '26px 16px' } },
        e('div', { style: { fontSize: '24px' } }, '◌'),
        Body('Nothing under that filter', 'c-2')));

    return Screen(body, Dock({
      onAsk: q => { setQuestion(q); go('agentchat'); },
      onFab: () => go('actions'),
    }));
  },
};

/* ---------------------------------------------------------------- *
 * The live chat. This is where the agent actually thinks.
 * ---------------------------------------------------------------- */

const accountLine = () => {
  const s = get();
  return `the home screen, with ${nairaFull(s.everyday)} in Everyday, $${s.dollars.toFixed(2)} in dollars, `
    + `${naira(s.outToday)} already out today against a ${naira(s.limits.day)} daily limit, `
    + `and ${s.ledger.filter(r => r.day === 'today').length} things that have moved today`;
};

export const agentchat = {
  title: 'Ask Beetle',
  render: () => {
    const thread = e('div', { class: 'stack gap-4' });
    const body = [PageHead('Beetle', 'Ask about anything in your money'), thread];

    const say = q => {
      thread.appendChild(Said(q));
      const holder = Typing();
      thread.appendChild(holder);
      const scroll = () => { const sc = thread.closest('.screen-scroll'); sc && sc.scrollTo({ top: 1e6, behavior: 'smooth' }); };
      scroll();
      const put = text => {
        holder.innerHTML = '';
        holder.appendChild(e('div', { class: 'agent-mark' }, '◉'));
        holder.appendChild(e('div', { class: 'bubble' }, text));
      };
      ask(q, { context: accountLine(), onText: put }).then(text => { put(text); scroll(); });
    };

    if (pendingQuestion) { const q = pendingQuestion; pendingQuestion = null; setTimeout(() => say(q), 60); }
    else {
      thread.appendChild(Bubble('Ask me anything about your money. I only answer from what I can actually see in your account.'));
      thread.appendChild(e('div', { class: 'stack gap-2' },
        ...['What did I spend on today?', 'Why did the transfer to Chidi fail?', 'What is my limit today?', 'Should I borrow ₦150,000?']
          .map(s => e('button', { class: 'btn btn-quiet press', style: { justifyContent: 'flex-start' }, onClick: () => say(s) }, s))));
    }

    return Screen(body, Dock({
      placeholder: 'Reply, or just keep talking',
      back: () => go('home'),
      onAsk: say,
    }));
  },
};
