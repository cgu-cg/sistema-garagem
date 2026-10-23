import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let user: any = { id: 1, role: 'ADMIN', garagem: 'VCG' };
function loadCard() {
  const loader = (Module as any)._load, resolver = (Module as any)._resolveFilename, oldTSX = require.extensions['.tsx'];
  try {
    (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) {
      return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args);
    };
    (Module as any)._load = function(id: string, ...args: unknown[]) {
      if (id === '@/stores/auth') return { useAuth: () => ({ user }) };
      if (id === 'react-router-dom') return { Link: ({ to, children, ...props }: any) => React.createElement('a', { ...props, href: to }, children) };
      return loader.call(this, id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    return require('../../web/src/pages/home/CiSummaryCard');
  } finally {
    (Module as any)._load = loader; (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
  }
}
const { summarizeCI, CiSummaryCard } = loadCard();
const date = '2026-10-24';
const item = { prefixo: '4001', data: date, garagem: 'VCG', categoriaPlanilha: 'BLOQUEADO', status: 'BLOQUEADO' };
const context = (status = 'FINALIZADA', items = [item]) => ({ mode: 'C4', garagem: 'VCG', folhas: [{ dataFolha: date, status }], ci: items });

test('CI do dashboard conta bloqueados unicos somente da data/garagem, sem oficina nem liberados', () => {
  const value = context('FINALIZADA', [item, item, { ...item, prefixo: '4002', data: '2026-10-23' },
    { ...item, prefixo: '4003', garagem: 'VCM' }, { ...item, prefixo: '4004', categoriaPlanilha: 'OFICINA' },
    { ...item, prefixo: '4005', status: 'LIBERADO' }]);
  assert.deepEqual(summarizeCI(value, date, 'VCG'), { status: 'Finalizada', blocked: 1, sourceDate: date, provisional: false });
});

test('zero real, CI em preparacao e CI nao iniciada sao estados diferentes', () => {
  assert.deepEqual(summarizeCI(context('FINALIZADA', []), date, 'VCG'), { status: 'Finalizada', blocked: 0, sourceDate: date, provisional: false });
  assert.deepEqual(summarizeCI(context('EM_PREPARACAO'), date, 'VCG'), { status: 'Em preparação', blocked: 1, sourceDate: date, provisional: false });
  assert.deepEqual(summarizeCI({ ...context(), folhas: [] }, date, 'VCG'), { status: 'Não iniciada', blocked: null, sourceDate: date, provisional: false });
});

test('legado, garagem divergente e resposta inconsistente nao viram zero bloqueados', () => {
  for (const value of [{ ...context(), mode: 'LEGADO' }, { ...context(), garagem: 'VCM' },
    context('DESCONHECIDO'), { ...context(), folhas: [...context().folhas, ...context().folhas] },
    context('FINALIZADA', [{ ...item, prefixo: '?' }]), { ...context(), ci: null }])
    assert.throws(() => summarizeCI(value, date, 'VCG'));
});

test('card informa consulta pendente sem numero ficticio e acesso ausente sem link de CI', () => {
  const html = renderToStaticMarkup(React.createElement(CiSummaryCard));
  assert.match(html, /CI MANUTENÇÃO/); assert.match(html, /Consultando CI/);
  assert.doesNotMatch(html, /100%|Auditado|catracas|text-blue|text-purple/);
  assert.match(html, /href="\/manutencao\/ci-manutencao"/);
  user = { id: 2, role: 'COLABORADOR' };
  const forbidden = renderToStaticMarkup(React.createElement(CiSummaryCard));
  assert.match(forbidden, /Sem acesso à CI/); assert.doesNotMatch(forbidden, /href=/);
});

 test('CI ausente usa ultima finalizada anterior e mostra a data efetiva, ignorando preparacoes e futuras', () => {
 const source='2026-10-22';
 const value={...context(),folhas:[{dataFolha:'2026-10-20',status:'FINALIZADA'},{dataFolha:source,status:'FINALIZADA'},
 {dataFolha:'2026-10-23',status:'EM_PREPARACAO'},{dataFolha:'2026-10-25',status:'FINALIZADA'}],ci:[
 {...item,data:source},{...item,prefixo:'4002',data:source},{...item,prefixo:'4003',data:'2026-10-20'},item]};
 assert.deepEqual(summarizeCI(value,date,'VCG'),{status:'Finalizada',blocked:2,sourceDate:source,provisional:true});
 });
 test('CI iniciada vazia prevalece sobre ultima fechada e ausencia de finalizada nao presume zero', () => {
 const previous={dataFolha:'2026-10-23',status:'FINALIZADA'};
 const value={...context('EM_PREPARACAO',[]),folhas:[previous,...context('EM_PREPARACAO').folhas],ci:[{...item,data:previous.dataFolha}]};
 assert.deepEqual(summarizeCI(value,date,'VCG'),{status:'Em preparação',blocked:0,sourceDate:date,provisional:false});
 assert.deepEqual(summarizeCI({...value,folhas:[{...previous,status:'EM_PREPARACAO'}]},date,'VCG'),{status:'Não iniciada',blocked:null,sourceDate:date,provisional:false});
 });
