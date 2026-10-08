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

/* ---- the password (Round 30, the owner's word: a text password in place of the six digits, everywhere) ---- */

export type PasswordProblem = 'short' | 'letters' | 'digits' | 'name' | 'common';

/** What a password has to be, in the order the rules are shown. */
export const PASSWORD_RULES: { problem: Exclude<PasswordProblem, 'common' | 'name'>; words: string }[] = [
  { problem: 'short', words: 'At least 8 characters' },
  { problem: 'letters', words: 'A letter' },
  { problem: 'digits', words: 'A number' },
];

const COMMON_PASSWORDS = new Set(['password', 'password1', 'password123', 'passw0rd', 'qwerty123', '12345678', 'abc12345', 'iloveyou1', 'beetle123', 'letmein1', 'welcome1', 'admin123']);

/** An email, as far as the app can tell before a code is sent to it. */
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Why a password is not good enough, or null when it is: eight characters at least, with a letter and a number,
    not one of the commonest, and not the person's own name or year of birth. */
export function passwordProblem(pw: string, opts: { names?: string[]; birthYear?: number } = {}): PasswordProblem | null {
  if (pw.length < 8) return 'short';
  if (!/[A-Za-z]/.test(pw)) return 'letters';
  if (!/\d/.test(pw)) return 'digits';
  const low = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(low)) return 'common';
  if ((opts.names ?? []).some(n => n.length >= 3 && low.includes(n.toLowerCase())) || (opts.birthYear && low.includes(String(opts.birthYear)))) return 'name';
  return null;
}

export const PASSWORD_WORDS: Record<PasswordProblem, string> = {
  short: 'At least 8 characters.',
  letters: 'Put a letter in it.',
  digits: 'Put a number in it.',
  name: 'Not your name or your year of birth.',
  common: 'That one is too easy to guess.',
};

/** A username, the $tag people pay: 3 to 20 small letters, numbers and underscores, starting with a letter. */
export const usernameProblem = (u: string): 'short' | 'long' | 'chars' | null => (u.length < 3 ? 'short' : u.length > 20 ? 'long' : !/^[a-z][a-z0-9_]*$/.test(u) ? 'chars' : null);

/* ---- your details (Round 32: typed, then held to the BVN or NIN) ---- */

/** A full name as the record would have it: two names at least, letters with a hyphen or an apostrophe. */
export function fullNameProblem(name: string): 'short' | 'chars' | null {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.some(w => w.length < 2)) return 'short';
  if (!words.every(w => /^[\p{L}][\p{L}'’-]*$/u.test(w))) return 'chars';
  return null;
}

/** DD/MM/YYYY as it is typed: the slashes put in as the digits arrive. */
export function typingDate(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** DD/MM/YYYY as an ISO date, when it is a real day in the past, or null. */
export function dateFrom(text: string, now = new Date()): string | null {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const at = new Date(Date.UTC(year, month - 1, day));
  if (at.getUTCFullYear() !== year || at.getUTCMonth() !== month - 1 || at.getUTCDate() !== day) return null;
  if (year < 1900 || at.getTime() > now.getTime()) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** An ISO date as DD/MM/YYYY. */
export const shownDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Whole years from a birthday to a day. */
export function ageOn(iso: string, now = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}

/** An account is for a grown-up: a child's is opened with a parent, at a branch. */
export const ADULT = 18;
