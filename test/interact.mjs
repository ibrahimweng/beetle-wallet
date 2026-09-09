/* The things a slideshow cannot do. Each case drives the real UI and then
   checks the store, so a screen that only looks right still fails. */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { createServer } from 'http';

/* localStorage needs a real origin, so the built page is served rather than
   pushed in with setContent. */
const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>'
  + readFileSync(new URL('../dist/beetle.html', import.meta.url), 'utf8') + '</body></html>';
const server = createServer((_, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); });
await new Promise(r => server.listen(0, r));
const url = 'http://127.0.0.1:' + server.address().port + '/';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
await p.goto(url, { waitUntil: 'load' });
await p.waitForSelector('#rail-body');

const go = id => p.evaluate(i => window.beetleGo(i), id);
const state = () => p.evaluate(() => window.beetleState());
const wipe = async () => { await p.evaluate(() => localStorage.removeItem('beetle.state.v2')); await p.reload(); await p.waitForSelector('#rail-body'); };
/* Everything is scoped to the phone: the index down the left has buttons
   with the same words on them, and an unscoped selector will find those. */
const IN = '#phone-screen ';
const key = async d => { for (const c of String(d)) await p.click(`${IN}.keypad .key:not(.key-blank) >> text="${c}"`); };
/* Centre the target first: the dock sits at the bottom of the phone, and a
   real finger scrolls past it rather than tapping through it. */
const tap = async (sel, n = 0) => {
  const l = p.locator(IN + sel).nth(n);
  await l.evaluate(el => el.scrollIntoView({ block: 'center' })).catch(() => {});
  await p.waitForTimeout(60);
  await l.click();
  await p.waitForTimeout(90);
};

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(ok ? '  ✓' : '  ✗', name, ok ? '' : detail); };

/* ---- 1. a transfer really leaves the account ---- */
await wipe();
const before = (await state()).everyday;
await go('pay');
await tap('.edit-row', 1);                        // Amount
await key('7500');
await tap('button:has-text("Use this amount")');
const shown = await p.locator('.edit-row').nth(1).innerText();
check('amount pad types a real figure', shown.includes('7,500.00'), shown);
await tap('.slide-thumb');                        // slide to send -> confirm
await p.waitForTimeout(300);
await key('4471');                                // the real passcode
await p.waitForTimeout(500);
const afterSend = await state();
check('the money actually left', Math.round(before - afterSend.everyday) === 7500, `${before} -> ${afterSend.everyday}`);
check('a row landed in the ledger', afterSend.ledger[0].amount === -7500, JSON.stringify(afterSend.ledger[0]));
check('the receipt screen shows the real figure', (await p.locator('#phone-screen').innerText()).includes('₦7,500'), '');
check('under ₦10,000 carries no fee', afterSend.ledger[0].amount === -7500 && Math.round(before - afterSend.everyday) === 7500);

/* ---- 2. a fee is charged over ₦10,000 ---- */
await wipe();
const b2 = (await state()).everyday;
await go('pay');
await tap('.edit-row', 1); await key('20000'); await tap('button:has-text("Use this amount")');
await tap('.slide-thumb'); await p.waitForTimeout(300); await key('4471'); await p.waitForTimeout(500);
const a2 = (await state()).everyday;
check('fee of ₦26.88 charged over ₦10,000', Math.abs((b2 - a2) - 20026.88) < 0.01, `${b2} -> ${a2}`);

/* ---- 3. a wrong passcode does not move money ---- */
await wipe();
const b3 = (await state()).everyday;
await go('confirm');
await key('9999'); await p.waitForTimeout(400);
const a3 = await state();
check('wrong passcode moves nothing', a3.everyday === b3, `${b3} -> ${a3.everyday}`);
check('wrong passcode is counted', a3.wrongTries === 1, String(a3.wrongTries));
check('wrong passcode says how many are left', (await p.locator('#phone-screen').innerText()).includes('2 tries left'));

/* ---- 4. the balance shows up on home ---- */
await go('home');
check('home shows the live balance', (await p.locator('#phone-screen').innerText()).includes('₦595,320'));

/* ---- 5. chips really filter ---- */
await tap('.chip >> text="In"');
const inOnly = await p.locator('#phone-screen').innerText();
check('the In filter drops the outgoings', !inOnly.includes('Netflix') && inOnly.includes('Pagrin'), '');
await tap('.chip >> text="All"');

/* ---- 6. a toggle sticks across a reload ---- */
await go('lock');
await tap('.toggle', 1);                          // Hide my balance
await p.waitForTimeout(150);
await p.reload(); await p.waitForSelector('#rail-body');
check('a switch is remembered', (await state()).toggles.hideBalance === true, JSON.stringify((await state()).toggles));

/* ---- 7. hiding the balance actually hides it ---- */
await go('home');
check('a hidden balance is hidden', (await p.locator('#phone-screen').innerText()).includes('• • •'));

/* ---- 8. putting money into the goal ---- */
await wipe();
const b8 = await state();
await go('goal');
await tap('button:has-text("Add money")');
await key('3000');
await tap('button:has-text("Put it away")');
const a8 = await state();
check('the goal grew', a8.goal.saved - b8.goal.saved === 3000, `${b8.goal.saved} -> ${a8.goal.saved}`);
check('and it came out of Everyday', Math.round(b8.everyday - a8.everyday) === 3000);

/* ---- 9. converting to dollars ---- */
await wipe();
const b9 = await state();
await go('convert');
await tap('.slide-thumb'); await p.waitForTimeout(400);
const a9 = await state();
check('dollars went up', a9.dollars > b9.dollars, `${b9.dollars} -> ${a9.dollars}`);
check('naira went down', a9.everyday < b9.everyday, `${b9.everyday} -> ${a9.everyday}`);

/* ---- 10. signing a device out ---- */
await wipe();
await go('devices');
await tap('.chip >> text="Sign out"');
check('the device is gone', (await state()).devices.length === 2, String((await state()).devices.length));

/* ---- 11. buying data takes the money ---- */
await wipe();
const b11 = (await state()).everyday;
await go('buy');
await tap('button:has-text("Confirm")');
await key('4471'); await p.waitForTimeout(500);
check('data purchase charged', Math.round(b11 - (await state()).everyday) === 2500, `${b11} -> ${(await state()).everyday}`);

/* ---- 12. paying a bill hands back a token ---- */
await wipe();
await go('powerpay');
await tap('.slide-thumb'); await p.waitForTimeout(300);
await key('4471'); await p.waitForTimeout(500);
const powerText = await p.locator('#phone-screen').innerText();
check('a token comes back', /\d{4} \d{4} \d{4} \d{4}/.test(powerText), powerText.slice(0, 80));

/* ---- 13. a request can be paid ---- */
await wipe();
const b13 = (await state()).everyday;
await go('sent');
await tap('button:has-text("Pretend they just paid")');
await p.waitForTimeout(1200);
check('money arrived', (await state()).everyday - b13 === 20000, `${b13} -> ${(await state()).everyday}`);

/* ---- 14. typing understands what you wrote ---- */
await wipe();
await go('typed');
for (const c of 'chidi') await p.click(`${IN}.kbd-key >> text="${c}"`);
const chipText = await p.locator('#phone-screen').innerText();
check('typing picks the person out', chipText.includes('Chidi Okafor'), chipText.slice(0, 120));

/* ---- 15. limits stop a payment ---- */
await wipe();
await go('pay');
await tap('.edit-row', 1); await key('90000'); await tap('button:has-text("Use this amount")');
const stopped = await p.locator('#phone-screen').innerText();
check('past the transfer limit is refused', stopped.includes('past the most you allow'), stopped.slice(0, 160));
check('and no slider is offered', await p.locator('.slide-thumb').count() === 0);

/* ---- 16. the reset puts it back ---- */
await go('home');
await p.evaluate(() => { window.confirm = () => true; });
await p.locator('.rail-foot .stage-btn').click(); await p.waitForTimeout(120);
check('reset restores the design figures', (await state()).everyday === 595320.75, String((await state()).everyday));

console.log(`\ninteraction: ${results.filter(r => r.ok).length}/${results.length} passed`);
if (errors.length) console.log('page errors:', errors.slice(0, 5));
await b.close();
server.close();
process.exit(results.some(r => !r.ok) || errors.length ? 1 : 0);
