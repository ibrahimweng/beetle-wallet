/* Act Two — it decides.
   What runs without asking, what the limits are, and what happens when the
   phone is in someone else's hand. */

import {
  el, Screen, Dock, Sheet, PageHead, Head, Body, Meta, Caption, Label,
  Card, Plain, Stack, Row, Divider, Glyph, ListRow, ActionRow, Field,
  Button, Ghost, Bubble, Note, Meter, Keypad, Pips, Banner, Pill,
  Toggle, AmountPad, Picker, EditRow, PassPad, toast, naira, nairaFull,
} from '../ui.js';
import { limits as seedLimits, meterBill, me } from '../data.js';
import { get, leftToday } from '../store.js';
import * as act from '../actions.js';

const e = el;
const go = id => window.beetleGo(id);
const repaint = () => window.beetleRepaint();

const SettingRow = ({ icon, tone, title, right, to, toggleKey, onToggle }) =>
  e('div', { class: 'listrow' + (to ? ' press' : ''), role: to ? 'button' : null, onClick: to ? () => go(to) : null },
    Glyph(icon, tone),
    e('div', { class: 'grow listrow-title' }, title),
    toggleKey
      ? Toggle(get().toggles[toggleKey], on => { act.setToggle(toggleKey, on); onToggle && onToggle(on); })
      : e('div', { class: 't-meta c-3' }, right || ''),
    !toggleKey && e('div', { class: 'chev' }, '›'));

const Group = (label, ...rows) =>
  e('div', { class: 'stack gap-1' }, Meta(label, 'c-2'), e('div', { class: 'stack' }, ...rows));

/* ---------------------------------------------------------------- *
 * What runs on its own
 * ---------------------------------------------------------------- */

export const rule = {
  title: 'Set this up?',
  render: () => Screen([
    PageHead('Set this up?', 'Nothing is saved until you say yes'),
    Card(
      ...[
        ['What', 'Top up Ikeja Electric'],
        ['Meter', meterBill.meter],
        ['When', 'The day units run low'],
        ['Up to', naira(10000)],
        ['Stops if', 'Everyday is under ₦15,000'],
      ].map(([k, v], i) => e('div', null,
        i ? Divider() : null,
        e('div', { class: 'row between', style: { padding: '10px 0' } },
          e('div', { class: 't-body c-2' }, k),
          e('div', { class: 't-row' }, v))))),
    Bubble('Over ₦10,000 and I stop and ask you, every time. I never raise this on my own.'),
    e('div', { class: 'card', style: { background: 'var(--accent-wash)' } },
      e('div', { class: 't-label c-accent', style: { marginBottom: '4px' } }, 'You can stop it any time'),
      e('div', { class: 't-caption c-accent' }, 'It sits in Standing instructions with a switch beside it. Or just tell me to stop and it stops.')),
    Button('Set it up', { onClick: () => go('rules') }),
    Ghost('Not now', () => go('home')),
  ]),
};

export const rules = {
  title: 'Standing instructions',
  render: () => Screen([
    PageHead('Standing instructions', 'What runs without asking you first', { big: true }),
    e('div', { class: 'stack' }, ...get().standing.map(r =>
      e('div', { class: 'listrow' },
        Glyph(r.on ? '⚡' : '◷', r.on ? 'accent' : ''),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, r.name),
          e('div', { class: 'listrow-sub' }, r.sub)),
        Toggle(r.on, on => { act.setStanding(r.name, on); toast(on ? `${r.name} is running again.` : `${r.name} is off. Nothing of yours moves for it.`); repaint(); })))),
    Plain(
      Label('What I will never do'),
      Stack(2,
        Row(Glyph('🔒'), Body('Raise a limit you set. Ever.')),
        Row(Glyph('🔒'), Body('Run one of these while your balance is under ₦15,000.')),
        Row(Glyph('✓', 'good'), Body('Tell you the moment one runs, with a tap to undo it.')))),
    Note('Every one of these can be stopped by saying stop.'),
  ], Dock({ placeholder: 'Ask me to stop one', back: () => go('settings') })),
};

/* ---------------------------------------------------------------- *
 * What you set
 * ---------------------------------------------------------------- */

export const settings = {
  title: 'Settings',
  render: () => Screen([
    PageHead('Settings', null, { big: true }),
    e('div', { class: 'card-plain', style: { cursor: 'pointer' }, onClick: () => go('settings') },
      e('div', { class: 'listrow' },
        Glyph('★', 'accent'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Get Beetle Plus'),
          e('div', { class: 'listrow-sub' }, 'Higher daily limits and a human when you need one')),
        e('div', { class: 'fab', style: { width: '32px', height: '32px', fontSize: '15px' } }, '›'))),
    Group('What keeps the money yours',
      SettingRow({ icon: '☺', tone: 'accent', title: 'Lock and privacy', right: get().toggles.faceId ? 'Face ID' : 'Passcode only', to: 'lock' }),
      SettingRow({ icon: '✓', tone: 'good', title: 'Spending limits', right: naira(get().limits.day) + ' a day', to: 'limits' }),
      SettingRow({ icon: '≡', tone: '', title: 'Standing instructions', right: get().standing.filter(r => r.on).length + ' running', to: 'rules' }),
      SettingRow({ icon: '▭', title: 'Devices', right: get().devices.length + ' signed in', to: 'devices' }),
      SettingRow({ icon: '🔑', title: 'Keys and recovery', right: 'Set up', to: 'lostphone' })),
    Group('Your account',
      SettingRow({ icon: '👤', tone: 'accent', title: 'Your details', to: 'settings' }),
      SettingRow({ icon: '🔔', tone: 'warn', title: 'Notifications', to: 'settings' }),
      SettingRow({ icon: '☆', title: 'Saved people', to: 'settings' }),
      SettingRow({ icon: '▭', title: 'Cards', right: '1 virtual', to: 'card' })),
    Group('About',
      SettingRow({ icon: '💬', title: 'Contact support', to: 'settings' }),
      SettingRow({ icon: '✎', title: 'Give feedback', to: 'settings' }),
      SettingRow({ icon: '⎋', title: 'Sign out', to: 'signin' })),
  ], Dock({ placeholder: 'Ask me to change something', back: () => go('home') })),
};

export const lock = {
  title: 'Lock and privacy',
  render: () => Screen([
    PageHead('Lock and privacy', 'What it takes to open this, and what shows', { big: true }),
    Group('Opening the app',
      SettingRow({ icon: '☺', tone: 'accent', title: 'Face ID', toggleKey: 'faceId' }),
      SettingRow({ icon: '⌨', title: 'Passcode', right: 'Four digits', to: 'newcode' }),
      SettingRow({ icon: '◷', title: 'Ask again after', right: '5 minutes', to: 'lock' })),
    Group('What other people can see',
      SettingRow({ icon: '👁', title: 'Hide my balance', toggleKey: 'hideBalance', onToggle: on => toast(on ? 'Hidden. Tap the balance on home to peek.' : 'Showing again.') }),
      SettingRow({ icon: '📷', title: 'Hide it in screenshots', toggleKey: 'hideScreenshots' }),
      SettingRow({ icon: '🔔', title: 'Amounts in notifications', toggleKey: 'notifAmounts' })),
    Bubble('Face opens the app. Only your passcode sends money, because a face can be held up to a phone by somebody else.'),
  ], Dock({ placeholder: 'Ask about locking this', back: () => go('settings') })),
};

let editingLimit = null;

export const limitsScreen = {
  title: 'Spending limits',
  render: () => {
    const s = get();
    const rows = [
      ['transfer', 'One transfer', 'The most that can leave in a single go'],
      ['day', 'One day', 'Midnight to midnight'],
      ['month', 'One month', 'Resets on the first'],
    ];

    const base = Screen([
      PageHead('Spending limits', 'What you set, and where today stands', { big: true }),
      Card(
        e('div', { class: 'row between' }, Caption('Out today', 'c-2'), Caption(`of ${naira(s.limits.day)}`, 'c-3')),
        e('div', { class: 't-display' }, naira(s.outToday)),
        Meter(s.outToday / s.limits.day * 100, s.outToday / s.limits.day > 0.85 ? 'var(--warn)' : null),
        Caption(`${naira(leftToday())} left before I stop and ask you twice.`, 'c-2')),
      Head('Your caps'),
      Card(...rows.map(([key, t, sub], i) => e('div', null,
        i ? Divider() : null,
        EditRow(t, naira(s.limits[key]), sub, () => { editingLimit = key; repaint(); })))),
      Plain(
        Label('What happens at the line'),
        Stack(2,
          Row(Glyph('🔑'), Body('Your passcode. Not your face, because a face can be held up to a phone.')),
          Row(Glyph('≡'), Body('Then you type Confirm this transaction in full. Three words, spelled out.'))),
        Caption('Two deliberate things, so a bad minute cannot carry you past a line you drew on a good one.')),
      Note('A limit you lower takes effect now. A limit you raise takes effect tomorrow.'),
    ], Dock({ placeholder: 'Ask me to change a limit', back: () => go('settings') }));

    if (!editingLimit) return base;
    const key = editingLimit;
    const label = rows.find(r => r[0] === key)[1];
    let next = s.limits[key];
    return Sheet(base,
      e('div', { class: 'stack gap-1 center' }, Head(label), Meta(`Now ${naira(s.limits[key])}`, 'c-3')),
      AmountPad({ value: s.limits[key], onChange: v => { next = v; } }),
      Button('Set it', { onClick: () => {
        if (!next) { toast('Put a figure in first.'); return; }
        const raising = next > s.limits[key];
        act.setLimit(key, next);
        editingLimit = null;
        toast(raising ? `Raised to ${naira(next)}. It applies from tomorrow, not to anything in front of you now.` : `Lowered to ${naira(next)}, from this second.`);
        repaint();
      } }),
      Button('Leave it', { kind: 'quiet', onClick: () => { editingLimit = null; repaint(); } }));
  },
};

export const limitstop = {
  title: 'Past your own limit',
  render: () => Screen([
    PageHead('Past your own limit', 'Nothing has been sent'),
    e('div', { class: 'row' }, Glyph('🔒', 'warn', { lg: true })),
    e('div', { class: 'stack gap-1' },
      e('div', { class: 't-display' }, naira(get().limits.day + 20000)),
      Meta(`is ${naira(20000)} past the ${naira(get().limits.day)} you set for a day`, 'c-3')),
    Bubble('You drew this line yourself, on a calmer day than this one. I am not going to move it for you in the moment.'),
    Card(
      e('div', { class: 't-label', style: { marginBottom: '6px' } }, 'To go past it'),
      e('div', { class: 'stack gap-2' },
        Row(Glyph('🔑'), Body('Your passcode, not your face')),
        Row(Glyph('⌨'), Body('Then type Confirm this transaction in full')))),
    Button(`Send ${naira(leftToday())} instead`, { onClick: () => go('pay') }),
    Button('Raise the limit from tomorrow', { kind: 'quiet', onClick: () => go('limits') }),
    Note('Raising a limit never applies to the payment in front of you.'),
  ], Dock({ placeholder: 'Ask about this limit', back: () => go('limits') })),
};

export const devicesScreen = {
  title: 'Devices',
  render: () => Screen([
    PageHead('Devices', 'Everywhere this account is open', { big: true }),
    Card(...get().devices.map((d, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'listrow' },
        Glyph(d.name.includes('Chrome') ? '💻' : '📱'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, d.name),
          e('div', { class: 'listrow-sub' }, d.sub)),
        d.tag === 'This one'
          ? e('span', { class: 'pill pill-good' }, d.tag)
          : e('button', { class: 'chip press', onClick: () => { act.signOutDevice(d.name); toast(`${d.name} is signed out. Your money was not touched.`); repaint(); } }, 'Sign out'))))),
    get().devices.length === 1
      ? Banner('Only this phone is signed in now.', 'good')
      : null,
    Bubble('The Windows one signed in from Abuja on 12 August and has not been back. If that was not you, sign it out and change your passcode. I will not do either without you.'),
    Button('Sign out everywhere else', { kind: 'quiet', onClick: () => {
      get().devices.filter(d => d.tag !== 'This one').forEach(d => act.signOutDevice(d.name));
      toast('Everything but this phone is signed out.'); repaint();
    } }),
    Note('Signing a device out never touches your money. It only means that device has to ask for your passcode again.'),
  ], Dock({ placeholder: 'Ask about a device', back: () => go('settings') })),
};

/* ---------------------------------------------------------------- *
 * When the phone is gone
 * ---------------------------------------------------------------- */

export const lostphone = {
  title: 'Not your phone',
  render: () => Screen([
    PageHead('Not your phone', 'Signed in on a device I do not know'),
    Card(
      e('div', { class: 'listrow' },
        Glyph('🔒', 'bad'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Freeze the money now'),
          e('div', { class: 'listrow-sub' }, 'Nothing can leave')),
        get().frozen ? e('span', { class: 'pill pill-good' }, 'Frozen') : e('span', { class: 'pill pill-accent' }, 'Do this')),
      Divider(),
      e('div', { class: 'listrow' },
        Glyph('📱'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Infinix Hot 40'),
          e('div', { class: 'listrow-sub' }, 'Ikeja · signing in now')),
        e('span', { class: 'pill pill-warn' }, 'Not you')),
      Divider(),
      e('div', { class: 'listrow' },
        Glyph('📱'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'iPhone 13'),
          e('div', { class: 'listrow-sub' }, 'Lagos · seen 09:14')),
        e('span', { class: 'pill pill-good' }, 'Yours'))),
    Bubble('You are on a device this account has never seen. I will not open the money here until you prove it is you. Freezing costs nothing and lifts in a minute.'),
    Button(get().frozen ? 'Now prove it is me' : 'Freeze it, then prove it is me', {
      onClick: () => { if (!get().frozen) { act.freezeAll(true); toast('Frozen. Nothing can leave the account now.'); repaint(); setTimeout(() => go('newcode'), 700); } else go('newcode'); },
    }),
    Note('Freezing stops money leaving. It does not stop money arriving, and it never touches what you already have.'),
  ], Dock({ placeholder: 'Ask what freezing does', back: () => go('signin') })),
};

export const newcode = {
  title: 'A new passcode',
  render: () => {
    let first = null;
    const host = e('div', { class: 'stack gap-4' });

    const draw = () => {
      host.innerHTML = '';
      host.appendChild(e('div', { class: 'stack gap-2' },
        ...['Frozen', 'Your number', 'Your face'].map(t =>
          e('div', { class: 'row', style: { gap: '10px' } },
            e('div', { class: 'tick' }, '✓'),
            e('div', { class: 't-body c-3' }, t)))));
      host.appendChild(e('div', { class: 'stack gap-1' },
        e('div', { class: 't-title' }, first ? 'Type it once more' : 'A new passcode'),
        Meta(first ? 'The same four, so I know it was not a slip.' : 'Four digits, and not the old ones. Sending stays locked for twelve hours.', 'c-3')));
      host.appendChild(PassPad({
        allowFace: false,
        hint: first ? 'Nothing is saved until both match.' : 'Not 1234, and not your year of birth.',
        onDone: code => {
          if (!first) {
            if (code === '1234' || code === '0000') return { error: 'Not that one. Pick four somebody could not guess.' };
            first = code; draw(); return;
          }
          if (code !== first) { first = null; draw(); return { error: 'Those two did not match. Start again.' }; }
          act.setPasscode(code);
          act.freezeAll(false);
          toast('Set. The account is unfrozen and sending is open again.');
          setTimeout(() => go('home'), 800);
        },
      }));
      host.appendChild(Note('Money can still reach you. Only sending waits.'));
    };

    draw();
    return Screen([host], Dock({ placeholder: 'Ask what happens next', back: () => go('lostphone') }));
  },
};
