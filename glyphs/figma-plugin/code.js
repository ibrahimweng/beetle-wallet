/* Beetle Glyphs for Figma: the main thread. It can change the document but has
   no page of its own. The panel (ui.html) draws every icon with the site's
   engine and sends the SVG here; this file turns it into layers.

   Every icon it makes carries its name and settings as plugin data under
   'beetle', so it can be swapped for another icon or redrawn at new settings
   later, and a relaunch button in the right panel to do so.

   Kept to plain syntax that Figma's sandbox has always read: no optional
   chaining, no nullish coalescing, no modules. */

var DATA = 'beetle';
var SETTINGS = 'beetle-glyphs-settings';
var PANEL = { width: 420, height: 720 };
var STYLE_NAME = { outline: 'Stroke', 'two-tone': 'Two-tone', duotone: 'Duotone', solid: 'Fill' };
var CORNER_NAME = { rounded: 'Rounded', sharp: 'Sharp' };
var GAP = 16;
var CHUNK = 50;

/* ---------- plugin data ---------- */
/* what this run made, by layer id: a copy with no plugin ID yet may not be
   allowed to keep plugin data, so the plugin also remembers while it is open */
var local = {};
function readData(node) {
  if (!node || typeof node.getPluginData !== 'function') return null;
  try { var s = node.getPluginData(DATA); if (s) return JSON.parse(s); } catch (e) { /* no plugin ID yet */ }
  return local[node.id] ? JSON.parse(local[node.id]) : null;
}
function writeData(node, data) {
  /* a copy with no plugin ID yet may not be allowed to label layers: the
     icon still arrives, it just cannot be swapped or updated later */
  local[node.id] = JSON.stringify(data);
  try { node.setPluginData(DATA, JSON.stringify(data)); } catch (e) { unlabelled(); }
  try { node.setRelaunchData({ open: 'Swap it or change its settings', sync: 'Redraw it at the plugin’s current settings' }); } catch (e) { /* no buttons in the right panel */ }
}
/* what is stored: the icon, the kind of layer, and how it was drawn */
function dataOf(item, kind) {
  return { v: 1, key: item.key, name: item.name, kind: kind, P: item.P, color: item.color };
}
var told = false;
function unlabelled() {
  if (told) return; told = true;
  figma.notify('Until the plugin is published, Swap and Update work only on icons inserted since it was opened.');
}
/* every layer of ours in a node, or none when Figma will not search plugin data */
function ours(n, types) {
  try { return n.findAllWithCriteria({ types: types, pluginData: { keys: [DATA] } }); }
  catch (e) { return n.findAll(function (k) { return !!local[k.id] && types.indexOf(k.type) >= 0; }); }
}
function isOurs(node) { var d = readData(node); return !!(d && d.key); }
/* the icon a node is, or sits inside of: never put a new icon into one */
function ourAncestor(node) {
  for (var n = node; n && n.type !== 'PAGE' && n.type !== 'DOCUMENT'; n = n.parent) if (isOurs(n)) return n;
  return null;
}
function insideInstance(node) {
  for (var n = node.parent; n && n.type !== 'PAGE'; n = n.parent) if (n.type === 'INSTANCE') return true;
  return false;
}

/* ---------- making layers ---------- */
/* an SVG at 24 becomes a frame at the chosen size: no fill, scaled with
   rescale so the strokes scale too */
function frameOf(svg, name, size) {
  var node = figma.createNodeFromSvg(svg);
  node.fills = [];
  node.name = name;
  node.clipsContent = false;
  if (size && size !== node.width) node.rescale(size / node.width);
  return node;
}
function makeFrame(item, size) {
  var node = frameOf(item.svg, item.name, size);
  writeData(node, dataOf(item, 'frame'));
  return node;
}
function makeComponent(item, size) {
  var node = figma.createComponentFromNode(frameOf(item.svg, item.name, size));
  node.name = item.name;
  writeData(node, dataOf(item, 'component'));
  return node;
}
function variantName(v) { return 'Style=' + STYLE_NAME[v.P.weight] + ', Corners=' + CORNER_NAME[v.P.corners]; }
/* one component per style and corners, joined into a set: the designer
   switches Style and Corners in the right panel */
function makeSet(item, size, parent) {
  var comps = item.variants.map(function (v) {
    var c = figma.createComponentFromNode(frameOf(v.svg, item.name, size));
    c.name = variantName(v);
    writeData(c, dataOf({ key: item.key, name: item.name, P: v.P, color: item.color }, 'variant'));
    parent.appendChild(c);
    return c;
  });
  var set = figma.combineAsVariants(comps, parent);
  set.name = item.name;
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  set.itemSpacing = GAP; set.counterAxisSpacing = GAP;
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = GAP;
  set.resize(4 * size + 3 * GAP + 2 * GAP, 2 * size + 3 * GAP);
  writeData(set, dataOf(item, 'set'));
  return set;
}
function make(item, as, size, parent) {
  if (as === 'set') return makeSet(item, size, parent);
  var node = as === 'component' ? makeComponent(item, size) : makeFrame(item, size);
  parent.appendChild(node);
  return node;
}

/* ---------- where a new icon goes ---------- */
var CONTAINERS = { FRAME: 1, COMPONENT: 1, SECTION: 1, GROUP: 1 };
function where() {
  var sel = figma.currentPage.selection;
  if (sel.length === 1) {
    var n = sel[0];
    var icon = ourAncestor(n);
    if (icon && icon.parent && icon.parent.type !== 'COMPONENT_SET' && !insideInstance(icon)) return { parent: icon.parent, beside: icon };
    if (icon && icon.parent && icon.parent.type === 'COMPONENT_SET' && icon.parent.parent) return { parent: icon.parent.parent, beside: icon.parent };
    if (!icon && CONTAINERS[n.type] && !insideInstance(n)) return { parent: n, inside: true };
  }
  return { parent: figma.currentPage };
}
function auto(parent) { return parent.layoutMode && parent.layoutMode !== 'NONE'; }
function place(node, spot, drop) {
  var parent = spot.parent;
  if (drop) { node.x = Math.round(drop.x - node.width / 2); node.y = Math.round(drop.y - node.height / 2); return; }
  if (auto(parent)) return;
  if (spot.beside) {
    var b = spot.beside;
    if (parent.children.indexOf(node) !== parent.children.indexOf(b) + 1) parent.insertChild(parent.children.indexOf(b) + 1, node);
    node.x = b.x + b.width + GAP; node.y = b.y;
  } else if (spot.inside) {
    node.x = Math.round((parent.width - node.width) / 2); node.y = Math.round((parent.height - node.height) / 2);
  } else {
    var c = figma.viewport.center;
    node.x = Math.round(c.x - node.width / 2); node.y = Math.round(c.y - node.height / 2);
  }
}

/* ---------- inserting: one icon, or a batch in chunks into a grid frame ---------- */
var batches = {};
function gridFrame(total, size, as) {
  var f = figma.createFrame();
  var cell = as === 'set' ? 4 * size + 5 * GAP : size;
  var cols = Math.max(1, Math.min(total, as === 'set' ? 3 : 12));
  f.name = 'Beetle Glyphs, ' + total + ' icons';
  f.fills = [];
  f.layoutMode = 'HORIZONTAL';
  f.layoutWrap = 'WRAP';
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'AUTO';
  f.itemSpacing = GAP; f.counterAxisSpacing = GAP;
  f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = GAP;
  f.resize(cols * cell + (cols - 1) * GAP + 2 * GAP, size + 2 * GAP);
  return f;
}
function insert(msg) {
  var b = batches[msg.id];
  if (!b) {
    var spot = msg.drop ? { parent: msg.drop.parent } : where();
    b = batches[msg.id] = { spot: spot, made: [], grid: null };
    if (msg.total > 1) {
      b.grid = gridFrame(msg.total, msg.size, msg.as);
      spot.parent.appendChild(b.grid);
      place(b.grid, spot, msg.drop);
    }
  }
  for (var i = 0; i < msg.items.length; i++) {
    var parent = b.grid || b.spot.parent;
    var node = make(msg.items[i], msg.as, msg.size, parent);
    if (!b.grid) place(node, b.spot, msg.drop);
    b.made.push(node);
  }
  if (msg.last) {
    delete batches[msg.id];
    var shown = b.grid ? [b.grid] : b.made;
    figma.currentPage.selection = shown;
    if (!msg.drop) figma.viewport.scrollAndZoomIntoView(shown);
    figma.notify(b.made.length === 1 ? 'Inserted ' + b.made[0].name : 'Inserted ' + b.made.length + ' icons');
  }
  return b.made.length;
}

/* ---------- redrawing a layer in place ---------- */
/* the node keeps its id, parent, position, size and anything pointing at it;
   only what is inside it changes. A component's instances follow. */
function redraw(node, svg) {
  var fresh = figma.createNodeFromSvg(svg);
  var scale = node.width / fresh.width;
  if (Math.abs(scale - 1) > 1e-6) fresh.rescale(scale);
  var old = node.children.slice();
  for (var i = 0; i < old.length; i++) old[i].remove();
  var kids = fresh.children.slice();
  for (var j = 0; j < kids.length; j++) node.appendChild(kids[j]);
  fresh.remove();
}

/* ---------- swapping ---------- */
function sameDraw(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
/* a component for this icon at these settings that the page already has */
function findComponent(item, kind) {
  var found = ours(figma.currentPage, kind === 'set' ? ['COMPONENT_SET'] : ['COMPONENT']);
  for (var i = 0; i < found.length; i++) {
    var d = readData(found[i]);
    if (d && d.key === item.key && d.kind === kind && sameDraw(d.P, item.P) && d.color === item.color) return found[i];
  }
  return null;
}
function variantFor(set, P) {
  for (var i = 0; i < set.children.length; i++) {
    var d = readData(set.children[i]);
    if (d && d.P && d.P.weight === P.weight && d.P.corners === P.corners) return set.children[i];
  }
  return set.children[0];
}
function beside(node, made) {
  made.x = node.x + node.width + 80; made.y = node.y;
}
async function swapOne(node, item) {
  var d = readData(node);
  if (node.type === 'INSTANCE') {
    var main = await node.getMainComponentAsync();
    var md = readData(main);
    var inSet = !!(md && md.kind === 'variant');
    var comp;
    if (inSet) {
      var set = findComponent(item, 'set');
      if (!set) {
        var home = main && !main.remote && main.parent && main.parent.parent ? main.parent.parent : figma.currentPage;
        set = makeSet(item, Math.round(main.width), home);
        beside(main.parent, set);
      }
      comp = variantFor(set, md.P);
    } else {
      comp = findComponent(item, 'component');
      if (!comp) {
        comp = makeComponent(item, Math.round(main ? main.width : node.width));
        var host = main && !main.remote && main.parent ? main.parent : figma.currentPage;
        host.appendChild(comp);
        if (main && !main.remote) beside(main, comp); else beside(node, comp);
      }
    }
    node.swapComponent(comp);
    return node;
  }
  if (d && (d.kind === 'frame' || d.kind === 'component')) {
    redraw(node, item.svg);
    node.name = item.name;
    writeData(node, dataOf(item, d.kind));
    return node;
  }
  if (d && d.kind === 'variant' && node.parent && node.parent.type === 'COMPONENT_SET') { node = node.parent; d = readData(node); }
  if (d && d.kind === 'set') {
    for (var i = 0; i < node.children.length; i++) {
      var c = node.children[i], cd = readData(c);
      var v = null;
      for (var k = 0; k < item.variants.length; k++) if (cd && item.variants[k].P.weight === cd.P.weight && item.variants[k].P.corners === cd.P.corners) v = item.variants[k];
      if (!v) continue;
      redraw(c, v.svg);
      writeData(c, dataOf({ key: item.key, name: item.name, P: v.P, color: item.color }, 'variant'));
    }
    node.name = item.name;
    writeData(node, dataOf(item, 'set'));
    return node;
  }
  /* any other layer: a new icon frame takes its place, size and parent */
  var parent = node.parent;
  if (!parent || insideInstance(node)) return null;
  var size = Math.round(Math.max(node.width, node.height)) || 24;
  var fresh = makeFrame(item, size);
  parent.insertChild(parent.children.indexOf(node), fresh);
  if (!auto(parent)) { fresh.x = node.x + (node.width - size) / 2; fresh.y = node.y + (node.height - size) / 2; }
  if ('layoutPositioning' in node && node.layoutPositioning === 'ABSOLUTE') fresh.layoutPositioning = 'ABSOLUTE';
  if ('constraints' in node) fresh.constraints = node.constraints;
  node.remove();
  return fresh;
}
async function swap(item) {
  var sel = figma.currentPage.selection.slice();
  var out = [];
  for (var i = 0; i < sel.length; i++) {
    var n = sel[i];
    var icon = n.type === 'INSTANCE' ? n : (ourAncestor(n) || n);
    if (out.indexOf(icon) >= 0) continue;
    var done = await swapOne(icon, item);
    if (done) out.push(done);
  }
  if (out.length) figma.currentPage.selection = out;
  figma.notify(out.length ? 'Swapped for ' + item.name : 'Select a layer to swap first');
  return out.length;
}

/* ---------- updating to the current settings ---------- */
/* every layer of ours in reach: the selection (with what is inside it, and the
   main component of an instance), or the whole page */
async function targets(scope) {
  var found = [], seen = {};
  var add = function (n) { if (n && !seen[n.id] && !n.remote && (n.type === 'FRAME' || n.type === 'COMPONENT') && isOurs(n) && !insideInstance(n)) { seen[n.id] = 1; found.push(n); } };
  var within = function (n) {
    if ('findAllWithCriteria' in n) { var all = ours(n, ['FRAME', 'COMPONENT']); for (var i = 0; i < all.length; i++) add(all[i]); }
  };
  if (scope === 'page') within(figma.currentPage);
  else {
    var sel = figma.currentPage.selection;
    for (var i = 0; i < sel.length; i++) {
      var n = sel[i];
      if (n.type === 'INSTANCE') { add(await n.getMainComponentAsync()); continue; }
      var icon = ourAncestor(n);
      if (icon && icon.type === 'COMPONENT_SET') { within(icon); continue; }
      if (icon) { add(icon); continue; }
      within(n);
    }
  }
  return found;
}
var jobs = {};
async function syncStart(scope, job) {
  var list = await targets(scope);
  jobs[job] = { scope: scope, count: 0 };
  figma.ui.postMessage({ type: 'sync-need', job: job, scope: scope, targets: list.map(function (n) { var d = readData(n); return { id: n.id, key: d.key, kind: d.kind, P: d.P }; }) });
}
async function syncApply(msg) {
  var job = jobs[msg.job]; if (!job) return 0;
  for (var i = 0; i < msg.items.length; i++) {
    var it = msg.items[i];
    var node = await figma.getNodeByIdAsync(it.id);
    var d = readData(node);
    if (!node || !d) continue;
    redraw(node, it.svg);
    d.P = it.P; d.color = it.color;
    writeData(node, d);
    if (d.kind === 'variant' && node.parent && node.parent.type === 'COMPONENT_SET') {
      var sd = readData(node.parent);
      if (sd) { sd.P = Object.assign({}, sd.P, it.P, { weight: sd.P.weight, corners: sd.P.corners }); sd.color = it.color; writeData(node.parent, sd); }
    }
    job.count++;
  }
  if (msg.last) {
    delete jobs[msg.job];
    figma.notify(job.count ? 'Updated ' + job.count + (job.count === 1 ? ' icon' : ' icons') + ' to the current settings' : (job.scope === 'page' ? 'No Beetle Glyphs icons on this page' : 'No Beetle Glyphs icons in the selection'));
  }
  return job.count;
}

/* ---------- the selection, for the panel ---------- */
async function describeSelection() {
  var sel = figma.currentPage.selection;
  var ours = [];
  for (var i = 0; i < sel.length && i < 200; i++) {
    var n = sel[i], d = null;
    if (n.type === 'INSTANCE') { var m = await n.getMainComponentAsync(); d = readData(m); }
    else { var icon = ourAncestor(n); d = readData(icon); }
    if (d) ours.push({ key: d.key, name: d.name, kind: d.kind, P: d.P, color: d.color });
  }
  return { count: sel.length, ours: ours };
}
async function sendSelection() {
  figma.ui.postMessage({ type: 'selection', selection: await describeSelection() });
}

/* ---------- settings, kept by Figma on this computer ---------- */
/* Figma keeps a plugin's storage only once the plugin has an ID, which it
   gets when it is first published. Until then, or if storage fails for any
   other reason, the panel opens with the defaults and nothing is saved. */
var memory = null;
async function loadSettings() {
  try { return await figma.clientStorage.getAsync(SETTINGS); } catch (e) { return memory; }
}
async function saveSettings(settings) {
  memory = settings;
  try { await figma.clientStorage.setAsync(SETTINGS, settings); } catch (e) { /* kept for this run only */ }
}

/* ---------- messages from the panel ---------- */
var command = figma.command || 'open';
var resolveReady;
var ready = new Promise(function (r) { resolveReady = r; });
async function onMessage(msg) {
  if (!msg || !msg.type) return;
  try {
    if (msg.type === 'ready') {
      var saved = await loadSettings();
      figma.ui.postMessage({ type: 'init', command: command, saved: saved || null, selection: await describeSelection() });
      resolveReady();
    } else if (msg.type === 'save') {
      await saveSettings(msg.settings);
    } else if (msg.type === 'insert') {
      var n = insert(msg);
      figma.ui.postMessage({ type: 'inserted', id: msg.id, count: n, last: !!msg.last });
    } else if (msg.type === 'swap') {
      var s = await swap(msg.item);
      figma.ui.postMessage({ type: 'swapped', count: s });
    } else if (msg.type === 'sync') {
      await syncStart(msg.scope === 'page' ? 'page' : 'selection', msg.job);
    } else if (msg.type === 'sync-apply') {
      var c = await syncApply(msg);
      figma.ui.postMessage({ type: 'synced', job: msg.job, count: c, last: !!msg.last });
      if (msg.last && command === 'sync') figma.closePlugin();
    } else if (msg.type === 'notify') {
      figma.notify(String(msg.text || ''), msg.error ? { error: true } : undefined);
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    var text = err && err.message ? err.message : String(err);
    figma.notify('Beetle Glyphs: ' + text, { error: true });
    figma.ui.postMessage({ type: 'error', id: msg.id || msg.job || null, message: text });
    if (command === 'sync') figma.closePlugin();
  }
}

/* dragged out of the panel and dropped on the canvas */
figma.on('drop', function (event) {
  var meta = event.dropMetadata;
  if (!meta || meta.source !== 'beetle-glyphs') return true;
  var target = event.node && CONTAINERS[event.node.type] && !isOurs(event.node) && !insideInstance(event.node) ? event.node : figma.currentPage;
  var onPage = target.type === 'PAGE';
  var x = onPage ? event.absoluteX : event.x, y = onPage ? event.absoluteY : event.y;
  insert({ id: 'drop-' + Date.now(), items: [meta.item], as: meta.as, size: meta.size, total: 1, last: true, drop: { parent: target, x: x, y: y } });
  return false;
});

figma.ui.onmessage = onMessage;
figma.on('selectionchange', function () { sendSelection(); });
figma.on('currentpagechange', function () { sendSelection(); });

if (command === 'sync') {
  /* the relaunch button: redraw the selection at the saved settings without opening the panel */
  figma.showUI(__html__, { visible: false });
  ready.then(function () {
    figma.ui.postMessage({ type: 'run-sync', scope: 'selection', job: 'relaunch' });
  });
} else {
  figma.showUI(__html__, { width: PANEL.width, height: PANEL.height, themeColors: true, title: 'Beetle Glyphs' });
}
