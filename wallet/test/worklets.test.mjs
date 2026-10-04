import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

/* What runs on the phone's animation thread calls nothing that is not a
   worklet. A gesture's callbacks, an animated style, a derived value and an
   animation's last callback all run there, and a plain function called from
   one stops the app on the phone, while the web, which runs everything on one
   thread, never shows it (Round 13: the owner saw Expo Go close on a slide).
   So every call inside one is checked: to a worklet of this app, to
   Reanimated's own, to Math and the like, or through runOnJS. */

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const traverse = traverseModule.default ?? traverseModule;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
const walk = d => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?)$/.test(f) && !/\.d\.ts$/.test(f)) files.push(p);
  }
};
walk(join(ROOT, 'src'));
walk(join(ROOT, 'app'));

const trees = new Map();
const tree = file => {
  if (!trees.has(file)) trees.set(file, parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] }));
  return trees.get(file);
};
const fileFor = (from, spec) => {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
};
const isFn = n => !!n && /Function/.test(n.type);
const isWorklet = n => isFn(n) && n.body?.type === 'BlockStatement' && (n.body.directives ?? []).some(d => d.value.value === 'worklet');
const kindOf = init => (isWorklet(init) ? 'worklet' : isFn(init) ? 'plain' : 'value');

/** what `name` is at the top of `file`: a worklet, a plain function, a value, or from a package */
function local(file, name, seen = new Set()) {
  for (const node of tree(file).program.body) {
    const d = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
    if (d?.type === 'FunctionDeclaration' && d.id?.name === name) return kindOf(d);
    if (d?.type === 'VariableDeclaration') for (const v of d.declarations) if (v.id?.name === name) return kindOf(v.init);
    if (node.type === 'ImportDeclaration')
      for (const s of node.specifiers)
        if (s.local.name === name) {
          const target = fileFor(file, node.source.value);
          return target ? exported(target, s.imported?.name ?? 'default', seen) : 'external';
        }
  }
  return null;
}
function exported(file, name, seen) {
  const key = `${file}#${name}`;
  if (seen.has(key)) return null;
  seen.add(key);
  for (const node of tree(file).program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      const d = node.declaration;
      if (d?.type === 'FunctionDeclaration' && d.id?.name === name) return kindOf(d);
      if (d?.type === 'VariableDeclaration') for (const v of d.declarations) if (v.id?.name === name) return kindOf(v.init);
      for (const s of node.specifiers ?? []) {
        if ((s.exported.name ?? s.exported.value) !== name) continue;
        if (!node.source) return local(file, s.local.name, seen);
        const target = fileFor(file, node.source.value);
        return target ? exported(target, s.local.name, seen) : 'external';
      }
    }
  }
  for (const node of tree(file).program.body)
    if (node.type === 'ExportAllDeclaration') {
      const target = fileFor(file, node.source.value);
      const k = target ? exported(target, name, seen) : null;
      if (k) return k;
    }
  return null;
}

/* where the thread is the phone's animation thread */
const HOOKS = {
  useAnimatedStyle: [0],
  useAnimatedProps: [0],
  useDerivedValue: [0],
  useAnimatedReaction: [0, 1],
  useFrameCallback: [0],
  useAnimatedScrollHandler: [0],
  runOnUI: [0],
};
const LAST_CALLBACK = { withTiming: 2, withSpring: 2, withDecay: 1, withRepeat: 3 };
const GESTURE = new Set(['onBegin', 'onStart', 'onUpdate', 'onChange', 'onEnd', 'onFinalize', 'onTouchesDown', 'onTouchesMove', 'onTouchesUp', 'onTouchesCancelled']);
/* what may be called there */
const GLOBALS = new Set(['Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'JSON', 'console', 'Date', 'isNaN', 'isFinite', 'parseFloat', 'parseInt', 'Easing', 'Extrapolation']);
const REANIMATED = new Set([
  'runOnJS',
  'runOnUI',
  'scheduleOnRN',
  'scheduleOnUI',
  'interpolate',
  'interpolateColor',
  'withTiming',
  'withSpring',
  'withDecay',
  'withDelay',
  'withSequence',
  'withRepeat',
  'withClamp',
  'cancelAnimation',
  'measure',
  'scrollTo',
  'clamp',
]);

function audit() {
  const found = [];
  for (const file of files) {
    const roots = [];
    traverse(tree(file), {
      Function(path) {
        if (isWorklet(path.node)) roots.push(path);
      },
      CallExpression(path) {
        const { callee } = path.node;
        if (callee.type === 'Identifier' && HOOKS[callee.name])
          for (const i of HOOKS[callee.name]) {
            const a = path.get(`arguments.${i}`);
            if (isFn(a?.node)) roots.push(a);
            if (a?.node?.type === 'ObjectExpression') for (const p of a.get('properties')) roots.push(p.node.type === 'ObjectMethod' ? p : p.get('value'));
          }
        if (callee.type === 'Identifier' && LAST_CALLBACK[callee.name] !== undefined) {
          const a = path.get(`arguments.${LAST_CALLBACK[callee.name]}`);
          if (isFn(a?.node)) roots.push(a);
        }
        if (callee.type === 'MemberExpression' && GESTURE.has(callee.property.name)) {
          let o = callee.object;
          let gesture = false;
          let js = false;
          while (o?.type === 'CallExpression') {
            const c = o.callee;
            if (c.type === 'MemberExpression' && c.property.name === 'runOnJS') js = true;
            if (c.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 'Gesture') gesture = true;
            o = c.type === 'MemberExpression' ? c.object : null;
          }
          const a = path.get('arguments.0');
          if (gesture && !js && isFn(a?.node)) roots.push(a);
        }
      },
    });
    const done = new Set();
    for (const root of roots) {
      if (!isFn(root.node) && root.node.type !== 'ObjectMethod') continue;
      if (done.has(root.node)) continue;
      done.add(root.node);
      const within = scope => {
        for (let q = scope; q; q = q.parent) if (q.path.node === root.node) return true;
        return false;
      };
      root.traverse({
        CallExpression(p) {
          const c = p.node.callee;
          let what = null;
          if (c.type === 'Identifier') {
            if (REANIMATED.has(c.name) || GLOBALS.has(c.name)) return;
            const b = p.scope.getBinding(c.name);
            if (!b) return void (what = `${c.name}, which is not defined here`);
            if (b.kind === 'param' || within(b.scope)) return;
            if (b.kind === 'module') {
              const k = local(file, c.name);
              if (k !== 'worklet' && k !== 'value') what = `${c.name} (${k ?? 'unknown'})`;
            } else {
              const init = b.path.node.type === 'VariableDeclarator' ? b.path.node.init : b.path.node;
              if (isFn(init) && !isWorklet(init)) what = `${c.name}, a plain function`;
            }
          } else if (c.type === 'MemberExpression') {
            let o = c.object;
            while (o.type === 'MemberExpression') o = o.object;
            if (o.type !== 'Identifier' || GLOBALS.has(o.name)) return;
            const b = p.scope.getBinding(o.name);
            if (!b || b.kind === 'param' || within(b.scope)) return;
            if (['get', 'set', 'modify'].includes(c.property.name)) return;
            const init = b.path.node.type === 'VariableDeclarator' ? b.path.node.init : null;
            if (init && ['ArrayExpression', 'StringLiteral', 'TemplateLiteral'].includes(init.type)) return;
            what = `${o.name}.${c.property.name}`;
          }
          if (what) found.push(`${file.slice(ROOT.length + 1)}:${p.node.loc.start.line} calls ${what} on the animation thread`);
        },
      });
    }
  }
  return found;
}

describe('the animation thread', () => {
  it('calls only worklets, Reanimated and the language itself; anything else goes through runOnJS', () => {
    expect(audit()).toEqual([]);
  });
});
