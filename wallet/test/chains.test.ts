/* Round 33: the stablecoin addresses. Each network's own check letters, an
   address for one network named as such on another, and the test addresses
   this build gives an account. Real addresses from each network's docs. */
import { describe, expect, it } from 'vitest';
import { base58, checkAddress, checksummed, codeTarget, familyOf, networksFor, sendOut, shortAddress, testAddressFor, unbase58 } from '../src/features/dollars/chains';

/* EIP-55's own examples, Tether's contract on Tron, and Circle's USDC mint on Solana */
const EVM = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const SOL = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

describe('stablecoin addresses', () => {
  it('writes and reads Base58 both ways', () => {
    const bytes = Uint8Array.from([0, 0, 1, 2, 3, 250, 251, 252]);
    expect(unbase58(base58(bytes))).toEqual(bytes);
    expect(unbase58('0OIl')).toBeNull();
  });
  it('puts EIP-55’s capitals where the hash says', () => {
    expect(checksummed(EVM.toLowerCase())).toBe(EVM);
    expect(checksummed('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359')).toBe('0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359');
  });
  it('knows each network’s shape', () => {
    expect([familyOf(EVM), familyOf(TRON), familyOf(SOL), familyOf('hello')]).toEqual(['evm', 'tron', 'solana', null]);
  });
  it('takes a good address on its own network, all lower case too', () => {
    expect(checkAddress('base', EVM)).toEqual({ ok: true, address: EVM });
    expect(checkAddress('ethereum', EVM.toLowerCase())).toEqual({ ok: true, address: EVM });
    expect(checkAddress('tron', ` ${TRON} `)).toEqual({ ok: true, address: TRON });
    expect(checkAddress('solana', SOL)).toEqual({ ok: true, address: SOL });
  });
  it('names an address for another network rather than sending to it', () => {
    expect(checkAddress('tron', EVM)).toEqual({ ok: false, why: 'That is a Base or Ethereum address. Pick its network, or check the address.' });
    expect(checkAddress('base', TRON)).toMatchObject({ ok: false, why: expect.stringContaining('a Tron address') });
    expect(checkAddress('solana', 'not an address')).toMatchObject({ ok: false, why: expect.stringContaining('not a Solana address') });
  });
  it('catches one letter wrong', () => {
    const typo = EVM.slice(0, -1) + 'e';
    expect(checkAddress('base', typo)).toMatchObject({ ok: false, why: expect.stringContaining('One letter') });
    const tronTypo = TRON.slice(0, -1) + (TRON.endsWith('t') ? 'u' : 't');
    expect(checkAddress('tron', tronTypo)).toMatchObject({ ok: false, why: expect.stringContaining('One letter') });
  });
  it('will not send to the account’s own address, and says nothing for nothing typed', () => {
    const own = testAddressFor('0123456789', 'base');
    expect(checkAddress('base', own.toLowerCase(), own)).toMatchObject({ ok: false, why: expect.stringContaining('your own') });
    expect(checkAddress('base', '   ')).toEqual({ ok: false, why: '' });
  });
  it('gives each account its own test address, valid on its network, the same each time', () => {
    for (const net of ['base', 'ethereum', 'solana', 'tron'] as const) {
      const a = testAddressFor('0123456789', net);
      expect(checkAddress(net, a)).toEqual({ ok: true, address: a });
      expect(testAddressFor('0123456789', net)).toBe(a);
      expect(testAddressFor('9876543210', net)).not.toBe(a);
    }
    expect(testAddressFor('0123456789', 'base')).toBe(testAddressFor('0123456789', 'ethereum'));
  });
  it('lists the networks a coin runs on, and takes the network’s fee from what is sent', () => {
    expect(networksFor('USDC').map(n => n.id)).toEqual(['base', 'solana', 'ethereum']);
    expect(networksFor('USDT').map(n => n.id)).toEqual(['solana', 'tron', 'ethereum']);
    expect(sendOut(100, 'tron')).toEqual({ fee: 1, arrives: 99 });
    expect(sendOut(0.5, 'ethereum')).toEqual({ fee: 2.5, arrives: 0 });
    expect(shortAddress(EVM)).toBe('0x5aAe…eAed');
  });
});

describe('what a QR code leads to', () => {
  it('reads a bare address, a payment link, and an EIP-681 token transfer', () => {
    expect(codeTarget(EVM.toLowerCase())).toEqual({ network: 'base', coin: 'USDC', address: EVM });
    expect(codeTarget(`ethereum:${EVM}`)).toEqual({ network: 'ethereum', coin: 'USDC', address: EVM });
    expect(codeTarget(`ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913@8453/transfer?address=${EVM}&uint256=1e6`)).toEqual({ network: 'base', coin: 'USDC', address: EVM });
    expect(codeTarget(`solana:${SOL}?amount=5&spl-token=x`)).toEqual({ network: 'solana', coin: 'USDC', address: SOL });
    expect(codeTarget(TRON)).toEqual({ network: 'tron', coin: 'USDT', address: TRON });
    expect(codeTarget('https://beetle.ng/pay/ibrahimmusa')).toBeNull();
    expect(codeTarget('0123456789')).toBeNull();
  });
});
