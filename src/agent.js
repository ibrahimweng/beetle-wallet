/* Beetle — the agent.

   Two ways to reach a model, picked automatically:
     published page  -> claude.use("sample"), the viewer's own Claude, no key needed
     run from repo   -> your own Anthropic key, read from beetle.config.js or localStorage

   If neither is available the agent still answers, from the wording in the design,
   so the app is never dead. */

import { contacts, loan, me } from './data.js';
import { get, dollarsInNaira, leftToday, byDay } from './store.js';
import { draft } from './flow.js';

/* The brief is built fresh on every question, from the live account, so the
   agent is answering about the money as it stands and not as it was written
   into the design. */
const voice = () => {
  const s = get();
  const money = n => '₦' + Number(n).toLocaleString('en-NG');
  const rows = day => byDay(day).map(r => `${r.name}, ${r.detail}, ${r.amount > 0 ? 'in' : 'out'} ${money(Math.abs(r.amount))} at ${r.time}${r.status !== 'done' ? ' (' + r.status + ')' : ''}`).join('; ') || 'nothing';

  return `You are Beetle, the agent inside a Nigerian bank app. You are speaking to ${me.name}.

How you talk:
- Plain words. Short sentences. No jargon, no exclamation marks, no emoji.
- Say what is true, including what you cannot do. Never pretend a limit away.
- Never invent a transaction, a balance or a fee. If you do not know, say so.
- When something fails, say whose fault it is and what happens to the money.
- When you are unsure about an amount, say you are unsure and ask.
- You never move money without the person confirming with Face ID or a passcode.
- Keep answers to three sentences unless asked for more.
- You are called Beetle. Never call yourself anything else.

What you know right now:
- Everyday balance ${money(s.everyday)}. Dollars $${s.dollars.toFixed(2)}, worth about ${money(dollarsInNaira())} at ₦${s.rate} to $1.
- Money health ${s.health} out of 100, up 4 since July.
- Limits: ${money(s.limits.transfer)} per transfer, ${money(s.limits.day)} a day, ${money(s.limits.month)} a month. ${money(s.outToday)} has gone out today, so ${money(leftToday())} is left.
- A transfer costs ₦25 plus 7.5% VAT, and nothing at all under ₦10,000.
- Today: ${rows('today')}.
- Yesterday: ${rows('yesterday')}.
- The payment being put together right now: ${money(draft.amount)} to ${draft.to && draft.to.name}, ${draft.to && draft.to.bank} ${draft.to && draft.to.account}.
- Savings goal "${s.goal.name}": ${money(s.goal.saved)} of ${money(s.goal.target)}, ${Math.round(s.goal.saved / s.goal.target * 100)}% there, due ${s.goal.by}${s.goal.paused ? ', currently paused' : ''}.
- Borrowing: up to ${money(loan.principal)} over ${loan.days} days. It costs ${money(loan.total - loan.principal)} on ${money(loan.principal)}, which is about ${loan.nominalApr}% nominal APR and ${loan.effectiveApr}% effective. Always say the APR if credit comes up.
- The account is ${s.frozen ? 'frozen' : 'not frozen'}. The card is ${s.card.frozen ? 'frozen' : 'active'}.`;
};

/* Replies used when no model is reachable. Wording from the design. */
const money = n => '₦' + Number(n).toLocaleString('en-NG');

const FALLBACK = () => [
  [/fail|did not go|didn.?t go|declin/i, 'Nothing was taken and nothing was charged. GTBank has been failing since 13:40, so this is their afternoon, not your account.'],
  [/back|recall|reverse|wrong person/i, 'I have asked GTBank. I cannot take it back myself. It is her money until she agrees, and no bank can force her.'],
  [/balance|how much.*have/i, `Everyday is ${money(get().everyday)}, and you hold $${get().dollars.toFixed(2)} in dollars.`],
  [/limit/i, `${money(get().limits.transfer)} per transfer and ${money(get().limits.day)} a day. ${money(get().outToday)} has gone out today, so ${money(leftToday())} is left before I stop and ask you twice.`],
  [/borrow|loan|credit/i, `${money(loan.principal)} over ${loan.days} days costs you ${money(loan.total - loan.principal)}. That is about ${loan.nominalApr}% APR. I would rather you knew that before the slider.`],
  [/dollar|convert|rate/i, `The rate is ₦${get().rate} to $1 today. You hold $${get().dollars.toFixed(2)}, about ${money(dollarsInNaira())}.`],
  [/spend|where.*money|month/i, 'You spent ₦18,900 on airtime and data last month. That is your highest month this year.'],
  [/save|goal|holiday/i, `${get().goal.name} has ${money(get().goal.saved)} of ${money(get().goal.target)}. You are a fortnight ahead of where you need to be.`],
  [/can you|what can you do/i, 'I can send money, pay bills, buy airtime, read a bill off a photograph, and explain anything that went wrong. I will not move money without your face or your passcode.'],
];

let mode = 'pending';   // pending | sample | key | offline
let sampleFn = null;

export function agentMode() { return mode; }

async function localKey() {
  try {
    const stored = localStorage.getItem('beetle.anthropicKey');
    if (stored) return stored;
  } catch (e) { /* private window */ }
  try {
    const cfg = await import('../beetle.config.js');
    if (cfg && cfg.anthropicKey) return cfg.anthropicKey;
  } catch (e) { /* no config file, which is normal */ }
  return null;
}

/* On a published page window.claude appears a moment after the script runs,
   so give it a few seconds before deciding there is no model. */
function waitForClaude(ms = 4000) {
  return new Promise(resolve => {
    if (window.claude && typeof window.claude.use === 'function') return resolve(true);
    const started = Date.now();
    const t = setInterval(() => {
      if (window.claude && typeof window.claude.use === 'function') { clearInterval(t); resolve(true); }
      else if (Date.now() - started > ms) { clearInterval(t); resolve(false); }
    }, 120);
  });
}

export async function initAgent() {
  try {
    if (await waitForClaude()) {
      const s = await window.claude.use('sample');
      if (s) { sampleFn = s; mode = 'sample'; return mode; }
    }
  } catch (e) { /* fall through */ }
  const key = await localKey();
  mode = key ? 'key' : 'offline';
  return mode;
}

function fallbackReply(text) {
  for (const [re, reply] of FALLBACK()) if (re.test(text)) return reply;
  return 'I only tell you things I have seen in your own money, and I have not seen that. Ask me about a payment, a limit, or anything that went wrong.';
}

/**
 * Ask the agent something.
 * @param {string} text        what the person typed
 * @param {object} opts        { context, onText }
 * @returns {Promise<string>}  the whole answer
 */
export async function ask(text, { context = '', onText } = {}) {
  if (mode === 'pending') await initAgent();
  const system = voice() + (context ? `\n\nThe person is looking at: ${context}` : '');

  if (mode === 'sample' && sampleFn) {
    try {
      const res = await sampleFn(
        [{ role: 'user', content: `${system}\n\n---\n\n${text}` }],
        { modelTier: 'default', onText: onText ? ({ text }) => onText(text) : undefined }
      );
      return res.text;
    } catch (err) {
      if (err && err.code === 'not_granted') mode = 'offline';
      return fallbackReply(text);
    }
  }

  if (mode === 'key') {
    const key = await localKey();
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 400,
          system,
          messages: [{ role: 'user', content: text }],
        }),
      });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const out = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
      if (onText) onText(out);
      return out || fallbackReply(text);
    } catch (err) {
      return fallbackReply(text);
    }
  }

  const out = fallbackReply(text);
  if (onText) onText(out);
  return out;
}
