/* Beetle — component kit.
   Every recurring pattern in the Figma file, once. Screens compose these. */

import { ICONS } from './icons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg', 'circle', 'path', 'rect', 'g', 'line', 'text', 'polyline', 'polygon']);

export const el = (tag, props, ...kids) => {
  /* SVG has to be built in its own namespace or the browser draws nothing */
  const node = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
  }
  const add = c => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) return c.forEach(add);
    node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return node;
};

const e = el;
export const frag = (...kids) => { const f = document.createDocumentFragment(); kids.flat().forEach(k => k && f.appendChild(k.nodeType ? k : document.createTextNode(String(k)))); return f; };

/* ---------- money ---------- */
export const naira = n => '₦' + Number(n).toLocaleString('en-NG');
export const nairaFull = n => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const signed = n => (n > 0 ? '+' : '−') + naira(Math.abs(n));

/* ---------- text ---------- */
export const Display = (t, cls = '') => e('div', { class: 't-display ' + cls }, t);
export const Title   = (t, cls = '') => e('div', { class: 't-title ' + cls }, t);
export const Head    = (t, cls = '') => e('div', { class: 't-head ' + cls }, t);
export const Body    = (t, cls = '') => e('div', { class: 't-body ' + cls }, t);
export const Meta    = (t, cls = 'c-3') => e('div', { class: 't-meta ' + cls }, t);
export const Caption = (t, cls = 'c-2') => e('div', { class: 't-caption ' + cls }, t);
export const Label   = (t, cls = '') => e('div', { class: 't-label ' + cls }, t);

/* Page head — the title plus its one line of explanation.
   `big` is a destination you navigate to and stay on; the default is a moment. */
export const PageHead = (title, sub, { big = false } = {}) =>
  e('div', { class: 'stack gap-1', style: { marginBottom: '18px' } },
    e('div', { class: big ? 't-title' : 't-head' }, title),
    sub && Meta(sub, 'c-3'));

/* ---------- containers ---------- */
export const Card = (...kids) => e('div', { class: 'card stack gap-3' }, ...kids);
export const Plain = (...kids) => e('div', { class: 'card-plain stack gap-3' }, ...kids);
export const Stack = (gap, ...kids) => e('div', { class: `stack gap-${gap}` }, ...kids);
export const Row = (...kids) => e('div', { class: 'row' }, ...kids);
export const Between = (...kids) => e('div', { class: 'row between' }, ...kids);
export const Divider = () => e('div', { class: 'divider' });
export const Spacer = h => e('div', { style: { height: h + 'px', flex: 'none' } });

/* ---------- icons ---------- */
/* One of the ninety-seven glyphs from the Figma file, drawn as SVG and taking
   its colour from the text around it. Two or three characters of initials are
   allowed instead, for the round avatars the design uses. */
export const Icon = (name, { size = 24, cls = '' } = {}) => {
  const d = ICONS[name];
  if (!d) {
    /* a name that is not in the set is a mistake worth seeing, not hiding */
    console.warn(`No icon called "${name}".`);
    return e('span', { class: 'icon-missing', title: name }, '?');
  }
  return e('svg', {
    class: 'icon ' + cls, 'data-icon': name, width: String(size), height: String(size),
    viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true', html: d,
  });
};

/* ---------- glyph ---------- */
/* The rounded tile an icon sits in. Pass an icon name, or a short string for
   the initials the design shows on a person. */
export const Glyph = (icon, tone = '', { lg = false, circle = false } = {}) =>
  e('div', { class: `glyph ${lg ? 'glyph-lg' : ''} ${circle ? 'glyph-circle' : ''} ${tone ? 'glyph-' + tone : ''}` },
    ICONS[icon] ? Icon(icon, { size: lg ? 28 : 20 }) : e('span', { class: 'glyph-text' }, icon));

/* ---------- list row ---------- */
export const ListRow = ({ icon, tone, title, sub, right, rightSub, chev = true, onClick }) =>
  e('div', { class: 'listrow', onClick },
    icon !== undefined && Glyph(icon, tone),
    e('div', { class: 'grow stack gap-1' },
      e('div', { class: 'listrow-title' }, title),
      sub && e('div', { class: 'listrow-sub' }, sub)),
    right !== undefined && e('div', { class: 'stack gap-1', style: { textAlign: 'right' } },
      e('div', { class: 't-label' }, right),
      rightSub && e('div', { class: 't-caption c-3' }, rightSub)),
    chev && e('div', { class: 'chev' }, Icon('chevron', { size: 20 })));

/* A ledger line: name, what it was, and the amount. */
export const TxRow = ({ icon, tone, name, detail, amount, amountClass = '', onClick }) =>
  e('div', { class: 'listrow', onClick },
    Glyph(icon, tone),
    e('div', { class: 'grow stack gap-1' },
      e('div', { class: 'listrow-title' }, name),
      detail && e('div', { class: 'listrow-sub' }, detail)),
    e('div', { class: 't-label ' + amountClass }, amount));

/* label / value line inside a receipt or summary card */
export const Field = (k, v, note) =>
  e('div', { class: 'stack gap-1' },
    e('div', { class: 't-caption c-2' }, k),
    e('div', { class: 't-row' }, v),
    note && e('div', { class: 't-caption c-3' }, note));

/* ---------- buttons ---------- */
export const Button = (label, { kind = 'primary', onClick, icon } = {}) =>
  e('button', { class: `btn btn-${kind} press`, onClick },
    icon ? (icon.nodeType ? icon : Icon(icon, { size: 18 })) : null, label);
export const Ghost = (label, onClick) => e('button', { class: 'btn btn-ghost', onClick }, label);
export const Chip = (label, pressed, onClick) =>
  e('button', { class: 'chip', 'aria-pressed': pressed ? 'true' : 'false', onClick }, label);

/* An action a screen offers: icon, what it does, what it costs you. */
export const ActionRow = ({ icon, tone, title, sub, onClick }) =>
  e('div', { class: 'card', style: { padding: '4px 12px', cursor: 'pointer' }, onClick },
    e('div', { class: 'listrow' },
      Glyph(icon, tone),
      e('div', { class: 'grow stack gap-1' },
        e('div', { class: 'listrow-title' }, title),
        sub && e('div', { class: 'listrow-sub' }, sub)),
      e('div', { class: 'chev' }, Icon('chevron', { size: 20 }))));

/* ---------- the agent ---------- */
export const AgentMark = () => e('div', { class: 'agent-mark' }, Icon('mark', { size: 26 }));
export const Bubble = text =>
  e('div', { class: 'row', style: { alignItems: 'flex-start', gap: '10px' } },
    AgentMark(),
    e('div', { class: 'bubble' }, text));
export const Said = (text, { spoken = false } = {}) =>
  e('div', { class: 'row', style: { justifyContent: 'flex-end' } },
    e('div', { class: 'bubble-me' + (spoken ? ' bubble-spoken' : '') },
      spoken ? Icon('mic', { size: 16 }) : null, e('span', null, text)));
export const Typing = () =>
  e('div', { class: 'row', style: { alignItems: 'flex-start', gap: '10px' } },
    AgentMark(),
    e('div', { class: 'bubble' },
      e('span', { class: 'typing' }, e('i'), e('i'), e('i')),
      e('span', { style: { marginLeft: '8px', color: 'var(--text-tertiary)' } }, 'Beetle is digging')));

/* The agent showing its working: what it checked, and what it is unsure of. */
export const ToolPanel = (title, state, rows) =>
  e('div', { class: 'tool' },
    e('div', { class: 'tool-head' },
      Icon('send', { size: 16 }), e('b', null, title),
      e('span', { class: 'tool-state' }, e('i', { class: 'dot' }), state)),
    ...rows.map(r => e('div', { class: 'tool-row' },
      /* the design ships these three as finished glyphs, so draw them rather
         than faking a circle in CSS */
      Icon(r.done === false ? 'step-todo' : r.done === 'work' ? 'step-work' : 'step-done', { size: 18, cls: 'step' }),
      e('div', { class: 'k' }, r.k),
      e('div', { class: 'v ' + (r.tone || '') }, r.v))));

/* ---------- banners and notes ---------- */
export const Banner = (text, tone = 'good') => e('div', { class: `banner banner-${tone}` }, text);
export const Note = (text, icon = 'lock') => e('div', { class: 'note' }, Icon(icon, { size: 16 }), e('span', null, text));
export const Pill = (text, tone = 'accent') => e('span', { class: `pill pill-${tone}` }, text);

/* ---------- timeline ---------- */
export const Timeline = rows =>
  e('div', { class: 'stack' }, ...rows.map((r, i) =>
    e('div', { class: 'timeline-row', style: i ? { borderTop: '1px solid var(--rule)' } : {} },
      e('div', { class: 'tick ' + (r.done ? '' : 'tick-wait') }, r.done ? Icon('check', { size: 13 }) : null),
      e('div', { class: 'grow t-meta', style: { color: r.done ? 'var(--text-secondary)' : 'var(--text-tertiary)' } }, r.k),
      e('div', { class: 't-label' }, r.v))));

/* ---------- meter ---------- */
export const Meter = (pct, colour) =>
  e('div', { class: 'meter' }, e('i', { style: { width: Math.max(0, Math.min(100, pct)) + '%', background: colour || 'var(--accent)' } }));

/* ---------- keypad ---------- */
export const Pips = (filled, total = 4) =>
  e('div', { class: 'pips' }, ...Array.from({ length: total }, (_, i) => e('div', { class: 'pip ' + (i < filled ? 'on' : '') })));

export const Keypad = (onKey) =>
  e('div', { class: 'keypad' },
    ...['1','2','3','4','5','6','7','8','9'].map(d => e('button', { class: 'key', onClick: () => onKey(d) }, d)),
    e('button', { class: 'key key-blank', 'aria-label': 'Face ID', onClick: () => onKey('face') }, Icon('faceid', { size: 26 })),
    e('button', { class: 'key', onClick: () => onKey('0') }, '0'),
    e('button', { class: 'key key-blank', 'aria-label': 'Delete', onClick: () => onKey('del') }, Icon('del', { size: 26 })));

/* ---------- phone keyboard (for typed flows) ---------- */
const KB = [['q','w','e','r','t','y','u','i','o','p'], ['a','s','d','f','g','h','j','k','l'], ['z','x','c','v','b','n','m']];
export const Keyboard = (onKey, sendLabel = 'send') =>
  e('div', { class: 'kbd' },
    ...KB.map((rowKeys, i) => e('div', { class: 'kbd-row' },
      i === 2 ? e('button', { class: 'kbd-key wide dark', 'aria-label': 'Shift', onClick: () => onKey('shift') }, Icon('up', { size: 18 })) : null,
      ...rowKeys.map(k => e('button', { class: 'kbd-key', onClick: () => onKey(k) }, k)),
      i === 2 ? e('button', { class: 'kbd-key wide dark', 'aria-label': 'Backspace', onClick: () => onKey('back') }, Icon('del', { size: 18 })) : null)),
    e('div', { class: 'kbd-row' },
      e('button', { class: 'kbd-key wide dark', onClick: () => onKey('123') }, '123'),
      e('button', { class: 'kbd-key', style: { flex: 4 }, onClick: () => onKey(' ') }, ' '),
      e('button', { class: 'kbd-key wide', style: { background: 'var(--accent)', color: '#fff' }, onClick: () => onKey('send') }, sendLabel)));

/* ---------- waveform ---------- */
export const Waveform = (bars = 26, seed = 7) => {
  const w = e('div', { class: 'waveform' });
  let s = seed;
  for (let i = 0; i < bars; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const h = 6 + (s % 100) / 100 * 28;
    w.appendChild(e('i', { style: { height: h.toFixed(0) + 'px', opacity: 0.35 + (s % 65) / 100 } }));
  }
  return w;
};

/* ---------- dock ---------- */
export const Dock = ({ placeholder = 'Ask, or just say what you need', back, onAsk, fab = 'fab-plus', onFab } = {}) => {
  /* Every ask bar answers, on every screen. A screen that wants to do
     something particular with what you typed passes its own onAsk; the rest
     hand it to the agent. */
  onAsk = onAsk || (q => window.beetleAsk(q));
  const input = e('input', { placeholder, 'aria-label': 'Ask Beetle' });
  const fire = () => {
    const v = input.value.trim(); if (!v) return; input.value = '';
    /* "show me what happens when it fails" is a request to be taken somewhere,
       and it works from any screen. Anything else is the screen's own to answer. */
    if (window.beetleShow && window.beetleShow(v)) return;
    onAsk && onAsk(v);
  };
  input.addEventListener('keydown', ev => { if (ev.key === 'Enter') fire(); });
  return e('div', { class: 'dock' },
    back && e('button', { class: 'backbtn', 'aria-label': 'Back', onClick: back }, Icon('back', { size: 20 })),
    /* the design ends the ask bar with a camera and a microphone, not a send
       arrow: you point it at something, or you talk to it */
    e('div', { class: 'askbar' }, AgentMark(), input,
      e('button', { class: 'askbar-btn press', 'aria-label': 'Scan something', onClick: () => window.beetleGo('scan') }, Icon('camera', { size: 19 })),
      e('button', { class: 'askbar-btn press', 'aria-label': 'Speak', onClick: fire }, Icon('mic', { size: 19 }))),
    onFab !== undefined && e('button', { class: 'fab', 'aria-label': 'What can I do', onClick: onFab }, Icon(fab, { size: 22 })));
};

/* ---------- sheet over a screen ---------- */
export const Sheet = (base, ...kids) =>
  frag(base, e('div', { class: 'scrim' }), e('div', { class: 'sheet stack gap-4' }, e('div', { class: 'sheet-grab' }), ...kids));

/* ---------- screen wrapper ---------- */
/* The dock is a sibling of the scroller, not a child of it. Inside, it is
   anchored to the bottom of the scrolling content and slides away as you
   read; outside, it stays where a thumb expects it. */
export const Screen = (body, dock) =>
  frag(
    e('div', { class: 'screen-scroll' },
      e('div', { class: 'pad top-pad bottom-pad stack gap-5' }, body)),
    dock || null);

/* ================================================================ *
 * Controls that actually do something.
 * Everything below holds no state of its own: it reads a value, and
 * calls back when the person changes it. The store is the truth.
 * ================================================================ */

/* ---------- a switch that flips ---------- */
export const Toggle = (on, onChange) => {
  const b = e('button', { class: 'toggle', role: 'switch', 'aria-checked': on ? 'true' : 'false' }, e('i'));
  b.addEventListener('click', () => {
    const next = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', next ? 'true' : 'false');
    onChange && onChange(next);
  });
  return b;
};

/* ---------- typing an amount ---------- */
/* Digits build up from the right, the way a bank keypad works: 2, 20, 205,
   2050. onChange gets the naira figure after every key. */
export const AmountPad = ({ value = 0, onChange, prefix = '₦', max = 100000000 }) => {
  let digits = value ? String(Math.round(value)) : '';
  /* The pad opens showing what is already set, but the first digit you press
     starts a new figure rather than appending to it — otherwise changing
     ₦20,000 to ₦750 silently gives you ₦20,000,750. */
  let fresh = true;
  const line = e('div', { class: 'amount-line' });

  const draw = () => {
    line.innerHTML = '';
    const n = digits ? Number(digits) : 0;
    const dim = !digits || fresh;
    line.appendChild(e('span', { class: dim ? 'ghost' : '' }, prefix));
    line.appendChild(e('span', { class: dim ? 'ghost' : '' }, digits ? n.toLocaleString('en-NG') : '0'));
    line.appendChild(e('div', { class: 'amount-caret' }));
  };

  const key = k => {
    if (k === 'face') return;
    if (k === 'del') { digits = fresh ? '' : digits.slice(0, -1); fresh = false; }
    else {
      if (fresh) { digits = ''; fresh = false; }
      if (digits.length < 9 && Number(digits + k) <= max) digits = (digits + k).replace(/^0+(?=\d)/, '');
    }
    draw();
    onChange && onChange(digits ? Number(digits) : 0);
  };

  draw();
  return e('div', { class: 'stack gap-3' }, line, Keypad(key));
};

/* ---------- typing a passcode ---------- */
/* Four real digits, checked against the one that is set. Wrong shakes the
   pips and says how many tries are left. */
export const PassPad = ({ length = 6, onDone, hint, allowFace = true, onFace }) => {
  let code = '';
  let error = null;
  const host = e('div', { class: 'stack gap-3 center' });

  const draw = () => {
    host.innerHTML = '';
    const pips = e('div', { class: 'pips' + (error ? ' shake' : '') },
      ...Array.from({ length }, (_, i) =>
        e('div', { class: 'pip ' + (error ? 'err' : i < code.length ? 'on' : '') })));
    host.appendChild(pips);
    host.appendChild(e('div', { class: 't-meta ' + (error ? '' : 'c-3'), style: error ? { color: 'var(--bad-bright)' } : {} },
      error || hint || 'Nothing moves until the last number lands.'));
    host.appendChild(Keypad(k => {
      if (k === 'face') { if (allowFace && onFace) onFace(); return; }
      error = null;
      if (k === 'del') code = code.slice(0, -1);
      else if (code.length < length) code += k;
      draw();
      if (code.length === length) {
        setTimeout(() => {
          const res = onDone(code);
          if (res && res.error) { error = res.error; code = ''; draw(); }
        }, 160);
      }
    }));
  };

  draw();
  return host;
};

/* ---------- slide to send ---------- */
/* A deliberate gesture, so nothing large leaves on a mis-tap. Works with a
   mouse and with a finger, and a keyboard can do it with Enter. */
export const Slide = (label, onDone) => {
  const fill = e('div', { class: 'slide-fill' });
  const text = e('div', { class: 'slide-label' }, label);
  const thumb = e('button', { class: 'slide-thumb', 'aria-label': label }, Icon('slide-arrow', { size: 22 }));
  const track = e('div', { class: 'slide' }, fill, text, thumb);

  let dragging = false, done = false;
  const span = () => track.clientWidth - 58;

  const move = x => {
    if (done) return;
    const pos = Math.max(0, Math.min(span(), x));
    thumb.style.left = (pos + 4) + 'px';
    fill.style.width = (pos + 54) + 'px';
    if (pos >= span() - 4) finish();
  };
  const finish = () => {
    done = true; dragging = false;
    track.classList.add('armed');
    thumb.innerHTML = ''; thumb.appendChild(Icon('check', { size: 22 }));
    thumb.style.left = (span() + 4) + 'px';
    fill.style.width = '100%';
    setTimeout(onDone, 180);
  };
  const reset = () => {
    if (done) return;
    dragging = false;
    thumb.style.left = '4px';
    fill.style.width = '0';
  };

  thumb.addEventListener('pointerdown', ev => {
    if (done) return;
    dragging = true; thumb.setPointerCapture(ev.pointerId);
  });
  thumb.addEventListener('pointermove', ev => {
    if (!dragging) return;
    move(ev.clientX - track.getBoundingClientRect().left - 29);
  });
  thumb.addEventListener('pointerup', reset);
  thumb.addEventListener('pointercancel', reset);
  thumb.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); finish(); } });
  /* a plain click still works, for anyone who cannot drag */
  thumb.addEventListener('click', ev => { if (!dragging && !done) finish(); });

  return track;
};

/* ---------- a line you can tap to change ---------- */
export const EditRow = (label, value, note, onEdit) =>
  e('div', { class: 'row between edit-row', style: { padding: '4px 0' }, role: 'button', tabindex: '0', onClick: onEdit },
    e('div', { class: 'stack gap-1 grow' },
      e('div', { class: 't-caption c-2' }, label),
      e('div', { class: 't-row' }, value),
      note && e('div', { class: 't-caption c-3' }, note)),
    e('div', { class: 'edit-hint' }, 'Change'));

/* ---------- a passing message ---------- */
export function toast(text) {
  const host = document.getElementById('phone-screen');
  if (!host) return;
  host.querySelectorAll('.toast').forEach(t => t.remove());
  const t = e('div', { class: 'toast' }, text);
  host.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 220); }, 2200);
}

/* ---------- writing with the phone keyboard ---------- */
/* The keys type into a real string. Shift and 123 are honest about doing
   nothing yet, rather than pretending. */
export const TextPad = ({ value = '', placeholder = '', onChange, onSend, sendLabel = 'send' }) => {
  let text = value;
  let caps = false;
  /* What is already there is an example, not something to type on the end of:
     the first key you press replaces it. */
  let fresh = Boolean(value);
  const line = e('div', { class: 't-title', style: { minHeight: '30px' } });
  const draw = () => {
    line.innerHTML = '';
    line.appendChild(e('span', { class: text && !fresh ? '' : 'c-3' }, text || placeholder));
    line.appendChild(e('span', { style: { color: 'var(--accent)' } }, '|'));
    onChange && onChange(text);
  };
  const kb = Keyboard(k => {
    if (k === 'send') return onSend && onSend(text);
    if (k === 'shift') { caps = !caps; return; }
    if (k === '123') return;
    if (k === 'back') { text = fresh ? '' : text.slice(0, -1); fresh = false; }
    else {
      if (fresh) { text = ''; fresh = false; }
      text += caps ? k.toUpperCase() : k;
    }
    if (caps && k.length === 1 && k !== ' ') caps = false;
    draw();
  }, sendLabel);
  draw();
  return { line, kb, get text() { return text; } };
};

/* ---------- a row of chips that actually filters ---------- */
export const ChipRow = (options, current, onPick) =>
  e('div', { class: 'row', style: { gap: '8px' } },
    ...options.map(o => e('button', {
      class: 'chip press', 'aria-pressed': o.id === current ? 'true' : 'false',
      onClick: () => onPick(o.id),
    }, o.label)));

/* ---------- pick one of a few ---------- */
export const Picker = (options, current, onPick) =>
  e('div', { class: 'stack gap-2' },
    ...options.map(o => e('button', {
      class: 'card press',
      style: {
        padding: '14px', cursor: 'pointer', textAlign: 'left',
        border: o.id === current ? '2px solid var(--accent)' : '2px solid transparent',
      },
      onClick: () => onPick(o.id),
    },
      e('div', { class: 'row between' },
        e('div', { class: 'stack gap-1' },
          e('div', { class: 't-row' }, o.label),
          o.sub && e('div', { class: 't-caption c-3' }, o.sub)),
        e('div', { class: 'tick ' + (o.id === current ? '' : 'tick-wait') }, o.id === current ? Icon('check', { size: 13 }) : null)))));
