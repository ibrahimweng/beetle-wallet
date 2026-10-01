/* Being paid and asking: the code that is drawn, read back; a message read
   as a request; the words that open a page; what Beetle says. */
import { describe, expect, it, vi } from 'vitest';
import jsQR from 'jsqr';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { codeFor, eyeAt, modulesPath, payload, rasterise } from '@/features/receive/qr';
import { MESSAGE_READING, MESSAGE_TEXT, MockReader, SAMPLE_TEXT, requestIn } from '@/services/reader';
import { PAYERS, noteIn, payerIn } from '@/features/request/people';
import { isRequest, isWays, pageFor } from '@/features/request/intent';
import { requestDraft } from '@/features/request/hand';
import { requestFrom, requestReference } from '@/features/request/requests';
import { lineFor, shortMoney } from '@/features/request/words';
import { SAMPLE_ARRIVAL, arrivalChat } from '@/features/receive/arrival';

describe('the code', () => {
  const words = payload('0102445788', 'Ibrahim Musa');
  it('says where to pay and whom', () => {
    expect(words).toBe('beetle://pay?to=0102445788&name=Ibrahim%20Musa');
  });
  it('is a real QR: a reader gets the words back off the modules', () => {
    const code = codeFor(words);
    expect(code.size).toBeGreaterThanOrEqual(21);
    const { data, width, height } = rasterise(code, 4);
    expect(jsQR(data, width, height)?.data).toBe(words);
  });
  it('draws every dark module outside the eyes as one path, and knows the eyes', () => {
    const code = codeFor(words);
    const d = modulesPath(code, 5);
    expect(d.startsWith('M')).toBe(true);
    expect(eyeAt(code, 0, 0)).toBe('tl');
    expect(eyeAt(code, 0, code.size - 1)).toBe('tr');
    expect(eyeAt(code, code.size - 1, 0)).toBe('bl');
    expect(eyeAt(code, 10, 10)).toBeNull();
    /* the eyes' dark modules are not in the path: the top-left eye's corner would begin the path at 0 0 */
    expect(d.startsWith('M0 0h')).toBe(false);
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
    expect(pageFor('how do I get paid')).toBe('/ways');
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
    expect(lineFor(PAYERS[0]!, 0)).toBe('How much should I ask Musa for? Tap the amount.');
    expect(lineFor(null, 20_000)).toContain('Who should I ask for ₦20,000?');
    expect(lineFor(null, 0)).toContain('Who should I ask, and for how much?');
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
