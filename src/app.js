/* Beetle — the app. One phone on the page and nothing beside it.

   There is no screen picker and no index. You get around the way you would
   get around a bank app: you tap things, you press back, you type into the
   ask bar. The states nobody can cause on purpose — the bank declining, a
   phone going missing, a dispute reaching day three — are reachable by
   asking for them, because asking is what this product is. */

import { el } from './ui.js';
import { SCREENS, ACTS } from './screens/index.js';
import { setQuestion } from './screens/home.js';
import { initAgent } from './agent.js';
import { get } from './store.js';

const e = el;

/* Signed out you start at the front door. Once you are in you land at home
   and stay there across reloads, the way an app you have already opened does. */
const SESSION = 'beetle.session';
const FRONT = 'start';
const HOME = 'home';
const INSIDE = ['home', 'firsthome'];

const signedIn = () => { try { return localStorage.getItem(SESSION) === '1'; } catch { return false; } };
const remember = () => { try { localStorage.setItem(SESSION, '1'); } catch { /* private window */ } };

let current = null;
let trail = [];
let direction = 'forward';

function go(id, push = true) {
  if (!SCREENS[id]) {
    /* only ever a mistyped address: the registry checks itself at load */
    if (id) console.warn(`No screen called "${id}". Going home.`);
    id = signedIn() ? HOME : FRONT;
  }
  if (INSIDE.includes(id)) remember();

  /* going back to where you just came from should feel like going back */
  if (trail[trail.length - 2] === id) { trail.pop(); direction = 'back'; }
  else if (id !== current) { trail.push(id); direction = 'forward'; }
  if (trail.length > 40) trail = trail.slice(-40);

  current = id;
  if (push && location.hash !== '#/' + id) location.hash = '#/' + id;
  paint();
}

/* ---------------------------------------------------------------- *
 * The ask bar
 * ---------------------------------------------------------------- */

/* Asking to be shown something is a different act from asking a question, and
   only the first one moves you. "Show me what happens when it fails" goes to
   that screen; "how much did I spend" goes to the agent, which is also how
   "send 20k to Sarah" keeps working. */
const SHOW = /^\s*(show|take|go|open|jump|let me see|see|what happens|what does it look|i want to see)\b/i;
const words = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
const SKIP = new Set(['show','take','give','let','see','look','like','what','when','where','how','the','a','an','me','to','it','is','does','do','on','of','my','you','your','i','want','happens','screen','page','if','and','for','that','this','there','was','not','but','goes','go','open']);

/* A screen answers to its own name, its title, and the words of the section it
   belongs to. The section is what carries the plain language — "When the
   network is not there" is how a person would ask for the screen whose id is
   nonetwork and whose title is "You are offline". */
const VOCAB = (() => {
  const v = {};
  for (const a of ACTS) for (const sec of a.sections) for (const id of sec.screens) {
    v[id] = words(`${id} ${(SCREENS[id] || {}).title || ''} ${sec.name} ${sec.aim || ''}`);
  }
  return v;
})();

function findScreen(q) {
  const asked = words(q).filter(w => !SKIP.has(w));
  if (!asked.length) return null;
  const stem = w => w.slice(0, 4);
  let best = null, bestScore = 0;
  for (const id of Object.keys(VOCAB)) {
    const hay = VOCAB[id];
    let hits = 0;
    for (const w of asked) if (hay.some(h => stem(h) === stem(w))) hits++;
    const score = hits / asked.length;
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return bestScore >= 0.5 ? best : null;
}

/* Asking to be shown something moves you, and says so by returning true.
   It runs ahead of whatever the screen itself does with the ask bar. */
function showBeetle(q) {
  const text = String(q || '').trim();
  if (!text || !SHOW.test(text)) return false;
  const id = findScreen(text);
  if (!id || id === current) return false;
  go(id);
  return true;
}

function askBeetle(q) {
  const text = String(q || '').trim();
  if (!text) return;
  if (showBeetle(text)) return;
  setQuestion(text);
  go('agentchat');
}

window.beetleGo = go;                    // screens move between each other with this
window.beetleRepaint = () => paint();    // and redraw in place after changing something
window.beetleAsk = askBeetle;            // an ask bar with nothing of its own ends up here
window.beetleShow = showBeetle;          // and every ask bar checks this one first
window.beetleState = get;                // what the tests read the account through

/* ---------------------------------------------------------------- *
 * Drawing
 * ---------------------------------------------------------------- */

function paint() {
  const screen = SCREENS[current];
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
  document.title = (screen && screen.title) ? `Beetle — ${screen.title}` : 'Beetle';
}

function boot() {
  document.body.appendChild(
    e('div', { class: 'app' },
      e('div', { class: 'phone' }, e('div', { class: 'phone-screen', id: 'phone-screen' }))));

  /* Every hash is a history entry, so the browser's own back button is the
     app's back button and nothing extra has to be wired for it.

     Going somewhere sets the hash, which fires this, which would draw the
     screen a second time. Anything a screen consumes as it renders — the
     question you just typed, for one — would be eaten by the first draw and
     gone by the second, so the echo is ignored. */
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#/', '');
    if (id === current) return;
    go(id, false);
  });

  const asked = location.hash.replace('#/', '');
  go(asked || (signedIn() ? HOME : FRONT), false);

  initAgent();
}

document.addEventListener('DOMContentLoaded', boot);
