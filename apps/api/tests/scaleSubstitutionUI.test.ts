import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import React from 'react';
import ts from 'typescript';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// Avanca os hooks/handlers reais sem DOM, rede ou banco.
function harness(kind: 'linha' | 'popup' = 'linha') {
  const loader = (Module as any)._load, resolver = (Module as any)._resolveFilename;
  const oldTSX = require.extensions['.tsx'];
  const memory: any[] = []; let cursor = 0;
  let Component: any;
  try {
    (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) {
      return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args);
    };
    (Module as any)._load = function(id: string, ...args: unknown[]) {
      if (id === 'react') return { ...React,
        useState(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = typeof initial === 'function' ? initial() : initial;
          return [memory[n], (value: any) => { memory[n] = typeof value === 'function' ? value(memory[n]) : value; }]; },
        useRef(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = { current: initial }; return memory[n]; },
        useEffect() {},
      };
      if (id === 'sonner') return { toast: { error() {}, success() {} } };
      return loader.call(this, id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    const file = require.resolve(kind === 'linha' ? '../../web/src/pages/soltura/AlterarCarroProgramadoView' : '../../web/src/pages/soltura/ScaleSubstitutionDialog');
    delete require.cache[file];
    const exports = require(file);
    if (kind === 'popup') Component = exports.ScaleSubstitutionDialog;
    else {
      const find = (node: any): any => Array.isArray(node) ? node.map(find).find(Boolean)
        : node && typeof node === 'object' ? node.type?.name === 'LineRow' ? node.type : find(node.props?.children) : undefined;
      Component = find(exports.AlterarCarroProgramadoView({ schedules: [{ id: 'linha-1', linha: '302', tabela: '1', carroProgramado: '3951' }], official: null }));
      assert.ok(Component); memory.length = 0;
    }
  } finally {
    (Module as any)._load = loader; (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
  }
  const calls: any[] = [], edits: any[] = [];
  const props: any = kind === 'linha' ? {
    item: { id: 'linha-1', linha: '302', tabela: '1', carroProgramado: '3951', saidaGaragem: '04:00' },
    official: { frota: ['3951', '2319', '2320'], bloqueados: [], cards: [], ocupacoes: [], contexto: { garagem: 'VCG' } },
    readOnly: false, drafts: new Map(), onEditingChange: (...args: any[]) => edits.push(args),
    onSave: async (...args: any[]) => { calls.push(args); return true; },
  } : { prefixo: '3951', substituto: '2319', saving: false, onCancel: () => calls.push('cancelar'), onSave: (value: any) => calls.push(value) };
  let nodes: any[] = [];
  const walk = (node: any): void => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    nodes.push(node); walk(node.props?.children);
  };
  const render = () => { cursor = 0; nodes = []; walk(Component(props)); };
  const get = (predicate: (n: any) => boolean) => { const node = nodes.find(predicate); assert.ok(node, 'Elemento esperado ausente'); return node; };
  return { props, calls, edits, render, nodes: () => nodes, get,
    picker: () => get(n => n.type?.name === 'ScaleVehiclePicker'),
    modal: () => get(n => n.type?.name === 'ScaleSubstitutionDialog'),
    select: (value: string) => { const p = get(n => n.type?.name === 'ScaleVehiclePicker').props; p.onChange(value); p.onSelect(value); },
  };
}

test('linha: selecionar substituto abre popup sem salvar; cancelar restaura carro e limpa rascunho', () => {
  const h = harness(); h.render(); h.select('2319'); h.render();
  assert.equal(h.modal().props.prefixo, '3951'); assert.equal(h.modal().props.substituto, '2319');
  assert.deepEqual(h.calls, []);
  h.modal().props.onCancel(); h.render();
  assert.equal(h.picker().props.value, ''); assert.equal(h.props.drafts.size, 0);
  assert.ok(!h.nodes().some(n => n.type?.name === 'ScaleSubstitutionDialog'));
  assert.deepEqual(h.calls, []);
});

test('linha: salvar envia uma unica troca e motivo; falha conserva popup e rascunho', async () => {
  const h = harness(); let success = false;
  h.props.onSave = async (...args: any[]) => { h.calls.push(args); return success; };
  h.render(); h.select('2319'); h.render();
  const retirada = { prefixo: '3951', destino: 'BLOQUEAR', motivo: 'Falha mecanica' };
  h.modal().props.onSave(retirada); await new Promise(resolve => setImmediate(resolve)); h.render();
  assert.deepEqual(h.calls, [['linha-1', '2319', retirada]]);
  assert.ok(h.modal()); assert.equal(h.props.drafts.get('linha-1'), '2319');
  success = true; h.modal().props.onSave(retirada); await new Promise(resolve => setImmediate(resolve)); h.render();
  assert.ok(!h.nodes().some(n => n.type?.name === 'ScaleSubstitutionDialog'));
  assert.equal(h.props.drafts.size, 0);
});

test('linha: segunda troca usa carro atual e CI bloqueada impede opcao reserva', () => {
  const h = harness(); h.props.item.carroSubstituido = '2319'; h.props.official.bloqueados = ['2319'];
  h.render(); h.select('2320'); h.render();
  assert.equal(h.modal().props.prefixo, '2319');
  assert.match(h.modal().props.reserveUnavailable, /bloqueado/);
});

test('linha: confirmar sem trocar nao pede destino; digitacao pede popup ao confirmar', async () => {
  const h = harness(); h.render(); await h.picker().props.onConfirm(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0][2], undefined);
  h.picker().props.onChange('2319'); h.render(); h.picker().props.onConfirm(); h.render();
  assert.ok(h.modal()); assert.equal(h.calls.length, 1);
});

test('popup: exige destino e motivo sem espacos e envia motivo normalizado', () => {
  const h = harness('popup'); h.render();
  const submit = () => h.get(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  const save = () => h.get(n => n.props.type === 'submit');
  assert.ok(save().props.disabled); submit(); assert.deepEqual(h.calls, []);
  h.get(n => n.type === 'input' && n.props.value === 'RESERVA').props.onChange(); h.render();
  h.get(n => n.type === 'textarea').props.onChange({ target: { value: '  ' } }); h.render();
  assert.ok(save().props.disabled); submit(); assert.deepEqual(h.calls, []);
  h.get(n => n.type === 'textarea').props.onChange({ target: { value: '  Ajuste de frota  ' } }); h.render();
  assert.equal(save().props.disabled, false); submit();
  assert.deepEqual(h.calls, [{ prefixo: '3951', destino: 'RESERVA', motivo: 'Ajuste de frota' }]);
  h.props.saving = true; h.render(); submit(); assert.equal(h.calls.length, 1);
});

test('popup: reserva indisponivel nao permite salvar nem fechar durante gravacao', () => {
  const h = harness('popup'); h.props.reserveUnavailable = 'Bloqueado na CI'; h.render();
  assert.equal(h.get(n => n.type === 'input' && n.props.value === 'RESERVA').props.disabled, true);
  h.props.saving = true; h.render();
  h.get(n => n.type?.name === 'Dialog').props.onOpenChange(false);
  assert.deepEqual(h.calls, []);
});
