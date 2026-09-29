/* What the lab lists: every feature, and inside a feature every place worth
   opening on its own, with the state the app has to be in for that place to
   make sense. A feature is a folder under src/features; a place is what the
   folder's screens show once the way there has been walked. The lab walks it
   for you, so a step deep in the way in is one tap away. */
import type { Progress } from '../features/onboarding/machine';
import type { Stage } from '../features/onboarding/stages';
import type { IconName } from '../icons';
import { accountNumberFor, DEMO_ACCOUNT, DEMO_PHONE, type IdentityRecord, type Session } from '../services';

export type Seed = { progress: Progress; session: Session | null };

export type Place = {
  id: string;
  icon: IconName;
  title: string;
  /** what is on the screen there, in a few words */
  sub: string;
  /** where the app goes, and the state to leave for it */
  href: string;
  seed: Seed;
  /** things the phone remembers that this place wants forgotten first */
  forget?: string[];
};

export type Feature = { id: string; title: string; folder: string; sub: string; places: Place[] };

/* The account the lab opens the way in and home with, when one is needed:
   the number the browser walk uses, and the record the design's own number
   comes back as. */
export const LAB_PHONE = '08123456789';
const RECORD: IdentityRecord = {
  firstName: 'Ibrahim',
  lastName: 'Musa',
  recordName: 'MUSA IBRAHIM',
  born: '1996-06-14',
  birthYear: 1996,
};
const LAB_NUMBER = '12345678900';

const done = {
  number: { phone: LAB_PHONE, phoneVerified: true } satisfies Progress,
  who: {
    phone: LAB_PHONE,
    phoneVerified: true,
    identity: { number: LAB_NUMBER, record: RECORD },
    identityConfirmed: true,
  } satisfies Progress,
};

const account = (phone: string) => ({
  accountNumber: accountNumberFor(phone),
  phone,
  firstName: RECORD.firstName,
  lastName: RECORD.lastName,
  createdAt: '2026-09-01T09:00:00Z',
});
const sessionFor = (a: Session['account']): Session => ({ token: 'lab', account: a });

const none: Seed = { progress: {}, session: null };

/** A stage of the way in, with the way there walked. */
const stage = (id: Stage, icon: IconName, title: string, sub: string, seed: Seed = none, query = ''): Place => ({ id, icon, title, sub, href: `/way-in?stage=${id}${query}`, seed });

export const WAY_IN: Feature = {
  id: 'way-in',
  title: 'The way in',
  folder: 'src/features/onboarding',
  sub: 'One screen from the welcome to the account being ready, and the way back in.',
  places: [
    stage('welcome', 'mark', 'Welcome', 'The four words, and the two ways in'),
    stage('number', 'phone-filled', 'Your number', 'Eleven digits on the keypad'),
    stage('code', 'phone-filled', 'Six digits', 'The code from the text, and the half minute before another', { progress: { phone: LAB_PHONE }, session: null }),
    stage('identity', 'id-filled', 'Who you are', 'NIN or BVN', { progress: done.number, session: null }),
    stage('confirm', 'id-filled', 'Is this you', 'The record that came back', {
      progress: { ...done.who, identityConfirmed: false },
      session: null,
    }),
    stage('nomatch', 'warn-filled', 'Nothing came back', 'When the register has no record', {
      progress: done.number,
      session: null,
    }),
    stage('face', 'faceid-filled', 'Your face', 'The photo, or later', { progress: done.who, session: null }),
    stage('passcode', 'lock-filled', 'A passcode', 'Six digits, twice, with the weak ones refused', {
      progress: { ...done.who, face: 'later' },
      session: null,
    }),
    stage('ready', 'check', 'Ready', 'The account open, the ticks landing', {
      progress: { ...done.who, face: 'later', passcodeSet: true, accountNumber: accountNumberFor(LAB_PHONE) },
      session: sessionFor(account(LAB_PHONE)),
    }),
    stage('signin', 'mark', 'Welcome back', 'A number the app already knows'),
    stage('signcode', 'mark', 'Six digits, coming back', 'The code on the way back in, for the demo account', none, `&phone=${DEMO_PHONE}`),
  ],
};

const demo: Seed = { progress: {}, session: sessionFor(DEMO_ACCOUNT) };

export const HOME: Feature = {
  id: 'home',
  title: 'Home',
  folder: 'src/features/home',
  sub: 'The card at the top, and the day under it. Pull the card down for the chat.',
  places: [
    {
      id: 'home-demo',
      icon: 'home-filled',
      title: 'The demo account',
      sub: `${DEMO_ACCOUNT.firstName}'s day, the one the design is drawn around`,
      href: '/home',
      seed: demo,
    },
    {
      id: 'home-new',
      icon: 'home-filled',
      title: 'A new account',
      sub: 'Nothing has moved yet',
      href: '/home',
      seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) },
    },
    {
      id: 'home-first',
      icon: 'home-filled',
      title: 'The first time',
      sub: 'The card dips on its own to point out the chat',
      href: '/home',
      seed: demo,
      forget: ['beetle.home.pointed-out.v1'],
    },
  ],
};

export const ASK: Feature = {
  id: 'ask',
  title: 'Ask Beetle',
  folder: 'src/features/agent',
  sub: 'The chat inside the card: what it says, and the panels it puts up.',
  places: [
    {
      id: 'ask-open',
      icon: 'mark',
      title: 'The chat, open',
      sub: 'Home with the card already pulled down',
      href: '/home?chat=open',
      seed: demo,
    },
    {
      id: 'ask-transfer',
      icon: 'send',
      title: 'A transfer, mid-way',
      sub: '"Send 20k to Sarah", the panel filling in',
      href: '/home?chat=transfer',
      seed: demo,
    },
    {
      id: 'ask-prompt',
      icon: 'power',
      title: 'A prompt from Beetle',
      sub: 'A chat Beetle started, waiting in the day, opened',
      href: '/home?chat=prompt',
      seed: demo,
    },
    {
      id: 'ask-thinking',
      icon: 'clock',
      title: 'Beetle thinking',
      sub: '"Send 20k to Sarah" asked live: the steps, then the words, then the panel',
      href: '/home?chat=thinking',
      seed: demo,
    },
    {
      id: 'ask-carry',
      icon: 'clock-filled',
      title: 'A chat that carries on',
      sub: 'One filed a quarter of an hour ago, picked up by the pull down; New at the top right starts another',
      href: '/home?chat=carry',
      seed: demo,
    },
  ],
};

export const RECEIPTS: Feature = {
  id: 'receipts',
  title: 'Receipts',
  folder: 'src/features/receipts',
  sub: 'A receipt for every line in the day: the card in the chat, the page, and sharing it.',
  places: [
    {
      id: 'receipt-chat',
      icon: 'receipt',
      title: 'A receipt in the chat',
      sub: 'A transfer just through the passcode: the panel done, the card, a tap to the page',
      href: '/home?chat=sent',
      seed: demo,
    },
    {
      id: 'receipt-transfer',
      icon: 'send',
      title: 'A transfer',
      sub: '₦20,000 to Sarah Adeyemi, on its page, from the All done frame',
      href: '/receipt/l08',
      seed: demo,
    },
    {
      id: 'receipt-data',
      icon: 'data',
      title: 'Data bought',
      sub: '5GB for Mum, from the frame',
      href: '/receipt/l07',
      seed: demo,
    },
    {
      id: 'receipt-bill',
      icon: 'power',
      title: 'A bill paid',
      sub: 'Ikeja Electric, with the meter token to copy, from the frame',
      href: '/receipt/l11',
      seed: demo,
    },
    {
      id: 'receipt-in',
      icon: 'bank',
      title: 'Money in',
      sub: 'The salary from Pagrin Limited, from the frame',
      href: '/receipt/l10',
      seed: demo,
    },
    {
      id: 'receipt-share',
      icon: 'share',
      title: 'Share receipt',
      sub: 'The share sheet over the transfer, from the frame',
      href: '/receipt/l08?share=1',
      seed: demo,
    },
  ],
};

export const SETTINGS: Feature = {
  id: 'settings',
  title: 'Settings',
  folder: 'src/features/settings',
  sub: 'From the mark at the top left of home: what keeps the money yours, your account, about.',
  places: [
    {
      id: 'settings-page',
      icon: 'settings-filled',
      title: 'Settings',
      sub: 'The page from the frame; Your details and Sign out work, the rest say which round they come with',
      href: '/settings',
      seed: demo,
    },
    {
      id: 'settings-details',
      icon: 'person-filled',
      title: 'Your details',
      sub: 'Name, number, account number to copy, member since, on a sheet',
      href: '/settings?details=1',
      seed: demo,
    },
  ],
};

export const SCAN: Feature = {
  id: 'scan',
  title: 'Reading a photo',
  folder: 'src/features/scan',
  sub: 'The camera, and an account number read off what it sees.',
  places: [
    {
      id: 'scan-camera',
      icon: 'camera',
      title: 'The camera',
      sub: 'Permission, the shutter, and every way it can go wrong',
      href: '/scan',
      seed: demo,
    },
    {
      id: 'scan-read',
      icon: 'id',
      title: 'A photo, read',
      sub: 'The sample slip through the reader, into the chat',
      href: '/home?chat=photo',
      seed: demo,
    },
  ],
};

export const GUARD: Feature = {
  id: 'guard',
  title: 'Before money moves',
  folder: 'src/features/passcode',
  sub: 'The passcode on its sheet over the chat, and the face where the phone has one enrolled.',
  places: [
    {
      id: 'guard-passcode',
      icon: 'lock-filled',
      title: 'The passcode',
      sub: 'A transfer ready and the pad up: 654321 lets it through, three wrong shut the gate',
      href: '/home?chat=confirm',
      seed: demo,
    },
  ],
};

export const RECEIVE: Feature = {
  id: 'receive',
  title: 'Being paid',
  folder: 'src/features/receive',
  sub: 'The account number to hand out, and money arriving.',
  places: [
    {
      id: 'receive-details',
      icon: 'receive-filled',
      title: 'Your details',
      sub: 'The number and the name, to copy or share, over the chat',
      href: '/home?receive=details',
      seed: demo,
    },
    {
      id: 'receive-arrival',
      icon: 'bank',
      title: 'Money arrives',
      sub: '₦50,000 from Sarah lands on the card, in the day, and in a chat from Beetle',
      href: '/home?receive=arrival',
      seed: demo,
    },
  ],
};

export const MODEL: Feature = {
  id: 'model',
  title: "Beetle's model",
  folder: 'src/features/agent',
  sub: 'Claude behind the chat where there is a key for it, the script where there is not (src/services/model.ts).',
  places: [
    {
      id: 'model-key',
      icon: 'key-filled',
      title: 'The key, and a try',
      sub: 'Keep a key on this phone, see where Beetle answers from, and ask it something',
      href: '/model',
      seed: demo,
    },
  ],
};

export const FEATURES: Feature[] = [WAY_IN, HOME, ASK, SCAN, GUARD, RECEIVE, RECEIPTS, SETTINGS, MODEL];
