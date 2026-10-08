/* code.js against the stand-in for Figma, in Node. The panel's side of each
   message is played by hand with small fixed SVGs, so this tests only what
   code.js does with them. run() returns [pass, what, detail] rows; the build's
   --check prints them, and so does running this file on its own:

     node glyphs/figma-plugin/test/code.mjs */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { makeFigma } from './fake-figma.js';

const here = dirname(fileURLToPath(import.meta.url));
const SVG = (c = '#000000') => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12h16" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6h12v12H6z" fill="${c}" fill-rule="evenodd"/></svg>`;
const P = (weight = 'outline', corners = 'rounded', S = 2.5) => ({ S, R: 2, G: 0.75, choke: 0, fillet: 0.5, weight, corners });
const WEIGHTS = ['outline', 'two-tone', 'duotone', 'solid'];
const item = (key, over = {}) => {
  const p = over.P || P();
  return { key, name: key.split(':')[1], P: p, color: '#000000', svg: SVG(), variants: ['rounded', 'sharp'].flatMap(c => WEIGHTS.map(w => ({ P: { ...p, weight: w, corners: c }, svg: SVG() }))), ...over };
};
const data = n => { try { return JSON.parse(n.getPluginData('beetle')); } catch { return null; } };
const tick = () => new Promise(r => setTimeout(r, 0));

function boot(code, opts) {
  const figma = makeFigma(opts);
  new Function('figma', '__html__', code)(figma, '<html></html>');
  return figma;
}

export async function run(codePath = resolve(here, '../dist/code.js')) {
  const code = readFileSync(codePath, 'utf8');
  const rows = [];
  const ok = (pass, what, detail = '') => rows.push([!!pass, what, detail]);
  const last = (figma, type) => figma.ui.sent.filter(m => m.type === type).pop();

  /* opening */
  let figma = boot(code);
  const show = figma.calls.find(c => c.name === 'showUI');
  ok(show && show.opts.width >= 360 && show.opts.themeColors, 'it opens the panel, in Figma\'s theme');
  ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(code), 'code.js never goes to the network');
  await figma.message({ type: 'ready' });
  ok(last(figma, 'init') && last(figma, 'init').saved === null, 'the panel gets its saved settings when it is ready');
  await figma.message({ type: 'save', settings: { P: P('solid') } });
  ok(figma.clientStorage.data['beetle-glyphs-settings'] && figma.clientStorage.data['beetle-glyphs-settings'].P.weight === 'solid', 'settings are kept in clientStorage');

  /* one icon */
  await figma.message({ type: 'insert', id: 'a', as: 'frame', size: 32, total: 1, items: [item('core:arrow-right')], last: true });
  const one = figma.currentPage.children.find(n => data(n) && data(n).key === 'core:arrow-right');
  ok(one && one.type === 'FRAME', 'one icon arrives as a frame on the page');
  ok(one && one.fills.length === 0, 'with no white fill');
  ok(one && one.width === 32 && figma.calls.some(c => c.name === 'rescale' && c.id === one.id && Math.abs(c.scale - 32 / 24) < 1e-9), 'scaled to the chosen size with rescale, so strokes scale too');
  ok(one && Math.abs(one.children[0].strokeWeight - 2.5 * 32 / 24) < 1e-9, 'its strokes stay live and scale with it');
  ok(one && one.x === 500 - 16 && one.y === 300 - 16, 'in the middle of the screen');
  ok(one && one.relaunch && 'open' in one.relaunch && 'sync' in one.relaunch, 'with the relaunch buttons in the right panel');
  ok(one && data(one).kind === 'frame' && data(one).P.S === 2.5 && data(one).name === 'arrow-right', 'and it remembers its name and settings');
  ok(last(figma, 'inserted') && last(figma, 'inserted').id === 'a', 'the panel hears it is done');

  /* placement */
  figma.select([one.children[0]]);
  await figma.message({ type: 'insert', id: 'b', as: 'frame', size: 32, total: 1, items: [item('core:check')], last: true });
  const next = figma.currentPage.children.find(n => data(n) && data(n).key === 'core:check');
  ok(next && next.parent === figma.currentPage && next.x === one.x + one.width + 16, 'with an icon selected, the next lands beside it, never inside it');
  const box = new figma.Node('FRAME', { width: 200, height: 120 }); figma.currentPage.appendChild(box);
  figma.select([box]);
  await figma.message({ type: 'insert', id: 'c', as: 'frame', size: 24, total: 1, items: [item('core:x')], last: true });
  const inBox = box.children.find(n => data(n) && data(n).key === 'core:x');
  ok(inBox && inBox.x === 88 && inBox.y === 48, 'with a frame selected, it lands in the middle of that frame');
  figma.select([]);

  /* a batch, in chunks, into one grid frame */
  const keys = Array.from({ length: 127 }, (_, i) => 'scene:s' + i);
  for (let i = 0; i < keys.length; i += 50) await figma.message({ type: 'insert', id: 'd', as: 'frame', size: 24, total: keys.length, items: keys.slice(i, i + 50).map(k => item(k)), last: i + 50 >= keys.length });
  const grids = figma.currentPage.children.filter(n => /^Beetle Glyphs, 127 icons$/.test(n.name));
  ok(grids.length === 1 && grids[0].children.length === 127, 'a batch of 127 arrives in one grid frame, in chunks of 50');
  ok(grids[0] && grids[0].layoutMode === 'HORIZONTAL' && grids[0].layoutWrap === 'WRAP', 'the grid frame wraps with auto layout');
  ok(figma.currentPage.selection[0] === grids[0], 'and is selected when it is done');
  figma.select([]);

  /* components and component sets */
  await figma.message({ type: 'insert', id: 'e', as: 'component', size: 24, total: 1, items: [item('four:heart')], last: true });
  const comp = figma.currentPage.children.find(n => n.type === 'COMPONENT' && data(n).key === 'four:heart');
  ok(comp && data(comp).kind === 'component', 'an icon arrives as a component');
  await figma.message({ type: 'insert', id: 'f', as: 'set', size: 24, total: 1, items: [{ ...item('four:star'), svg: undefined }], last: true });
  const set = figma.currentPage.children.find(n => n.type === 'COMPONENT_SET');
  const names = set ? set.children.map(c => c.name) : [];
  ok(set && set.children.length === 8 && names.includes('Style=Stroke, Corners=Rounded') && names.includes('Style=Fill, Corners=Sharp') && names.includes('Style=Two-tone, Corners=Rounded') && names.includes('Style=Duotone, Corners=Sharp'), 'an icon arrives as a component set with Style and Corners variants');
  ok(set && set.name === 'star' && data(set).kind === 'set' && set.children.every(c => data(c).kind === 'variant'), 'the set and each variant remember what they are');

  /* swap in place */
  const id = one.id;
  figma.select([one]);
  await figma.message({ type: 'swap', item: item('core:heart') });
  ok(figma.byId.get(id) === one && data(one).key === 'core:heart' && one.name === 'heart' && one.width === 32, 'swapping a frame keeps the layer, its place and its size, and changes the icon');
  const inst = comp.createInstance(); figma.currentPage.appendChild(inst);
  figma.select([inst]);
  await figma.message({ type: 'swap', item: item('core:bell') });
  const bell = inst.main;
  ok(bell && bell !== comp && data(bell).key === 'core:bell' && figma.calls.some(c => c.name === 'swapComponent' && c.id === inst.id), 'swapping an instance swaps its component, which keeps its overrides');
  const inst2 = comp.createInstance(); figma.currentPage.appendChild(inst2);
  figma.select([inst2]);
  await figma.message({ type: 'swap', item: item('core:bell') });
  ok(inst2.main === bell, 'a second swap to the same icon reuses its component');
  const vInst = set.children.find(c => c.name === 'Style=Fill, Corners=Sharp').createInstance(); figma.currentPage.appendChild(vInst);
  figma.select([vInst]);
  await figma.message({ type: 'swap', item: item('four:moon') });
  ok(vInst.main && data(vInst.main).key === 'four:moon' && vInst.main.name === 'Style=Fill, Corners=Sharp', 'swapping a variant instance keeps its style and corners');
  const plain = new figma.Node('VECTOR', { width: 20, height: 20, x: 40, y: 40 }); box.appendChild(plain);
  figma.select([plain]);
  await figma.message({ type: 'swap', item: item('core:plus') });
  const took = box.children.find(n => data(n) && data(n).key === 'core:plus');
  ok(plain.removed && took && took.width === 20 && took.x === 40, 'any other layer is replaced by the icon, in its place and at its size');

  /* update to the current settings */
  figma.select([]);
  await figma.message({ type: 'sync', scope: 'page', job: 'p' });
  const need = last(figma, 'sync-need');
  const all = figma.currentPage.findAllWithCriteria({ types: ['FRAME', 'COMPONENT'], pluginData: { keys: ['beetle'] } });
  ok(need && need.targets.length === all.length && need.targets.length > 130, `Update page finds every icon of ours on the page (${need ? need.targets.length : 0})`);
  ok(need && need.targets.filter(t => t.kind === 'variant').length >= 8, 'variants included, each with its own style and corners');
  const before = need.targets.map(t => t.id);
  for (let i = 0; i < need.targets.length; i += 50) await figma.message({ type: 'sync-apply', job: 'p', items: need.targets.slice(i, i + 50).map(t => ({ id: t.id, svg: SVG('#ff0000'), P: { ...(t.P || P()), S: 1.5 }, color: '#ff0000' })), last: i + 50 >= need.targets.length });
  const after = before.map(i => figma.byId.get(i));
  ok(after.every(n => n && data(n).P.S === 1.5 && data(n).color === '#ff0000'), 'every one is redrawn at the new settings, keeping its id');
  ok(one.width === 32 && one.x === 500 - 16 && one.children.every(c => /#ff0000/.test(c.svg)), 'and keeps its position and size');
  ok(last(figma, 'synced') && last(figma, 'synced').count === need.targets.length, 'the panel hears how many');
  figma.select([one]);
  await figma.message({ type: 'sync', scope: 'selection', job: 'q' });
  ok(last(figma, 'sync-need').targets.length === 1 && last(figma, 'sync-need').targets[0].id === one.id, 'Update selection finds only the selected icon');

  /* drag and drop */
  figma.emit('drop', { node: box, x: 30, y: 40, absoluteX: 0, absoluteY: 0, dropMetadata: { source: 'beetle-glyphs', item: item('core:sun'), as: 'frame', size: 24 } });
  const sun = box.children.find(n => data(n) && data(n).key === 'core:sun');
  ok(sun && sun.x === 18 && sun.y === 28, 'an icon dropped on a frame lands under the pointer');

  /* the relaunch button that updates without opening the panel */
  figma = boot(code, { command: 'sync' });
  ok(figma.calls.find(c => c.name === 'showUI').opts.visible === false, 'Update to current settings runs with the panel hidden');
  await figma.message({ type: 'ready' }); await tick();
  ok(last(figma, 'run-sync'), 'it asks the panel to redraw the selection');
  await figma.message({ type: 'sync', scope: 'selection', job: 'relaunch' });
  await figma.message({ type: 'sync-apply', job: 'relaunch', items: [], last: true });
  ok(figma.closed, 'and closes when it is done');

  /* a copy with no plugin ID yet, as Figma gives one only at first publish */
  figma = boot(code, { noId: true });
  await figma.message({ type: 'ready' });
  ok(last(figma, 'init') && last(figma, 'init').saved === null && !figma.calls.some(c => c.name === 'notify' && c.error), 'with no plugin ID yet, the panel still opens, with the defaults and no error');
  await figma.message({ type: 'save', settings: { P: P('solid') } });
  ok(!figma.calls.some(c => c.name === 'notify' && c.error) && !last(figma, 'error'), 'and saving settings fails quietly instead of stopping the plugin');
  await figma.message({ type: 'insert', id: 'n', as: 'frame', size: 24, total: 1, items: [item('core:x')], last: true });
  ok(figma.currentPage.children.some(n => n.type === 'FRAME' && n.name === 'x') && !last(figma, 'error'), 'and icons still insert, even if Figma will not let it label them');
  await figma.message({ type: 'insert', id: 'n2', as: 'set', size: 24, total: 1, items: [{ ...item('four:star'), svg: undefined }], last: true });
  ok(figma.currentPage.children.some(n => n.type === 'COMPONENT_SET') && !last(figma, 'error'), 'component sets too');
  ok(figma.calls.filter(c => c.name === 'notify' && /Until the plugin is published/.test(c.text)).length === 1, 'and it says once that Swap and Update reach only this session\'s icons');
  const xs = figma.currentPage.children.find(n => n.type === 'FRAME' && n.name === 'x');
  figma.select([xs]);
  await figma.message({ type: 'insert', id: 'n3', as: 'frame', size: 24, total: 1, items: [item('core:check')], last: true });
  ok(!xs.children.some(n => n.name === 'check') && figma.currentPage.children.some(n => n.name === 'check'), 'it still never puts a new icon inside the selected one');
  figma.select([xs]);
  await figma.message({ type: 'swap', item: item('core:heart') });
  ok(xs.name === 'heart' && figma.byId.get(xs.id) === xs, 'and Swap works on this session\'s icons');
  await figma.message({ type: 'sync', scope: 'page', job: 'z' });
  ok(last(figma, 'sync-need') && last(figma, 'sync-need').targets.length >= 10 && !last(figma, 'error'), 'and so does Update page');

  /* an error reaches the user and the panel */
  figma = boot(code);
  await figma.message({ type: 'insert', id: 'z', as: 'frame', size: 24, total: 1, items: [{ ...item('core:x'), svg: 'not svg' }], last: true });
  ok(figma.calls.some(c => c.name === 'notify' && c.error) && last(figma, 'error') && last(figma, 'error').id === 'z', 'a failure is shown in Figma and told to the panel');
  return rows;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rows = await run();
  for (const [pass, what, detail] of rows) console.log(`  ${pass ? '✓' : '✗'} ${what}${pass || !detail ? '' : ' — ' + detail}`);
  if (rows.some(r => !r[0])) process.exit(1);
}
