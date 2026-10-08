/* Where somebody is on the way in, and where they go next. The routes read
   this so that a person who closed the app halfway comes back to the step
   they were on, and nobody can land on a later step by typing its address.

   Since Round 30 (the owner's word) it begins with a mobile number, or an
   email, or Google or Apple handing over a checked email; then the code
   (OTP verification), the BVN number (or a NIN slip or voter's card, which
   gives the rest of the record), the details confirmed, the mobile number
   for those who began with an email (a BVN is tied to one), a password, and
   last the face scan and the username together. */
import type { IdentityRecord, DocumentKind } from '../../services/identity';
import type { KeptPasscode } from '../../services/crypto';

export type Step = 'welcome' | 'code' | 'bvn' | 'details' | 'phone' | 'phonecode' | 'password' | 'finish' | 'ready' | 'home';

/** How the way in began. */
export type Via = 'phone' | 'email' | 'google' | 'apple';

export type Progress = {
  via?: Via;
  phone?: string;
  phoneVerified?: boolean;
  email?: string;
  emailVerified?: boolean;
  /** the BVN, or the number off a NIN slip or a voter's card, and the record it brought back */
  identity?: { number: string; record: IdentityRecord; from?: 'bvn' | DocumentKind };
  identityConfirmed?: boolean;
  /** the password, stretched: never kept as typed */
  password?: KeptPasscode;
  accountNumber?: string;
};

export const EMPTY: Progress = {};

/** The contact the way in began with, verified first. */
const startedWithEmail = (p: Progress) => p.via === 'email' || p.via === 'google' || p.via === 'apple';

/** The first step that still has to be done. */
export function nextStep(p: Progress): Step {
  if (p.accountNumber) return 'ready';
  if (!p.phone && !p.email) return 'welcome';
  if (startedWithEmail(p) ? !p.emailVerified : !p.phoneVerified) return 'code';
  if (!p.identity) return 'bvn';
  if (!p.identityConfirmed) return 'details';
  if (!p.phone) return 'phone';
  if (!p.phoneVerified) return 'phonecode';
  if (!p.password) return 'password';
  return 'finish';
}

/** Where somebody who has a session lands: the ready screen once, right after
    the account is opened, and home ever after. Signing in or out clears the
    way in, so an account number left in it means the ready screen has not
    been seen yet. */
export function landing(p: Progress): Step {
  return p.accountNumber ? 'ready' : 'home';
}

const ORDER: Step[] = ['welcome', 'code', 'bvn', 'details', 'phone', 'phonecode', 'password', 'finish', 'ready', 'home'];

/** Can this step be shown? Every step up to the next one to do, but nothing
    past it. The welcome can always be shown: it is where the way in starts,
    and a new number or email starts over. */
export function canEnter(step: Step, p: Progress): boolean {
  if (step === 'welcome') return true;
  return ORDER.indexOf(step) <= ORDER.indexOf(nextStep(p));
}

/** The address of a step. The whole way in is one screen, so every step
    before home shares its address; the screen works out the stage itself. */
export const routeOf: Record<Step, string> = {
  welcome: '/way-in',
  code: '/way-in',
  bvn: '/way-in',
  details: '/way-in',
  phone: '/way-in',
  phonecode: '/way-in',
  password: '/way-in',
  finish: '/way-in',
  ready: '/way-in',
  home: '/home',
};
