/* The way in is one screen. These are its stages, the order they come in,
   what the stack above the title holds at each, and where somebody starts. */
import type { Session } from '../../services';
import type { TrailStep } from '../../design';
import { nextStep, type Progress, type Step } from './machine';
import { FACE, NUMBER, PASS, WHO } from './steps';

export type Stage = 'welcome' | 'number' | 'code' | 'identity' | 'confirm' | 'nomatch' | 'face' | 'passcode' | 'ready' | 'signin' | 'signcode';

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

/** Where somebody is when the screen opens: the ready screen for an account
    just opened, the step they left off on, or the welcome. An account number
    left in the way in without a session is a device that forgot its session,
    and starts again. */
export function initialStage(p: Progress, session: Session | null): Stage {
  if (session) return 'ready';
  if (p.accountNumber) return 'welcome';
  return STAGE_OF[nextStep(p)];
}
