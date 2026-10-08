/* The way in is one screen. These are its stages, the order they come in,
   what the stack above the title holds at each, and where somebody starts.

   Since Round 30 (the owner's word) every stage is named for what it asks:
   Enter mobile number, OTP verification, BVN number, Password, Face scan
   and username. Three ways run through the one screen: opening an account,
   logging in, and getting back an account whose email or password is lost. */
import type { Session } from '../../services';
import type { TrailStep } from '../../design';
import { nextStep, type Progress, type Step } from './machine';
import { EMAIL, FACE_MATCHED, FINISHED, MOBILE, PASSWORD, contactRow, idRow } from './steps';
import { IDCARD, INCOME, LIVE } from '../setup/setup';

/** Opening an account, in order; the ones off the main path (the email instead of the number, Google or Apple, a
    paper instead of the BVN, nothing came back) branch from the one before them. */
export const SIGN_UP = ['welcome', 'number', 'email', 'provider', 'code', 'bvn', 'document', 'details', 'nomatch', 'password', 'finish', 'ready'] as const;
/** Logging in: the number or the email, the code, the password, and on a phone it has not seen, the face. */
export const LOG_IN = ['signin', 'signemail', 'signcode', 'signpass', 'signface'] as const;
/** Getting an account back: the code to its mobile number, its BVN, a live face matched to the BVN's photo, and only then
    a new email (checked with a code of its own) or a new password. */
export const RECOVER = ['recover', 'recovercode', 'recoverbvn', 'recoverface', 'recoverwhat', 'newemail', 'newemailcode', 'newpassword', 'recovered'] as const;
/** Finishing setting up, after the account is ready. */
export const SETUP = ['address', 'idcard', 'income', 'full'] as const;

export const STAGES = [...SIGN_UP, ...LOG_IN, ...RECOVER, ...SETUP] as const;
export type Stage = (typeof STAGES)[number];

export const isStage = (s: unknown): s is Stage => typeof s === 'string' && (STAGES as readonly string[]).includes(s);

export type Row = TrailStep;

/** The way back in has one step behind its code: the number, under the mark. */
export const BACK_IN: Row = { icon: 'mark', label: 'Welcome back' };

/** The steps done by the time a stage shows, as rows above the title: worked out from how far the way in has got,
    since the same stage (the number, the code) can come first or come after the BVN. */
export function rowsFor(stage: Stage, p: Progress = {}): Row[] {
  const first = contactRow(p);
  const id = idRow(p);
  /* once the mobile number is in after an email, the two share a row, so the ready screen keeps four */
  const both = first && p.via && p.via !== 'phone' && p.phoneVerified ? { ...first, label: `${first.label} and mobile number` } : first;
  switch (stage) {
    case 'number':
    case 'code':
      return p.identityConfirmed && first ? [first, id] : [];
    case 'bvn':
    case 'document':
    case 'details':
    case 'nomatch':
      return first ? [first] : [];
    case 'password':
      return both ? [both, id] : [];
    case 'finish':
      return both ? [both, id, PASSWORD] : [];
    case 'ready':
      return [both ?? MOBILE, id, PASSWORD, FINISHED];
    case 'signcode':
    case 'signpass':
    case 'signface':
      return [BACK_IN];
    /* getting an account back: each proof, as it is given */
    case 'recoverbvn':
      return [MOBILE];
    case 'recoverface':
      return [MOBILE, idRow({})];
    case 'recoverwhat':
    case 'newemail':
    case 'newpassword':
      return [MOBILE, idRow({}), FACE_MATCHED];
    case 'newemailcode':
      return [MOBILE, idRow({}), FACE_MATCHED, EMAIL];
    /* finishing setting up: its own three steps, after the account is ready */
    case 'idcard':
      return [LIVE];
    case 'income':
      return [LIVE, IDCARD];
    case 'full':
      return [LIVE, IDCARD, INCOME];
    default:
      return [];
  }
}

const STAGE_OF: Record<Step, Stage> = {
  welcome: 'welcome',
  code: 'code',
  bvn: 'bvn',
  details: 'details',
  phone: 'number',
  phonecode: 'code',
  password: 'password',
  finish: 'finish',
  ready: 'ready',
  home: 'ready',
};

/** The stages of finishing setting up, which the ready screen and Settings open. */
export const SETUP_STAGES: readonly Stage[] = SETUP;
export const isSetupStage = (s: Stage) => SETUP_STAGES.includes(s);

/** Where somebody is when the screen opens: the ready screen for an account
    just opened, the step they left off on, or the welcome. An account number
    left in the way in without a session is a device that forgot its session,
    and starts again. */
export function initialStage(p: Progress, session: Session | null): Stage {
  if (session) return 'ready';
  if (p.accountNumber) return 'welcome';
  return STAGE_OF[nextStep(p)];
}
