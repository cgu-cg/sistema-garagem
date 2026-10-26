import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';

// Isola a funcao real sem carregar a pagina inteira, API ou banco.
function exportedFunction(file: string, name: string) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(fn); return fn.getText(source);
}

function harness() {
  const state: any[] = []; let cursor = 0;
  const hooks = {
    useState(initial: any) { const n = cursor++; if (!(n in state)) state[n] = initial;
      return [state[n], (value: any) => { state[n] = typeof value === 'function' ? value(state[n]) : value; }]; },
    useRef(initial: any) { const n = cursor++; if (!(n in state)) state[n] = { current: initial }; return state[n]; },
    useMemo(fn: () => any) { return fn(); },
    useEffect(fn: () => void, deps: any[]) { const n = cursor++; if (!(n in state) || deps.some((v, i) => v !== state[n][i])) { state[n] = deps; fn(); } },
  };
  const source = `import { useState, useRef, useMemo, useEffect } from 'react';
    ${exportedFunction('apps/web/src/pages/soltura/ciManager.ts', 'getConsorciadaByCarro')}
    ${exportedFunction('apps/web/src/pages/soltura/CiManutencaoView.tsx', 'CarSearchSelect')}`;
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const native = (tag: string) => ({ children, ...props }: any) => React.createElement(tag, props, children);
  const exports: any = {}, icons = native('svg');
  new Function('exports', 'require', 'Input', 'Popover', 'PopoverAnchor', 'PopoverContent', 'cn', 'toast',
    'Bus', 'Search', 'X', 'ChevronDown', 'Check', compiled)(exports,
    (name: string) => name === 'react' ? hooks : require(name), native('input'),
    ({ open, children }: any) => [children[0], open ? children[1] : null], ({ children }: any) => children,
    native('section'), (...classes: any[]) => classes.filter(Boolean).join(' '), { error() {} }, icons, icons, icons, icons, icons);
  const changes: string[] = [];
  const props: any = { value: '', allowedCars: [
    { prefixo: '2319', garagem: 'VCG' }, { prefixo: '3001', garagem: 'VCG' },
    { prefixo: '4001', garagem: 'VCG' }, { prefixo: '1001', garagem: 'VCM' },
  ], onChange: (value: string) => { changes.push(value); props.value = value; } };
  let nodes: any[] = [];
  const walk = (node: any): any => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (typeof node.type === 'function') return walk(node.type(node.props));
    nodes.push(node); walk(node.props?.children);
  };
  const text = (node: any): string => typeof node === 'string' || typeof node === 'number' ? String(node)
    : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : '';
  const get = (predicate: (node: any) => boolean) => { const found = nodes.find(predicate); assert.ok(found); return found; };
  return { props, changes, text, render() { cursor = 0; nodes = []; walk(exports.CarSearchSelect(props)); },
    input: () => get(n => n.type === 'input'),
    company: (name: string) => get(n => n.type === 'button' && text(n) === name),
    rows: () => nodes.filter(n => n.type === 'button' && /^\d{4}/.test(text(n))),
    allText: () => nodes.map(text).join(' '),
  };
}

test('lista distingue empresa de garagem e mostra contador da frota', () => {
  const h = harness(); h.render(); h.input().props.onFocus(); h.render();
  assert.equal(h.rows().length, 4); assert.match(h.allText(), /Mostrando 4 de 4/);
  assert.equal(h.company('TODAS').props['aria-pressed'], true);
  h.company('VSF').props.onClick(); h.render();
  assert.equal(h.rows().length, 1); assert.match(h.text(h.rows()[0]), /2319VSFGaragem VCG/);
  assert.match(h.allText(), /Mostrando 1 de 4/);
});

test('busca e empresa se combinam e mostram lista vazia sem alterar selecao', () => {
  const h = harness(); h.render(); h.input().props.onChange({ target: { value: '23' } }); h.render();
  assert.equal(h.rows().length, 1);
  h.company('VCG').props.onClick(); h.render(); assert.equal(h.rows().length, 0);
  assert.match(h.allText(), /Nenhum veículo encontrado/); assert.match(h.allText(), /Mostrando 0 de 4/);
  h.company('TODAS').props.onClick(); h.render(); assert.equal(h.rows().length, 1);
  assert.deepEqual(h.changes, []);
});

test('Enter seleciona somente um carro da empresa filtrada e fecha a lista', () => {
  const h = harness(); h.render(); h.input().props.onFocus(); h.render();
  h.company('JTU').props.onClick(); h.render();
  h.input().props.onKeyDown({ key: 'Enter', preventDefault() {} }); h.render();
  assert.deepEqual(h.changes, ['3001']); assert.equal(h.rows().length, 0);
});

test('seletor bloqueado desabilita filtros e impede escolha de carro', () => {
  const h = harness(); h.render(); h.input().props.onFocus(); h.render();
  h.props.disabled = true; h.render();
  assert.equal(h.input().props.disabled, true); assert.equal(h.company('VSF').props.disabled, true);
  assert.ok(h.rows().every(n => n.props.disabled)); h.rows()[0].props.onClick(); assert.deepEqual(h.changes, []);
});
