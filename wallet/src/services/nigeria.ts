/* What Beetle knows about the country it works in, so that it can fill in
   what you did not say and ask only for what it cannot work out: which
   network a phone number is on, from its first four digits; the electricity
   companies and what they call themselves; what a meter number looks like,
   prepaid or postpaid; the data plans each network sells; a look-up that
   says whose a meter is; and the people, lines and meters paid before, so
   a repeat is a repeat. None of it is a screen. */

/* ---- phone numbers and their networks ---- */

export type Network = 'MTN' | 'Airtel' | 'Glo' | '9mobile';

export type NetworkInfo = { name: Network; /** the badge's colours */ colour: string; ink: string; prefixes: string[] };

export const NETWORKS: NetworkInfo[] = [
  { name: 'MTN', colour: '#ffcc00', ink: '#000000', prefixes: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916', '0704'] },
  { name: 'Airtel', colour: '#e40000', ink: '#ffffff', prefixes: ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0907', '0912', '0911', '0904'] },
  { name: 'Glo', colour: '#50b848', ink: '#ffffff', prefixes: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'] },
  { name: '9mobile', colour: '#006e3c', ink: '#ffffff', prefixes: ['0809', '0818', '0817', '0909', '0908'] },
];

export const networkInfo = (name: Network): NetworkInfo => NETWORKS.find(n => n.name === name)!;

/** The digits of a phone number as the country writes them: eleven, from
    0. +234 803… and 234803… come back as 0803…; anything else comes back
    as its digits, for the rules to refuse. */
export function normalisePhone(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('234')) return '0' + digits.slice(3);
  if (digits.length === 10 && /^[789]/.test(digits)) return '0' + digits;
  return digits;
}

/** Which network a number is on, from its first four digits; null where
    the digits do not start like a Nigerian mobile number. */
export function networkOf(number: string): Network | null {
  const digits = normalisePhone(number);
  const head = digits.slice(0, 4);
  return NETWORKS.find(n => n.prefixes.includes(head))?.name ?? null;
}

/** Why a number will not do, or nothing. */
export function phoneProblem(number: string): string | null {
  const digits = normalisePhone(number);
  if (!digits) return 'The number it goes to';
  if (digits.length < 11) return 'A phone number has eleven digits';
  if (digits.length > 11) return 'That is more than eleven digits';
  if (!networkOf(digits)) return 'That does not start like a Nigerian mobile number';
  return null;
}

/** The first phone number in the words: eleven digits from 0, or +234 and
    ten, however they are grouped. A ten-digit account number is not one. */
export function phoneIn(text: string): string | null {
  const m = text.match(/(?:\+?234[\s-]?|\b0)(?:\d[\s-]?){10}(?!\d)/);
  if (!m) return null;
  const digits = normalisePhone(m[0]);
  return digits.length === 11 && networkOf(digits) ? digits : null;
}

/** 0803 214 4471. */
export const groupPhoneNumber = (digits: string) => {
  const d = normalisePhone(digits);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean).join(' ');
};

/* ---- data plans ---- */

export type Plan = { id: string; network: Network; /** in gigabytes; 0.5 is 500MB */ gb: number; days: number; price: number };

const plan = (network: Network, gb: number, days: number, price: number): Plan => ({
  id: `${network.toLowerCase()}-${gb}gb-${days}d`,
  network,
  gb,
  days,
  price,
});

export const PLANS: Plan[] = [
  plan('MTN', 0.5, 1, 350),
  plan('MTN', 1, 7, 800),
  plan('MTN', 2, 30, 2_000),
  plan('MTN', 5, 30, 2_500),
  plan('MTN', 10, 30, 4_000),
  plan('MTN', 20, 30, 7_500),
  plan('MTN', 40, 30, 12_000),
  plan('Airtel', 0.5, 1, 350),
  plan('Airtel', 1, 7, 800),
  plan('Airtel', 2, 30, 1_800),
  plan('Airtel', 4, 30, 2_500),
  plan('Airtel', 10, 30, 4_000),
  plan('Airtel', 18, 30, 6_000),
  plan('Glo', 1, 7, 750),
  plan('Glo', 2.5, 30, 2_000),
  plan('Glo', 5.8, 30, 2_500),
  plan('Glo', 10, 30, 3_500),
  plan('Glo', 20, 30, 6_500),
  plan('9mobile', 1, 7, 800),
  plan('9mobile', 2, 30, 1_500),
  plan('9mobile', 4.5, 30, 2_500),
  plan('9mobile', 11, 30, 4_000),
  plan('9mobile', 15, 30, 5_000),
];

export const plansFor = (network: Network): Plan[] => PLANS.filter(p => p.network === network);
export const planById = (id: string): Plan | null => PLANS.find(p => p.id === id) ?? null;

/** 5GB, 500MB. */
export const planSize = (p: Plan) => (p.gb < 1 ? `${Math.round(p.gb * 1000)}MB` : `${p.gb}GB`);
/** 5GB for 30 days; 500MB for a day. */
export const planName = (p: Plan) => `${planSize(p)} for ${p.days === 1 ? 'a day' : p.days === 7 ? 'a week' : `${p.days} days`}`;

/** The gigabytes in the words: 5gb, 1.5 GB, 500mb, 2 gigs. */
export function dataIn(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(gb|gig|gigs|mb)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!(n > 0)) return null;
  return m[2]!.toLowerCase() === 'mb' ? n / 1000 : n;
}

/** The plan the words mean on a network: the size if one was said, the
    price if an amount was, the one bought before if neither. */
export function planFor(network: Network, said: { gb?: number | null; amount?: number | null; usual?: string | null }): Plan | null {
  const plans = plansFor(network);
  if (said.gb) return plans.find(p => p.gb === said.gb) ?? null;
  if (said.amount) {
    const exact = plans.find(p => p.price === said.amount);
    if (exact) return exact;
    const usual = said.usual ? planById(said.usual) : null;
    if (usual && usual.network === network && Math.abs(usual.price - said.amount) <= said.amount * 0.3) return usual;
    /* the most data the amount buys */
    const under = plans.filter(p => p.price <= said.amount!);
    return under.length ? under[under.length - 1]! : null;
  }
  if (said.usual) {
    const usual = planById(said.usual);
    if (usual && usual.network === network) return usual;
  }
  return null;
}

/** The three plans most worth offering: the one bought before first, then
    the nearest to what was said, then the middle of the range. */
export function likelyPlans(network: Network, said: { gb?: number | null; amount?: number | null; usual?: string | null } = {}): Plan[] {
  const plans = plansFor(network);
  const usual = said.usual ? planById(said.usual) : null;
  const near = (p: Plan) => (said.gb ? Math.abs(p.gb - said.gb) / Math.max(1, said.gb) : said.amount ? Math.abs(p.price - said.amount) / said.amount : Math.abs(p.price - 2_500) / 2_500);
  const ranked = [...plans].sort((a, b) => near(a) - near(b));
  const out: Plan[] = [];
  if (usual && usual.network === network) out.push(usual);
  for (const p of ranked) if (!out.includes(p) && out.length < 3) out.push(p);
  return out.sort((a, b) => a.price - b.price);
}

/* ---- airtime ---- */

/** The airtime slider runs from ₦100 to ₦10,000 in hundreds, its stops
    spaced evenly so the small amounts, the usual ones, get as much room as
    the big ones. */
export const AIRTIME = { min: 100, max: 10_000, step: 100, stops: [100, 200, 500, 1_000, 2_000, 5_000, 10_000] } as const;

/** Where an amount sits on the slider, 0 to 1, and back. */
export function airtimeAt(amount: number): number {
  const stops = AIRTIME.stops;
  const v = Math.min(Math.max(amount, AIRTIME.min), AIRTIME.max);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (v <= b) return (i + (v - a) / (b - a)) / (stops.length - 1);
  }
  return 1;
}
export function airtimeFrom(at: number): number {
  const stops = AIRTIME.stops;
  const p = Math.min(Math.max(at, 0), 1) * (stops.length - 1);
  const i = Math.min(Math.floor(p), stops.length - 2);
  const raw = stops[i]! + (p - i) * (stops[i + 1]! - stops[i]!);
  return Math.min(AIRTIME.max, Math.max(AIRTIME.min, Math.round(raw / AIRTIME.step) * AIRTIME.step));
}

/* ---- electricity ---- */

export type MeterKind = 'prepaid' | 'postpaid';

export type Disco = { id: string; name: string; short: string; /** where it supplies */ area: string; /** a town in it, for an address */ town: string; aliases: string[] };

export const DISCOS: Disco[] = [
  { id: 'ikeja', name: 'Ikeja Electric', short: 'Ikeja', area: 'Lagos mainland', town: 'Ikeja', aliases: ['ikeja', 'ie', 'ikedc'] },
  { id: 'eko', name: 'Eko Electricity', short: 'Eko', area: 'Lagos island', town: 'Lekki', aliases: ['eko', 'ekedc'] },
  { id: 'abuja', name: 'Abuja Electricity', short: 'AEDC', area: 'Abuja, Niger, Kogi and Nasarawa', town: 'Wuse', aliases: ['aedc', 'abuja'] },
  { id: 'jos', name: 'Jos Electricity', short: 'JED', area: 'Plateau, Bauchi, Benue and Gombe', town: 'Jos', aliases: ['jed', 'jedc', 'jos'] },
  { id: 'kano', name: 'Kano Electricity', short: 'KEDCO', area: 'Kano, Jigawa and Katsina', town: 'Kano', aliases: ['kedco', 'kano'] },
  { id: 'ibadan', name: 'Ibadan Electricity', short: 'IBEDC', area: 'Oyo, Ogun, Osun and Kwara', town: 'Ibadan', aliases: ['ibedc', 'ibadan'] },
  { id: 'enugu', name: 'Enugu Electricity', short: 'EEDC', area: 'the South East', town: 'Enugu', aliases: ['eedc', 'enugu'] },
  {
    id: 'portharcourt',
    name: 'Port Harcourt Electricity',
    short: 'PHED',
    area: 'Rivers, Bayelsa, Cross River and Akwa Ibom',
    town: 'Port Harcourt',
    aliases: ['phed', 'phedc', 'port harcourt', 'ph'],
  },
  { id: 'benin', name: 'Benin Electricity', short: 'BEDC', area: 'Edo, Delta, Ondo and Ekiti', town: 'Benin City', aliases: ['bedc', 'benin'] },
  { id: 'kaduna', name: 'Kaduna Electric', short: 'KAEDCO', area: 'Kaduna, Kebbi, Sokoto and Zamfara', town: 'Kaduna', aliases: ['kaedco', 'kaduna'] },
  { id: 'yola', name: 'Yola Electricity', short: 'YEDC', area: 'Adamawa, Borno, Taraba and Yobe', town: 'Yola', aliases: ['yedc', 'yola'] },
];

export const discoById = (id: string): Disco | null => DISCOS.find(d => d.id === id) ?? null;

/** The electricity company named in the words, by any of its names. NEPA
    and PHCN name the whole thing, not a company. */
export function discoIn(text: string): Disco | null {
  const lower = text.toLowerCase();
  for (const d of DISCOS) for (const a of d.aliases) if (new RegExp(`\\b${a}\\b`).test(lower)) return d;
  return null;
}

export function meterKindIn(text: string): MeterKind | null {
  if (/\bpre-?paid\b|\bprepay\b/i.test(text)) return 'prepaid';
  if (/\bpost-?paid\b/i.test(text)) return 'postpaid';
  return null;
}

/** A meter number is eight to thirteen digits; a postpaid account number
    the same. A phone number is not one. */
export function meterProblem(meter: string): string | null {
  const digits = meter.replace(/\D/g, '');
  if (!digits) return 'The meter number';
  if (digits.length < 8) return 'A meter number has at least eight digits';
  if (digits.length > 13) return 'That is more than thirteen digits';
  if (digits.length === 11 && networkOf(digits)) return 'That is a phone number';
  return null;
}

/** The meter number in the words: a run of eight to thirteen digits that
    is not a phone number. */
export function meterIn(text: string): string | null {
  for (const m of text.matchAll(/\b\d(?:[\s-]?\d){7,12}\b/g)) {
    const digits = m[0].replace(/\D/g, '');
    if (!meterProblem(digits)) return digits;
  }
  return null;
}

/** 4457 8891 — in fours. */
export const groupMeter = (digits: string) => digits.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

/** About what a naira buys, in units, on a prepaid meter. */
/* about 208 naira a unit: ₦3,000 is 14 kWh, ₦8,000 is 38 and ₦15,000 is 72, as the frames print them */
export const KWH_PER_NAIRA = 1 / 208.3;
export const unitsFor = (amount: number) => Math.round(amount * KWH_PER_NAIRA);

/** The amounts worth offering for a meter. */
export const BILL_AMOUNTS = [3_000, 8_000, 15_000];

export type MeterRecord = { name: string; address: string };

export interface MeterService {
  /** whose a meter is, at a company; null where there is no such meter */
  lookup(disco: string, kind: MeterKind, meter: string): Promise<MeterRecord | null>;
}

const NAMES = ['Adebayo Okon', 'Ngozi Eze', 'Yusuf Bello', 'Chiamaka Obi', 'Tunde Bakare', 'Halima Sani', 'Emeka Nwachukwu', 'Funke Alabi'];
const STREETS = ['Allen Avenue', 'Adeola Odeku Street', 'Herbert Macaulay Way', 'Aminu Kano Crescent', 'Zik Avenue', 'Ahmadu Bello Way', 'Old Aba Road', 'Awolowo Road'];

/** The meters this build knows by heart: the demo account's own, and the flat it pays for too. */
export const KNOWN_METERS: Record<string, MeterRecord> = {
  '44578891': { name: 'Ibrahim Musa', address: '14 Bode Thomas' },
  '54150011234': { name: 'Aisha Musa', address: '4 Admiralty Way, Lekki' },
};

/** A stand-in for the companies' own look-ups: a meter that reads right is
    somebody's, the same somebody every time; one ending in four zeros is
    nobody's. */
export class MockMeters implements MeterService {
  constructor(private readonly delay = 700) {}
  async lookup(disco: string, kind: MeterKind, meter: string): Promise<MeterRecord | null> {
    await new Promise(r => setTimeout(r, this.delay));
    const digits = meter.replace(/\D/g, '');
    if (meterProblem(digits) || digits.endsWith('0000')) return null;
    const known = KNOWN_METERS[digits];
    if (known) return known;
    let h = kind === 'prepaid' ? 3 : 5;
    for (const c of digits) h = (h * 31 + c.charCodeAt(0)) % 1_000_003;
    const d = discoById(disco);
    return { name: NAMES[h % NAMES.length]!, address: `${(h % 40) + 1} ${STREETS[(h >> 3) % STREETS.length]}, ${d?.town ?? 'Lagos'}` };
  }
}

/* ---- what has been paid before ---- */

/** What a line in the day went to, beyond the person a transfer names. */
export type Target =
  | { kind: 'line'; number: string; network: Network; /** whose: Mum, Your line */ label?: string; /** the plan bought, for data */ plan?: string }
  | { kind: 'meter'; disco: string; meterKind: MeterKind; meter: string; name?: string; label?: string };

/** A line in the day, as far as the beneficiaries need to read it. */
export type Paid = {
  name: string;
  detail: string;
  amount: number;
  status: string;
  kind: string;
  time: string;
  day: 'today' | 'yesterday' | 'earlier';
  person?: { bank: string; number: string };
  target?: Target;
};

export type PersonPaid = { kind: 'person'; id: string; name: string; bank: string; number: string; when: string; times: number };
export type LinePaid = {
  kind: 'line';
  id: string;
  label: string;
  number: string;
  network: Network;
  when: string;
  times: number;
  /** the plan bought last, for data */ plan?: string;
  /** the airtime bought last */ amount?: number;
  own?: boolean;
};
export type MeterPaid = { kind: 'meter'; id: string; label: string; disco: string; meterKind: MeterKind; meter: string; name: string; when: string; times: number; amount?: number };
export type Beneficiary = PersonPaid | LinePaid | MeterPaid;

export type Beneficiaries = { people: PersonPaid[]; lines: LinePaid[]; meters: MeterPaid[] };

/** What an account has paid before that the day does not show: lines and
    meters from earlier months. The demo account has a few; a new one has
    only its own line. */
export type Saved = { lines: LinePaid[]; meters: MeterPaid[] };

export const DEMO_SAVED: Saved = {
  lines: [
    { kind: 'line', id: 'line:08032144471', label: 'Mum', number: '08032144471', network: 'MTN', when: 'Last month', times: 6, plan: 'mtn-5gb-30d' },
    { kind: 'line', id: 'line:08053310921', label: 'Dad', number: '08053310921', network: 'Glo', when: 'Three weeks ago', times: 2, amount: 1_000 },
    { kind: 'line', id: 'line:08124027719', label: 'Kemi', number: '08124027719', network: 'Airtel', when: 'Last month', times: 3, plan: 'airtel-4gb-30d' },
    { kind: 'line', id: 'line:08161234567', label: 'Bola', number: '08161234567', network: 'MTN', when: 'Two months ago', times: 1, amount: 500 },
    { kind: 'line', id: 'line:08091183350', label: 'Tunde', number: '08091183350', network: '9mobile', when: 'Two months ago', times: 1, amount: 500 },
  ],
  meters: [
    { kind: 'meter', id: 'meter:44578891', label: 'Home', disco: 'ikeja', meterKind: 'prepaid', meter: '44578891', name: 'Ibrahim Musa', when: 'Last month', times: 9, amount: 8_000 },
    { kind: 'meter', id: 'meter:54150011234', label: "Mum's flat", disco: 'eko', meterKind: 'postpaid', meter: '54150011234', name: 'Aisha Musa', when: 'Two months ago', times: 2, amount: 12_000 },
  ],
};

/** The account's own line, first among the lines. */
export function ownLine(phone: string): LinePaid | null {
  const network = networkOf(phone);
  if (!network) return null;
  return { kind: 'line', id: `line:${normalisePhone(phone)}`, label: 'Your line', number: normalisePhone(phone), network, when: '', times: 0, own: true };
}

const whenOf = (row: Paid) => (row.day === 'earlier' ? 'Earlier' : `${row.day === 'today' ? 'Today' : 'Yesterday'} ${row.time}`);

/** Everyone and everything paid before, newest first: what the day shows
    (the rows in the order given, newest first), then what was saved from
    earlier, each counted. Only what went through counts. */
export function beneficiariesOf(rows: Paid[], saved: Saved, people: { name: string; bank: string; number: string }[], own?: LinePaid | null): Beneficiaries {
  const persons = new Map<string, PersonPaid>();
  const lines = new Map<string, LinePaid>();
  const meters = new Map<string, MeterPaid>();
  if (own) lines.set(own.number, { ...own });
  for (const row of rows) {
    if (row.status !== 'done' || row.amount >= 0) continue;
    if (row.kind === 'transfer') {
      const known = row.person ? people.find(p => p.number === row.person!.number) : people.find(p => p.name === row.name);
      const number = row.person?.number ?? known?.number;
      if (!number) continue;
      const had = persons.get(number);
      if (had) had.times++;
      else persons.set(number, { kind: 'person', id: `person:${number}`, name: row.name, bank: row.person?.bank ?? known?.bank ?? 'Their bank', number, when: whenOf(row), times: 1 });
    } else if (row.target?.kind === 'line') {
      const t = row.target;
      const had = lines.get(t.number);
      const bought = /\bGB\b|\bMB\b/i.test(row.detail) || !!t.plan;
      if (had) {
        had.times++;
        if (!had.when) had.when = whenOf(row);
        if (bought && !had.plan && t.plan) had.plan = t.plan;
        if (!bought && !had.amount) had.amount = -row.amount;
      } else
        lines.set(t.number, {
          kind: 'line',
          id: `line:${t.number}`,
          label: t.label ?? groupPhoneNumber(t.number),
          number: t.number,
          network: t.network,
          when: whenOf(row),
          times: 1,
          plan: bought ? t.plan : undefined,
          amount: bought ? undefined : -row.amount,
        });
    } else if (row.target?.kind === 'meter') {
      const t = row.target;
      const had = meters.get(t.meter);
      if (had) had.times++;
      else
        meters.set(t.meter, {
          kind: 'meter',
          id: `meter:${t.meter}`,
          label: t.label ?? discoById(t.disco)?.name ?? row.name,
          disco: t.disco,
          meterKind: t.meterKind,
          meter: t.meter,
          name: t.name ?? '',
          when: whenOf(row),
          times: 1,
          amount: -row.amount,
        });
    }
  }
  /* the people known but not in the day: paid before the day the rows show */
  for (const p of people) if (!persons.has(p.number)) persons.set(p.number, { kind: 'person', id: `person:${p.number}`, name: p.name, bank: p.bank, number: p.number, when: '', times: 0 });
  for (const l of saved.lines) {
    const had = lines.get(l.number);
    if (had) {
      had.times += l.times;
      if (had.label === groupPhoneNumber(l.number)) had.label = l.label;
      if (!had.plan) had.plan = l.plan;
      if (!had.amount) had.amount = l.amount;
    } else lines.set(l.number, { ...l });
  }
  for (const m of saved.meters) {
    const had = meters.get(m.meter);
    if (had) {
      had.times += m.times;
      if (!had.name) had.name = m.name;
      had.label = m.label;
    } else meters.set(m.meter, { ...m });
  }
  return { people: [...persons.values()], lines: [...lines.values()], meters: [...meters.values()] };
}

/** Whether the words name a saved thing's label: "mum", "mum's", "Mum's flat". */
export function labelIn(text: string, label: string): boolean {
  const lower = text.toLowerCase().replace(/'/g, '');
  const word = label
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
  if (!word || word === 'home' || word === 'your line') return false;
  return new RegExp(`\\b${word.replace(/s$/, '')}s?\\b`).test(lower);
}

/** The line the words mean: "for mum", "mum's line", "my line", "me", or a
    number among those saved. */
export function savedLineIn(text: string, lines: LinePaid[]): LinePaid | null {
  const lower = text.toLowerCase().replace(/'/g, '');
  const number = phoneIn(text);
  if (number) return lines.find(l => l.number === number) ?? null;
  if (/\b(my (own )?(line|number|phone)|myself|for me|me)\b/.test(lower)) return lines.find(l => l.own) ?? null;
  for (const l of lines) if (!l.own && labelIn(text, l.label)) return l;
  return null;
}

/** The meter the words mean: "my light", "the usual", "again", a company's
    name, or a label such as Mum's flat. */
export function savedMeterIn(text: string, meters: MeterPaid[]): MeterPaid | null {
  const lower = text.toLowerCase().replace(/'/g, '');
  const number = meterIn(text);
  if (number) return meters.find(m => m.meter === number) ?? null;
  for (const m of meters) if (labelIn(text, m.label)) return m;
  const disco = discoIn(text);
  if (disco) return meters.find(m => m.disco === disco.id) ?? null;
  if (/\b(my|our|usual|again|same|home)\b/.test(lower)) return meters[0] ?? null;
  return null;
}
