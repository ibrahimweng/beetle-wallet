/* Beetle — the payment being put together right now.

   A transfer is started on one screen, priced on another, confirmed on a
   third and receipted on a fourth. This is the one thing all four read, so
   what you typed on the keypad is what the receipt says. */

import { contacts, transfer as seedTransfer, dollarSend, meterBill, bills } from './data.js';

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

/* Whether a payment has actually been begun. Until one has, the form screens
   show the transfer their own frames are drawn around rather than the one the
   chat and the receipt are drawn around. */
export let started = false;

/** Begin a new one. Anything not given falls back to the design's figures. */
export function start(patch = {}) {
  draft = Object.assign(blank(), patch);
  started = true;
  return draft;
}

/** Change part of the one in progress. */
export function set(patch) {
  Object.assign(draft, patch);
  return draft;
}

export const clear = () => { draft = blank(); started = false; };

/** The transfer the send form is drawn around: ₦50,000 to Sarah, the flat
    deposit, until you actually begin one of your own. */
export const formDraft = () => (started ? draft : Object.assign(blank(), {
  to: contacts.sarah,
  amount: dollarSend.amount,
  narration: dollarSend.reference,
  spoken: dollarSend.spoken,
}));

export { bills };
