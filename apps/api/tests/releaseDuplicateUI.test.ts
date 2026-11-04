import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import React from 'react';
import ts from 'typescript';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// Exercita o hook real e as respostas dos botoes, sem rede, DOM ou banco.
function harness() {
  const loader = (Module as any)._load, resolver = (Module as any)._resolveFilename, oldTSX = require.extensions['.tsx'];
  const memory: any[] = []; let cursor = 0, hook: any, cleanup: (() => void) | undefined;
  try {
    (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) {
      return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args);
    };
    (Module as any)._load = function(id: string, ...args: unknown[]) {
      if (id === 'react') return { ...React,
        useState(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = initial;
          return [memory[n], (value: any) => { memory[n] = value; }]; },
        useRef(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = { current: initial }; return memory[n]; },
        useEffect(effect: () => (() => void), deps: unknown[]) { const n = cursor++;
          if (memory[n] !== deps[0]) { cleanup?.(); memory[n] = deps[0]; cleanup = effect(); } },
      };
      return loader.call(this, id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    const file = require.resolve('../../web/src/pages/soltura/ReleaseDuplicateConfirmation'); delete require.cache[file];
    hook = require(file).useReleaseDuplicateConfirmation;
  } finally {
    (Module as any)._load = loader; (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
  }
  let scope = 'folha-1', result: any;
  const render = () => { cursor = 0; result = hook(scope); return result; };
  const nodes = (node: any): any[] => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  return { render, close: () => cleanup?.(), scope: (value: string) => { scope = value; render(); },
    click: (text: string) => { const button = nodes(render().dialog).find(n => n.props?.children === text); assert.ok(button); button.props.onClick(); },
    text: () => nodes(render().dialog).flatMap(n => n.props?.children ?? []).filter(v => typeof v === 'string').join(' '),
  };
}
const details = (token = 'a'.repeat(64)) => ({ token, conflitos: [{ tipo: 'CARRO', valor: '4000', scheduleId: 'r2', linha: '308', tabela: '2',
  outras: [{ scheduleId: 'r1', linha: '302', tabela: '1' }] }] });
const rejection = (token?: string) => Object.assign(new Error('Repetido'), { code: 'CONFIRMAR_REPETICAO_NA_SOLTURA', details: details(token) });
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test('popup mostra linha de origem, cancelar nao repete a escrita e confirmar envia token exato', async () => {
  const h = harness(); let calls: unknown[] = [];
  const write = async (token?: string) => { calls.push(token); if (!token) throw rejection(); return 'salvo'; };
  const cancelled = h.render().run(write); const caught = assert.rejects(cancelled, /cancelado/);
  await tick(); assert.match(h.text(), /302/); assert.match(h.text(), /308/);
  h.click('Não, voltar'); await caught; assert.deepEqual(calls, [undefined]);
  calls = []; const accepted = h.render().run(write); await tick(); h.click('Sim, confirmar');
  assert.equal(await accepted, 'salvo'); assert.deepEqual(calls, [undefined, 'a'.repeat(64)]); h.close();
});

test('mudanca concorrente mostra novo aviso e troca de contexto cancela sem gravar', async () => {
  const h = harness(); const calls: unknown[] = [];
  const request = h.render().run(async (token?: string) => {
    calls.push(token); if (token !== 'b'.repeat(64)) throw rejection(token ? 'b'.repeat(64) : undefined); return 'salvo';
  });
  const caught = assert.rejects(request, /cancelado/);
  await tick(); h.click('Sim, confirmar'); await tick();
  assert.equal(h.render().dialog.props.open, true); h.scope('folha-2'); await caught;
  assert.deepEqual(calls, [undefined, 'a'.repeat(64)]); h.close();
});

test('outros erros nao sao tratados como permissao para repetir a escrita', async () => {
  const h = harness(); let calls = 0;
  await assert.rejects(h.render().run(async () => { calls++; throw Error('Bloqueado Portaria'); }), /Bloqueado Portaria/);
  assert.equal(calls, 1); assert.equal(h.render().dialog.props.open, false); h.close();
});
