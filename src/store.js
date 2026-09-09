/* Beetle — the live state.

   Everything that can change while you use the app lives here: the balance,
   the ledger, the limits, the switches. Screens read from it and never hold
   their own copy, so a payment made on one screen is visible on every other
   one immediately. It is kept in the browser between visits, and the harness
   has a Reset that puts it back to the figures in the design. */

import { balances, seedLedger, limits, goal, standing, devices, card, me } from './data.js';

const KEY = 'beetle.state.v2';

export const seed = () => ({
  version: 2,
  everyday: balances.everyday,
  dollars: balances.dollars,
  rate: balances.rate,
  health: balances.health,
  ledger: seedLedger.map(r => ({ ...r })),
  outToday: limits.outToday,
  limits: { transfer: limits.transfer, day: limits.day, month: limits.month },
  goal: { name: goal.name, target: goal.target, saved: goal.saved, by: goal.by, paused: false },
  standing: standing.map(r => ({ ...r })),
  devices: devices.map(d => ({ ...d })),
  card: { spent: card.spent, frozen: false },
  frozen: false,
  passcode: '4471',
  wrongTries: 0,
  toggles: {
    faceId: true,
    hideBalance: false,
    hideScreenshots: true,
    notifAmounts: false,
    roundUps: true,
    payday: true,
    biometricSend: false,
  },
  filter: 'all',
  disputeDay: 3,
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) return parsed;
    }
  } catch (e) { /* private window, or a stale shape */ }
  return seed();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* nothing we can do */ }
}

export const get = () => state;

/* Write the seed down on a first visit, so what is on screen and what is
   stored never disagree. */
save();

/** Change the world. The mutator gets the state; anything it returns is ignored. */
export function update(mutator) {
  mutator(state);
  save();
  listeners.forEach(fn => fn(state));
  return state;
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function reset() {
  state = seed();
  save();
  listeners.forEach(fn => fn(state));
}

/* ---------- things the screens ask about ---------- */

export const dollarsInNaira = () => Math.round(get().dollars * get().rate);

export const leftToday = () => Math.max(0, get().limits.day - get().outToday);

export const spentThisMonth = () =>
  get().ledger.filter(r => r.amount < 0 && r.status === 'done').reduce((n, r) => n + Math.abs(r.amount), 0);

export const byDay = day => get().ledger.filter(r => r.day === day);

/** The feed, filtered by the chip the person last pressed. */
export const filtered = day => {
  const f = get().filter;
  return byDay(day).filter(r =>
    f === 'all' ? true : f === 'in' ? r.amount > 0 : f === 'out' ? r.amount < 0 : false);
};

/** Put a row at the top of today. Amount is signed: negative leaves you. */
export function addEntry(row) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const entry = { id: 'l' + Date.now().toString(36), day: 'today', time, status: 'done', ...row };
  update(s => {
    const firstToday = s.ledger.findIndex(r => r.day === 'today');
    s.ledger.splice(firstToday < 0 ? 0 : firstToday, 0, entry);
  });
  return entry;
}

/* A session ID in the shape the design shows: a counter, the date, a clock,
   and two random blocks. */
export function sessionId() {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, '0');
  const rand = () => p(Math.floor(Math.random() * 1e6), 6);
  return [
    p(Math.floor(Math.random() * 999), 6),
    `${p(d.getFullYear() % 100)}${p(d.getMonth() + 1)}${p(d.getDate())}`,
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`,
    rand(), rand(),
  ].join(' ');
}

export const stamp = () => {
  const d = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const h = d.getHours() % 12 || 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} at ${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
};

export { me };
