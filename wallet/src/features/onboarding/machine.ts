/* Where somebody is on the way in, and where they go next. The routes read
   this so that a person who closed the app halfway comes back to the step
   they were on, and nobody can land on a later step by typing its address.

   Since Round 32 (the owner's word) it begins with a mobile number, an email,
   or Google or Apple handing over a checked email; then the code (OTP
   verification), your details (full name and date of birth, typed), the BVN
   or the NIN they are checked against (or a photo of a NIN slip or a voter's
   card), the mobile number for those who began otherwise (a BVN is tied to
   one), a password for those who did not come with Google or Apple, the
   passcode, and last the face scan and the username together. */
import type { IdentityRecord, DocumentKind } from '../../services/identity';
import type { KeptPasscode } from '../../services/crypto';

export type Step = 'welcome' | 'code' | 'details' | 'bvn' | 'phone' | 'phonecode' | 'password' | 'passcode' | 'finish' | 'ready' | 'home';

/** How the way in began. */
export type Via = 'phone' | 'email' | 'google' | 'apple';
/** The number the details are checked against. */
export type IdKind = 'bvn' | 'nin';

export type Progress = {
  via?: Via;
  phone?: string;
  phoneVerified?: boolean;
  email?: string;
  emailVerified?: boolean;
  /** as typed, or as Google or Apple gave it, or as the paper read */
  name?: string;
  /** ISO date, as typed */
  dob?: string;
  idKind?: IdKind;
  /** the BVN or NIN (or the number off a NIN slip or a voter's card) the details matched, and the record behind it */
  identity?: { number: string; record: IdentityRecord; from?: IdKind | DocumentKind };
  /** the password, stretched: never kept as typed; none for Google and Apple */
  password?: KeptPasscode;
  /** the six digits that open the app and send money, stretched */
  passcode?: KeptPasscode;
  accountNumber?: string;
};

export const EMPTY: Progress = {};

/** Came with Google or Apple: they vouch for the email, and there is no password. */
export const withProvider = (p: Progress) => p.via === 'google' || p.via === 'apple';
/** The contact the way in began with, verified first. */
const startedWithEmail = (p: Progress) => p.via === 'email' || withProvider(p);

/** The first step that still has to be done. */
export function nextStep(p: Progress): Step {
  if (p.accountNumber) return 'ready';
  if (!p.phone && !p.email) return 'welcome';
  if (startedWithEmail(p) ? !p.emailVerified : !p.phoneVerified) return 'code';
  if (!p.name || !p.dob) return 'details';
  if (!p.identity) return 'bvn';
  if (!p.phone) return 'phone';
  if (!p.phoneVerified) return 'phonecode';
  if (!withProvider(p) && !p.password) return 'password';
  if (!p.passcode) return 'passcode';
  return 'finish';
}

/** Where somebody who has a session lands: the ready screen once, right after
    the account is opened, and home ever after. Signing in or out clears the
    way in, so an account number left in it means the ready screen has not
    been seen yet. */
export function landing(p: Progress): Step {
  return p.accountNumber ? 'ready' : 'home';
}

const ORDER: Step[] = ['welcome', 'code', 'details', 'bvn', 'phone', 'phonecode', 'password', 'passcode', 'finish', 'ready', 'home'];

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
  details: '/way-in',
  bvn: '/way-in',
  phone: '/way-in',
  phonecode: '/way-in',
  password: '/way-in',
  passcode: '/way-in',
  finish: '/way-in',
  ready: '/way-in',
  home: '/home',
};
