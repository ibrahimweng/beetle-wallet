/* Money health: one number for how the money is being handled, and the
   five habits that move it, as the frame lists them. The score is the
   demo's own until an account service works it out; the habits read what
   this phone knows — the switches in Settings and the transfers sent. */
import type { IconName } from '../../icons';
import type { Prefs } from '../settings/prefs';

export type HealthRow = { id: string; glyph: IconName; title: string; sub: string; value: string; tone?: 'warn' };

export const HEALTH_ROWS = {
  check: 'You check before you send',
  save: 'You save on payday',
  cover: 'Your balance stays covered',
  open: 'Only you can open this',
  watch: 'You watch where it goes',
} as const;

/** The five rows, from what the phone knows: the switches and the transfers. */
export function healthRows(prefs: Prefs, transfers: number): HealthRow[] {
  const read = 9 + transfers;
  return [
    { id: 'check', glyph: 'check', title: HEALTH_ROWS.check, sub: 'Every transfer read before it left', value: `${read} of ${read}` },
    { id: 'save', glyph: 'pot', title: HEALTH_ROWS.save, sub: 'Before it can go anywhere else', value: prefs.rules.payday && !prefs.tight ? '3 months' : 'Paused' },
    { id: 'cover', glyph: 'eye', title: HEALTH_ROWS.cover, sub: 'Dots in public, figures at home', value: prefs.hideBalance ? 'On' : 'Off' },
    { id: 'open', glyph: 'faceid', title: HEALTH_ROWS.open, sub: 'Face ID, a passcode, and a limit', value: prefs.faceId ? 'On' : 'Passcode' },
    { id: 'watch', glyph: 'chart', title: HEALTH_ROWS.watch, sub: 'Against what you planned to spend', value: '18% over', tone: 'warn' },
  ];
}

/** Beetle's word on the score. */
export function healthLine(score: number | null): string {
  if (score === null) return 'Give it a month of moving money and I can tell you how you are handling it. Nothing to score yet.';
  return 'Steadier than you were. The one thing holding it down is spending, which is up 18% on last month. Everything else is going the right way.';
}
