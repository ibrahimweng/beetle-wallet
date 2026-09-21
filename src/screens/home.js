/* The home screen, and the live chat the ask bar opens.
   Home reads the store, so anything you do anywhere shows up here. */

import {
  el, Icon, AgentMark, Screen, Dock, PageHead, Head, Body, Meta, Caption, Label,
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

/* The four shortcuts under the balance. These use the tone variants of the
   glyphs, the only icons in the set that carry their own colour. */
const shortcut = (icon, label, to) =>
  e('button', { class: 'home-shortcut press', onClick: () => go(to) }, Icon(icon, { size: 32 }), label);

/* The mark the home frame sets by the wallet name is a picture, not a glyph,
   so it ships as one: the frame's own 36 disc, taken out of the file at 3x. */
export const MARK = 'data:image/png;base64,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';

/* The top of the home screen as its frame now draws it: one pale card the
   width of the phone, rounded 36 at its foot, holding the mark and the wallet
   name, the balance with its reading in dollars, Receive, the four shortcuts
   on a hairline card, and the hint that the rest is underneath. The sheets
   that open over home draw it too, so it takes no handlers of its own. */
export const homeTop = ({ hidden = false, onBalance } = {}) => {
  const s = get();
  const whole = Math.floor(s.everyday);
  const cents = (s.everyday - whole).toFixed(2).slice(1);
  return e('div', { class: 'home-top' },
    e('div', { class: 'row', style: { gap: '12px' } },
      e('img', { class: 'home-mark', src: MARK, alt: 'Beetle', width: '36', height: '36' }),
      Label('Wallet')),
    e('div', { class: 'stack center', style: { gap: '32px' } },
      e('div', { class: 'stack center', style: { gap: '4px' } },
        Caption('Total balance', 'c-2'),
        e('button', {
          class: 'row center press', style: { gap: 0, alignItems: 'baseline', border: 0, background: 'none', cursor: 'pointer', padding: '0 4px' },
          title: hidden ? 'Show it' : 'Hide it',
          onClick: onBalance,
        },
          hidden
            ? e('span', { class: 't-display c-3' }, '₦ • • • • • •')
            : e('span', { class: 't-display' }, '₦' + whole.toLocaleString('en-NG')),
          hidden ? null : e('span', { class: 't-head', style: { color: '#c4c4c9' } }, cents)),
        e('button', { class: 'home-usd press', 'aria-label': 'Your dollars', onClick: () => go('dollars') },
          `~ ${Math.round(s.everyday / s.rate).toLocaleString('en-NG')} USD`)),
      e('button', { class: 'home-receive press', onClick: () => go('receive') },
        e('i', null, Icon('receive-filled', { size: 14 })), 'Receive'),
      e('div', { class: 'home-shortcuts' },
        shortcut('airtime-tone', 'Airtime', 'airtime'),
        shortcut('power-tone', 'Bills', 'bills'),
        shortcut('pot-tone', 'Savings', 'goal'),
        shortcut('grid-tone', 'Services', 'services')),
      e('div', { class: 'stack center', style: { gap: '12px' } },
        e('div', { class: 't-caption' }, 'Swipe Up'),
        e('div', { class: 'home-grab' }))));
};

const insightCard = ({ kicker, body, action, onAction, extra }) => {
  const card = Card(
    e('div', { class: 'row', style: { alignItems: 'flex-start', gap: '10px' } },
      AgentMark(),
      e('div', { class: 't-row grow' }, kicker)),
    e('div', { class: 'bubble', style: { maxWidth: 'none' } }, body),
    extra || null,
    action && e('div', { class: 'row', style: { gap: '8px' } },
      e('button', { class: 'btn btn-primary grow press', onClick: onAction }, action),
      e('button', { class: 'chip press', title: 'Not now', onClick: () => { card.remove(); toast('Put away. Beetle will not raise it again today.'); } }, Icon('close-small', { size: 14 }))));
  return card;
};

/* The score ring, in the green of a good thing, with the number at row size. */
const ring = value =>
  e('div', { style: { position: 'relative', width: '36px', height: '36px', flex: 'none' } },
    e('svg', { width: '36', height: '36', viewBox: '0 0 36 36', html:
      `<circle cx="18" cy="18" r="15" fill="none" stroke="#dedee3" stroke-width="4"/>
       <circle cx="18" cy="18" r="15" fill="none" stroke="#11823b" stroke-width="4"
               stroke-linecap="round" stroke-dasharray="${(value / 100) * 94.2} 94.2"
               transform="rotate(-90 18 18)"/>` }),
    e('div', { style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', font: 'var(--t-row)' } }, String(value)));

/* One ledger row, drawn from the store rather than written into the screen. */
export const entryRow = r => TxRow({
  icon: r.icon, name: r.name,
  detail: `${r.detail} · ${r.time}`,
  amount: signed(r.amount),
  amountClass: r.amount > 0 ? 'c-good' : r.tone === 'bad' ? 'c-bad' : '',
  onClick: () => go(r.to || 'donesend'),
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

    const body = [
      homeTop({ hidden, onBalance: () => { setToggle('hideBalance', !hidden); repaint(); } }),

      /* activities */
      e('div', { class: 'row between', style: { minHeight: '28px' } },
        Head('Activities'),
        e('button', { class: 'btn btn-ghost press', style: { width: 'auto', padding: 0 }, onClick: () => go('history') }, 'See all', Icon('chevron', { size: 15 }))),
      Meta('What I noticed, and every naira that moved.', 'c-3'),
      ChipRow(FILTERS, f, id => { setFilter(id); repaint(); }),
    ];

    const today = applyFilter(byDay('today'), f);
    const yesterday = applyFilter(byDay('yesterday'), f);

    body.push(Body('Today', 'c-3'));
    /* the day leads with the score, on a pale card padded 12 by 16 */
    body.push(e('div', { class: 'card press', style: { padding: '12px 16px', cursor: 'pointer' }, role: 'button', onClick: () => go('health') },
      e('div', { class: 'row', style: { gap: '12px' } },
        ring(s.health),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Money health'),
          e('div', { class: 'listrow-sub c-good' }, 'Up 4 since July')),
        Icon('chevron', { size: 16, cls: 'chev' }))));
    if (showInsights) body.push(insightCard({ ...insights.topup, onAction: () => go('powerpay') }));
    if (showRows) body.push(...today.slice(0, 5).map(entryRow));
    if (showInsights) body.push(insightCard({
      ...insights.data,
      onAction: () => go('airtime'),
      extra: e('div', { class: 'card-plain' }, e('div', { class: 'listrow' },
        Glyph('data'),
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
          Glyph('card'),
          e('div', { class: 'grow stack gap-1' },
            e('div', { class: 'listrow-title' }, insights.card.kicker),
            e('div', { class: 'listrow-sub' }, insights.card.sub)),
          e('div', { class: 'fab', style: { width: '34px', height: '34px' } }, Icon('chevron', { size: 16 })))));
    if (showRows) body.push(...yesterday.map(entryRow));
    if (showInsights) body.push(insightCard({ ...insights.spend, onAction: () => go('answer') }));

    if (!today.length && !yesterday.length && showRows && !showInsights)
      body.push(e('div', { class: 'card-plain stack gap-2 center', style: { padding: '26px 16px' } },
        e('div', { style: { fontSize: '24px' } }, 'wait-filled'),
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
        holder.appendChild(AgentMark());
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
      placeholder: 'Reply, or just keep typing',
      back: () => go('home'),
      onAsk: say,
    }));
  },
};
