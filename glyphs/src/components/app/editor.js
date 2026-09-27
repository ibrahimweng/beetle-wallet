/* The point editor: a 24-unit canvas with the selected icon, its anchors,
   bezier handles, arc centres and radii, midpoint inserts, corner kinds and
   the role of each part in the solid weight. */
import * as E from '../../lib/engine.js';
import { h, ICO, clone } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { store } from '../../lib/store.js';
import { primsOf, editKey, lib } from '../../lib/library.js';

const KINDS = ['none', 'soft', 'box', 'fillet'];
const ROLES = ['auto', 'stroke', 'shape', 'detail', 'cut', 'knock', 'flat'];
const segsOf = pr => pr.segs || (pr.segs = E.parsePath(pr.d || ''));

export function Editor() {
  const canvas = h('svg:svg', { class: 'canvas', viewBox: '0 0 24 24', 'aria-label': 'Editor canvas' });
  const wrap = h('div', { class: 'canvas-wrap' }, canvas);
  let selPt = null, selPrim = null, drag = null, showGrid = true, snapOn = true;

  const tKind = Button({ variant: 'outline', size: 'xs', label: 'Corner: none', disabled: true, onClick: () => cycleKind() });
  const tDel = Button({ variant: 'outline', size: 'xs', label: 'Delete point', disabled: true, onClick: () => delPoint() });
  const tClose = Button({ variant: 'outline', size: 'xs', label: 'Close path', disabled: true, onClick: () => toggleClose() });
  const tRole = Button({ variant: 'outline', size: 'xs', label: 'Part: auto', disabled: true, onClick: () => cycleRole() });
  const tReset = Button({ variant: 'secondary', size: 'xs', icon: ICO.rotate, label: 'Reset icon', onClick: () => { const s = store.get(); const edits = { ...s.edits }; delete edits[editKey(s.sel)]; selPt = null; selPrim = null; store.set({ edits }); } });
  const tGrid = Button({ variant: 'ghost', size: 'xs', label: 'Grid', 'aria-pressed': 'true', onClick: () => { showGrid = !showGrid; tGrid.setAttribute('aria-pressed', String(showGrid)); render(); } });
  const tSnap = Button({ variant: 'ghost', size: 'xs', label: 'Snap ¼', 'aria-pressed': 'true', onClick: () => { snapOn = !snapOn; tSnap.setAttribute('aria-pressed', String(snapOn)); } });
  const status = h('div', { class: 'status' });
  const tools = h('div', { class: 'tools' }, tKind, tDel, tClose, tRole, tReset, tGrid, tSnap);
  const el = h('div', { class: 'stack', style: { gap: '10px' } }, wrap, tools, status);

  const work = () => primsOf(store.get().sel, store.get());
  const commit = prims => { const s = store.get(); const stored = clone(prims); for (const pr of stored) if (pr.t === 'path' && pr.segs) delete pr.d; store.set({ edits: { ...s.edits, [editKey(s.sel)]: stored } }); };
  const snap = v => snapOn ? Math.round(v * 4) / 4 : Math.round(v * 100) / 100;
  const toGrid = ev => { const p = canvas.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(canvas.getScreenCTM().inverse()); return [q.x, q.y]; };

  function render(prims) {
    prims = prims || work();
    const P = store.get().P;
    let grid = '';
    if (showGrid) {
      for (let i = 0; i <= 24; i++) grid += `<line x1="${i}" y1="0" x2="${i}" y2="24"/><line x1="0" y1="${i}" x2="24" y2="${i}"/>`;
      grid += '<circle class="key" cx="12" cy="12" r="11"/><rect class="key" x="2" y="2" width="20" height="20" rx="1"/>';
    }
    canvas.innerHTML = `<g class="grid-lines">${grid}</g><g class="art">${art(prims, P)}</g><g class="handles">${handles(prims)}</g>`;
    updateTools(prims);
  }
  const art = (prims, P) => { const inner = E.svgInner(prims, P, { uid: 'cv' }); const goo = E.gooFilter(P, 'cv'); return goo ? `<defs>${goo}</defs><g filter="url(#goo-cv)">${inner}</g>` : inner; };
  function live(prims) { const P = store.get().P; canvas.querySelector('.art').innerHTML = art(prims, P); canvas.querySelector('.handles').innerHTML = handles(prims); }

  function handles(prims) {
    let s = ''; const r = 0.34, rm = 0.2;
    const isSel = (pi, vi, si, hh) => selPt && selPt.pi === pi && (vi !== undefined ? selPt.vi === vi : selPt.si === si && selPt.h === hh);
    prims.forEach((pr, pi) => {
      if (pr.t === 'poly') {
        const n = pr.pts.length;
        pr.pts.forEach((p, vi) => { s += `<circle class="pt${isSel(pi, vi) ? ' sel' : ''}" data-pi="${pi}" data-vi="${vi}" cx="${p[0]}" cy="${p[1]}" r="${r}"/>`; });
        const segs = pr.closed ? n : n - 1;
        for (let i = 0; i < segs; i++) { const a = pr.pts[i], b = pr.pts[(i + 1) % n]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1) continue; s += `<circle class="mid" data-pi="${pi}" data-ins="${i + 1}" cx="${(a[0] + b[0]) / 2}" cy="${(a[1] + b[1]) / 2}" r="${rm}"/>`; }
      } else if (pr.t === 'quad') {
        pr.pts.forEach((p, vi) => { s += `<circle class="${vi % 2 ? 'ctl' : 'pt'}${isSel(pi, vi) ? ' sel' : ''}" data-pi="${pi}" data-vi="${vi}" cx="${p[0]}" cy="${p[1]}" r="${vi % 2 ? rm + .05 : r}"/>`; });
      } else if (pr.t === 'arc') {
        const m = (pr.a0 + pr.a1) / 2 * Math.PI / 180;
        s += `<circle class="cen" data-pi="${pi}" data-arc="c" cx="${pr.c[0]}" cy="${pr.c[1]}" r="${r}"/><rect class="rad" data-pi="${pi}" data-arc="r" x="${pr.c[0] + pr.rx * Math.cos(m) - r}" y="${pr.c[1] + pr.ry * Math.sin(m) - r}" width="${2 * r}" height="${2 * r}" rx="0.08"/>`;
      } else if (pr.t === 'seq') {
        pr.segs.forEach((sg, si) => { if (sg[0] === 'M' || sg[0] === 'L') s += `<circle class="pt${isSel(pi, undefined, si, 'p') ? ' sel' : ''}" data-pi="${pi}" data-si="${si}" data-h="p" cx="${sg[1]}" cy="${sg[2]}" r="${r}"/>`; else if (sg[0] === 'A') s += `<circle class="cen" data-pi="${pi}" data-si="${si}" data-arc="c" cx="${sg[1]}" cy="${sg[2]}" r="${r}"/>`; });
      } else if (pr.t === 'path') {
        const segs = segsOf(pr); let prev = null;
        segs.forEach((sg, si) => {
          if (sg.t === 'Z') return;
          if (sg.t === 'C' && prev) s += `<line class="guide" x1="${prev[0]}" y1="${prev[1]}" x2="${sg.c1[0]}" y2="${sg.c1[1]}"/><line class="guide" x1="${sg.p[0]}" y1="${sg.p[1]}" x2="${sg.c2[0]}" y2="${sg.c2[1]}"/><circle class="ctl" data-pi="${pi}" data-si="${si}" data-h="c1" cx="${sg.c1[0]}" cy="${sg.c1[1]}" r="${rm + .05}"/><circle class="ctl" data-pi="${pi}" data-si="${si}" data-h="c2" cx="${sg.c2[0]}" cy="${sg.c2[1]}" r="${rm + .05}"/>`;
          if (sg.t === 'Q' && prev) s += `<line class="guide" x1="${prev[0]}" y1="${prev[1]}" x2="${sg.c1[0]}" y2="${sg.c1[1]}"/><line class="guide" x1="${sg.p[0]}" y1="${sg.p[1]}" x2="${sg.c1[0]}" y2="${sg.c1[1]}"/><circle class="ctl" data-pi="${pi}" data-si="${si}" data-h="c1" cx="${sg.c1[0]}" cy="${sg.c1[1]}" r="${rm + .05}"/>`;
          if (sg.t === 'L' && prev && Math.hypot(prev[0] - sg.p[0], prev[1] - sg.p[1]) >= 1) s += `<circle class="mid" data-pi="${pi}" data-ins="${si}" cx="${(prev[0] + sg.p[0]) / 2}" cy="${(prev[1] + sg.p[1]) / 2}" r="${rm}"/>`;
          s += `<circle class="pt${isSel(pi, undefined, si, 'p') ? ' sel' : ''}" data-pi="${pi}" data-si="${si}" data-h="p" cx="${sg.p[0]}" cy="${sg.p[1]}" r="${r}"/>`;
          prev = sg.p;
        });
      }
    });
    return s;
  }

  canvas.addEventListener('pointerdown', ev => {
    const hEl = ev.target.closest('[data-pi]');
    if (!hEl) { selPt = null; selPrim = null; render(); return; }
    const prims = work(); const pi = +hEl.dataset.pi; const pr = prims[pi];
    selPrim = pi;
    if (hEl.dataset.ins !== undefined) { insertPoint(prims, pi, +hEl.dataset.ins); return; }
    drag = { pi, prims, start: toGrid(ev), moved: false, vi: hEl.dataset.vi !== undefined ? +hEl.dataset.vi : null, si: hEl.dataset.si !== undefined ? +hEl.dataset.si : null, h: hEl.dataset.h || null, arc: hEl.dataset.arc || null };
    if (drag.arc === 'c') drag.c0 = pr.t === 'arc' ? pr.c.slice() : [pr.segs[drag.si][1], pr.segs[drag.si][2]];
    if (pr.t === 'path' && drag.h === 'p') { const segs = segsOf(pr); const sg = segs[drag.si]; drag.p0 = sg.p.slice(); drag.c2 = sg.t === 'C' ? sg.c2.slice() : null; const nx = segs[drag.si + 1]; drag.next = nx && (nx.t === 'C' || nx.t === 'Q') ? { i: drag.si + 1, c1: nx.c1.slice() } : null; }
    selPt = drag.vi !== null ? { pi, vi: drag.vi } : drag.si !== null && drag.h ? { pi, si: drag.si, h: drag.h } : null;
    canvas.setPointerCapture(ev.pointerId); ev.preventDefault();
  });
  canvas.addEventListener('pointermove', ev => {
    if (!drag) return;
    const g = toGrid(ev); const pr = drag.prims[drag.pi]; drag.moved = true;
    const dx = g[0] - drag.start[0], dy = g[1] - drag.start[1];
    if (drag.arc === 'c') { if (pr.t === 'arc') pr.c = [snap(drag.c0[0] + dx), snap(drag.c0[1] + dy)]; else { pr.segs[drag.si][1] = snap(drag.c0[0] + dx); pr.segs[drag.si][2] = snap(drag.c0[1] + dy); } }
    else if (drag.arc === 'r') { const m = (pr.a0 + pr.a1) / 2 * Math.PI / 180, cm = Math.cos(m), sm = Math.sin(m); if (Math.abs(pr.rx - pr.ry) < 1e-6) pr.rx = pr.ry = Math.max(0.5, snap(Math.hypot(g[0] - pr.c[0], g[1] - pr.c[1]))); else { if (Math.abs(cm) > 0.3) pr.rx = Math.max(0.5, snap(Math.abs(g[0] - pr.c[0]) / Math.abs(cm))); if (Math.abs(sm) > 0.3) pr.ry = Math.max(0.5, snap(Math.abs(g[1] - pr.c[1]) / Math.abs(sm))); } }
    else if (drag.vi !== null) { const p = pr.pts[drag.vi]; p[0] = snap(g[0]); p[1] = snap(g[1]); }
    else if (pr.t === 'seq') { pr.segs[drag.si][1] = snap(g[0]); pr.segs[drag.si][2] = snap(g[1]); }
    else if (pr.t === 'path') { const segs = segsOf(pr); const sg = segs[drag.si]; if (drag.h === 'p') { sg.p = [snap(drag.p0[0] + dx), snap(drag.p0[1] + dy)]; if (drag.c2) sg.c2 = [drag.c2[0] + dx, drag.c2[1] + dy]; if (drag.next) segs[drag.next.i].c1 = [drag.next.c1[0] + dx, drag.next.c1[1] + dy]; } else sg[drag.h] = [snap(g[0]), snap(g[1])]; delete pr.d; }
    live(drag.prims);
  });
  const endDrag = () => { if (!drag) return; if (drag.moved) commit(drag.prims); else render(); drag = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

  function insertPoint(prims, pi, at) {
    const pr = prims[pi];
    if (pr.t === 'poly') { const a = pr.pts[at - 1], b = pr.pts[at % pr.pts.length]; pr.pts.splice(at, 0, [snap((a[0] + b[0]) / 2), snap((a[1] + b[1]) / 2), 'fillet']); selPt = { pi, vi: at }; }
    else if (pr.t === 'path') { const segs = segsOf(pr); const sg = segs[at]; let prev = null; for (let i = at - 1; i >= 0; i--) if (segs[i].p) { prev = segs[i].p; break; } if (!prev || sg.t !== 'L') return; segs.splice(at, 0, { t: 'L', p: [snap((prev[0] + sg.p[0]) / 2), snap((prev[1] + sg.p[1]) / 2)] }); delete pr.d; selPt = { pi, si: at, h: 'p' }; }
    commit(prims);
  }
  function cycleKind() { const prims = work(); const v = prims[selPt.pi].pts[selPt.vi]; const cur = typeof v[2] === 'number' ? -1 : KINDS.indexOf(v[2] || 'none'); v[2] = KINDS[(cur + 1) % KINDS.length]; commit(prims); }
  function delPoint() {
    const prims = work(); const p = prims[selPt.pi];
    if (p.t === 'poly') { if (p.pts.length <= (p.closed ? 3 : 2)) return; p.pts.splice(selPt.vi, 1); }
    else if (p.t === 'path') { const segs = segsOf(p); if (selPt.si === 0 || segs.filter(s => s.t !== 'Z').length <= 2) return; segs.splice(selPt.si, 1); delete p.d; }
    selPt = null; commit(prims);
  }
  function toggleClose() { const prims = work(); const p = prims[selPt ? selPt.pi : selPrim]; if (!p || p.t !== 'poly') return; p.closed = !p.closed; commit(prims); }
  function cycleRole() { const prims = work(); const p = prims[selPrim]; if (!p) return; const cur = p.roleLocked ? ROLES.indexOf(p.role) : 0; const next = ROLES[(cur + 1) % ROLES.length]; if (next === 'auto') { delete p.role; delete p.roleLocked; } else { p.role = next; p.roleLocked = true; } commit(prims); }
  function updateTools(prims) {
    const s = store.get();
    const p = selPt && prims[selPt.pi];
    const isVertex = !!(p && p.t === 'poly' && selPt.vi !== undefined);
    const isAnchor = !!(p && p.t === 'path' && selPt.h === 'p');
    tKind.disabled = !isVertex; tDel.disabled = !(isVertex || isAnchor); tClose.disabled = !(p && p.t === 'poly');
    tKind.textContent = isVertex ? 'Corner: ' + (typeof p.pts[selPt.vi][2] === 'number' ? p.pts[selPt.vi][2] + ' u' : (p.pts[selPt.vi][2] || 'none')) : 'Corner: none';
    if (p && p.t === 'poly') tClose.textContent = p.closed ? 'Open path' : 'Close path';
    const part = selPrim !== null && prims[selPrim];
    tRole.disabled = !part;
    tRole.textContent = part ? 'Part: ' + (part.roleLocked ? part.role : 'auto · ' + E.autoRoles(prims, s.P)[selPrim]) : 'Part: auto';
    const detached = !!s.edits[editKey(s.sel)];
    const e = lib.byKey.get(s.sel);
    status.textContent = detached ? 'Edited. Detached from its source; corner kinds still follow the sliders.' : (e && e.key.startsWith('param:') ? 'Parametric. Derived from the sliders.' : 'From the library. Drag a point to make it yours.');
  }
  document.addEventListener('keydown', ev => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && selPt) { ev.preventDefault(); delPoint(); }
    if (ev.key === 'Escape' && (selPt || selPrim !== null)) { selPt = null; selPrim = null; render(); }
  });
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits', 'ready'].includes(k))) { if (keys.includes('sel')) { selPt = null; selPrim = null; } render(); } });
  return { el, render };
}
