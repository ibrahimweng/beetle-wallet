/* Beetle — the world the app runs on.
   Every figure, name and account number here is taken from the Figma file.
   Screens read from this, so the numbers agree with each other everywhere. */

export const me = {
  name: 'Ibrahim Musa',
  initials: 'IM',
  phone: '0803 214 4471',
  account: '0102 4457 88',
  bank: 'Beetle',
  born: 'Born 14 June 1996',
};

export const balances = {
  everyday: 595320.75,
  everydayLabel: '₦595,320',
  everydayDecimal: '.75',
  changeLabel: '+9% this month',
  dollars: 412.60,
  dollarsInNaira: 640355,
  rate: 1552,          // ₦ to $1
  health: 72,
  healthMove: 'Up 4 since July',
};

export const contacts = {
  sarah:  { name: 'Sarah Adeyemi', bank: 'GTBank', account: '0234 5678 90', initials: 'SA', note: 'The only Sarah you have paid before' },
  musa:   { name: 'Musa Danjuma',  bank: 'GTBank', account: '0234 5678 90', initials: 'MD' },
  chidi:  { name: 'Chidi Okafor',  bank: 'Access', account: '0119 8842 03', initials: 'CO' },
  john:   { name: 'John Doe',      bank: 'Access Bank', account: '0044 8821', initials: 'JD' },
  mum:    { name: 'Mum',           bank: 'MTN',    account: '0803 214 4471', initials: 'M' },
};

/* One ledger, seeded from the design. Every view of money — the home feed,
   the history screen, the filters — is derived from this single list, so a
   payment that happens shows up everywhere at once and nowhere twice. */
export const seedLedger = [
  { id: 'l01', day: 'today',     time: '14:22', icon: 'wait-filled', name: 'Sarah Adeyemi', detail: 'Still on its way', amount: -20000, status: 'pending',  to: 'pending',  kind: 'transfer' },
  { id: 'l02', day: 'today',     time: '13:40', icon: 'alert', name: 'Chidi Okafor',  detail: 'Did not go',       amount: -12000, status: 'failed',   to: 'failed',   kind: 'transfer', tone: 'bad' },
  { id: 'l03', day: 'today',     time: '11:15', icon: 'undo-filled', name: 'Musa Danjuma',  detail: 'Came back',        amount:  20000, status: 'reversed', to: 'reversed', kind: 'transfer' },
  { id: 'l04', day: 'today',     time: '12:00', icon: 'data', name: 'Netflix',       detail: 'Monthly Subscription', amount: -3500, status: 'done', to: 'donesub',  kind: 'service' },
  { id: 'l05', day: 'today',     time: '10:45', icon: 'send', name: 'John Doe',      detail: 'Grocery Shopping', amount:  -8000, status: 'done',     to: 'doneshop', kind: 'transfer' },
  { id: 'l06', day: 'today',     time: '09:14', icon: 'send', name: 'Sarah Adeyemi', detail: 'Flat deposit',     amount: -50000, status: 'done',     to: 'doneflat', kind: 'transfer' },
  { id: 'l07', day: 'today',     time: '08:02', icon: 'data', name: 'MTN',           detail: '5GB for Mum',      amount:  -2500, status: 'done',     to: 'done',     kind: 'airtime' },
  { id: 'l08', day: 'today',     time: '07:55', icon: 'send', name: 'Sarah Adeyemi', detail: 'Rent part payment', amount: -20000, status: 'done',    to: 'donesend', kind: 'transfer' },
  { id: 'l09', day: 'today',     time: '07:30', icon: 'pot', name: 'Holiday goal',  detail: 'Round ups',        amount:   -280, status: 'done',     to: 'goal',     kind: 'saving' },
  { id: 'l10', day: 'yesterday', time: '16:40', icon: 'bank', name: 'Pagrin Limited', detail: 'August salary',   amount: 640000, status: 'done',     to: 'donein',   kind: 'in', tone: 'good' },
  { id: 'l11', day: 'yesterday', time: '11:22', icon: 'power', name: 'Ikeja Electric', detail: 'Meter 4457 8891', amount:  -8000, status: 'done',     to: 'power',    kind: 'bill' },
  { id: 'l12', day: 'yesterday', time: '09:00', icon: 'data', name: 'Netflix',        detail: 'Virtual card',    amount:  -5200, status: 'done',     to: 'donecard', kind: 'card' },
];

export const ledgerFooter = 'Your spending is ₦41,000 above this point last month.';

/* The agent's unprompted observations, worded as in the design. */
export const insights = {
  topup: {
    kicker: 'Your usual top up',
    body: 'You top up Ikeja Electric about every three weeks. The last one was ₦8,000.',
    action: 'Top up ₦8,000 now',
  },
  data: {
    kicker: 'Your data is nearly gone',
    body: 'Your data usually runs out about now. The same 5GB is ₦2,500.',
    offer: { title: '5GB for 30 days', sub: 'MTN · your line', price: '₦2,500' },
    action: 'Buy it again',
  },
  changes: {
    kicker: 'Three changes you made',
    body: 'They save you ₦1,800 every month. The data plan, the DStv package, and the transfer you moved off your card.',
    action: 'See the three',
  },
  card: { kicker: 'Your card is ready', sub: 'Spend online anywhere' },
  spend: {
    kicker: 'Where your money went',
    body: 'You spent ₦18,900 on airtime and data last month. That is your highest month this year.',
    action: 'Show me what would help',
  },
};

/* The transfer the whole send flow is about. */
export const transfer = {
  to: contacts.sarah,
  amount: 20000,
  fee: 26.88,          // ₦25 NIP + 7.5% VAT
  feeNote: 'Transfers under ₦10,000 carry none',
  total: 20026.88,
  balanceAfter: 659320.75,
  from: 'Everyday',
  narration: 'Rent part payment',
  spoken: 'Send 20k to Sarah',
  typed: 'send sarah 20k',
  at: '28 August 2026 at 7:55 AM',
  session: '000016 260828 075504 471803 926104',
  arrives: 'In a few seconds',
};

/* The dollar send, which converts on the way out. */
export const dollarSend = {
  to: contacts.sarah,
  amount: 50000,
  spoken: 'send Sarah 50k for the flat deposit',
  reference: 'Flat deposit',
  inDollars: 32.22,
  rateLine: 'About $32.22 from your dollars, at ₦1,552 to $1',
  holdNote: 'The rate is held for sixty seconds once you slide, and nothing moves until then.',
};

export const limits = {
  transfer: 50000,
  day: 100000,
  month: 900000,
  outToday: 64000,
  leftToday: 36000,
  leftNote: '₦36,000 left before I stop and ask you twice.',
};

export const goal = {
  name: 'Holiday',
  target: 250000,
  saved: 82400,
  pct: 33,
  by: '12 March',
  ahead: 'You are a fortnight ahead. Keep this up and you will get there on 26 February.',
  feeders: [
    { name: 'Payday transfer',      sub: '₦20,000 every month',        amount: 80000 },
    { name: 'Round ups',            sub: 'The change from card payments', amount: 2280 },
    { name: 'Money back on top ups', sub: 'Instead of cash back',        amount: 120 },
  ],
  unlocked: 'Nothing here is locked. Take it back whenever you need it.',
};

export const bills = [
  { name: 'Ikeja Electric', sub: 'Prepaid · 4457 8891', icon: 'power',  last: 8000,  when: 'Due Thursday',  covered: true },
  { name: 'DStv Compact',   sub: 'Monthly · 4457 8891', icon: 'tv',     last: 12500, when: 'Due 24 August', covered: false },
  { name: 'Spectranet',     sub: 'Internet · 4457 88',  icon: 'globe',  last: 15000, when: 'Due 27 August', covered: false },
  { name: 'LAWMA waste',    sub: 'Waste · Ikeja',       icon: 'waste',  last: 2000,  when: 'Paid 2 August', covered: true },
  { name: 'MTN 5GB',        sub: 'Data · Mum',          icon: 'data',   last: 2500,  when: 'Paid 4 August', covered: true },
];

export const meterBill = {
  disco: 'Ikeja Electric',
  kind: 'IKEJA ELECTRIC · Prepaid',
  meter: '4457 8891',
  amount: 8000,
  address: '14 Bode Thomas',
  readAt: 'Read from your photo, 4:02 PM',
  slip: 'Keep this slip for your records',
  token: '0293 8471 5502 1946',
};

/* Borrow, priced honestly: the screen shows the APR the design omitted. */
export const loan = {
  principal: 150000,
  monthlyRate: 4,
  days: 90,
  interest: 18000,
  fee: 1500,
  total: 169500,
  instalments: 3,
  perInstalment: 56500,
  nominalApr: 76,
  effectiveApr: 110,
  lateFee: 'Pay late and it costs ₦2,000 a day. Late loans are reported to the credit bureau.',
  firstPayment: '19 September',
  ceiling: 250000,
};

export const card = {
  number: '5399 •••• •••• 4471',
  name: 'IBRAHIM WENG',
  expiry: '09/28',
  spent: 21000,
  ceiling: 50000,
  only: 'NETFLIX ONLY',
};

export const devices = [
  { name: 'iPhone 13',        sub: 'Lagos · open now',    tag: 'This one', tone: 'good' },
  { name: 'Tecno Spark 10',   sub: 'Lagos · 3 days ago',  tag: null,       tone: null },
  { name: 'Chrome on Windows', sub: 'Abuja · 12 August',  tag: 'Odd one',  tone: 'warn' },
];

export const standing = [
  { name: 'Top up Ikeja Electric', sub: 'When units run low, up to ₦10,000', on: true },
  { name: 'Payday transfer',       sub: '₦20,000 to Holiday, every month',   on: true },
  { name: 'Round ups',             sub: 'The change from card payments',     on: true },
  { name: 'Money is tight',        sub: 'Pause the goal without losing it',  on: false },
];

export const services = [
  { name: 'Airtime and data', sub: 'Any network, any line', icon: 'data', to: 'airtime' },
  { name: 'Bills',            sub: 'Power, TV, internet, waste', icon: 'power', to: 'bills' },
  { name: 'Borrow',           sub: 'Up to ₦150,000 over 90 days', icon: 'clock', to: 'loan' },
  { name: 'Virtual card',     sub: 'Spend online anywhere', icon: 'card', to: 'card' },
  { name: 'Savings pot',      sub: 'Put money away, take it back any time', icon: 'pot', to: 'goal' },
  { name: 'Dollars',          sub: 'Hold it steady, or convert', icon: 'dollar', to: 'dollars' },
  { name: 'Request money',    sub: 'Ask, and they pay in one tap', icon: 'request', to: 'askreq' },
];

export const onboarding = {
  tagline: 'A bank that answers when you ask it something.',
  blurb: 'Opening one takes about a minute, and all it needs is your number and your NIN.',
  ready: [
    { t: 'Receive money from any Nigerian bank', on: true },
    { t: 'Send up to ₦50,000 a day',             on: true },
    { t: 'Buy airtime, data and pay bills',      on: true },
    { t: 'Hold dollars',                         on: false },
    { t: 'Send up to ₦1,000,000 a day',          on: false },
  ],
};
