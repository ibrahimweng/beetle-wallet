/* The terms and the privacy notice (Round 32, the owner's word: aligned with
   the Nigeria Data Protection Act 2023 and the CBN's rules, so that nothing
   here can be held against Beetle). These are drafts in plain words for
   Beetle's lawyers to finish: every [bracket] is theirs to fill, and nothing
   here is final until they have. What the app itself does is built to match
   what these say: consent before the face scan, the BVN or NIN checked and
   not shown, offers off until switched on, and the rights under Privacy and
   your data in Settings. */

export type LegalDoc = 'terms' | 'privacy';

export type LegalSection = { head: string; body: string[] };

/** Said at the top of both, until counsel has signed them off. */
export const DRAFT = 'A draft for Beetle’s lawyers to finish. Every [bracket] is theirs to fill, and nothing here is final until they have.';

/** Who provides the account, as the app says it wherever it has to. */
export const PROVIDER_LINE = 'Beetle is a product of [company name], working with [partner bank], a bank licensed by the Central Bank of Nigeria. Deposits are insured by the NDIC up to its limit.';

export const PRIVACY: LegalSection[] = [
  {
    head: 'Who we are',
    body: [
      '[Company name], [registered address], RC [number], is the data controller for what you give Beetle. [Partner bank] holds your account and is a controller for what the law asks a bank to keep.',
    ],
  },
  {
    head: 'What we collect',
    body: [
      'Your mobile number and email, and the codes that check them.',
      'Your full name, date of birth and the BVN or NIN you choose, which we check with NIBSS or NIMC. If you use a photo of a NIN slip or a voter’s card, what is read off it, and your address and email from it.',
      'A face scan, once, to prove the BVN or NIN is yours. It is checked against the photo on the record and is not kept as a picture. Opening Beetle with your face or fingerprint uses your phone’s own check: Beetle never sees your face or your fingerprint.',
      'Which phones you use Beetle on, so a new one is asked to prove it is you.',
      'What you do with your money in Beetle, and what you ask it.',
    ],
  },
  {
    head: 'Why, and on what basis',
    body: [
      'To open and run your account: the contract between us.',
      'To know who you are and stop fraud and money laundering: what the law asks of a bank, under the CBN’s know-your-customer rules and the Money Laundering (Prevention and Prohibition) Act.',
      'To keep your account and your money safe: our legitimate interest, which never outweighs your rights.',
      'The face scan: your consent, asked for on its own before it happens.',
      'Offers and news: only if you switch them on in Settings. They are off until you do.',
    ],
  },
  {
    head: 'Who we share it with',
    body: [
      'NIBSS and NIMC, to check your BVN or NIN; [partner bank]; the payment networks that move your money; [identity check provider], for the face scan; and regulators, courts and the police when the law requires it.',
      'We never sell your data.',
    ],
  },
  {
    head: 'How long we keep it',
    body: ['For as long as your account is open, and your records of money moved for [five] years after it closes, as anti-money-laundering law requires [counsel to confirm]. Then it is deleted.'],
  },
  {
    head: 'Where it is kept',
    body: ['In Nigeria, or with [cloud provider] in [country] under the safeguards the Nigeria Data Protection Act requires for data sent abroad [counsel to confirm].'],
  },
  {
    head: 'Your rights',
    body: [
      'Under the Nigeria Data Protection Act 2023 you can ask what we hold about you and have a copy, have it corrected, have it deleted where the law lets us, object to or limit how it is used, move it elsewhere, and withdraw a consent at any time.',
      'Most of these are in Settings, under Privacy and your data. For the rest, write to our data protection officer at [DPO email].',
      'If you are not happy with our answer, you can complain to the Nigeria Data Protection Commission at ndpc.gov.ng.',
    ],
  },
  {
    head: 'How we keep it safe',
    body: [
      'Encrypted on our servers and on your phone. Your passcode and password are kept stretched, never as you typed them, and nobody at Beetle can read them. We will tell you, and the Commission, if your data is ever exposed, as the law requires.',
    ],
  },
  {
    head: 'Children',
    body: ['Beetle is for people 18 and over. A child’s account is opened with a parent, at [partner bank].'],
  },
];

export const TERMS: LegalSection[] = [
  {
    head: 'Who provides your account',
    body: [PROVIDER_LINE],
  },
  {
    head: 'Who can open one',
    body: [
      'Anyone 18 or over with a Nigerian mobile number and a BVN or NIN that is their own. What you can send and hold depends on how much of setting up you have finished, as the CBN’s tiers set out [counsel to confirm the limits].',
    ],
  },
  {
    head: 'Keeping it yours',
    body: [
      'Keep your passcode and password to yourself. Beetle will never ask for them by call, text or email.',
      'If you think somebody else has got in, freeze the account from Settings at once, or use This wasn’t me on the alert we send.',
    ],
  },
  {
    head: 'Fees',
    body: ['What a payment costs is shown before you confirm it, and nothing is taken that was not shown. [Fee schedule].'],
  },
  {
    head: 'When something goes wrong',
    body: [
      'Tell us from the receipt or in the chat, and we answer within [time]. If you are not satisfied, you can take it to the CBN’s Consumer Protection Department [counsel to confirm the route].',
    ],
  },
  {
    head: 'The law',
    body: ['These terms are governed by the laws of the Federal Republic of Nigeria. [Full terms of service].'],
  },
];

export const LEGAL: Record<LegalDoc, { title: string; sub: string; sections: LegalSection[] }> = {
  terms: { title: 'Terms', sub: 'What we agree when you open a Beetle account', sections: TERMS },
  privacy: { title: 'Privacy notice', sub: 'What Beetle keeps about you, why, and what you can do about it', sections: PRIVACY },
};
