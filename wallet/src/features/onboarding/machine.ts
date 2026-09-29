/* Where somebody is on the way in, and where they go next. The routes read
   this so that a person who closed the app halfway comes back to the step
   they were on, and nobody can land on a later step by typing its address. */
import type { IdentityRecord } from '../../services/identity';

export type Step =
  | 'welcome'
  | 'phone'
  | 'code'
  | 'identity'
  | 'confirm'
  | 'face'
  | 'passcode'
  | 'ready'
  | 'home';

export type Progress = {
  phone?: string;
  phoneVerified?: boolean;
  identity?: { number: string; record: IdentityRecord };
  identityConfirmed?: boolean;
  face?: 'enrolled' | 'later';
  passcodeSet?: boolean;
  accountNumber?: string;
};

export const EMPTY: Progress = {};

/** The first step that still has to be done. */
export function nextStep(p: Progress): Step {
  if (p.accountNumber) return 'ready';
  if (!p.phone) return 'welcome';
  if (!p.phoneVerified) return 'code';
  if (!p.identity) return 'identity';
  if (!p.identityConfirmed) return 'confirm';
  if (!p.face) return 'face';
  if (!p.passcodeSet) return 'passcode';
  return 'passcode';
}

/** Where somebody who has a session lands: the ready screen once, right after
    the account is opened, and home ever after. Signing in or out clears the
    way in, so an account number left in it means the ready screen has not
    been seen yet. */
export function landing(p: Progress): Step {
  return p.accountNumber ? 'ready' : 'home';
}

const ORDER: Step[] = ['welcome', 'phone', 'code', 'identity', 'confirm', 'face', 'passcode', 'ready', 'home'];

/** Can this step be shown? Every step up to the next one to do, but nothing
    past it. The phone screen can always be shown: it is where the way in
    starts, and typing a new number starts over. */
export function canEnter(step: Step, p: Progress): boolean {
  if (step === 'welcome' || step === 'phone') return true;
  return ORDER.indexOf(step) <= ORDER.indexOf(nextStep(p));
}

/** The address of a step. The whole way in is one screen, so every step
    before home shares its address; the screen works out the stage itself. */
export const routeOf: Record<Step, string> = {
  welcome: '/way-in',
  phone: '/way-in',
  code: '/way-in',
  identity: '/way-in',
  confirm: '/way-in',
  face: '/way-in',
  passcode: '/way-in',
  ready: '/way-in',
  home: '/home',
};
