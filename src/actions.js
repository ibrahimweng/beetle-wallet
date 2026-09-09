/* Beetle — the things that actually move money.

   Every one of these changes the store and returns what happened, so the
   screen after it can show the truth rather than a figure written into the
   design. Nothing here asks for confirmation: that is the screen's job. */

import { get, update, addEntry, sessionId, stamp, dollarsInNaira } from './store.js';

export const FEE_FLAT = 25;          // NIP
export const VAT = 0.075;            // on the fee, not the amount

/** What a transfer costs. Under ₦10,000 carries none, as the design says. */
export const feeFor = amount => (amount < 10000 ? 0 : Math.round(FEE_FLAT * (1 + VAT) * 100) / 100);

/** Can this leave, and if not, why not. The screens use the reason verbatim. */
export function check({ amount, from = 'everyday' }) {
  const s = get();
  if (!amount || amount <= 0) return { ok: false, code: 'none', why: 'Put an amount in first.' };
  if (s.frozen) return { ok: false, code: 'frozen', why: 'The account is frozen. Nothing can leave it until you unfreeze it.' };
  const fee = feeFor(amount);
  const need = from === 'dollars' ? amount : amount + fee;
  const have = from === 'dollars' ? dollarsInNaira() : s.everyday;
  if (need > have) return { ok: false, code: 'short', why: 'There is not enough in that account.', short: need - have };
  if (amount > s.limits.transfer) return { ok: false, code: 'transfer-limit', why: 'That is past the most you allow in one transfer.', over: amount - s.limits.transfer };
  if (s.outToday + amount > s.limits.day) return { ok: false, code: 'day-limit', why: 'That is past the most you allow in a day.', over: s.outToday + amount - s.limits.day };
  return { ok: true, fee, total: amount + fee };
}

/** Send money. Returns the receipt the done screen renders. */
export function send({ to, amount, from = 'everyday', narration = '', icon = '↗', kind = 'transfer' }) {
  const fee = feeFor(amount);
  const inDollars = from === 'dollars' ? +(amount / get().rate).toFixed(2) : null;

  update(s => {
    if (from === 'dollars') s.dollars = +(s.dollars - amount / s.rate).toFixed(2);
    else s.everyday = +(s.everyday - amount - fee).toFixed(2);
    s.outToday += amount;
  });

  addEntry({
    icon, name: to.name, detail: narration || 'Transfer', amount: -amount, to: 'donesend', kind,
  });

  return {
    to, amount, fee, from, narration, inDollars,
    total: +(amount + fee).toFixed(2),
    balanceAfter: get().everyday,
    at: stamp(),
    session: sessionId(),
    arrives: 'In a few seconds',
  };
}

/** Buy airtime or data. */
export function buy({ network, line, amount, label, icon = '≋' }) {
  update(s => { s.everyday = +(s.everyday - amount).toFixed(2); s.outToday += amount; });
  addEntry({ icon, name: network, detail: label, amount: -amount, to: 'done', kind: 'airtime' });
  return { network, line, amount, label, at: stamp(), session: sessionId(), balanceAfter: get().everyday };
}

/** Pay a bill. Prepaid power hands back a token. */
export function payBill({ biller, meter, amount, icon = '⚡', token = true }) {
  update(s => { s.everyday = +(s.everyday - amount).toFixed(2); s.outToday += amount; });
  addEntry({ icon, name: biller, detail: meter ? `Meter ${meter}` : 'Bill', amount: -amount, to: 'power', kind: 'bill' });
  const units = +(amount / 62.5).toFixed(1);
  return {
    biller, meter, amount, units,
    token: token ? Array.from({ length: 4 }, () => String(Math.floor(1000 + Math.random() * 9000))).join(' ') : null,
    at: stamp(), session: sessionId(), balanceAfter: get().everyday,
  };
}

/** Money received — used by the request flow and by Add money. */
export function receive({ from, amount, detail = 'Payment received', icon = '↙' }) {
  update(s => { s.everyday = +(s.everyday + amount).toFixed(2); });
  addEntry({ icon, name: from, detail, amount, to: 'donein', kind: 'in', tone: 'good' });
  return { from, amount, at: stamp(), session: sessionId(), balanceAfter: get().everyday };
}

/* Borrow. The money arrives now; the schedule is what it costs later, and
   the screen has already shown the APR. */
export function borrow({ principal, total, instalments, perInstalment }) {
  update(s => { s.everyday = +(s.everyday + principal).toFixed(2); });
  addEntry({ icon: '◷', name: 'Borrowed', detail: `${instalments} payments of ₦${perInstalment.toLocaleString('en-NG')}`, amount: principal, to: 'loan', kind: 'loan', tone: 'good' });
  return { principal, total, instalments, perInstalment, at: stamp(), session: sessionId(), balanceAfter: get().everyday };
}

/* ---------- savings ---------- */

export function saveToGoal(amount) {
  update(s => {
    s.everyday = +(s.everyday - amount).toFixed(2);
    s.goal.saved += amount;
  });
  addEntry({ icon: '🏺', name: get().goal.name + ' goal', detail: 'Put away', amount: -amount, to: 'goal', kind: 'saving' });
  return get().goal;
}

export function takeFromGoal(amount) {
  const take = Math.min(amount, get().goal.saved);
  update(s => { s.goal.saved -= take; s.everyday = +(s.everyday + take).toFixed(2); });
  addEntry({ icon: '🏺', name: get().goal.name + ' goal', detail: 'Taken back', amount: take, to: 'goal', kind: 'saving', tone: 'good' });
  return get().goal;
}

export const pauseGoal = on => update(s => { s.goal.paused = on; });

/* ---------- dollars ---------- */

/** naira -> dollars, or dollars -> naira, at the rate on screen. */
export function convert({ direction, amount }) {
  const rate = get().rate;
  if (direction === 'to-dollars') {
    const got = +(amount / rate).toFixed(2);
    update(s => { s.everyday = +(s.everyday - amount).toFixed(2); s.dollars = +(s.dollars + got).toFixed(2); });
    addEntry({ icon: '$', name: 'Converted to dollars', detail: `At ₦${rate} to $1`, amount: -amount, to: 'converted', kind: 'fx' });
    return { gave: amount, got, rate, unit: '$' };
  }
  const got = Math.round(amount * rate);
  update(s => { s.dollars = +(s.dollars - amount).toFixed(2); s.everyday = +(s.everyday + got).toFixed(2); });
  addEntry({ icon: '$', name: 'Converted to naira', detail: `At ₦${rate} to $1`, amount: got, to: 'converted', kind: 'fx', tone: 'good' });
  return { gave: amount, got, rate, unit: '₦' };
}

/* ---------- switches and lines ---------- */

export const setToggle = (key, on) => update(s => { s.toggles[key] = on; });
export const setLimit = (kind, value) => update(s => { s.limits[kind] = value; });
export const setStanding = (name, on) => update(s => { const r = s.standing.find(x => x.name === name); if (r) r.on = on; });
export const freezeAll = on => update(s => { s.frozen = on; });
export const freezeCard = on => update(s => { s.card.frozen = on; });
export const signOutDevice = name => update(s => { s.devices = s.devices.filter(d => d.name !== name); });
export const setFilter = f => update(s => { s.filter = f; });

/* ---------- the passcode ---------- */

export function tryPasscode(code) {
  const s = get();
  if (code === s.passcode) { update(x => { x.wrongTries = 0; }); return { ok: true }; }
  update(x => { x.wrongTries += 1; });
  const left = 3 - get().wrongTries;
  return { ok: false, left, locked: left <= 0 };
}

export const setPasscode = code => update(s => { s.passcode = code; s.wrongTries = 0; });
