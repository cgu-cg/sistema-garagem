import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import React from 'react';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

// Exercita os handlers/estados reais do componente, sem DOM, API ou banco.
// Primitivos de layout e hooks sao adaptados para avancar cada render explicitamente.
function harness() {
  const loader = (Module as any)._load, previousTSX = require.extensions['.tsx'];
  const file = require.resolve('../../web/src/pages/soltura/CIReinforcementCards.tsx');
  const cached = require.cache[file]; delete require.cache[file];
  const memory: any[] = []; let cursor = 0; const cleanups: (() => void)[] = [];
  const native = (tag: string) => ({ children, ...props }: any) => React.createElement(tag, props, children);
  let Component: any;
  try {
    (Module as any)._load = function(id: string, ...args: unknown[]) {
      if (id === 'react') return { ...React,
        useState(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = typeof initial === 'function' ? initial() : initial;
          return [memory[n], (value: any) => { memory[n] = typeof value === 'function' ? value(memory[n]) : value; }]; },
        useRef(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = { current: initial }; return memory[n]; },
        useEffect(effect: () => (() => void) | void) { const n = cursor++; if (!(n in memory)) { memory[n] = true; const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } },
      };
      if (id === '@/components/ui/button') return { Button: native('button') };
      if (id === '@/components/ui/input') return { Input: native('input') };
      if (id === '@/components/ui/dialog') return {
        Dialog: ({ open, children }: any) => open ? children : null,
        DialogContent: native('section'), DialogDescription: native('p'), DialogFooter: native('footer'),
        DialogHeader: native('header'), DialogTitle: native('h2'),
      };
      return loader.call(this, id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    Component = require(file).CIReinforcementCards;
  } finally {
    (Module as any)._load = loader;
    if (previousTSX) require.extensions['.tsx'] = previousTSX; else delete require.extensions['.tsx'];
    if (cached) require.cache[file] = cached; else delete require.cache[file];
  }
  const starts: string[] = [], ends: string[] = [], savedFixed: any[] = [], savedInspection: any[] = [];
  const props: any = { slots: Array.from({ length: 12 }, (_, n) => ({ id: `ref-${n + 1}`, horario: '07:15 - A' })),
    cars: Array.from({ length: 8 }, (_, n) => ({ prefixo: String(4000 + n), garagem: 'VCG' })),
    editable: true, busy: false, refreshRequired: false, inspection: [], readSlot: () => undefined,
    onStart: (key: string) => { starts.push(key); return true; }, onEnd: (key: string) => ends.push(key),
    onSaveFixed: (...args: any[]) => savedFixed.push(args), onSaveInspection: (...args: any[]) => savedInspection.push(args), onRemoveFixed() {},
    CarSelect: ({ onChange, ...p }: any) => React.createElement('select', { ...p, 'data-car-selector': true, onChange: (e: any) => onChange(e.target.value) }),
  };
  let nodes: any[] = [];
  const walk = (node: any): any => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (typeof node.type === 'function') return walk(node.type(node.props));
    nodes.push(node); walk(node.props?.children);
  };
  const render = () => { cursor = 0; nodes = []; walk(Component(props)); return nodes; };
  const text = (node: any): string => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : '';
  const get = (predicate: (node: any) => boolean) => { const node = nodes.find(predicate); assert.ok(node, 'Elemento esperado ausente'); return node; };
  return { props, starts, ends, savedFixed, savedInspection, render, nodes: () => nodes, get, text,
    clickLabel: (label: string) => get(n => n.type === 'button' && n.props['aria-label'] === label).props.onClick(),
    button: (label: string) => get(n => n.type === 'button' && text(n) === label),
    car: () => get(n => n.type === 'select' && n.props['data-car-selector']),
    unmount: () => cleanups.forEach(fn => fn()),
  };
}

test('cards mostram apenas dados salvos e treze botoes +, sem selects ou checks por carro', () => {
  const h = harness(); h.render();
  assert.equal(h.nodes().filter(n => n.type === 'button').length, 13);
  assert.equal(h.nodes().filter(n => n.type === 'select' || n.type === 'input').length, 0);
  h.props.editable = false; h.render();
  assert.ok(h.nodes().filter(n => n.type === 'button').every(n => n.props.disabled));
});

test('popup de horario exige situacao/carro, obs opcional; so fecha quando salvar confirma', () => {
  const h = harness(); h.render(); h.clickLabel('Adicionar reforço 07:15 - A, posição 1'); h.render();
  assert.deepEqual(h.starts, ['ref-1']); assert.equal(h.button('Salvar').props.disabled, true);
  h.car().props.onChange({ target: { value: '4001' } }); h.render();
  assert.equal(h.button('Salvar').props.disabled, true);
  h.get(n => n.type === 'select' && !n.props['data-car-selector']).props.onChange({ target: { value: 'INSPEÇÃO' } }); h.render();
  assert.equal(h.button('Salvar').props.disabled, false);
  assert.ok(!h.get(n => n.type === 'input').props.required);
  h.get(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(h.savedFixed.length, 1); assert.deepEqual(h.savedFixed[0][1], { prefixo: '4001', motivo: 'INSPEÇÃO', obs: '' });
  h.render(); assert.ok(h.nodes().some(n => n.type === 'form'));
  h.savedFixed[0][2](); h.render();
  assert.ok(!h.nodes().some(n => n.type === 'form')); assert.deepEqual(h.ends, ['ref-1']);
});

test('inspecao acumula badges, evita repeticao, limita seis e envia uma unica gravacao', () => {
  const h = harness(); h.render(); h.clickLabel('Adicionar ou editar carros da inspeção'); h.render();
  for (let n = 0; n < 6; n++) { h.car().props.onChange({ target: { value: String(4000 + n) } }); h.render(); }
  assert.equal(h.car().props.disabled, true);
  h.car().props.onChange({ target: { value: '4006' } }); h.render();
  assert.equal(h.nodes().filter(n => n.type === 'button' && String(n.props['aria-label']).startsWith('Retirar ')).length, 6);
  h.button('Salvar').props.onClick();
  assert.equal(h.savedInspection.length, 1); assert.equal(h.savedInspection[0][0].length, 6);
  assert.equal(new Set(h.savedInspection[0][0].map((i: any) => i.prefixo)).size, 6);
  h.clickLabel('Retirar 4000 da seleção'); h.render(); assert.equal(h.car().props.disabled, false);
  h.car().props.onChange({ target: { value: '4001' } }); h.render();
  assert.equal(h.nodes().filter(n => n.type === 'button' && String(n.props['aria-label']).startsWith('Retirar ')).length, 5);
});

test('cancelamento descarta apenas rascunho; fechamento durante gravacao e bloqueado', () => {
  const oldWindow = (globalThis as any).window; let discard = false;
  (globalThis as any).window = { confirm: () => discard };
  try {
    const h = harness(); h.render(); h.clickLabel('Adicionar ou editar carros da inspeção'); h.render();
    h.car().props.onChange({ target: { value: '4001' } }); h.render();
    h.button('Cancelar').props.onClick(); h.render(); assert.equal(h.ends.length, 0);
    discard = true; h.props.busy = true; h.render(); h.button('Cancelar').props.onClick(); h.render(); assert.equal(h.ends.length, 0);
    h.props.busy = false; h.render(); h.button('Cancelar').props.onClick(); h.render();
    assert.deepEqual(h.ends, ['inspection']); assert.equal(h.savedInspection.length, 0);
    h.clickLabel('Adicionar ou editar carros da inspeção'); h.render();
    assert.equal(h.nodes().filter(n => n.type === 'button' && String(n.props['aria-label']).startsWith('Retirar ')).length, 0);
    h.unmount(); assert.deepEqual(h.ends, ['inspection', 'inspection']);
  } finally { (globalThis as any).window = oldWindow; }
});

test('conflito/erro preserva formulario e exige atualizacao antes de nova tentativa', () => {
  const h = harness(); h.render(); h.clickLabel('Adicionar ou editar carros da inspeção'); h.render();
  h.car().props.onChange({ target: { value: '4001' } }); h.render(); h.button('Salvar').props.onClick();
  h.props.refreshRequired = true; h.props.editable = false; h.render();
  assert.ok(h.nodes().some(n => n.props?.role === 'alert'));
  assert.equal(h.button('Salvar').props.disabled, true);
  assert.ok(h.nodes().some(n => n.type === 'button' && n.props['aria-label'] === 'Retirar 4001 da seleção'));
});
