/* What the lab lists: every feature, and inside a feature every place worth
   opening on its own, with the state the app has to be in for that place to
   make sense. A feature is a folder under src/features; a place is what the
   folder's screens show once the way there has been walked. The lab walks it
   for you, so a step deep in the way in is one tap away. */
import type { Progress } from '../features/onboarding/machine';
import type { Stage } from '../features/onboarding/stages';
import type { IconName } from '../icons';
import { accountNumberFor, DEMO_ACCOUNT, DEMO_PHONE, type IdentityRecord, type Session } from '../services';

export type Seed = { progress: Progress; session: Session | null };

export type Place = {
  id: string;
  icon: IconName;
  title: string;
  /** what is on the screen there, in a few words */
  sub: string;
  /** where the app goes, and the state to leave for it */
  href: string;
  seed: Seed;
  /** things the phone remembers that this place wants forgotten first */
  forget?: string[];
};

export type Feature = { id: string; title: string; folder: string; sub: string; places: Place[] };

/* The account the lab opens the way in and home with, when one is needed:
   the number the browser walk uses, and the record the design's own number
   comes back as. */
export const LAB_PHONE = '08123456789';
const RECORD: IdentityRecord = {
  firstName: 'Ibrahim',
  lastName: 'Musa',
  recordName: 'MUSA IBRAHIM',
  born: '1996-06-14',
  birthYear: 1996,
};
const LAB_NUMBER = '12345678900';
/** a password as the way in keeps it, stretched; the lab's own two open everything all the same */
const KEPT = { v: 2 as const, salt: 'lab', rounds: 1000, hash: 'lab' };

const done = {
  begun: { via: 'phone', phone: LAB_PHONE } satisfies Progress,
  number: { via: 'phone', phone: LAB_PHONE, phoneVerified: true } satisfies Progress,
  /* the details typed, as the design's own record has them */
  typed: { via: 'phone', phone: LAB_PHONE, phoneVerified: true, name: 'Ibrahim Musa', dob: '1996-06-14' } satisfies Progress,
  who: {
    via: 'phone',
    phone: LAB_PHONE,
    phoneVerified: true,
    name: 'Ibrahim Musa',
    dob: '1996-06-14',
    identity: { number: LAB_NUMBER, record: RECORD, from: 'bvn' },
  } satisfies Progress,
};

const account = (phone: string) => ({
  accountNumber: accountNumberFor(phone),
  phone,
  username: 'ibrahimmusa',
  idNumber: LAB_NUMBER,
  firstName: RECORD.firstName,
  lastName: RECORD.lastName,
  createdAt: '2026-09-01T09:00:00Z',
  /* the first day the frames draw: nothing on it yet, not the test money a new account opened in this build has */
  startsEmpty: true,
});
const sessionFor = (a: Session['account']): Session => ({ token: 'lab', account: a });

/** An address on Base, for the wrong-network page: EIP-55's own example, so its capitals check, and Send dollars names it as not Solana's. */
const COIN_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
/** somebody's Solana wallet, for sending dollars out to (Round 36) */
const SOL_ADDRESS = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

const none: Seed = { progress: {}, session: null };
/** The account just opened, on the ready screen: where finishing setting up starts from. */
const READY: Seed = { progress: { ...done.who, accountNumber: accountNumberFor(LAB_PHONE) }, session: sessionFor(account(LAB_PHONE)) };

/** A stage of the way in, with the way there walked. */
const stage = (id: Stage, icon: IconName, title: string, sub: string, seed: Seed = none, query = ''): Place => ({ id, icon, title, sub, href: `/way-in?stage=${id}${query}`, seed });
/** logging in and getting an account back are for the demo account */
const DEMO = `&phone=${DEMO_PHONE}`;

export const WAY_IN: Feature = {
  id: 'way-in',
  title: 'The way in',
  folder: 'src/features/onboarding',
  sub: 'One screen from the welcome to the account being ready, logging in, and getting an account back.',
  places: [
    stage('welcome', 'mark', 'Welcome', 'The coin turning on the dark, Sign up and Log in'),
    stage('number', 'phone-filled', 'Enter mobile number', 'Eleven digits on the keypad, the email instead, Google and Apple'),
    stage('email', 'mail-filled', 'Enter email', 'The email instead of the number'),
    stage('provider', 'mail-filled', 'Continue with Google', 'The stand-in for Google’s own sheet: a name and a checked email', none, '&provider=google'),
    stage('code', 'phone-filled', 'OTP verification', 'The code from the text, and the half minute before another', { progress: done.begun, session: null }),
    stage('details', 'person-filled', 'Your details', 'The full name and the date of birth, typed as they are on the BVN or NIN', { progress: done.number, session: null }),
    stage('bvn', 'id-filled', 'BVN number', 'BVN or NIN, picked, held to the details typed', { progress: done.typed, session: null }),
    stage('document', 'camera-filled', 'NIN slip or voter’s card', 'A photo of either, held to the details typed', { progress: done.typed, session: null }),
    stage('nomatch', 'warn-filled', 'Nothing matched', 'The details and the number do not belong together, said without saying why', { progress: done.typed, session: null }),
    stage('password', 'lock-filled', 'Password', 'Letters and a number, eight or more, the rules ticking', { progress: done.who, session: null }),
    stage('passcode', 'lock-filled', 'Create passcode', 'Six digits, twice, with the weak ones refused', { progress: { ...done.who, password: KEPT }, session: null }),
    stage('finish', 'faceid-filled', 'Face scan and username', 'The yes to the scan, the face, the $tag and the passkey on one screen', {
      progress: { ...done.who, password: KEPT, passcode: KEPT },
      session: null,
    }),
    stage('ready', 'check', 'Ready', 'The account open, the ticks landing', READY),
    /* logging in */
    stage('signin', 'mark', 'Log in', 'The number, the email instead, a passkey, Google and Apple'),
    stage('signemail', 'mail-filled', 'Log in with email', 'The email on the account'),
    stage('signcode', 'mark', 'OTP verification, logging in', 'The code on the way back in, for the demo account', none, DEMO),
    stage('signpass', 'lock-filled', 'Enter password', 'The password for the demo account', none, DEMO),
    stage('signface', 'faceid-filled', 'Face scan, a new phone', 'Once, the first time on a phone', none, DEMO),
    stage('signpasscode', 'lock-filled', 'Enter your passcode, logging in', 'A phone that knows the account, the face not to hand', none, DEMO),
    stage('newpasscode', 'lock-filled', 'Create passcode, logging in', 'On a phone without the account’s passcode, after logging in', none, DEMO),
    /* getting an account back */
    stage('recover', 'shield-filled', 'Recover your account', 'The mobile number on the account'),
    stage('recovercode', 'phone-filled', 'OTP verification, recovering', 'The code to the account’s number', none, DEMO),
    stage('recoverbvn', 'id-filled', 'BVN number, recovering', 'The BVN the account was opened with', none, DEMO),
    stage('recoverface', 'faceid-filled', 'Face scan, recovering', 'Matched to the BVN’s photo', none, DEMO),
    stage('recoverwhat', 'mail-filled', 'Your email', 'The email found, kept or changed', none, DEMO),
    stage('newemail', 'mail-filled', 'Enter new email', 'A new email for the account', none, DEMO),
    stage('newemailcode', 'mail-filled', 'OTP verification, new email', 'The new email’s own code', none, `${DEMO}&email=ibrahim.new%40example.com`),
    stage('newpassword', 'lock-filled', 'New password', 'A new password for the account', none, DEMO),
    stage('recovered', 'check', 'Your email is changed', 'The day’s hold, and This wasn’t me', none, `${DEMO}&email=ibrahim.new%40example.com`),
    /* finishing setting up: the three answers after the account is ready, and everything on */
    stage('address', 'home-filled', 'Where you live', 'The street and the area typed into one card, and what it opens', READY, '&street=12%20Bode%20Thomas%20Street&area=Surulere%2C%20Lagos%20State'),
    stage('idcard', 'camera-filled', 'A photo of an ID', 'The frame to fill, and Take it', READY),
    stage('income', 'receive-filled', 'Where your money comes from', 'One tap on four rows, a salary picked', READY, '&income=salary'),
    stage('full', 'check', 'Everything is on', 'The three done above, and the four things on, landing one after another', READY),
  ],
};

const demo: Seed = { progress: {}, session: sessionFor(DEMO_ACCOUNT) };

export const HOME: Feature = {
  id: 'home',
  title: 'Home',
  folder: 'src/features/home',
  sub: 'The first of the three pages: the card at the top, Savings, Loan, Card and Services under it. Pull the card down for the chat.',
  places: [
    {
      id: 'home-demo',
      icon: 'home-filled',
      title: 'The demo account',
      sub: `${DEMO_ACCOUNT.firstName}'s home, the one the design is drawn around: swipe for Activities and Settings`,
      href: '/home',
      seed: demo,
    },
    {
      id: 'home-no-offers',
      icon: 'home-filled',
      title: 'Nothing to offer',
      sub: 'The demo account with no offers: the empty No promos card in the black card, from the frame',
      href: '/home?offers=none',
      seed: demo,
    },
    {
      id: 'home-new',
      icon: 'home-filled',
      title: 'A new account',
      sub: 'Nothing has moved yet: Start a goal, and borrowing once setting up is done',
      href: '/home',
      seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) },
    },
    {
      id: 'home-tour',
      icon: 'home-filled',
      title: 'The tour',
      sub: 'A new account’s first home: the card, Send and Receive, Activities and the place to ask, Skip at the top',
      href: '/home?tour=1',
      seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) },
    },
    {
      id: 'home-first-question',
      icon: 'chat',
      title: 'The first question',
      sub: 'What can you do?, on an account with no history, from the frame',
      href: '/home?chat=first',
      seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) },
    },
    {
      id: 'home-first',
      icon: 'home-filled',
      title: 'The first time',
      sub: 'The card dips on its own to point out the chat',
      href: '/home',
      seed: demo,
      forget: ['beetle.home.pointed-out.v1'],
    },
    {
      id: 'home-draft',
      icon: 'chat',
      title: 'A draft, unsent',
      sub: 'Words typed and the keyboard up, the way the Draft frame draws it',
      href: '/home?typing=Send%2020k%20to%20Sarah%20for&kb=236',
      seed: demo,
    },
  ],
};

export const ASK: Feature = {
  id: 'ask',
  title: 'Ask Beetle',
  folder: 'src/features/agent',
  sub: 'The chat inside the card: what it says, and the panels it puts up.',
  places: [
    {
      id: 'ask-open',
      icon: 'mark',
      title: 'The chat, open',
      sub: 'Home with the card already pulled down',
      href: '/home?chat=open',
      seed: demo,
    },
    {
      id: 'ask-transfer',
      icon: 'send',
      title: 'A transfer, mid-way',
      sub: '"Send 20k to Sarah", the panel filling in',
      href: '/home?chat=transfer',
      seed: demo,
    },
    {
      id: 'ask-prompt',
      icon: 'power',
      title: 'A prompt from Beetle',
      sub: 'A chat Beetle started, waiting in the drawer, opened',
      href: '/home?chat=prompt',
      seed: demo,
    },
    {
      id: 'ask-drawer',
      icon: 'list',
      title: 'The chats drawer',
      sub: 'The chat open and the drawer in from the left edge: New chat, and the chats under it',
      href: '/home?chat=drawer',
      seed: demo,
    },
    {
      id: 'ask-thinking',
      icon: 'clock',
      title: 'Beetle thinking',
      sub: '"Send 20k to Sarah" asked live: the steps, then the words, then the panel',
      href: '/home?chat=thinking',
      seed: demo,
    },
    {
      id: 'ask-carry',
      icon: 'clock-filled',
      title: 'A chat that carries on',
      sub: 'One filed a quarter of an hour ago, picked up by the pull down; New chat in the drawer starts another',
      href: '/home?chat=carry',
      seed: demo,
    },
    {
      id: 'ask-send',
      icon: 'up',
      title: 'Send, no amount given',
      sub: '"Send something to Sarah": the card asking "Is this the person?", the amount on the picker, and Recent for the people paid before',
      href: '/home?chat=ask-send',
      seed: demo,
    },
    {
      id: 'ask-data',
      icon: 'data',
      title: 'Data for a new number',
      sub: '"Data for 0812 345 6789": Airtel from the digits, the plan to type or pick, the rest a tap away',
      href: '/home?chat=ask-data',
      seed: demo,
    },
    {
      id: 'ask-airtime',
      icon: 'airtime',
      title: 'Airtime, on your own line',
      sub: '"Airtime": your own line with Change beside it, the amount on the picker, and Recent for the numbers topped up before',
      href: '/home?chat=ask-airtime',
      seed: demo,
    },
    {
      id: 'ask-bill',
      icon: 'power',
      title: 'A bill, from the meters paid',
      sub: '"Pay a bill": the company, prepaid or postpaid, the meter looked up as it is typed, or one paid before from Recent',
      href: '/home?chat=ask-bill',
      seed: demo,
    },
  ],
};

export const SEND: Feature = {
  id: 'send',
  title: 'Sending money',
  folder: 'src/features/send',
  sub: 'The Send money page in four taps — who, how much, slide, the passcode — and what can stand in the way.',
  places: [
    {
      id: 'send-empty',
      icon: 'send',
      title: 'Send money',
      sub: 'The page as Send on the card opens it: who, how much, a reference, and Slide to send',
      href: '/send',
      seed: demo,
    },
    {
      id: 'send-filled',
      icon: 'send-filled',
      title: 'Filled from a message',
      sub: '"send Sarah 50k for the flat deposit" read into its three parts, from the frame',
      href: '/send?demo=1',
      seed: demo,
    },
    {
      id: 'send-short',
      icon: 'warn-filled',
      title: 'Not enough in Everyday',
      sub: '₦7,520 short of ₦20,000, and three ways to close it, from the frame',
      href: '/short?asked=20000&have=12480',
      seed: demo,
    },
    {
      id: 'send-misread',
      icon: 'camera',
      title: 'Check this number',
      sub: 'A last digit the reader was not sure of: both readings, and the choice, from the frame',
      href: '/misread?demo=1',
      seed: demo,
    },
  ],
};

const state = (id: string, icon: IconName, title: string, sub: string, href: string): Place => ({ id, icon, title, sub, href, seed: demo });

export const TRANSFERS: Feature = {
  id: 'transfers',
  title: 'When a transfer is not done',
  folder: 'src/features/transfers',
  sub: 'Still on its way, did not go, came back; what went wrong, asking for it back, and a number Beetle read wrong.',
  places: [
    state('transfer-pending', 'wait-filled', 'Still on its way', 'The ring turning, the three steps, and a message offered for when it lands, from the frame', '/transfer/l01'),
    state('transfer-failed', 'alert', 'It did not go', 'The balance whole, whose afternoon it is, try again or another way, from the frame', '/transfer/l02'),
    state('transfer-reversed', 'undo-filled', 'It came back', 'When it left and came back, why, the reference, and the number to check, from the frame', '/transfer/l03'),
    state('transfer-wrong', 'warn-filled', 'What went wrong?', 'The three things that can be wrong with a payment, and the payment, from the frame', '/wrong/l08'),
    state('transfer-recall', 'undo-filled', 'Asking for it back', 'Beetle Recall at work, what it is and is not, a message or a dispute, from the frame', '/recall/l08'),
    state('transfer-alreadygone', 'alert', 'I sent it wrong', 'A digit Beetle read wrong: the cover today, or the bank asked to recall it, from the frame', '/alreadygone/l08'),
  ],
};

export const WRONG: Feature = {
  id: 'wrong',
  title: 'When it goes wrong',
  folder: 'src/features/dispute',
  sub: 'What Beetle checked before filling a transfer in, the one it will not do, a dispute open and closed, and the phone offline.',
  places: [
    state('wrong-checking', 'search', 'Before I filled this in', 'Beetle Reasoning: the four checks and the one it is not sure of, from the frame', '/checking?demo=1'),
    state('wrong-refused', 'shield', 'I will not do this one', 'The whole balance to an account four minutes old, and the three ways, from the frame', '/refused?demo=1'),
    state('wrong-dispute', 'list', 'Your dispute', 'Day three of five: filed, acknowledged, their decision due, from the frame', '/dispute/demo'),
    state('wrong-closed', 'check', 'The dispute is closed', 'The money back at 11:40, the steps, and the closing letter offered, from the frame', '/dispute/demo?closed=1'),
    state('wrong-offline', 'alert', 'You are offline', 'The balance as of a time, queue it or pay by USSD, lite mode offered, from the frame', '/offline?demo=1'),
  ],
};

export const RECEIPTS: Feature = {
  id: 'receipts',
  title: 'Receipts',
  folder: 'src/features/receipts',
  sub: 'A receipt for every line of the record: the card in the chat, opened where it is, every other line opened in place, and sharing it.',
  places: [
    {
      id: 'receipt-chat',
      icon: 'receipt',
      title: 'A receipt in the chat',
      sub: 'A transfer just through the passcode: the panel done, the card, a tap and it opens where it is, a little larger',
      href: '/home?chat=sent',
      seed: demo,
    },
    {
      id: 'receipt-transfer',
      icon: 'send',
      title: 'A transfer',
      sub: '₦20,000 to Sarah Adeyemi, opened in place, as every transaction is',
      href: '/receipt/l08',
      seed: demo,
    },
    {
      id: 'receipt-data',
      icon: 'data',
      title: 'Data bought',
      sub: '5GB for Mum, opened in place',
      href: '/receipt/l07',
      seed: demo,
    },
    {
      id: 'receipt-bill',
      icon: 'power',
      title: 'A bill paid',
      sub: 'Ikeja Electric, opened in place, with the meter token to copy',
      href: '/receipt/l11',
      seed: demo,
    },
    {
      id: 'receipt-in',
      icon: 'bank',
      title: 'Money in',
      sub: 'The salary from Pagrin Limited, opened in place',
      href: '/receipt/l10',
      seed: demo,
    },
    {
      id: 'receipt-share',
      icon: 'share',
      title: 'Share receipt',
      sub: 'The share sheet over the transfer opened in place, from the frame',
      href: '/receipt/l08?share=1',
      seed: demo,
    },
  ],
};

export const MORE: Feature = {
  id: 'more',
  title: 'The bar and More',
  folder: 'src/features/more',
  sub: 'The bar at the foot of home — Home, Activities, Settings, and the plus — the three actions that rise out of it, and which account they are for.',
  places: [
    {
      id: 'more-bar',
      icon: 'home-filled',
      title: 'The bar',
      sub: 'Home with the card closed: the three glyphs and the plus at the foot',
      href: '/home',
      seed: demo,
    },
    {
      id: 'more-sheet',
      icon: 'plus',
      title: 'More',
      sub: 'Convert, Send and Receive up out of the plus, the screen soft behind them, from the frame',
      href: '/home?more=1',
      seed: demo,
    },
    /* Round 36: Send and Receive on the plus ask which account first */
    { id: 'pick-send', icon: 'send', title: 'Send from which account?', sub: 'The Naira account or the Dollar account, with what each holds', href: '/pick?for=send', seed: demo },
    { id: 'pick-receive', icon: 'down', title: 'Receive into which account?', sub: 'The two, and how money comes into each', href: '/pick?for=receive', seed: demo },
  ],
};

export const ACTIVITIES: Feature = {
  id: 'activities',
  title: 'Activities',
  folder: 'src/features/activities',
  sub: 'Everything that moved, and the answer to a question about spending.',
  places: [
    {
      id: 'activities-page',
      icon: 'history-filled',
      title: 'Activities',
      sub: 'The second page: Money health, All / Insights / In / Out, the record with what Beetle noticed among it, from the frame',
      href: '/activities',
      seed: demo,
    },
    {
      id: 'activities-receipt',
      icon: 'receipt',
      title: 'A receipt over Activities',
      sub: 'Netflix opened in one step over the page, which goes soft under white; swipe right or Back to close',
      href: '/activities?receipt=l04',
      seed: demo,
    },
    {
      id: 'activities-empty',
      icon: 'history-filled',
      title: 'Nothing has moved yet',
      sub: 'A new account: nothing yet, and what every line here will open, from the frame',
      href: '/activities',
      seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) },
    },
    {
      id: 'activities-answer',
      icon: 'chart',
      title: 'The answer',
      sub: 'Airtime and data last month: the figure, the months, where it went, from the frame',
      href: '/answer',
      seed: demo,
    },
  ],
};

const settingsPage = (id: string, icon: IconName, title: string, sub: string, href: string): Place => ({ id, icon, title, sub, href, seed: demo });

export const SETTINGS: Feature = {
  id: 'settings',
  title: 'Settings',
  folder: 'src/features/settings',
  sub: 'From the mark at the top left of home: what keeps the money yours, your account, about, and every page a row leads to.',
  places: [
    {
      id: 'settings-page',
      icon: 'gear-filled',
      title: 'Settings',
      sub: 'The page from the frame; every row leads somewhere',
      href: '/settings',
      seed: demo,
    },
    {
      id: 'settings-details',
      icon: 'person-filled',
      title: 'Your details',
      sub: 'Name, number, account number to copy, member since, on a sheet',
      href: '/settings?details=1',
      seed: demo,
    },
    settingsPage('settings-lock', 'faceid-filled', 'Lock and privacy', 'Face ID, the passcode, the password, the wait, and what other people can see', '/lock'),
    settingsPage('settings-limits', 'shield-filled', 'Spending limits', 'Where today stands, the three caps, what happens at the line', '/limits'),
    settingsPage('settings-limitstop', 'warn-filled', 'Past your own limit', 'The passcode done and the three words half typed, as the frame draws it', '/limitstop?typed=1'),
    settingsPage('settings-rules', 'list-filled', 'Standing instructions', 'Money is tight, the three instructions with their switches and logs', '/rules'),
    settingsPage('settings-rule', 'plus', 'Set this up?', 'A standing instruction offered, from a receipt or the list', '/rule'),
    settingsPage('settings-devices', 'laptop-filled', 'Devices', 'Three signed in, one that does not belong, and the button', '/devices'),
    settingsPage('settings-lostphone', 'lock-filled', 'Not your phone', 'A device the account has never seen: freeze, then prove it is you', '/lostphone'),
    settingsPage('settings-newcode', 'key-filled', 'A new passcode', 'Six digits on the keypad, after the freeze and the proof', '/newcode?from=frozen&proved=1'),
    settingsPage('settings-password', 'key-filled', 'Change password', 'The current one and a new one, for logging in on a new phone', '/password'),
    settingsPage('settings-privacy', 'shield-filled', 'Privacy and your data', 'Offers off until switched on, a copy of your data, closing the account, who to write to', '/privacy'),
    settingsPage('settings-legal', 'list-filled', 'Privacy notice', 'The draft for the lawyers, in plain words, every [bracket] theirs', '/legal?doc=privacy'),
    settingsPage('settings-card', 'card-filled', 'Virtual card', 'The cards side by side, Reveal, Freeze, Load, Rules, the month, its own lines; hold one to turn it over', '/card'),
  ],
};

export const SCAN: Feature = {
  id: 'scan',
  title: 'Reading a photo',
  folder: 'src/features/scan',
  sub: 'The camera, and an account number read off what it sees.',
  places: [
    {
      id: 'scan-camera',
      icon: 'camera',
      title: 'The camera',
      sub: 'Permission, the shutter, and every way it can go wrong',
      href: '/scan',
      seed: demo,
    },
    {
      id: 'scan-read',
      icon: 'id',
      title: 'A photo, read',
      sub: 'The sample slip through the reader, into the chat',
      href: '/home?chat=photo',
      seed: demo,
    },
  ],
};

export const GUARD: Feature = {
  id: 'guard',
  title: 'Before money moves',
  folder: 'src/features/passcode',
  sub: 'The passcode on its sheet over the chat, the face asked first where the phone has one enrolled.',
  places: [
    {
      id: 'guard-passcode',
      icon: 'lock-filled',
      title: 'The passcode',
      sub: 'A transfer ready and the pad up, the face asked first where there is one: 654321 lets it through, three wrong shut the gate',
      href: '/home?chat=confirm',
      seed: demo,
    },
    {
      id: 'guard-face-missed',
      icon: 'faceid',
      title: 'Face ID missed',
      sub: 'The face did not take: the line in red, the face key to try again, and what three wrong tries cost, from the frame',
      href: '/home?chat=confirm&face=missed',
      seed: demo,
    },
  ],
};

export const RECEIVE: Feature = {
  id: 'receive',
  title: 'Being paid',
  folder: 'src/features/receive',
  sub: 'The Receive sheet with your number and $tag, and money arriving.',
  places: [
    {
      id: 'receive-sheet',
      icon: 'receive-filled',
      title: 'Receive',
      sub: 'The sheet over home: your number and $tag to copy and share, then asking someone and dollars',
      href: '/home?receive=pick',
      seed: demo,
    },
    {
      id: 'receive-arrival',
      icon: 'down',
      title: 'Money arrives',
      sub: '₦50,000 from Sarah lands on the card, in the day, and in a chat from Beetle with the receipt',
      href: '/home?receive=arrival',
      seed: demo,
    },
  ],
};

export const ASKING: Feature = {
  id: 'asking',
  title: 'Asking for money',
  folder: 'src/features/request',
  sub: 'A request somebody can pay: from words, from a photo of their message, or from nothing yet.',
  places: [
    {
      id: 'ask-typing',
      icon: 'chat',
      title: 'Typed at home',
      sub: '"ask musa for 20k" in the bar with the keyboard up, from the frame',
      href: '/home?typing=ask%20musa%20for%2020k&kb=236',
      seed: demo,
    },
    {
      id: 'ask-typed',
      icon: 'request',
      title: 'The request, from words',
      sub: 'Musa, ₦20,000, the rent balance: Beetle Requests at work, from the frame',
      href: '/request?demo=typed',
      seed: demo,
    },
    {
      id: 'ask-found',
      icon: 'camera',
      title: 'Read from your photo',
      sub: "Musa's message through the reader, and the sheet over the camera, from the frame",
      href: '/scan?demo=request',
      seed: demo,
    },
    {
      id: 'ask-photo',
      icon: 'camera-filled',
      title: 'The request, from the photo',
      sub: 'What the camera read, on the request page, from the frame',
      href: '/request?demo=photo',
      seed: demo,
    },
    {
      id: 'ask-empty',
      icon: 'person',
      title: 'Nothing yet',
      sub: 'Ask someone on the Receive sheet: Beetle asks who, and for how much',
      href: '/request',
      seed: demo,
    },
    {
      id: 'ask-sent',
      icon: 'check',
      title: 'Request sent',
      sub: 'The page that says so, with the reminder Beetle offers, from the frame',
      href: '/asked/demo',
      seed: demo,
    },
  ],
};

export const BILLS: Feature = {
  id: 'bills',
  title: 'Bills',
  folder: 'src/features/bills',
  sub: "The month's bills, paying one on the saved meter, and a bill read off a photo.",
  places: [
    {
      id: 'bills-month',
      icon: 'receipt',
      title: 'Bills',
      sub: 'The month: what it comes to, what is covered, and the five rows, from the frame',
      href: '/bills',
      seed: demo,
    },
    {
      id: 'bills-pay',
      icon: 'power',
      title: 'Pay a bill',
      sub: 'Ikeja Electric on the saved meter, ₦8,000, three figures to pick from, from the frame',
      href: '/pay?biller=ikeja&demo=1',
      seed: demo,
    },
    {
      id: 'bills-scan',
      icon: 'camera',
      title: 'Scan a bill',
      sub: 'The camera pointed at a bill: the sample read, the meter found under it, from the frame',
      href: '/scan?demo=bill&hold=1',
      seed: demo,
    },
    {
      id: 'bills-found',
      icon: 'search',
      title: 'What I found',
      sub: 'The bill as read, Is this your meter?, and the three pieces, from the frame',
      href: '/meter?demo=1',
      seed: demo,
    },
    {
      id: 'bills-confirm',
      icon: 'lock',
      title: 'Confirm the bill',
      sub: 'The passcode over What I found, ₦8,000 to Ikeja Electric, from the frame',
      href: '/meter?demo=1&guard=1',
      seed: demo,
    },
  ],
};

export const SERVICES: Feature = {
  id: 'services',
  title: 'All services',
  folder: 'src/features/services',
  sub: 'The drawer: the eight used most, then bills, saving and borrowing, and money.',
  places: [
    {
      id: 'services-all',
      icon: 'grid',
      title: 'All services',
      sub: 'The tiles and the three lists, each a way into a page, from the frame',
      href: '/services',
      seed: demo,
    },
  ],
};

export const DATA: Feature = {
  id: 'data',
  title: 'Buying data',
  folder: 'src/features/data',
  sub: 'Data and airtime on a saved line: the page, the typed way in, the message read off a photo, and the chat that prices it.',
  places: [
    {
      id: 'data-buy',
      icon: 'data',
      title: 'Buy data',
      sub: "Mum's 5GB on her MTN line, the other bundles, the other lines, from the frame",
      href: '/buy?demo=1',
      seed: demo,
    },
    {
      id: 'data-airtime',
      icon: 'airtime',
      title: 'Buy airtime',
      sub: "The same page with a figure in the bundle's place",
      href: '/buy?kind=airtime',
      seed: demo,
    },
    {
      id: 'data-typing',
      icon: 'chat',
      title: 'Typed at home, for data',
      sub: '"2k data for mum" in the bar with the keyboard up, from the frame',
      href: '/home?typing=2k%20data%20for%20mum&kb=236',
      seed: demo,
    },
    {
      id: 'data-found',
      icon: 'camera',
      title: 'Read from your photo, for data',
      sub: "Mum's message through the reader, and the sheet over the camera, from the frame",
      href: '/scan?demo=topup',
      seed: demo,
    },
    {
      id: 'data-topup',
      icon: 'camera-filled',
      title: 'The top-up, from the photo',
      sub: 'Beetle Data pricing the bigger bundle, and checking for a cheaper one, from the frame',
      href: '/topup?demo=1',
      seed: demo,
    },
    {
      id: 'data-confirm',
      icon: 'lock',
      title: 'Confirm the top-up',
      sub: 'The passcode over the chat, ₦2,500 of MTN for Mum, from the frame',
      href: '/topup?demo=1&guard=1',
      seed: demo,
    },
    {
      id: 'data-share',
      icon: 'share',
      title: 'Share the receipt',
      sub: "The share sheet over Mum's 5GB receipt, from the frame",
      href: '/receipt/l07?share=1',
      seed: demo,
    },
  ],
};

export const LOAN: Feature = {
  id: 'loan',
  title: 'Borrowing',
  folder: 'src/features/loan',
  sub: 'Borrow: the whole cost before deciding, and the money landing as money in.',
  places: [
    {
      id: 'loan-borrow',
      icon: 'loan',
      title: 'Borrow',
      sub: '₦150,000 for 90 days and what it costs, row by row, from the frame',
      href: '/loan',
      seed: demo,
    },
  ],
};

export const DOLLARS: Feature = {
  id: 'dollars',
  title: 'Dollars',
  folder: 'src/features/dollars',
  sub: 'The Dollar account: stablecoins on Solana, what is held and what it is worth today, converting either way, sending and receiving, and paying from the dollars.',
  places: [
    { id: 'dollars-page', icon: 'dollar', title: 'Dollars', sub: 'The Dollar account: $412.60, Convert, Send and Receive, and where each dollar came from', href: '/dollars', seed: demo },
    { id: 'dollars-convert', icon: 'swap', title: 'Convert', sub: '₦155,200 into dollars, with the rate, the fee and what you get', href: '/convert?demo=1', seed: demo },
    { id: 'dollars-converted', icon: 'check', title: 'Converted', sub: 'The tick, the rate you got, and the offer to move some every payday', href: '/converted/demo', seed: demo },
    { id: 'dollars-payfrom', icon: 'up', title: 'Pay from', sub: 'The sheet the From row on Send money puts up', href: '/send?demo=1&from=pick', seed: demo },
    { id: 'dollars-send', icon: 'send', title: 'Send from dollars', sub: 'Sarah paid from the dollars, at the rate on the page', href: '/send?demo=1&from=dollars', seed: demo },
    /* Round 36: the Dollar account's stablecoins on Solana, received and sent as part of it */
    { id: 'coins-in', icon: 'down', title: 'Receive dollars', sub: 'How receiving works the first time, then the Solana address as a QR, and test coins sent to it', href: '/coins', seed: demo },
    { id: 'coins-in-how', icon: 'down', title: 'How receiving works', sub: 'The address with the four steps open under it', href: '/coins?how=1', seed: demo },
    { id: 'coins-out', icon: 'send', title: 'Send dollars', sub: 'To a Beetle $tag, free and at once', href: '/coins/send', seed: demo },
    {
      id: 'coins-out-wallet',
      icon: 'up',
      title: 'Send to a Solana wallet',
      sub: 'An address pasted and checked, the amount, and what they get',
      href: `/coins/send?to=${SOL_ADDRESS}`,
      seed: demo,
    },
    {
      id: 'coins-out-wrong',
      icon: 'alert',
      title: 'The wrong network',
      sub: 'A Base address: named as such, with what to ask for instead, and nothing can go',
      href: `/coins/send?to=${COIN_ADDRESS}`,
      seed: demo,
    },
  ],
};

export const SAVING: Feature = {
  id: 'saving',
  title: 'Putting money away',
  folder: 'src/features/goal',
  sub: 'Several goals, saved into in four taps: the Holiday goal, a second beside it, a new one filled in, edited, paused, money taken out, the Save card in the chat, and an account with no goal yet.',
  places: [
    { id: 'goal-holiday', icon: 'pot', title: 'Holiday', sub: 'A third of the way, Add money and Take out under the ring, and what feeds it', href: '/goal', seed: demo },
    { id: 'goal-two', icon: 'pot-tone', title: 'Two goals', sub: 'Holiday and Rent as pills, a tap switching between them', href: '/goal?two=1', seed: demo },
    { id: 'goal-new', icon: 'plus', title: 'A new goal', sub: 'The sheet + New goal puts up, filled with Rent, its figure and a date', href: '/goal?new=1', seed: demo },
    { id: 'goal-edit', icon: 'gear', title: 'Edit a goal', sub: 'The same sheet with Holiday’s own name, figure and date', href: '/goal?open=edit', seed: demo },
    { id: 'goal-take', icon: 'up', title: 'Take money out', sub: 'The picker, stopping at what Holiday holds, then the passcode', href: '/goal?open=take', seed: demo },
    { id: 'goal-feed', icon: 'pot-tone', title: 'Feed the goal', sub: 'The sheet the row of what feeds it puts up: four ways, three switches', href: '/goal?feed=1', seed: demo },
    { id: 'goal-paused', icon: 'clock', title: 'Paused', sub: 'Money is tight, so the feeds wait, the date moves, and Start again is on the line', href: '/goal?paused=1', seed: demo },
    { id: 'goal-chat', icon: 'chat', title: 'Save in the chat', sub: 'The Save chip’s card: the goal, the dark picker, and Put away', href: '/home?chat=save', seed: demo },
    { id: 'goal-none', icon: 'pot', title: 'No goal yet', sub: 'An account with nothing put aside, and Start a goal', href: '/goal', seed: { progress: {}, session: sessionFor(account(LAB_PHONE)) } },
  ],
};

export const HEALTH: Feature = {
  id: 'health',
  title: 'Money health',
  folder: 'src/features/health',
  sub: 'One number for how the money is handled, the five habits that move it, and the offer that would lift it.',
  places: [{ id: 'health-page', icon: 'chart', title: 'Money health', sub: '72 out of 100, up 4 since July, from the frame', href: '/health', seed: demo }],
};

export const MODEL: Feature = {
  id: 'model',
  title: "Beetle's model",
  folder: 'src/features/agent',
  sub: 'Claude behind the chat where there is a key for it, the script where there is not (src/services/model.ts).',
  places: [
    {
      id: 'model-key',
      icon: 'key-filled',
      title: 'The key, and a try',
      sub: 'Keep a key on this phone, see where Beetle answers from, and ask it something',
      href: '/model',
      seed: demo,
    },
  ],
};

export const FEATURES: Feature[] = [
  WAY_IN,
  HOME,
  MORE,
  ASK,
  SEND,
  TRANSFERS,
  WRONG,
  SCAN,
  GUARD,
  RECEIVE,
  ASKING,
  BILLS,
  SERVICES,
  DATA,
  LOAN,
  DOLLARS,
  SAVING,
  HEALTH,
  RECEIPTS,
  ACTIVITIES,
  SETTINGS,
  MODEL,
];
