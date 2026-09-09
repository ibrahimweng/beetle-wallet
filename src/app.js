/* Beetle — the harness. Phone frame, routing, and the index down the left. */

import { el } from './ui.js';
import { SCREENS, ACTS } from './screens/index.js';
import { initAgent } from './agent.js';
import { get, reset as resetStore } from './store.js';
import { clear as clearDraft } from './flow.js';

const e = el;
const flat = () => ACTS.flatMap(a => a.sections.flatMap(s => s.screens));

let current = null;
let trail = [];
let direction = 'forward';

function go(id, push = true) {
  if (!SCREENS[id]) {
    /* only ever a mistyped address: the registry checks itself at load */
    if (id) console.warn(`No screen called "${id}". Showing the first one.`);
    id = flat()[0];
  }

  /* going back to where you just came from should feel like going back */
  if (trail[trail.length - 2] === id) { trail.pop(); direction = 'back'; }
  else if (id !== current) { trail.push(id); direction = 'forward'; }
  if (trail.length > 40) trail = trail.slice(-40);

  current = id;
  if (push && location.hash !== '#/' + id) location.hash = '#/' + id;
  paint();
}
window.beetleGo = go;                    // screens move between each other with this
window.beetleRepaint = () => paint();    // and redraw in place after changing something
window.beetleState = get;                // handy in the console, and what the tests read

function meta(id) {
  for (const a of ACTS) for (const s of a.sections) if (s.screens.includes(id)) return { act: a.name, section: s.name, aim: s.aim };
  return { act: '', section: '', aim: '' };
}

function paintRail(filter = '') {
  const rail = document.getElementById('rail-body');
  rail.innerHTML = '';
  const q = filter.trim().toLowerCase();
  for (const a of ACTS) {
    const secs = a.sections
      .map(s => ({ ...s, screens: s.screens.filter(id => !q || id.includes(q) || (SCREENS[id]?.title || '').toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) }))
      .filter(s => s.screens.length);
    if (!secs.length) continue;
    rail.appendChild(e('div', { class: 'rail-act' }, a.name));
    for (const s of secs) {
      rail.appendChild(e('div', { class: 'rail-sec' }, s.name));
      for (const id of s.screens) {
        rail.appendChild(e('button', {
          class: 'rail-link',
          'aria-current': id === current ? 'true' : 'false',
          onClick: () => go(id),
        }, e('span', null, SCREENS[id]?.title || id), e('em', null, id)));
      }
    }
  }
  if (!q) {
    const s = get();
    rail.appendChild(e('div', { class: 'rail-foot' },
      e('button', {
        class: 'stage-btn', style: { width: '100%' },
        onClick: () => {
          if (!confirm('Put the money back to the figures in the design?')) return;
          resetStore(); clearDraft(); paint();
        },
      }, 'Reset the account'),
      e('p', null, `Everyday ₦${s.everyday.toLocaleString('en-NG', { minimumFractionDigits: 2 })} · $${s.dollars.toFixed(2)} · ${s.ledger.length} entries. Anything you do here is kept in this browser and nowhere else.`)));
  }
}

function paint() {
  const m = meta(current);
  const screen = SCREENS[current];
  document.getElementById('stage-title').textContent = `${m.section} — ${screen?.title || current}`;
  document.getElementById('stage-sub').textContent = m.aim || '';

  const list = flat();
  const i = list.indexOf(current);
  document.getElementById('nav-count').textContent = `${i + 1} of ${list.length}`;
  const prev = document.getElementById('nav-prev');
  const next = document.getElementById('nav-next');
  prev.disabled = i <= 0;
  next.disabled = i >= list.length - 1;
  prev.onclick = () => go(list[i - 1]);
  next.onclick = () => go(list[i + 1]);

  const host = document.getElementById('phone-screen');
  host.classList.toggle('back', direction === 'back');
  host.innerHTML = '';
  host.appendChild(e('div', { class: 'phone-notch' }));
  try {
    host.appendChild(screen.render());
  } catch (err) {
    host.appendChild(e('div', { class: 'pad top-pad stack gap-3' },
      e('div', { class: 't-head' }, 'This screen did not draw'),
      e('div', { class: 't-meta c-3' }, String(err && err.message || err))));
    console.error(current, err);
  }
  paintRail(document.getElementById('rail-search').value);
}

function boot() {
  document.body.appendChild(
    e('div', { class: 'harness' },
      e('div', { class: 'rail' },
        e('div', { class: 'rail-brand' }, e('b', null, 'Beetle'), e('span', null, 'concept build')),
        e('input', { class: 'rail-search', id: 'rail-search', placeholder: 'Find a screen', oninput: ev => paintRail(ev.target.value) }),
        e('div', { id: 'rail-body' })),
      e('div', { class: 'stage' },
        e('div', { class: 'stage-head' },
          e('div', null,
            e('h1', { class: 'stage-title', id: 'stage-title' }, ''),
            e('p', { class: 'stage-sub', id: 'stage-sub' }, '')),
          e('div', { class: 'stage-nav' },
            e('button', { class: 'stage-btn', id: 'nav-prev' }, '‹ Prev'),
            e('span', { class: 'stage-count', id: 'nav-count' }, ''),
            e('button', { class: 'stage-btn', id: 'nav-next' }, 'Next ›'),
            e('button', { class: 'stage-btn', id: 'agent-badge', title: 'How the agent is answering' }, 'Agent: …'))),
        e('div', { class: 'phone' }, e('div', { class: 'phone-screen', id: 'phone-screen' })))));

  window.addEventListener('hashchange', () => go(location.hash.replace('#/', ''), false));
  document.addEventListener('keydown', ev => {
    if (ev.target.tagName === 'INPUT') return;
    const list = flat(); const i = list.indexOf(current);
    if (ev.key === 'ArrowRight' && i < list.length - 1) go(list[i + 1]);
    if (ev.key === 'ArrowLeft' && i > 0) go(list[i - 1]);
  });

  go(location.hash.replace('#/', '') || flat()[0], false);

  initAgent().then(m => {
    const badge = document.getElementById('agent-badge');
    badge.textContent = { sample: 'Agent: live', key: 'Agent: live (your key)', offline: 'Agent: written answers' }[m] || 'Agent: written answers';
    badge.title = m === 'offline'
      ? 'No model reachable, so the agent answers from the wording in the design. Press to add a key and make it think.'
      : 'The agent is answering with a real model.';
    badge.onclick = () => {
      const key = prompt('Anthropic API key. It is kept in this browser only and never leaves it except to Anthropic.',
        localStorage.getItem('beetle.anthropicKey') || '');
      if (key === null) return;
      if (key.trim()) localStorage.setItem('beetle.anthropicKey', key.trim());
      else localStorage.removeItem('beetle.anthropicKey');
      location.reload();
    };
  });
}

document.addEventListener('DOMContentLoaded', boot);
