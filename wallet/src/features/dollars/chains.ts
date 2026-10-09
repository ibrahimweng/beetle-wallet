/* Stablecoins (Round 33, the owner's word: start testing them). The dollars
   held in Beetle come in and go out as USDC or USDT, a digital dollar worth
   one dollar, on the network the other side uses. This build runs on test
   networks: every address here is a test address, and no real coin moves.

   What is checked here is what keeps money from being lost: an address is
   the right shape for the network picked, its own check letters add up
   (EIP-55 on Base and Ethereum, Base58Check on Tron, 32 bytes on Solana),
   and an address for another network is named as such rather than sent to. */
import { keccak_256 } from '@noble/hashes/sha3';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

import type { CoinLine } from '../../services/agent';

export type Coin = CoinLine['coin'];
export type NetworkId = CoinLine['network'];
type Family = 'evm' | 'solana' | 'tron';

export type Network = {
  id: NetworkId;
  name: string;
  family: Family;
  /** what the network charges to send out, in dollars, taken from what is sent */
  fee: number;
  /** about how long a coin takes to arrive */
  minutes: number;
  coins: Coin[];
};

export const COINS: { id: Coin; name: string }[] = [
  { id: 'USDC', name: 'USD Coin, by Circle' },
  { id: 'USDT', name: 'Tether' },
];

/** The networks, cheapest first. */
export const NETWORKS: Network[] = [
  { id: 'base', name: 'Base', family: 'evm', fee: 0.01, minutes: 1, coins: ['USDC'] },
  { id: 'solana', name: 'Solana', family: 'solana', fee: 0.01, minutes: 1, coins: ['USDC', 'USDT'] },
  { id: 'tron', name: 'Tron (TRC-20)', family: 'tron', fee: 1, minutes: 3, coins: ['USDT'] },
  { id: 'ethereum', name: 'Ethereum (ERC-20)', family: 'evm', fee: 2.5, minutes: 5, coins: ['USDC', 'USDT'] },
];

const BY_ID = Object.fromEntries(NETWORKS.map(n => [n.id, n])) as Record<NetworkId, Network>;
export const networkOf = (id: NetworkId): Network => BY_ID[id];
export const networksFor = (coin: Coin) => NETWORKS.filter(n => n.coins.includes(coin));
export const isNetwork = (s: unknown): s is NetworkId => typeof s === 'string' && NETWORKS.some(n => n.id === s);
export const isCoin = (s: unknown): s is Coin => s === 'USDC' || s === 'USDT';

/** The least that can be sent out, and the least worth sending in. */
export const LEAST_OUT = 5;
export const LEAST_IN = 1;

/** "about a minute", "about 5 minutes" */
export const arrivesIn = (n: Network) => (n.minutes <= 1 ? 'about a minute' : `about ${n.minutes} minutes`);
/** "$0.01", "$2.50": the network's fee the way the pages print dollars. */
export const feeLine = (n: Network) => `$${n.fee.toFixed(2)}`;

/* ---- Base58, the alphabet Solana and Tron write addresses in ---- */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58(bytes: Uint8Array): string {
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i]! << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]!];
  return out;
}

export function unbase58(text: string): Uint8Array | null {
  const bytes: number[] = [];
  for (const ch of text) {
    let carry = ALPHABET.indexOf(ch);
    if (carry < 0) return null;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i]! * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of text) {
    if (ch !== '1') break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}

/* ---- The check letters of each network ---- */

/** An EVM address with EIP-55's capitals: each letter capital where the address's own hash says so. */
export function checksummed(address: string): string {
  const lower = address.toLowerCase().replace(/^0x/, '');
  const hash = bytesToHex(keccak_256(utf8ToBytes(lower)));
  let out = '0x';
  for (let i = 0; i < lower.length; i++) out += parseInt(hash[i]!, 16) >= 8 ? lower[i]!.toUpperCase() : lower[i];
  return out;
}

const doubleSha = (b: Uint8Array) => sha256(sha256(b));

/** A Tron address: 0x41 and twenty bytes, with four check bytes after, in Base58. */
function tronFrom(twenty: Uint8Array): string {
  const payload = new Uint8Array(21);
  payload[0] = 0x41;
  payload.set(twenty, 1);
  const check = doubleSha(payload).slice(0, 4);
  const all = new Uint8Array(25);
  all.set(payload);
  all.set(check, 21);
  return base58(all);
}

function tronOk(text: string): boolean {
  const b = unbase58(text);
  if (!b || b.length !== 25 || b[0] !== 0x41) return false;
  const check = doubleSha(b.slice(0, 21)).slice(0, 4);
  return check.every((x, i) => x === b[21 + i]);
}

/** Which network's shape an address has, whatever was picked. */
export function familyOf(text: string): Family | null {
  if (/^0x[0-9a-fA-F]{40}$/.test(text)) return 'evm';
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(text)) return 'tron';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text) && unbase58(text)?.length === 32) return 'solana';
  return null;
}

const FAMILY_NAME: Record<Family, string> = { evm: 'a Base or Ethereum', solana: 'a Solana', tron: 'a Tron' };

export type AddressCheck = { ok: true; address: string } | { ok: false; why: string };

/** Whether an address can be sent to on a network: its shape, its check letters, and that it is not this account's own. */
export function checkAddress(network: NetworkId, typed: string, own?: string): AddressCheck {
  const text = typed.trim();
  if (!text) return { ok: false, why: '' };
  const net = networkOf(network);
  const family = familyOf(text);
  if (!family) return { ok: false, why: `That is not ${FAMILY_NAME[net.family]} address. Copy it again from where it came from.` };
  if (family !== net.family) return { ok: false, why: `That is ${FAMILY_NAME[family]} address. Pick its network, or check the address.` };
  if (family === 'evm') {
    const body = text.slice(2);
    const mixed = body !== body.toLowerCase() && body !== body.toUpperCase();
    if (mixed && checksummed(text) !== text) return { ok: false, why: 'One letter in that address is wrong. Copy it again from where it came from.' };
  }
  if (family === 'tron' && !tronOk(text)) return { ok: false, why: 'One letter in that address is wrong. Copy it again from where it came from.' };
  if (own && text.toLowerCase() === own.toLowerCase()) return { ok: false, why: 'That is your own Beetle address. Send to somebody else’s.' };
  return { ok: true, address: family === 'evm' ? checksummed(text) : text };
}

/** This account's test address on a network: the same every time for the same account, and nobody else's. */
export function testAddressFor(accountNumber: string, network: NetworkId): string {
  const net = networkOf(network);
  /* Base and Ethereum share one address, as they do for real */
  const seed = sha256(utf8ToBytes(`beetle-test:${net.family}:${accountNumber}`));
  if (net.family === 'solana') return base58(seed);
  const twenty = keccak_256(seed).slice(-20);
  if (net.family === 'tron') return tronFrom(twenty);
  return checksummed('0x' + bytesToHex(twenty));
}

/** An address cut down to read aloud: 0x8f3A…91cE */
export const shortAddress = (a: string) => (a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

/** What leaves and what arrives when coins are sent out: the network's fee comes out of the amount. */
export function sendOut(usd: number, network: NetworkId) {
  const fee = networkOf(network).fee;
  const arrives = Math.max(0, Math.round((usd - fee) * 100) / 100);
  return { fee, arrives };
}

/** A test network's record of a transfer, written the way that network writes one: 0x and 64 hex on Base and Ethereum,
    64 hex on Tron, Base58 of 64 bytes on Solana. Nothing to look up: no real chain carries it. */
export function testHash(network: NetworkId, seed = `${Date.now()}:${Math.random()}`): string {
  const a = sha256(utf8ToBytes(`a:${seed}`));
  const family = networkOf(network).family;
  if (family === 'solana') {
    const both = new Uint8Array(64);
    both.set(a);
    both.set(sha256(utf8ToBytes(`b:${seed}`)), 32);
    return base58(both);
  }
  return (family === 'evm' ? '0x' : '') + bytesToHex(a);
}

/** The test wallet that sends this build's test coins in. */
export const TEST_WALLET = 'a test wallet';

/** The coins by their contracts and mints, lower case, for reading payment links. */
const TOKENS: Record<string, Coin> = Object.fromEntries(
  (
    [
      ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC'], // Ethereum
      ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'USDC'], // Base
      ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT'], // Ethereum
      ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'], // Solana
      ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT'], // Solana
    ] as const
  ).map(([k, coin]) => [k.toLowerCase(), coin]),
);

/** Where a QR code leads, read off it (Round 33: Scan reads codes): a coin address with the network its link names or its
    own shape says, or null for anything else. A payment link (EIP-681) to a token's transfer gives the address paid. */
export function codeTarget(data: string): { network: NetworkId; coin: Coin; address: string } | null {
  let text = data.trim();
  let hinted: NetworkId | null = null;
  const scheme = text.match(/^([a-z]+):(?:\/\/)?(.+)$/i);
  if (scheme) {
    const name = scheme[1]!.toLowerCase();
    text = scheme[2]!;
    hinted = name === 'solana' ? 'solana' : name === 'tron' ? 'tron' : name === 'ethereum' ? 'ethereum' : name === 'base' ? 'base' : null;
    /* ethereum:<token>@8453/transfer?address=<who>&uint256=… — the chain by its number, the address the one paid */
    const chain = text.match(/@(\d+)/)?.[1];
    if (chain === '8453') hinted = 'base';
    if (chain === '1') hinted = 'ethereum';
    const paid = text.match(/[?&]address=([^&]+)/)?.[1];
    if (paid) text = paid;
  }
  text = (text.split(/[?@/&]/)[0] ?? '').trim();
  const family = familyOf(text);
  if (!family) return null;
  /* the coin the link names, by its token contract or its Solana mint, where it names one (the analysis after Round 34:
     a USDT link was filled in as USDC) */
  const named = TOKENS[(data.match(/^[a-z]+:(?:\/\/)?(0x[0-9a-fA-F]{40})@/)?.[1] ?? data.match(/[?&]spl-token=([^&]+)/)?.[1] ?? '').toLowerCase()];
  if (family === 'tron') return { network: 'tron', coin: 'USDT', address: text };
  if (family === 'solana') return { network: 'solana', coin: named ?? 'USDC', address: text };
  const network = hinted === 'ethereum' ? 'ethereum' : 'base';
  /* Tether is not on Base: a USDT link is Ethereum's */
  return { network: named === 'USDT' ? 'ethereum' : network, coin: named ?? 'USDC', address: checksummed(text) };
}
