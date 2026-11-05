import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const old = require.extensions['.tsx'];
require.extensions['.tsx'] = (m: any, file: string) => m._compile(ts.transpileModule(readFileSync(file, 'utf8'), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file);
const { ScaleFleetSidebar } = require('../../web/src/pages/soltura/ScaleFleetSidebar');
const { ReleaseTreatmentCards } = require('../../web/src/pages/soltura/ReleaseTreatmentCards');
if (old) require.extensions['.tsx'] = old; else delete require.extensions['.tsx'];

const state: any = { reserva: [], cards: [], bloqueados: ['2801', '4246'], ciData: '2026-11-05',
  ciPortaria: [{ prefixo: '2801', bloqueadoPortaria: true, usadoPortaria: true }],
  contexto: { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-11-05' } };
const sidebar = (modulo: string, betweenCards?: React.ReactNode) => renderToStaticMarkup(React.createElement(ScaleFleetSidebar, { state, garage: 'VCG', modulo, betweenCards }));

test('Escala separa bloqueio Portaria CI sem duplicar prefixo e conserva badge de uso', () => {
  const html = sidebar('ESCALA'), split = html.indexOf('BLOQUEADOS CI');
  assert.ok(html.includes('BLOQUEADOS PORTARIA CI (1)'));
  assert.ok(html.slice(0, split).includes('2801')); assert.ok(html.slice(0, split).includes('Usado Portaria'));
  assert.ok(!html.slice(split).includes('2801')); assert.ok(html.slice(split).includes('4246'));
});

test('Soltura usa seu card Portaria existente e nao duplica carro CI com registro legado', () => {
  const card = React.createElement(ReleaseTreatmentCards, { state, context: state.contexto, readOnly: true,
    blocked: [{ prefixo: '2801', registroId: 1, trocaId: 'legado' }], onTreat: async () => false });
  const html = sidebar('SOLTURA', card), split = html.indexOf('BLOQUEADOS CI');
  assert.ok(html.includes('Bloqueados Portaria CI (1)')); assert.ok(html.includes('Usado Portaria'));
  assert.ok(!html.includes('Desbloquear carro 2801')); assert.ok(!html.slice(split).includes('2801'));
  assert.ok(html.slice(split).includes('4246'));
});
