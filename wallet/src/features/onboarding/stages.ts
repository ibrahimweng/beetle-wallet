/* The way in is one screen. These are its stages, the order they come in,
   what the stack above the title holds at each, and where somebody starts. */
import type { Session } from '../../services';
import type { TrailStep } from '../../design';
import { nextStep, type Progress, type Step } from './machine';
import { FACE, NUMBER, PASS, WHO } from './steps';
import { IDCARD, INCOME, LIVE } from '../setup/setup';

export const STAGES = ['welcome', 'number', 'code', 'identity', 'confirm', 'nomatch', 'face', 'passcode', 'ready', 'signin', 'signcode', 'address', 'idcard', 'income', 'full'] as const;
export type Stage = (typeof STAGES)[number];

export const isStage = (s: unknown): s is Stage => typeof s === 'string' && (STAGES as readonly string[]).includes(s);

export type Row = TrailStep;

/** The way back in has one step behind its code: the number, under the mark. */
export const BACK_IN: Row = { icon: 'mark', label: 'Welcome back' };

/** The steps done by the time a stage shows, as rows above the title. */
export function rowsFor(stage: Stage): Row[] {
  switch (stage) {
    case 'identity':
    case 'confirm':
    case 'nomatch':
      return [NUMBER];
    case 'face':
      return [NUMBER, WHO];
    case 'passcode':
      return [NUMBER, WHO, FACE];
    case 'ready':
      return [NUMBER, WHO, FACE, PASS];
    case 'signcode':
      return [BACK_IN];
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
  phone: 'number',
  code: 'code',
  identity: 'identity',
  confirm: 'confirm',
  face: 'face',
  passcode: 'passcode',
  ready: 'ready',
  home: 'ready',
};

/** The stages of finishing setting up, which the ready screen and Settings open. */
export const SETUP_STAGES: readonly Stage[] = ['address', 'idcard', 'income', 'full'];
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
