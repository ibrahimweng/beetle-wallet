/* The steps of the way in, as the trail names them once each is done: named
   for what was given (Round 30), the way the titles are. */
import type { TrailStep } from '../../design';
import type { Progress } from './machine';

export const MOBILE: TrailStep = { icon: 'phone-filled', label: 'Mobile number' };
export const EMAIL: TrailStep = { icon: 'mail-filled', label: 'Email' };
export const GOOGLE: TrailStep = { icon: 'mail-filled', label: 'Google account' };
export const APPLE: TrailStep = { icon: 'mail-filled', label: 'Apple account' };
export const BVN: TrailStep = { icon: 'id-filled', label: 'BVN number' };
export const NIN_SLIP: TrailStep = { icon: 'id-filled', label: 'NIN slip' };
export const VOTERS: TrailStep = { icon: 'id-filled', label: 'Voter’s card' };
export const PASSWORD: TrailStep = { icon: 'lock-filled', label: 'Password' };
export const FINISHED: TrailStep = { icon: 'faceid-filled', label: 'Face scan and username' };
export const FACE_MATCHED: TrailStep = { icon: 'faceid-filled', label: 'Face scan' };

/** The row for the contact the way in began with, once it is checked. */
export function contactRow(p: Progress): TrailStep | null {
  if (p.via === 'google') return p.emailVerified ? GOOGLE : null;
  if (p.via === 'apple') return p.emailVerified ? APPLE : null;
  if (p.via === 'email') return p.emailVerified ? EMAIL : null;
  return p.phoneVerified ? MOBILE : null;
}

/** The row for who you are: the BVN, or the paper that stood in for it. */
export const idRow = (p: Progress): TrailStep => (p.identity?.from === 'nin' ? NIN_SLIP : p.identity?.from === 'voters' ? VOTERS : BVN);
