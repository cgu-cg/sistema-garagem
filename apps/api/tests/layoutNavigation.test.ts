import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';

// Renderiza o Layout real e aciona seus handlers; sem navegador/API/banco.
function withLayout(run: (h: any) => void) {
  const loader = (Module as any)._load, resolver = (Module as any)._resolveFilename;
  const oldTSX = require.extensions['.tsx'];
  const descriptors = ['navigator', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const file = require.resolve('../../web/src/components/layout.tsx'), cached = require.cache[file]; delete require.cache[file];
  const states: any[] = [], effects: any[] = []; let cursor = 0, effectCursor = 0;
  let pathname = '/escala-carros/alterar-carro-programado'; const pending: (() => void)[] = [];
  const hooks = { ...React,
    useState(initial: any) { const n = cursor++; if (!(n in states)) states[n] = typeof initial === 'function' ? initial() : initial;
      return [states[n], (value: any) => { states[n] = typeof value === 'function' ? value(states[n]) : value; }]; },
    useEffect(fn: () => void, deps: any[]) { const n = effectCursor++, changed = !effects[n] || deps.some((v, i) => v !== effects[n][i]); effects[n] = deps;
      // Exercita somente o efeito de rota; efeitos de DOM/conexao ficam fora deste teste.
      if (changed && deps.length === 1 && deps[0] === pathname) pending.push(fn);
    },
  };
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'light' } });
    (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) { return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args); };
    (Module as any)._load = function(id: string, ...args: unknown[]) {
      if (id === 'react') return hooks;
      if (id === '@/stores/auth') return { useAuth: () => ({ user: { role: 'ADMIN', name: 'Administrador', garagem: 'VCG' }, logout() {} }), roleLabels: { ADMIN: 'Administrador' } };
      if (id === 'react-router-dom') return { useLocation: () => ({ pathname }), useNavigate: () => () => {}, Outlet() {}, Link() {} };
      return loader.call(this, id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    const { Layout } = require(file);
    const nodes = (root: any): any[] => !root || typeof root !== 'object' ? [] : Array.isArray(root)
      ? root.flatMap(nodes) : [root, ...nodes(root.props?.children)];
    const text = (node: any): string => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : '';
    let tree: any;
    const render = () => { cursor = effectCursor = 0; tree = Layout(); if (pending.length) { pending.splice(0).forEach(fn => fn()); cursor = effectCursor = 0; tree = Layout(); } };
    const find = (predicate: (node: any) => boolean, root = tree) => { const result = nodes(root).find(predicate); assert.ok(result); return result; };
    const aside = () => find((n: any) => n.props?.id === 'desktop-navigation');
    const mobile = () => find((n: any) => n.props?.className?.includes('md:hidden fixed inset-y-0'));
    run({ render, text, find, aside, mobile, nodes,
      toggle: () => find((n: any) => n.props?.['data-sidebar-toggle']).props.onClick(),
      isCollapsed: () => find((n: any) => n.props?.['data-sidebar-toggle']).props['aria-expanded'] === false,
      route: (value: string) => { pathname = value; },
    });
  } finally {
    (Module as any)._load = loader; (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
    if (cached) require.cache[file] = cached; else delete require.cache[file];
    for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete (globalThis as any)[key]; }
  }
}

test('menu inicia recolhido e links de pagina recolhem mesmo ao selecionar a rota atual', () => withLayout(h => {
  h.render(); assert.equal(h.isCollapsed(), true); assert.match(h.aside().props.className, /w-14/);
  for (const route of ['/home', '/escala-carros/alterar-carro-programado']) {
    h.toggle(); h.render(); assert.equal(h.isCollapsed(), false);
    h.find((n: any) => n.props?.to === route, h.aside()).props.onClick(); h.render();
    assert.equal(h.isCollapsed(), true);
  }
}));

test('grupos abrem submenus sem navegar ou recolher; mudanca de rota recolhe o menu', () => withLayout(h => {
  h.render(); h.find((n: any) => n.props?.['aria-label'] === 'Soltura', h.aside()).props.onClick(); h.render();
  assert.equal(h.isCollapsed(), false);
  h.find((n: any) => n.type === 'button' && h.text(n) === 'Soltura', h.aside()).props.onClick({ preventDefault() {} }); h.render();
  assert.equal(h.isCollapsed(), false);
  h.route('/home'); h.render(); assert.equal(h.isCollapsed(), true);
}));

test('drawer mobile fecha em links diretos e submenus, incluindo pagina atual', () => withLayout(h => {
  h.render();
  for (const route of ['/home', '/escala-carros/alterar-carro-programado']) {
    h.find((n: any) => n.props?.['aria-label'] === 'Abrir menu').props.onClick(); h.render();
    assert.match(h.mobile().props.className, / translate-x-0/);
    h.find((n: any) => n.props?.to === route, h.mobile()).props.onClick(); h.render();
    assert.match(h.mobile().props.className, /-translate-x-full/);
  }
}));
