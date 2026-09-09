/* Beetle — the payment being put together right now.

   A transfer is started on one screen, priced on another, confirmed on a
   third and receipted on a fourth. This is the one thing all four read, so
   what you typed on the keypad is what the receipt says. */

import { contacts, transfer as seedTransfer, meterBill, bills } from './data.js';

const blank = () => ({
  kind: 'transfer',        // transfer | airtime | bill | request | convert | save
  to: contacts.sarah,
  amount: seedTransfer.amount,
  from: 'everyday',        // everyday | dollars
  narration: seedTransfer.narration,
  network: 'MTN',
  line: '0803 214 4471',
  plan: '5GB for 30 days',
  biller: meterBill.disco,
  meter: meterBill.meter,
  reason: 'Rent part payment',
  direction: 'to-dollars',
  receipt: null,
});

export let draft = blank();

/** Begin a new one. Anything not given falls back to the design's figures. */
export function start(patch = {}) {
  draft = Object.assign(blank(), patch);
  return draft;
}

/** Change part of the one in progress. */
export function set(patch) {
  Object.assign(draft, patch);
  return draft;
}

export const clear = () => { draft = blank(); };

export { bills };
