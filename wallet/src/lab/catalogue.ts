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
};

export type Feature = { id: string; title: string; folder: string; sub: string; places: Place[] };

/* The account the lab opens the way in and home with, when one is needed:
   the number the browser walk uses, and the record the design's own number
   comes back as. */
export const LAB_PHONE = '08123456789';
const RECORD: IdentityRecord = { firstName: 'Ibrahim', lastName: 'Musa', recordName: 'MUSA IBRAHIM', born: '1996-06-14', birthYear: 1996 };
const LAB_NUMBER = '12345678900';

const done = {
  number: { phone: LAB_PHONE, phoneVerified: true } satisfies Progress,
  who: { phone: LAB_PHONE, phoneVerified: true, identity: { number: LAB_NUMBER, record: RECORD }, identityConfirmed: true } satisfies Progress,
};

const account = (phone: string) => ({ accountNumber: accountNumberFor(phone), phone, firstName: RECORD.firstName, lastName: RECORD.lastName, createdAt: '2026-09-01T09:00:00Z' });
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
    stage('confirm', 'id-filled', 'Is this you', 'The record that came back', { progress: { ...done.who, identityConfirmed: false }, session: null }),
    stage('nomatch', 'warn-filled', 'Nothing came back', 'When the register has no record', { progress: done.number, session: null }),
    stage('face', 'faceid-filled', 'Your face', 'The photo, or later', { progress: done.who, session: null }),
    stage('passcode', 'lock-filled', 'A passcode', 'Six digits, twice, with the weak ones refused', { progress: { ...done.who, face: 'later' }, session: null }),
    stage('ready', 'check', 'Ready', 'The account open, the ticks landing', {
      progress: { ...done.who, face: 'later', passcodeSet: true, accountNumber: accountNumberFor(LAB_PHONE) },
      session: sessionFor(account(LAB_PHONE)),
    }),
    stage('signin', 'mark', 'Welcome back', 'A number the app already knows'),
    stage('signcode', 'mark', 'Six digits, coming back', 'The code on the way back in, for the demo account', none, `&phone=${DEMO_PHONE}`),
  ],
};

export const HOME: Feature = {
  id: 'home',
  title: 'Home',
  folder: 'src/features/home',
  sub: 'What the account looks like once you are in.',
  places: [
    { id: 'home-new', icon: 'home-filled', title: 'A new account', sub: 'Nothing has moved yet', href: '/home', seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) } },
    {
      id: 'home-demo',
      icon: 'home-filled',
      title: 'The demo account',
      sub: `${DEMO_ACCOUNT.firstName}'s day, the one the design is drawn around`,
      href: '/home',
      seed: { progress: {}, session: sessionFor(DEMO_ACCOUNT) },
    },
  ],
};

export const FEATURES: Feature[] = [WAY_IN, HOME];
