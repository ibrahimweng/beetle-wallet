/* The registry. Every screen in the design has an id here, and every act,
   section and aim is the one written on the Figma page. */

import * as a1 from './act1.js';
import * as a2 from './act2.js';
import * as a3a from './act3a.js';
import * as a3b from './act3b.js';
import * as a4 from './act4.js';
import { home, agentchat } from './home.js';

export const SCREENS = {
  /* Act One */
  checking: a1.checking, iwillnot: a1.iwillnot,
  misheard: a1.misheard, alreadygone: a1.alreadygone,
  confirm: a1.confirm, noface: a1.noface, short: a1.short,
  pending: a1.pending, failed: a1.failed, reversed: a1.reversed,
  wrong: a1.wrong, recall: a1.recall, amend: a1.amend,
  disputeopen: a1.disputeopen, disputeend: a1.disputeend,
  nonetwork: a1.nonetwork,

  /* Act Two */
  rule: a2.rule, rules: a2.rules,
  settings: a2.settings, lock: a2.lock,
  limits: a2.limitsScreen, limitstop: a2.limitstop,
  devices: a2.devicesScreen,
  lostphone: a2.lostphone, newcode: a2.newcode,

  /* Act Three */
  home, agentchat,
  ask: a3a.ask, scan: a3a.scan, typed: a3a.typed, pay: a3a.pay, chat: a3a.chat,
  donesend: a3a.donesend, share: a3a.share,
  asksvc: a3a.asksvc, typedbuy: a3a.typedbuy, buy: a3a.buy,
  confirmbuy: a3a.confirmbuy, done: a3a.done, sharebuy: a3a.sharebuy,
  askreq: a3a.askreq, typedask: a3a.typedask, request: a3a.request, sent: a3a.sent,
  scanbill: a3a.scanbill, meter: a3a.meter, confirmmeter: a3a.confirmmeter,
  power: a3a.power, sharepower: a3a.sharepower,
  bills: a3a.billsScreen, powerpay: a3a.powerpay,
  receive: a3b.receive, ways: a3b.ways, mycode: a3b.mycode,
  services: a3b.servicesScreen, airtime: a3b.airtime,
  loan: a3b.loanScreen, card: a3b.cardScreen,
  history: a3b.historyScreen, answer: a3b.answer,
  donein: a3b.donein, sharein: a3b.sharein,
  doneflat: a3b.doneflat, doneshop: a3b.doneshop, donesub: a3b.donesub, donecard: a3b.donecard,
  shareflat: a3b.shareflat, shareshop: a3b.shareshop, sharesub: a3b.sharesub, sharecard: a3b.sharecard,
  actions: a3b.actions, draft: a3b.draft,
  health: a3b.health,
  goal: a3b.goalScreen, saverule: a3b.saverule, paused: a3b.paused,
  dollars: a3b.dollars, convert: a3b.convert, converted: a3b.converted,
  payfrom: a3b.payfrom, paydollars: a3b.paydollars,

  /* Act Four */
  start: a4.start, number: a4.number, code: a4.code, nin: a4.nin,
  who: a4.who, face: a4.face, passcode: a4.passcode, ready: a4.ready,
  nomatch: a4.nomatch,
  finish: a4.finish, idcard: a4.idcard, income: a4.income, full: a4.full,
  firsthome: a4.firsthome, firstask: a4.firstask,
  emptyactivity: a4.emptyactivity, emptygoal: a4.emptygoal,
  signin: a4.signin, signcode: a4.signcode,
};

export const ACTS = [
  {
    name: 'One · It goes wrong',
    sections: [
      { name: 'When it is not sure', aim: 'It shows its working, and flags the one part it could have got wrong.',
        screens: ['checking', 'iwillnot'] },
      { name: 'When it heard you wrong', aim: 'A misheard word is caught before the money leaves, and after.',
        screens: ['misheard', 'alreadygone'] },
      { name: 'When it does not go', aim: 'Six ways a payment stops, each one saying what happened and what it costs.',
        screens: ['confirm', 'noface', 'short', 'pending', 'failed', 'reversed'] },
      { name: 'When it was wrong', aim: 'It made the mistake, so it pays first and recovers afterwards.',
        screens: ['wrong', 'recall', 'amend'] },
      { name: 'Following a dispute', aim: 'A claim with a date on it, and an answer that does not need chasing.',
        screens: ['disputeopen', 'disputeend'] },
      { name: 'When the network is not there', aim: 'What still works with no signal, and what honestly does not.',
        screens: ['nonetwork'] },
    ],
  },
  {
    name: 'Two · It decides',
    sections: [
      { name: 'What runs on its own', aim: 'A standing rule, written in a sentence, with a ceiling you set.',
        screens: ['rule', 'rules'] },
      { name: 'What you set', aim: 'The lines you draw on a calm day, held on a bad one.',
        screens: ['settings', 'lock', 'limits', 'limitstop', 'devices'] },
      { name: 'When the phone is gone', aim: 'Freeze it from anywhere, then get back in without a branch.',
        screens: ['lostphone', 'newcode'] },
    ],
  },
  {
    name: 'Three · It works',
    sections: [
      { name: 'Home and the ask bar', aim: 'The balance, what it noticed, and one place to ask anything.',
        screens: ['home', 'agentchat'] },
      { name: 'Sending money', aim: 'Voice, camera or typing, all landing on the same confirmation.',
        screens: ['ask', 'scan', 'typed', 'pay', 'chat', 'donesend', 'share'] },
      { name: 'Buying something', aim: 'Airtime and data bought in a sentence, priced before you agree.',
        screens: ['asksvc', 'typedbuy', 'buy', 'confirmbuy', 'done', 'sharebuy'] },
      { name: 'Asking to be paid', aim: 'A request that carries the reason, and pays in one tap.',
        screens: ['askreq', 'typedask', 'request', 'sent'] },
      { name: 'Pay a bill from a photo', aim: 'Point the camera at the bill and let it read the meter.',
        screens: ['scanbill', 'meter', 'confirmmeter', 'power', 'sharepower'] },
      { name: 'Pay a bill the ordinary way', aim: 'The same bill from the list, for when there is no photo.',
        screens: ['bills', 'powerpay'] },
      { name: 'Be paid from home', aim: 'Your number, your code, and every way in.',
        screens: ['receive', 'ways', 'mycode'] },
      { name: 'The services drawer', aim: 'Everything else the account does, priced honestly.',
        screens: ['services', 'airtime', 'loan', 'card'] },
      { name: 'Look at what happened', aim: 'The whole feed, and an answer about any line in it.',
        screens: ['history', 'answer', 'donein', 'sharein',
          'doneflat', 'shareflat', 'doneshop', 'shareshop', 'donesub', 'sharesub', 'donecard', 'sharecard'] },
      { name: 'The button', aim: 'One tap to everything it can start for you.',
        screens: ['actions', 'draft'] },
      { name: 'How the habits add up', aim: 'A score with the working shown, not a number handed down.',
        screens: ['health'] },
      { name: 'Putting money away', aim: 'A goal it feeds quietly, and a pause that costs nothing.',
        screens: ['goal', 'saverule', 'paused'] },
      { name: 'Keep some in dollars', aim: 'Hold it steady, and see the rate before you move.',
        screens: ['dollars', 'convert', 'converted'] },
      { name: 'Pay from your dollars', aim: 'Spend the dollars without converting them first.',
        screens: ['payfrom', 'paydollars'] },
    ],
  },
  {
    name: 'Four · Getting in',
    sections: [
      { name: 'Opening an account', aim: 'A number, a NIN and a face. Fifty-one seconds.',
        screens: ['start', 'number', 'code', 'nin', 'who', 'face', 'passcode', 'ready'] },
      { name: 'When the digits do not match', aim: 'Three reasons it failed, told apart instead of guessed at.',
        screens: ['nomatch'] },
      { name: 'Finishing setting up', aim: 'Two more things, and what each one actually opens.',
        screens: ['finish', 'idcard', 'income', 'full'] },
      { name: 'The first day', aim: 'An empty account that says so, rather than filling itself with adverts.',
        screens: ['firsthome', 'firstask', 'emptyactivity', 'emptygoal'] },
      { name: 'Signing in again', aim: 'Face to open it. The passcode is what moves money.',
        screens: ['signin', 'signcode'] },
    ],
  },
];

/* The rail is built from ACTS and the screens come from SCREENS, so the two
   have to agree. If a screen is ever deleted or renamed without the registry
   being updated, say so here rather than quietly showing a different one. */
const listed = ACTS.flatMap(a => a.sections.flatMap(s => s.screens));
const missing = listed.filter(id => !SCREENS[id] || typeof SCREENS[id].render !== 'function');
const stray = Object.keys(SCREENS).filter(id => !listed.includes(id));
const dupes = listed.filter((id, i) => listed.indexOf(id) !== i);
if (missing.length || stray.length || dupes.length) {
  throw new Error('The screen registry does not add up. '
    + (missing.length ? `Listed but not built: ${missing.join(', ')}. ` : '')
    + (stray.length ? `Built but not listed: ${stray.join(', ')}. ` : '')
    + (dupes.length ? `Listed twice: ${dupes.join(', ')}.` : ''));
}
