/* Which company a name is (Round 38), from the words the app already holds: a bank's
   name, a network, a biller's or a disco's id or name, a merchant, a coin or
   a chain. The whole name first, then without its last word or two ("MTN
   data", "DStv Compact", "WAEC result checker"), so a line named for what was
   bought still finds whose it was. Nothing for a name it does not know, and
   the row keeps its glyph. Apart from the drawing (Logo.tsx), so the tests
   and the lines' own rule can ask without a screen. */
import type { LogoName } from './logos';

const NAMES: Record<string, LogoName> = {
  /* banks */
  access: 'access',
  accessbank: 'access',
  ecobank: 'ecobank',
  fidelity: 'fidelity',
  fidelitybank: 'fidelity',
  firstbank: 'firstbank',
  firstbankofnigeria: 'firstbank',
  fcmb: 'fcmb',
  firstcitymonumentbank: 'fcmb',
  gtbank: 'gtbank',
  gtco: 'gtbank',
  guarantytrust: 'gtbank',
  guarantytrustbank: 'gtbank',
  heritage: 'heritage',
  heritagebank: 'heritage',
  keystone: 'keystone',
  keystonebank: 'keystone',
  kuda: 'kuda',
  kudabank: 'kuda',
  moniepoint: 'moniepoint',
  opay: 'opay',
  palmpay: 'palmpay',
  polaris: 'polaris',
  polarisbank: 'polaris',
  providus: 'providus',
  providusbank: 'providus',
  providusunity: 'providus',
  /* Unity Bank is one bank with Providus now, and wears its mark */
  unity: 'providus',
  unitybank: 'providus',
  stanbic: 'stanbic',
  stanbicibtc: 'stanbic',
  stanbicibtcbank: 'stanbic',
  sterling: 'sterling',
  sterlingbank: 'sterling',
  uba: 'uba',
  unitedbankforafrica: 'uba',
  union: 'union',
  unionbank: 'union',
  wema: 'wema',
  wemabank: 'wema',
  alat: 'wema',
  zenith: 'zenith',
  zenithbank: 'zenith',
  beetle: 'beetle',
  /* networks; 9mobile is T2 now, and wears its mark */
  mtn: 'mtn',
  airtel: 'airtel',
  glo: 'glo',
  globacom: 'glo',
  '9mobile': 't2',
  t2: 't2',
  /* billers */
  dstv: 'dstv',
  showmax: 'showmax',
  spectranet: 'spectranet',
  lawma: 'lawma',
  waec: 'waec',
  bet9ja: 'bet9ja',
  /* the electricity companies, by id, short name and name */
  ikeja: 'ikeja',
  ikejaelectric: 'ikeja',
  eko: 'eko',
  ekedc: 'eko',
  ekoelectric: 'eko',
  abuja: 'abuja',
  aedc: 'abuja',
  jos: 'jos',
  jed: 'jos',
  kano: 'kano',
  kedco: 'kano',
  ibadan: 'ibadan',
  ibedc: 'ibadan',
  enugu: 'enugu',
  eedc: 'enugu',
  portharcourt: 'portharcourt',
  phed: 'portharcourt',
  benin: 'benin',
  bedc: 'benin',
  kaduna: 'kaduna',
  kaedco: 'kaduna',
  yola: 'yola',
  yedc: 'yola',
  /* merchants and others */
  netflix: 'netflix',
  spotify: 'spotify',
  apple: 'apple',
  googleplay: 'googleplay',
  google: 'google',
  whatsapp: 'whatsapp',
  mastercard: 'mastercard',
  /* coins and chains */
  usdc: 'usdc',
  usdcoin: 'usdc',
  usdt: 'usdt',
  tether: 'usdt',
  tetherusd: 'usdt',
  pyusd: 'pyusd',
  paypalusd: 'pyusd',
  solana: 'solana',
  base: 'base',
  tron: 'tron',
  trontrc20: 'tron',
  ethereum: 'ethereum',
  ethereumerc20: 'ethereum',
};

const key = (words: string[]) => words.join('').toLowerCase();

export function logoOf(name: string | null | undefined): LogoName | undefined {
  if (!name) return undefined;
  const words = name
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  for (let drop = 0; drop <= 2 && words.length - drop > 0; drop++) {
    const hit = NAMES[key(words.slice(0, words.length - drop))];
    if (hit) return hit;
  }
  return undefined;
}
