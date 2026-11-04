import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import React from 'react';
import ts from 'typescript';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// Executa estados e handlers reais do popover, sem DOM ou API.
function harness(kind: 'troca' | 'notice' = 'troca') {
 const loader = (Module as any)._load, resolver = (Module as any)._resolveFilename, oldTSX = require.extensions['.tsx'];
 const memory: any[] = []; let cursor = 0, Component: any;
 try {
  (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) {
   return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args);
  };
  (Module as any)._load = function(id: string, ...args: unknown[]) {
   if (id === 'react') return { ...React,
    useContext() { return null; },
    useState(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = initial;
     return [memory[n], (value: any) => { memory[n] = typeof value === 'function' ? value(memory[n]) : value; }]; },
    useRef(initial: any) { const n = cursor++; if (!(n in memory)) memory[n] = { current: initial }; return memory[n]; },
   };
   if (id === 'sonner') return { toast: { error() {} } };
   return loader.call(this, id, ...args);
  };
  require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
   fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, f);
  const file = require.resolve(kind === 'troca' ? '../../web/src/pages/soltura/CarroTrocaPopover' : '../../web/src/pages/soltura/CiVehicleNotice'); delete require.cache[file];
  Component = kind === 'troca' ? require(file).CarroTrocaPopover : require(file).CiVehicleNotice;
 } finally {
  (Module as any)._load = loader; (Module as any)._resolveFilename = resolver;
  if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
 }
 const calls: any[] = [];
 const props: any = kind === 'troca' ? { item: { id: 'linha-1', linha: '302', tabela: '1' }, carroAtual: '4000',
  onTrocarCarro: async (...args: any[]) => { calls.push(args); return true; } } : {
  state: { ciData: '2026-10-27', bloqueados: [], cards: [], ciAvisos: [] }, prefixo: '4000', defectDescription: 'Pneu furado', hideIcon: true,
 };
 let nodes: any[] = [];
 const walk = (node: any): void => {
  if (Array.isArray(node)) { node.forEach(walk); return; }
  if (!node || typeof node !== 'object') return;
  nodes.push(node); walk(node.props?.children);
 };
 const render = () => { cursor = 0; nodes = []; const tree = Component(props); walk(tree); return tree; };
 const get = (predicate: (n: any) => boolean) => { const found = nodes.find(predicate); assert.ok(found, 'Elemento esperado ausente'); return found; };
 const open = () => { get(n => n.type === 'button' && n.props['aria-label']?.includes('Clique para alterar')).props.onClick({ stopPropagation() {} }); render(); };
 const car = (value: string) => { get(n => n.type?.name === 'FleetVehicleInput').props.onChange({ target: { value } }); render(); };
 const reason = (value: string) => { get(n => n.type === 'input' && n.props.type === 'radio' && n.props.value === value).props.onChange(); render(); };
 const submit = () => get(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
 return { props, calls, render, get, open, car, reason, submit };
}

test('seletor filho mantem a mesma estrutura ao digitar prefixo e alternar avisos', () => {
 const h = harness('notice'); h.props.defectDescription = undefined;
 h.props.children = React.createElement('input', { 'aria-label': 'Carro substituido' });
 const path = (tree: any) => [tree.type, tree.props.children[0].type,
  tree.props.children[0].props.children.type, tree.props.children[0].props.children.props.children[0]];
 h.props.prefixo = ''; const initial = path(h.render());
 assert.equal(h.render().props.open, false);
 for (const prefixo of ['2', '23', '231', '2319', '', '4000']) {
  h.props.prefixo = prefixo;
  h.props.warning = prefixo && prefixo !== '2319' ? 'Informe um carro valido.' : undefined;
  assert.deepEqual(path(h.render()), initial);
 }
});

test('troca envia somente o novo carro e deixa o motivo para o card Substituidos', async () => {
 const h = harness(); h.render(); h.open(); h.car('4001');
 assert.throws(() => h.get(n => n.type === 'input' && n.props.type === 'radio'));
 assert.throws(() => h.get(n => n.type === 'textarea'));
 await h.submit(); h.render();
 assert.equal(h.calls.length, 1); assert.equal(h.calls[0][1], '4001');
 assert.equal(h.calls[0][2], undefined);
 assert.equal(h.get(n => n.type?.name === 'Popover').props.open, false);
});

test('carro vazio ou igual ao atual nao gera nova troca', async () => {
 const h = harness(); h.render(); h.open(); await h.submit();
 h.car('4000'); await h.submit(); assert.deepEqual(h.calls, []);
});

test('consulta temporaria preserva borda e tamanho do carro; formularios fechados nao sao montados', () => {
 const h = harness(); h.render();
 const editable = h.get(n => n.type === 'button' && n.props['aria-label']?.includes('Carro realizado')).props.className;
 assert.match(editable, /border-neutral-300/); assert.match(editable, /px-2.5 py-0.5/);
 assert.throws(() => h.get(n => n.type === 'form'));
 h.props.isReadOnly = true; h.render();
 const readonly = h.get(n => n.props['data-readonly'] === 'true').props.className;
 assert.match(readonly, /border-neutral-300/); assert.match(readonly, /px-2.5 py-0.5/);
 assert.throws(() => h.get(n => n.type === 'form'));
});

test('recarga com popup aberto preserva formulario e bloqueia salvar ate a consulta terminar', async () => {
 const h = harness(); h.render(); h.open(); h.car('4001');
 h.props.isReadOnly = true; h.render();
 assert.ok(h.get(n => n.type === 'form')); assert.equal(h.get(n => n.props.type === 'submit').props.disabled, true);
 await h.submit(); assert.equal(h.calls.length, 0);
 h.props.isReadOnly = false; h.render(); await h.submit(); assert.equal(h.calls.length, 1);
});

test('pendencia impede fechar e repetir; falha mantem popup e carro', async () => {
 const h = harness(); let resolve!: (value: boolean) => void;
 h.props.onTrocarCarro = () => new Promise<boolean>(r => { resolve = r; });
 h.render(); h.open(); h.car('4001');
 h.render();
 const request = h.submit(); h.render();
 assert.equal(h.get(n => n.props.type === 'submit').props.disabled, true);
 h.get(n => n.type?.name === 'Popover').props.onOpenChange(false); h.render();
 assert.equal(h.get(n => n.type?.name === 'Popover').props.open, true);
 await h.submit(); resolve(false); await request; h.render();
 assert.equal(h.get(n => n.type?.name === 'Popover').props.open, true);

 assert.equal(h.get(n => n.type?.name === 'FleetVehicleInput').props.value, '4001');
});

test('aviso do carro abre card claro no hover e foco com descricao do defeito', () => {
 const h = harness('notice'); h.render();
 const target = () => h.get(n => n.type === 'span' && n.props['aria-label']?.includes('Ver ocorrencias'));
 target().props.onMouseEnter(); h.render(); assert.equal(h.get(n => n.type?.name === 'Popover').props.open, true);
 assert.match(h.get(n => n.props.align === 'start').props.className, /bg-card text-card-foreground/);
 assert.ok(h.get(n => n.type === 'p' && Array.isArray(n.props.children) && n.props.children.includes('Pneu furado')));
 target().props.onMouseLeave(); h.render(); assert.equal(h.get(n => n.type?.name === 'Popover').props.open, false);
 target().props.onFocus(); h.render(); assert.equal(h.get(n => n.type?.name === 'Popover').props.open, true);
});

test('aviso em modo hover nao intercepta clique da troca e fica oculto enquanto formulario esta aberto', () => {
 const h = harness('notice'); h.props.hoverOnly = true; h.render();
 let prevented = false;
 h.get(n => n.type === 'span' && n.props['aria-label']?.includes('Ver ocorrencias')).props.onClick({ preventDefault() { prevented = true; } });
 h.render(); assert.equal(prevented, false); assert.equal(h.get(n => n.type?.name === 'Popover').props.open, false);
 h.get(n => n.type === 'span' && n.props['aria-label']?.includes('Ver ocorrencias')).props.onMouseEnter();
 h.props.hoverDisabled = true; h.render(); assert.equal(h.get(n => n.type?.name === 'Popover').props.open, false);
});

test('card de defeito da Soltura nao identifica o carro como pertencente a CI', () => {
 const h = harness('notice'); h.render();
 h.get(n => n.type === 'span' && n.props['aria-label']?.includes('Ver ocorrencias')).props.onMouseEnter(); h.render();
 const heading = h.get(n => n.type === 'p' && n.props.className?.startsWith('text-xs font-bold'));
 assert.match(JSON.stringify(heading.props.children), /Soltura/); assert.doesNotMatch(JSON.stringify(heading.props.children), /CI 2026/);
});

test('card identifica CI quando existe ocorrencia real naquela fonte', () => {
 const h = harness('notice'); h.props.defectDescription = undefined;
 h.props.state.ciAvisos = [{ prefixo: '4000', categoria: 'OFICINA', subTipo: 'MECANICA' }]; h.render();
 h.get(n => n.type === 'span' && n.props['aria-label']?.includes('Ver ocorrencias')).props.onMouseEnter(); h.render();
 const heading = h.get(n => n.type === 'p' && n.props.className?.startsWith('text-xs font-bold'));
 assert.match(JSON.stringify(heading.props.children), /CI 2026-10-27/);
});
