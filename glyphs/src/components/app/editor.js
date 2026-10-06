/* The point editor: a 24-unit canvas with the selected icon in the weight being
   edited, its anchors, bezier handles, arc centres and radii, midpoint inserts
   and corner kinds; and the list of the icon's parts with the role each plays.
   An icon that has parts of its own for the solid keeps two sets of edits, one
   per weight, so the canvas always edits exactly what the grid shows. */
import * as E from '../../lib/engine.js';
import { h, ICO, clone } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { Select } from '../ui/input.js';
import { store } from '../../lib/store.js';
import { primsOf, editKey, hasOwnSolid, lib } from '../../lib/library.js';

const KINDS = ['none', 'soft', 'box', 'fillet'];
const ROLES = ['auto', 'stroke', 'shape', 'detail', 'cut', 'knock', 'punch', 'flat', 'fill'];
const TYPE = { poly: 'polyline', arc: 'arc', seq: 'arcs', quad: 'loop', path: 'path' };
const segsOf = pr => pr.segs || (pr.segs = E.parsePath(pr.d || ''));
const f2 = v => Math.round(v * 100) / 100;

export function Editor() {
  const canvas = h('svg:svg', { class: 'canvas', viewBox: '0 0 24 24', 'aria-label': 'Editor canvas' });
  const tag = h('div', { class: 'canvas-tag' });
  const wrap = h('div', { class: 'canvas-wrap' }, canvas, tag);
  let selPt = null, selPrim = null, drag = null, showGrid = true, snapOn = true, shownWeight = store.get().P.weight;

  const tKind = Button({ variant: 'outline', size: 'xs', label: 'Corner: none', disabled: true, title: 'Cycle the corner kind of the selected point', onClick: () => cycleKind() });
  const tDel = Button({ variant: 'outline', size: 'xs', label: 'Delete point', disabled: true, onClick: () => delPoint() });
  const tClose = Button({ variant: 'outline', size: 'xs', label: 'Close path', disabled: true, onClick: () => toggleClose() });
  const tGrid = Button({ variant: 'ghost', size: 'xs', label: 'Grid', 'aria-pressed': 'true', onClick: () => { showGrid = !showGrid; tGrid.setAttribute('aria-pressed', String(showGrid)); render(); } });
  const tSnap = Button({ variant: 'ghost', size: 'xs', label: 'Snap ¼', 'aria-pressed': 'true', onClick: () => { snapOn = !snapOn; tSnap.setAttribute('aria-pressed', String(snapOn)); } });
  const status = h('div', { class: 'status' });
  const tools = h('div', { class: 'tools' }, tKind, tDel, tClose, tGrid, tSnap);
  const el = h('div', { class: 'stack', style: { gap: '10px' } }, wrap, tools, status);
  const partsEl = h('div', { class: 'parts', role: 'listbox', 'aria-label': 'Parts of the icon' });

  const work = () => primsOf(store.get().sel, store.get());
  const commit = prims => { const s = store.get(); const stored = clone(prims); for (const pr of stored) if (pr.t === 'path' && pr.segs) delete pr.d; store.set({ edits: { ...s.edits, [editKey(s.sel, s.P.weight)]: stored } }); };
  const snap = v => snapOn ? Math.round(v * 4) / 4 : f2(v);
  const toGrid = ev => { const p = canvas.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(canvas.getScreenCTM().inverse()); return [q.x, q.y]; };

  function render(prims) {
    prims = prims || work();
    const s = store.get(); const P = s.P;
    if (selPrim !== null && selPrim >= prims.length) selPrim = null;
    if (selPt && selPt.pi >= prims.length) selPt = null;
    let grid = '';
    if (showGrid) {
      for (let i = 0; i <= 24; i++) grid += `<line x1="${i}" y1="0" x2="${i}" y2="24"/><line x1="0" y1="${i}" x2="24" y2="${i}"/>`;
      grid += '<circle class="key" cx="12" cy="12" r="11"/><rect class="key" x="2" y="2" width="20" height="20" rx="1"/>';
    }
    canvas.innerHTML = `<g class="grid-lines">${grid}</g><g class="art">${art(prims, P)}</g><g class="handles">${highlight(prims, P)}${handles(prims)}</g>`;
    tag.textContent = P.weight;
    renderParts(prims, P);
    updateTools(prims);
  }
  const art = (prims, P) => { const inner = E.svgInner(prims, P, { uid: 'cv' }); const goo = E.gooFilter(P, 'cv'); return goo ? `<defs>${goo}</defs><g filter="url(#goo-cv)">${inner}</g>` : inner; };
  function live(prims) { const P = store.get().P; canvas.querySelector('.art').innerHTML = art(prims, P); canvas.querySelector('.handles').innerHTML = highlight(prims, P) + handles(prims); }
  const highlight = (prims, P) => { if (selPrim === null || !prims[selPrim]) return ''; const d = E.pathOf(prims[selPrim], P); return d ? `<path class="hl-under" d="${d}"/><path class="hl" d="${d}"/>` : ''; };

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
          if (sg.t === 'C' && prev) s += `<line class="guide" x1="${prev[0]}" y1="${prev[1]}" x2="${sg.c1[0]}" y2="${sg.c1[1]}"/><line class="guide" x1="${sg.p[0]}" y1="${sg.p[1]}" x2="${sg.c2[0]}" y2="${sg.c2[1]}"/><circle class="ctl${isSel(pi, undefined, si, 'c1') ? ' sel' : ''}" data-pi="${pi}" data-si="${si}" data-h="c1" cx="${sg.c1[0]}" cy="${sg.c1[1]}" r="${rm + .05}"/><circle class="ctl${isSel(pi, undefined, si, 'c2') ? ' sel' : ''}" data-pi="${pi}" data-si="${si}" data-h="c2" cx="${sg.c2[0]}" cy="${sg.c2[1]}" r="${rm + .05}"/>`;
          if (sg.t === 'Q' && prev) s += `<line class="guide" x1="${prev[0]}" y1="${prev[1]}" x2="${sg.c1[0]}" y2="${sg.c1[1]}"/><line class="guide" x1="${sg.p[0]}" y1="${sg.p[1]}" x2="${sg.c1[0]}" y2="${sg.c1[1]}"/><circle class="ctl${isSel(pi, undefined, si, 'c1') ? ' sel' : ''}" data-pi="${pi}" data-si="${si}" data-h="c1" cx="${sg.c1[0]}" cy="${sg.c1[1]}" r="${rm + .05}"/>`;
          if (sg.t === 'L' && prev && Math.hypot(prev[0] - sg.p[0], prev[1] - sg.p[1]) >= 1) s += `<circle class="mid" data-pi="${pi}" data-ins="${si}" cx="${(prev[0] + sg.p[0]) / 2}" cy="${(prev[1] + sg.p[1]) / 2}" r="${rm}"/>`;
          s += `<circle class="pt${isSel(pi, undefined, si, 'p') ? ' sel' : ''}" data-pi="${pi}" data-si="${si}" data-h="p" cx="${sg.p[0]}" cy="${sg.p[1]}" r="${r}"/>`;
          prev = sg.p;
        });
      }
    });
    return s;
  }

  /* the parts list: one row per part, its kind, and the role it plays */
  function renderParts(prims, P) {
    const resolved = E.autoRoles(prims, P);
    partsEl.innerHTML = '';
    prims.forEach((pr, i) => {
      const sel = Select({ options: ROLES.map(r => ({ value: r, label: r === 'auto' ? `auto · ${resolved[i]}` : r })), value: pr.roleLocked ? pr.role : 'auto', 'aria-label': `Role of part ${i + 1}`, title: 'The role of this part in the solid weight', onChange: v => setRole(i, v) });
      sel.el.classList.add('select-sm');
      sel.el.addEventListener('click', ev => ev.stopPropagation());
      const kind = TYPE[pr.t] || pr.t;
      const extra = pr.alpha != null && pr.alpha < 1 ? ` · ${Math.round(pr.alpha * 100)}%` : pr.t === 'poly' ? ` · ${pr.pts.length} pt${pr.closed ? ', closed' : ''}` : '';
      partsEl.append(h('div', { class: 'part', role: 'option', 'aria-selected': selPrim === i ? 'true' : 'false', 'data-pi': i, onClick: () => { selPrim = selPrim === i ? null : i; selPt = null; render(); } },
        h('span', { class: 'n' }, String(i + 1)), h('span', { class: 'truncate' }, kind + extra), sel.el));
    });
    if (!prims.length) partsEl.append(h('div', { class: 'text-sm text-muted' }, 'This icon has no parts.'));
  }
  function setRole(i, v) { const prims = work(); const p = prims[i]; if (!p) return; if (v === 'auto') { delete p.role; delete p.roleLocked; } else { p.role = v; p.roleLocked = true; } selPrim = i; commit(prims); }

  canvas.addEventListener('pointerdown', ev => {
    const hEl = ev.target.closest('[data-pi]');
    if (!hEl) { selPt = null; selPrim = null; render(); return; }
    const prims = work(); const pi = +hEl.dataset.pi; const pr = prims[pi];
    selPrim = pi;
    if (hEl.dataset.ins !== undefined) { insertPoint(prims, pi, +hEl.dataset.ins); return; }
    drag = { pi, prims, start: toGrid(ev), sx: ev.clientX, sy: ev.clientY, moved: false, vi: hEl.dataset.vi !== undefined ? +hEl.dataset.vi : null, si: hEl.dataset.si !== undefined ? +hEl.dataset.si : null, h: hEl.dataset.h || null, arc: hEl.dataset.arc || null };
    if (drag.arc === 'c') drag.c0 = pr.t === 'arc' ? pr.c.slice() : [pr.segs[drag.si][1], pr.segs[drag.si][2]];
    if (pr.t === 'path' && drag.h === 'p') { const segs = segsOf(pr); const sg = segs[drag.si]; drag.p0 = sg.p.slice(); drag.c2 = sg.t === 'C' ? sg.c2.slice() : null; const nx = segs[drag.si + 1]; drag.next = nx && (nx.t === 'C' || nx.t === 'Q') ? { i: drag.si + 1, c1: nx.c1.slice() } : null; }
    selPt = drag.vi !== null ? { pi, vi: drag.vi } : drag.si !== null && drag.h ? { pi, si: drag.si, h: drag.h } : null;
    canvas.setPointerCapture(ev.pointerId); ev.preventDefault();
  });
  canvas.addEventListener('pointermove', ev => {
    if (!drag) return;
    /* a press that wanders a few pixels is still a click: it selects the point and leaves it where it is */
    if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < (ev.pointerType === 'mouse' ? 3 : 8)) return;
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
  /* arrow keys move the selected point by a quarter unit, a whole unit with Shift */
  function nudge(dx, dy) {
    if (!selPt) return;
    const prims = work(); const pr = prims[selPt.pi]; if (!pr) return;
    if ((pr.t === 'poly' || pr.t === 'quad') && selPt.vi != null) { const p = pr.pts[selPt.vi]; p[0] = f2(p[0] + dx); p[1] = f2(p[1] + dy); }
    else if (pr.t === 'seq' && selPt.si != null) { const sg = pr.segs[selPt.si]; sg[1] = f2(sg[1] + dx); sg[2] = f2(sg[2] + dy); }
    else if (pr.t === 'path' && selPt.si != null) { const segs = segsOf(pr); const sg = segs[selPt.si]; const k = selPt.h; if (k === 'p') { sg.p = [f2(sg.p[0] + dx), f2(sg.p[1] + dy)]; if (sg.c2) sg.c2 = [f2(sg.c2[0] + dx), f2(sg.c2[1] + dy)]; const nx = segs[selPt.si + 1]; if (nx && nx.c1) nx.c1 = [f2(nx.c1[0] + dx), f2(nx.c1[1] + dy)]; } else if (sg[k]) sg[k] = [f2(sg[k][0] + dx), f2(sg[k][1] + dy)]; delete pr.d; }
    else return;
    commit(prims);
  }
  function cycleKind() { const prims = work(); const v = prims[selPt.pi].pts[selPt.vi]; const cur = typeof v[2] === 'number' ? -1 : KINDS.indexOf(v[2] || 'none'); v[2] = KINDS[(cur + 1) % KINDS.length]; commit(prims); }
  /* a corner of a polyline that keeps enough points, or an anchor of a path past
     its first; never a bezier handle, a loop's point or an arc's */
  function deletable(prims) {
    const p = selPt && prims[selPt.pi]; if (!p) return false;
    if (p.t === 'poly') return selPt.vi != null && p.pts.length > (p.closed ? 3 : 2);
    if (p.t === 'path') return selPt.h === 'p' && selPt.si > 0 && segsOf(p).filter(s => s.t !== 'Z').length > 2;
    return false;
  }
  function delPoint() {
    const prims = work(); if (!deletable(prims)) return;
    const p = prims[selPt.pi];
    if (p.t === 'poly') p.pts.splice(selPt.vi, 1);
    else { segsOf(p).splice(selPt.si, 1); delete p.d; }
    selPt = null; commit(prims);
  }
  function toggleClose() { const prims = work(); const p = prims[selPt ? selPt.pi : selPrim]; if (!p || p.t !== 'poly') return; p.closed = !p.closed; commit(prims); }
  function reset() { const s = store.get(); const edits = { ...s.edits }; delete edits[editKey(s.sel, 'outline')]; delete edits[editKey(s.sel, 'solid')]; selPt = null; selPrim = null; store.set({ edits }); }
  const isEdited = () => { const s = store.get(); return !!(s.edits[editKey(s.sel, 'outline')] || s.edits[editKey(s.sel, 'solid')]); };
  const isEditedWeight = () => { const s = store.get(); return !!s.edits[editKey(s.sel, s.P.weight)]; };

  function updateTools(prims) {
    const p = selPt && prims[selPt.pi];
    const isVertex = !!(p && p.t === 'poly' && selPt.vi !== undefined);
    const part = selPrim !== null && prims[selPrim];
    tKind.disabled = !isVertex; tDel.disabled = !deletable(prims); tClose.disabled = !((p && p.t === 'poly') || (part && part.t === 'poly'));
    tKind.textContent = isVertex ? 'Corner: ' + (typeof p.pts[selPt.vi][2] === 'number' ? p.pts[selPt.vi][2] + ' u' : (p.pts[selPt.vi][2] || 'none')) : 'Corner: none';
    const cp = (p && p.t === 'poly') ? p : (part && part.t === 'poly') ? part : null;
    if (cp) tClose.textContent = cp.closed ? 'Open path' : 'Close path';
    if (selPt) status.textContent = `Point on part ${selPt.pi + 1}${isVertex ? ` · corner ${p.pts[selPt.vi][2] || 'none'}` : ''}. Drag it, or nudge it with the arrow keys.`;
    else if (part) status.textContent = `Part ${selPrim + 1} of ${prims.length} selected. Change its role in the list below, or drag its points.`;
    else status.textContent = prims.length ? 'Drag a point. Click a part below to see which points are its own.' : '';
  }
  document.addEventListener('keydown', ev => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (!el.getClientRects().length) return; // the editor is not on screen (the whole library, or a closed sheet): the keys are the page's
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && selPt) { ev.preventDefault(); delPoint(); }
    else if (ev.key === 'Escape' && (selPt || selPrim !== null)) { selPt = null; selPrim = null; render(); }
    else if (selPt && /^Arrow(Up|Down|Left|Right)$/.test(ev.key)) { ev.preventDefault(); const d = ev.shiftKey ? 1 : 0.25; nudge(ev.key === 'ArrowLeft' ? -d : ev.key === 'ArrowRight' ? d : 0, ev.key === 'ArrowUp' ? -d : ev.key === 'ArrowDown' ? d : 0); }
  });
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits', 'ready'].includes(k))) { if (keys.includes('sel') || (keys.includes('P') && s.P.weight !== shownWeight)) { selPt = null; selPrim = null; } shownWeight = s.P.weight; render(); } });
  return { el, partsEl, render, reset, isEdited, isEditedWeight };
}
