import { describe, expect, it } from 'vitest';
import {
  DEMO_SAVED,
  MockMeters,
  beneficiariesOf,
  dataIn,
  discoIn,
  groupPhoneNumber,
  likelyPlans,
  meterIn,
  meterKindIn,
  meterProblem,
  networkOf,
  ownLine,
  phoneIn,
  phoneProblem,
  planFor,
  planName,
  savedLineIn,
  savedMeterIn,
  unitsFor,
  type Paid,
} from '@/services/nigeria';

const PEOPLE = [
  { name: 'Sarah Adeyemi', bank: 'GTBank', number: '0123456789' },
  { name: 'John Doe', bank: 'Kuda', number: '3012345678' },
];

describe('phone numbers', () => {
  it('knows the network from the first four digits, however the number is written', () => {
    expect(networkOf('08032144471')).toBe('MTN');
    expect(networkOf('0812 345 6789')).toBe('Airtel');
    expect(networkOf('+234 805 331 0921')).toBe('Glo');
    expect(networkOf('2348091183350')).toBe('9mobile');
    expect(networkOf('08030000001')).toBe('MTN');
    expect(networkOf('0123456789')).toBeNull();
  });
  it('says what is wrong with a number', () => {
    expect(phoneProblem('')).toBe('The number it goes to');
    expect(phoneProblem('0803 214')).toBe('A phone number has eleven digits');
    expect(phoneProblem('080321444711')).toBe('That is more than eleven digits');
    expect(phoneProblem('01234567890')).toBe('That does not start like a Nigerian mobile number');
    expect(phoneProblem('0803 214 4471')).toBeNull();
  });
  it('finds a phone number in the words and leaves account numbers alone', () => {
    expect(phoneIn('data for 0812 345 6789')).toBe('08123456789');
    expect(phoneIn('airtime for +234 803 214 4471 please')).toBe('08032144471');
    expect(phoneIn('send 5k to 0123456789')).toBeNull();
    expect(phoneIn('buy data')).toBeNull();
    expect(groupPhoneNumber('08032144471')).toBe('0803 214 4471');
  });
});

describe('data plans', () => {
  it('reads the size off the words', () => {
    expect(dataIn('2gb for mum')).toBe(2);
    expect(dataIn('1.5 GB')).toBe(1.5);
    expect(dataIn('500mb')).toBe(0.5);
    expect(dataIn('2k data')).toBeNull();
  });
  it('picks the plan the words mean', () => {
    expect(planFor('MTN', { gb: 5 })?.price).toBe(2_500);
    expect(planName(planFor('MTN', { gb: 5 })!)).toBe('5GB for 30 days');
    expect(planFor('MTN', { amount: 2_000 })?.gb).toBe(2);
    /* near the usual, the usual */
    expect(planFor('MTN', { amount: 2_200, usual: 'mtn-5gb-30d' })?.gb).toBe(5);
    /* otherwise the most the amount buys */
    expect(planFor('Airtel', { amount: 3_000 })?.gb).toBe(4);
    expect(planFor('Glo', { usual: 'mtn-5gb-30d' })).toBeNull();
    expect(planFor('MTN', {})).toBeNull();
  });
  it('offers three plans, the usual among them, cheapest first', () => {
    const likely = likelyPlans('MTN', { usual: 'mtn-5gb-30d' });
    expect(likely).toHaveLength(3);
    expect(likely.map(p => p.price)).toEqual([...likely.map(p => p.price)].sort((a, b) => a - b));
    expect(likely.some(p => p.id === 'mtn-5gb-30d')).toBe(true);
    expect(likelyPlans('Airtel', { gb: 10 }).map(p => p.gb)).toEqual([2, 4, 10]);
  });
});

describe('electricity', () => {
  it('knows the companies by their names', () => {
    expect(discoIn('pay my JED bill')?.id).toBe('jos');
    expect(discoIn('ikeja electric')?.id).toBe('ikeja');
    expect(discoIn('the PHED meter')?.id).toBe('portharcourt');
    expect(discoIn('top up my light')).toBeNull();
    expect(discoIn('nepa bill')).toBeNull();
  });
  it('reads the kind and the meter number', () => {
    expect(meterKindIn('prepaid meter')).toBe('prepaid');
    expect(meterKindIn('a post-paid account')).toBe('postpaid');
    expect(meterKindIn('the meter')).toBeNull();
    expect(meterIn('pay 5k on 4457 8891')).toBe('44578891');
    expect(meterIn('meter 54150011234')).toBe('54150011234');
    expect(meterIn('data for 0803 214 4471')).toBeNull();
    expect(meterProblem('4457')).toBe('A meter number has at least eight digits');
    expect(meterProblem('08032144471')).toBe('That is a phone number');
    expect(meterProblem('44578891')).toBeNull();
    expect(unitsFor(8_000)).toBe(38);
  });
  it('looks a meter up, the same answer every time, and none for a dud', async () => {
    const meters = new MockMeters(0);
    expect(await meters.lookup('ikeja', 'prepaid', '4457 8891')).toEqual({ name: 'Ibrahim Musa', address: '14 Bode Thomas' });
    const a = await meters.lookup('jos', 'prepaid', '12345678901');
    expect(a?.name).toBeTruthy();
    expect(a?.address).toContain('Jos');
    expect(await meters.lookup('jos', 'prepaid', '12345678901')).toEqual(a);
    expect(await meters.lookup('jos', 'prepaid', '12345670000')).toBeNull();
    expect(await meters.lookup('jos', 'prepaid', '123')).toBeNull();
  });
});

describe('what has been paid before', () => {
  const rows: Paid[] = [
    { name: 'Sarah Adeyemi', detail: 'Still on its way', amount: -20000, status: 'pending', kind: 'transfer', time: '14:22', day: 'today' },
    { name: 'John Doe', detail: 'Grocery Shopping', amount: -8000, status: 'done', kind: 'transfer', time: '10:45', day: 'today' },
    { name: 'Sarah Adeyemi', detail: 'Flat deposit', amount: -50000, status: 'done', kind: 'transfer', time: '09:14', day: 'today' },
    {
      name: 'MTN',
      detail: '5GB for Mum',
      amount: -2500,
      status: 'done',
      kind: 'airtime',
      time: '08:02',
      day: 'today',
      target: { kind: 'line', number: '08032144471', network: 'MTN', label: 'Mum', plan: 'mtn-5gb-30d' },
    },
    { name: 'Sarah Adeyemi', detail: 'Rent part payment', amount: -20000, status: 'done', kind: 'transfer', time: '07:55', day: 'today' },
    { name: 'Pagrin Limited', detail: 'August salary', amount: 640000, status: 'done', kind: 'in', time: '16:40', day: 'yesterday' },
    {
      name: 'Ikeja Electric',
      detail: 'Meter 4457 8891',
      amount: -8000,
      status: 'done',
      kind: 'bill',
      time: '11:22',
      day: 'yesterday',
      target: { kind: 'meter', disco: 'ikeja', meterKind: 'prepaid', meter: '44578891', name: 'Ibrahim Musa' },
    },
  ];
  const saved = beneficiariesOf(rows, DEMO_SAVED, PEOPLE, ownLine('08030000001'));
  it('counts the people paid, newest first, only what went through', () => {
    expect(saved.people.map(p => [p.name, p.times, p.when])).toEqual([
      ['John Doe', 1, 'Today 10:45'],
      ['Sarah Adeyemi', 2, 'Today 09:14'],
    ]);
    /* a fresh day still knows the people paid before it */
    expect(beneficiariesOf([], DEMO_SAVED, PEOPLE, null).people.map(p => [p.name, p.times])).toEqual([
      ['Sarah Adeyemi', 0],
      ['John Doe', 0],
    ]);
    expect(saved.people[1]?.bank).toBe('GTBank');
  });
  it('puts the own line first, then the lines topped up, with what they had last', () => {
    expect(saved.lines[0]).toMatchObject({ label: 'Your line', number: '08030000001', network: 'MTN', own: true });
    expect(saved.lines[1]).toMatchObject({ label: 'Mum', times: 7, when: 'Today 08:02', plan: 'mtn-5gb-30d' });
    expect(saved.lines.map(l => l.label)).toEqual(['Your line', 'Mum', 'Dad', 'Kemi', 'Bola', 'Tunde']);
  });
  it('keeps the meters paid with the usual amount', () => {
    expect(saved.meters[0]).toMatchObject({ label: 'Home', disco: 'ikeja', meter: '44578891', name: 'Ibrahim Musa', times: 10, amount: 8_000, when: 'Yesterday 11:22' });
    expect(saved.meters[1]?.label).toBe("Mum's flat");
  });
  it('knows which line or meter the words mean', () => {
    expect(savedLineIn('2gb for mum', saved.lines)?.label).toBe('Mum');
    expect(savedLineIn("mum's line", saved.lines)?.label).toBe('Mum');
    expect(savedLineIn('data for me', saved.lines)?.own).toBe(true);
    expect(savedLineIn('airtime for 0805 331 0921', saved.lines)?.label).toBe('Dad');
    expect(savedLineIn('data for 0812 345 6789', saved.lines)).toBeNull();
    expect(savedLineIn('data for my sister', saved.lines)).toBeNull();
    expect(savedMeterIn('pay my light bill', saved.meters)?.label).toBe('Home');
    expect(savedMeterIn("mum's flat", saved.meters)?.label).toBe("Mum's flat");
    expect(savedMeterIn('the eko bill', saved.meters)?.disco).toBe('eko');
    expect(savedMeterIn('pay a bill', saved.meters)).toBeNull();
    expect(savedMeterIn('pay 5k on 12345678901', saved.meters)).toBeNull();
  });
});

describe('the airtime slider', () => {
  it('spaces its stops evenly and comes back to whole hundreds', async () => {
    const { airtimeAt, airtimeFrom, AIRTIME } = await import('@/services/nigeria');
    expect(airtimeAt(100)).toBe(0);
    expect(airtimeAt(10_000)).toBe(1);
    expect(airtimeAt(1_000)).toBeCloseTo(0.5);
    expect(airtimeFrom(0.5)).toBe(1_000);
    expect(airtimeFrom(0)).toBe(AIRTIME.min);
    expect(airtimeFrom(1)).toBe(AIRTIME.max);
    expect(airtimeFrom(airtimeAt(2_300))).toBe(2_300);
    expect(airtimeFrom(0.99) % 100).toBe(0);
  });
});
