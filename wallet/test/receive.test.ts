/* Being paid and asking: the details handed out; a message read as a
   request; the words that open a page; what Beetle says. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { detailsOf } from '@/features/receive/details';
import { MESSAGE_READING, MESSAGE_TEXT, MockReader, SAMPLE_TEXT, requestIn } from '@/services/reader';
import { PAYERS, noteIn, payerIn } from '@/features/request/people';
import { isRequest, isWays, pageFor } from '@/features/request/intent';
import { requestDraft } from '@/features/request/hand';
import { requestFrom, requestReference } from '@/features/request/requests';
import { lineFor, shortMoney } from '@/features/request/words';
import { SAMPLE_ARRIVAL, arrivalChat } from '@/features/receive/arrival';

describe('the details handed out', () => {
  const account = { firstName: 'Ibrahim', lastName: 'Musa', accountNumber: '0102445788' };
  it('are the number at Beetle and the tag, the same on the sheet and the card', () => {
    const d = detailsOf(account);
    expect(d).toMatchObject({ name: 'Ibrahim Musa', number: '0102 4457 88', tag: 'ibrahim' });
    expect(d.all).toBe('Ibrahim Musa\nBeetle · 0102445788\nOr on Beetle: $ibrahim');
  });
  it('take a tag the account was given', () => {
    expect(detailsOf(account, 'ibro').all.endsWith('$ibro')).toBe(true);
  });
});

describe('a message read as a request', () => {
  it('reads the sample message: who, the figure, what for, and by when', () => {
    expect(requestIn(MESSAGE_TEXT)).toEqual({ from: 'Musa D.', amount: 20_000, note: 'Rent balance', when: 'Friday' });
  });
  it('does not read a slip as one', () => {
    expect(requestIn(SAMPLE_TEXT)).toBeNull();
  });
  it('needs a figure', () => {
    expect(requestIn('Sarah\nsend me your account number please')).toBeNull();
    expect(requestIn('Sarah\nsend me your account number for the ₦5,000')?.amount).toBe(5_000);
  });
  it('comes back from the stand-in for a photo named as the message', async () => {
    const r = await new MockReader(0).read('file:///sample-message.png');
    expect(r.request).toEqual(MESSAGE_READING.request);
    expect((await new MockReader(0).read('file:///sample-slip.png')).request).toBeUndefined();
  });
});

describe('who can be asked', () => {
  it('finds a payer by first name, last name or a short form', () => {
    expect(payerIn('ask musa for 20k')?.name).toBe('Musa Danjuma');
    expect(payerIn('Musa D.')?.name).toBe('Musa Danjuma');
    expect(payerIn('request 5k from adeyemi')?.name).toBe('Sarah Adeyemi');
    expect(payerIn('ask john for 5k')).toBeNull();
  });
  it('reads what it is for off the end of the words', () => {
    expect(noteIn('ask musa for 20k for the rent balance')).toBe('Rent balance');
    expect(noteIn('ask musa for 20k')).toBeNull();
  });
  it('knows the payers by their lines', () => {
    expect(PAYERS[0]).toMatchObject({ name: 'Musa Danjuma', phone: '08032214471', pronoun: 'he' });
  });
});

describe('words that are a page of their own', () => {
  it('knows a request from a question for the chat', () => {
    expect(isRequest('ask musa for 20k')).toBe(true);
    expect(isRequest('Sarah owes me 5k')).toBe(true);
    expect(isRequest('send 20k to Sarah')).toBe(false);
    expect(isWays('how do I get paid')).toBe(true);
    expect(isWays('what is my account number')).toBe(true);
    expect(isWays('top up my light')).toBe(false);
  });
  it('opens the request with what the words carry', () => {
    expect(pageFor('ask musa for 20k for the rent balance')).toBe('/request');
    const d = requestDraft.take();
    expect(d?.who?.name).toBe('Musa Danjuma');
    expect(d?.amount).toBe(20_000);
    expect(d?.note).toBe('Rent balance');
    expect(d?.said).toBe('ask musa for 20k for the rent balance');
    /* how to be paid is the Receive card in the chat, not a page */
    expect(pageFor('how do I get paid')).toBeNull();
    expect(pageFor('send 20k to Sarah')).toBeNull();
  });
});

describe('a request, and what Beetle says', () => {
  it('gets a reference the way the frame prints one, and lapses in a week', () => {
    expect(requestReference()).toMatch(/^REQ-\d{5}-\d{4}$/);
    const r = requestFrom(PAYERS[0]!, 20_000, 'Rent balance', 'photo', new Date('2026-09-30T09:41:00'));
    expect(r).toMatchObject({ who: { name: 'Musa Danjuma', phone: '08032214471' }, amount: 20_000, note: 'Rent balance', expires: 'In 7 days', time: '09:41', read: 'photo' });
  });
  it('says who it found, or asks for what is missing', () => {
    expect(lineFor(PAYERS[0]!, 20_000)).toBe('Musa Danjuma, the line ending 4471. He is the only Musa who has ever paid you.');
    expect(lineFor(PAYERS[1]!, 5_000)).toContain('She is the only Sarah');
    expect(lineFor(PAYERS[0]!, 0)).toBe('Tap Amount to say how much to ask Musa for.');
    expect(lineFor(null, 20_000)).toContain('Tap Person to pick someone');
    expect(lineFor(null, 0)).toBe('Tap Person and Amount to fill them in.');
  });
  it('writes money the way a message does', () => {
    expect(shortMoney(20_000)).toBe('20k');
    expect(shortMoney(2_500)).toBe('₦2,500');
    expect(shortMoney(500)).toBe('₦500');
  });
});

describe('money arriving', () => {
  it("starts a chat that carries the receipt's card when the line is known", () => {
    const chat = arrivalChat(SAMPLE_ARRIVAL, 645_320, 'row1', '09:41');
    const card = chat.turns.find(t => t.who === 'beetle' && t.block.kind === 'receipt');
    expect(card && card.who === 'beetle' && card.block.kind === 'receipt' ? card.block.card : null).toMatchObject({ rowId: 'row1', amount: '₦50,000', line: 'From Sarah Adeyemi', status: 'Received' });
    expect(arrivalChat(SAMPLE_ARRIVAL, 645_320).turns).toHaveLength(1);
  });
});
