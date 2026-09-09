/* Act Two — it decides.
   What runs without asking, what the limits are, and what happens when the
   phone is in someone else's hand. */

import {
  el, Icon, Screen, Dock, Sheet, PageHead, Head, Body, Meta, Caption, Label,
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
    PageHead('Top up Ikeja Electric', 'A standing instruction, in one sentence'),
    Card(
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('What', 'c-2'), e('div', { class: 't-row' }, 'Top up Ikeja Electric')),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('Meter', 'c-2'), e('div', { class: 't-row' }, meterBill.meter)),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('When', 'c-2'), e('div', { class: 't-row' }, 'The day units run low')),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('Up to', 'c-2'), e('div', { class: 't-row' }, naira(10000))),
      Divider(),
      e('div', { class: 'row between', style: { padding: '6px 0' } }, Caption('Stops if', 'c-2'), e('div', { class: 't-row' }, 'Everyday is under ' + naira(15000)))),
    Bubble('I will tell you each time it runs, with a tap to undo it. It never goes past the ceiling above, and it stops itself if your balance drops.'),
    Button('Set it up', { onClick: () => { act.setStanding('Top up Ikeja Electric', true); toast('Set. It runs the day your units run low.'); go('rules'); } }),
    Ghost('Not now', () => go('home')),
  ], Dock({ placeholder: 'Ask about this rule', back: () => go('home') })),
};

export const rules = {
  title: 'Standing instructions',
  render: () => {
    const RAN = {
      'Payday transfer': 'Moved 4 times · ₦80,000 put aside',
      'Top up Ikeja Electric': 'Paid 3 times · ₦22,400',
      'Round ups': 'Bought twice · ₦5,000',
      'Money is tight': null,
    };
    return Screen([
      PageHead('Money is tight this month', null, { big: true }),
      Plain(
        Body('Turn this on and I stop moving money into savings, and I stop asking you to. Your goals wait where they are. Nothing is lost and nothing is charged.', 'c-2'),
        e('div', { class: 'row between' },
          Caption('You can also just tell me, any time.', 'c-3'),
          Toggle(!get().standing.find(r => r.name === 'Money is tight').on === false && get().standing.find(r => r.name === 'Money is tight').on,
            on => { act.setStanding('Money is tight', on); toast(on ? 'On. Nothing moves into savings while this is set.' : 'Off. Your goals start filling again.'); repaint(); }))),
      Head('What runs on its own'),
      e('div', { class: 'stack' }, ...get().standing.filter(r => r.name !== 'Money is tight').map(r =>
        e('div', { class: 'card', style: { padding: '12px 14px', marginBottom: '8px' } },
          e('div', { class: 'row between' },
            e('div', { class: 'stack gap-1 grow' },
              e('div', { class: 'listrow-title' }, r.name),
              e('div', { class: 'listrow-sub' }, r.sub)),
            Toggle(r.on, on => { act.setStanding(r.name, on); toast(on ? `${r.name} is running again.` : `${r.name} is off. Nothing of yours moves for it.`); repaint(); })),
          e('div', { class: 'row between', style: { marginTop: '8px' } },
            Caption(RAN[r.name] || 'Not run yet', 'c-3'),
            e('button', { class: 'btn btn-ghost press', style: { width: 'auto', padding: 0 }, onClick: () => go('history') }, 'See log'))))),
      Note('I will always ask first'),
    ], Dock({ placeholder: 'Ask me to stop one', back: () => go('settings') }));
  },
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
        Glyph('star-filled', 'accent'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Get Beetle Plus'),
          e('div', { class: 'listrow-sub' }, 'Higher daily limits and a human when you need one')),
        e('div', { class: 'fab', style: { width: '32px', height: '32px', fontSize: '15px' } }, '›'))),
    Group('What keeps the money yours',
      SettingRow({ icon: 'faceid', tone: 'accent', title: 'Lock and privacy', right: get().toggles.faceId ? 'Face ID' : 'Passcode only', to: 'lock' }),
      SettingRow({ icon: 'check', tone: 'good', title: 'Spending limits', right: naira(get().limits.day) + ' a day', to: 'limits' }),
      SettingRow({ icon: 'list', tone: '', title: 'Standing instructions', right: get().standing.filter(r => r.on).length + ' running', to: 'rules' }),
      SettingRow({ icon: 'card', title: 'Devices', right: get().devices.length + ' signed in', to: 'devices' }),
      SettingRow({ icon: 'key', title: 'Keys and recovery', right: 'Set up', to: 'lostphone' })),
    Group('Your account',
      SettingRow({ icon: 'person', tone: 'accent', title: 'Your details', to: 'settings' }),
      SettingRow({ icon: 'bell', tone: 'warn', title: 'Notifications', to: 'settings' }),
      SettingRow({ icon: 'star', title: 'Saved people', to: 'settings' }),
      SettingRow({ icon: 'card', title: 'Cards', right: '1 virtual', to: 'card' })),
    Group('About',
      SettingRow({ icon: 'chat', title: 'Contact support', to: 'settings' }),
      SettingRow({ icon: 'chat', title: 'Give feedback', to: 'settings' }),
      SettingRow({ icon: 'back', title: 'Sign out', to: 'signin' })),
  ], Dock({ placeholder: 'Ask me to change something', back: () => go('home') })),
};

export const lock = {
  title: 'Lock and privacy',
  render: () => Screen([
    PageHead('Lock and privacy', 'What it takes to open this, and what shows', { big: true }),
    Group('Opening the app',
      SettingRow({ icon: 'faceid', tone: 'accent', title: 'Face ID', toggleKey: 'faceId' }),
      SettingRow({ icon: 'list', title: 'Passcode', right: 'Six digits', to: 'newcode' }),
      SettingRow({ icon: 'clock', title: 'Ask again after', right: '2 minutes', to: 'lock' })),
    Group('What other people can see',
      SettingRow({ icon: 'eye', title: 'Hide my balance', toggleKey: 'hideBalance', onToggle: on => toast(on ? 'Hidden. Tap the balance on home to peek.' : 'Showing again.') }),
      SettingRow({ icon: 'camera', title: 'Hide it in screenshots', toggleKey: 'hideScreenshots' }),
      SettingRow({ icon: 'bell', title: 'Amounts in notifications', toggleKey: 'notifAmounts' })),
    Bubble('With this on, your balance is dots until you look at the phone. Nobody standing behind you in a queue reads it over your shoulder.'),
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
          Row(Glyph('key'), Body('Your passcode. Not your face, because a face can be held up to a phone.')),
          Row(Glyph('list'), Body('Then you type Confirm this transaction in full. Three words, spelled out.'))),
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
  render: () => {
    const s = get();
    const over = 120000 - s.limits.transfer;
    return Screen([
      e('div', { class: 'stack gap-1' },
        e('div', { class: 't-display' }, naira(120000)),
        Meta(`${naira(over)} over the ${naira(s.limits.transfer)} you set for one transfer`, 'c-3')),
      Bubble('This is your limit, not the bank’s. Two things and it goes.'),
      Card(
        e('div', { class: 'row between', style: { padding: '6px 0' } },
          e('div', { class: 'row', style: { gap: '10px' } }, Icon('check', { size: 18 }), e('div', { class: 't-row' }, 'Your passcode')),
          Pill('Done', 'good')),
        Divider(),
        e('div', { class: 'stack gap-2', style: { padding: '8px 0' } },
          e('div', { class: 'row', style: { gap: '10px' } },
            e('div', { class: 'tick tick-wait' }, null),
            e('div', { class: 't-row' }, 'Now type the words in full')),
          e('div', { class: 'card-plain row', style: { gap: '2px' } },
            e('span', { class: 't-row' }, 'Confirm this transa'),
            e('span', { class: 't-row c-3' }, 'ction'),
            e('span', { style: { width: '2px', height: '20px', background: 'var(--accent)' } })),
          Caption('Five letters to go. Exactly those three words, nothing shorter.', 'c-3'))),
      Button(`Send ${naira(s.limits.transfer)} instead`, { onClick: () => { set({ amount: s.limits.transfer }); go('pay'); } }),
      Caption('The rest tomorrow, no typing', 'c-3'),
    ], Dock({ placeholder: 'Ask about this limit', back: () => go('limits') }));
  },
};

export const devicesScreen = {
  title: 'Devices',
  render: () => Screen([
    PageHead('Devices', 'Everywhere this account is open', { big: true }),
    Card(...get().devices.map((d, i) => e('div', null,
      i ? Divider() : null,
      e('div', { class: 'listrow' },
        Glyph(d.name.includes('Chrome') ? 'laptop' : 'airtime'),
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
        Glyph('lock', 'bad'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Freeze the money now'),
          e('div', { class: 'listrow-sub' }, 'Nothing can leave')),
        get().frozen ? e('span', { class: 'pill pill-good' }, 'Frozen') : e('span', { class: 'pill pill-accent' }, 'Do this')),
      Divider(),
      e('div', { class: 'listrow' },
        Glyph('airtime'),
        e('div', { class: 'grow stack gap-1' },
          e('div', { class: 'listrow-title' }, 'Infinix Hot 40'),
          e('div', { class: 'listrow-sub' }, 'Ikeja · signing in now')),
        e('span', { class: 'pill pill-warn' }, 'Not you')),
      Divider(),
      e('div', { class: 'listrow' },
        Glyph('airtime'),
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
            e('div', { class: 'tick' }, Icon('check', { size: 13 })),
            e('div', { class: 't-body c-3' }, t)))));
      host.appendChild(e('div', { class: 'stack gap-1' },
        e('div', { class: 't-title' }, first ? 'Type it once more' : 'A new passcode'),
        Meta(first ? 'The same six, so I know it was not a slip.' : 'Six digits, and not the old ones. Sending stays locked for twelve hours.', 'c-3')));
      host.appendChild(PassPad({
        allowFace: false,
        hint: first ? 'Nothing is saved until both match.' : 'Not 1234, and not your year of birth.',
        onDone: code => {
          if (!first) {
            if (['123456', '000000', '111111'].includes(code)) return { error: 'Not that one. Pick six somebody could not guess.' };
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
