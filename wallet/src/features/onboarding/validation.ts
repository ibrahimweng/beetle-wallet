/* What the way in accepts. Pure functions, so the rules can be read and tested
   on their own. */

/** Strip spaces, dashes and a +234 or 234 prefix down to the 11 digits a
    Nigerian number is written with, or null if that is not what it is. */
export function normalisePhone(input: string): string | null {
  const raw = input.replace(/[\s\-().]/g, '');
  let digits = raw.startsWith('+234') ? '0' + raw.slice(4) : raw.startsWith('234') && raw.length === 13 ? '0' + raw.slice(3) : raw;
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 10 && !digits.startsWith('0')) digits = '0' + digits;
  return digits.length === 11 ? digits : null;
}

/** A Nigerian mobile number: eleven digits, starting 070, 080, 081, 090 or 091. */
export const isNigerianMobile = (digits: string) => /^0(70|80|81|90|91)\d{8}$/.test(digits);

export type PhoneCheck = { ok: true; phone: string } | { ok: false; reason: 'short' | 'not-nigerian' };

export function checkPhone(input: string): PhoneCheck {
  const phone = normalisePhone(input);
  if (!phone) return { ok: false, reason: 'short' };
  if (!isNigerianMobile(phone)) return { ok: false, reason: 'not-nigerian' };
  return { ok: true, phone };
}

/** The six digits from a text. */
export const isCode = (code: string) => /^\d{6}$/.test(code);

/** A NIN or a BVN: eleven digits either way. */
export const isIdentityNumber = (digits: string) => /^\d{11}$/.test(digits);

export type PasscodeProblem = 'short' | 'same' | 'run' | 'pairs' | 'birth-year' | 'common';

const COMMON = new Set(['123456', '654321', '000000', '111111', '112233', '121212', '123123', '696969', '159753']);

/** Why a passcode is not good enough, or null when it is. A run is 123456 or
    654321 in either direction from any start; pairs are 121212; the year of
    birth is checked when the record gave one. */
export function passcodeProblem(code: string, opts: { birthYear?: number } = {}): PasscodeProblem | null {
  if (!/^\d{6}$/.test(code)) return 'short';
  if (COMMON.has(code)) return 'common';
  if (/^(\d)\1{5}$/.test(code)) return 'same';
  const d = code.split('').map(Number) as number[];
  const step = (d[1] ?? 0) - (d[0] ?? 0);
  if ((step === 1 || step === -1) && d.every((v, i) => i === 0 || v - (d[i - 1] ?? 0) === step)) return 'run';
  if (/^(\d\d)\1\1$/.test(code)) return 'pairs';
  if (opts.birthYear && code.includes(String(opts.birthYear))) return 'birth-year';
  return null;
}

export const PASSCODE_WORDS: Record<PasscodeProblem, string> = {
  short: 'Six digits.',
  same: 'Not the same digit six times.',
  run: 'Not a run like 123456.',
  pairs: 'Not a pair repeated.',
  'birth-year': 'Not your year of birth.',
  common: 'That one is too easy to guess.',
};
