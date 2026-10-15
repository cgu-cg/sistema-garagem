import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DailyEscala } from '../../web/src/lib/sharedEscala';
import { fixedScheduleRows } from '../../web/src/lib/dailySchedule';

// Componente React real renderizado sem DOM, navegador, API ou banco.
function loadView() {
  const resolver = (Module as any)._resolveFilename;
  const oldTSX = require.extensions['.tsx'];
  try {
    (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) {
      return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    return require('../../web/src/pages/soltura/AlterarCarroProgramadoView').AlterarCarroProgramadoView;
  } finally {
    (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
  }
}
const View = loadView();
const contexto = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-10-14' } as const;
const rows = fixedScheduleRows(contexto).slice(0, 2);
const official: DailyEscala = { contexto, revisao: 0, itens: [], cardsOrigem: 'salvo', omitidosPadrao: 0,
  confirmadas: [],
  ciData: '2026-10-15', frota: [rows[0].carroProgramado, '5001', '5002'], bloqueados: [rows[0].carroProgramado], reserva: ['5001'],
  cards: [{ id: 'LIMPEZA', titulo: 'PEDIDO LIMPEZA', modo: 'lista', itens: [{ id: '1', prefixo: '5002' }] }],
  ocupacoes: [{ prefixo: rows[0].carroProgramado, chave: `linha:${rows[0].id}`, local: 'Linha fixa' }, { prefixo: '5002', chave: 'card:LIMPEZA:1', local: 'Limpeza' }],
};
const render = (readOnly: boolean, overrides: Record<string, unknown> = {}) => renderToStaticMarkup(React.createElement(View, {
  garagem: 'VCG', escalaTipo: 'SEG_SEX', schedules: rows, official, readOnly,
  readOnlyReason: 'Consulta indisponivel', onSaveSubstitution: async () => true, onSaveCard: async () => true, ...overrides,
}));
test('React mostra CI do dia seguinte, Reserva e carro fixo bloqueado em vermelho', () => {
  const html = render(false);
  assert.match(html, /BLOQUEADOS CI 2026-10-15/);
  assert.match(html, /RESERVA \(1\)/);
  assert.match(html, /text-rose-600 bg-rose-50/);
  assert.match(html, /esta bloqueado/);
  assert.match(html, /Carro fixo/);
  assert.match(html, /Carro substituido/);
});
test('React nao mostra seletor de outra garagem sem autorizacao e so sugere reserva livre', () => {
  const html = render(false);
  assert.doesNotMatch(html, />Garagem VCG<\/span>/); assert.doesNotMatch(html, />VCM<\/button>/);
  assert.match(html, /<option value="5001"/);
  assert.doesNotMatch(html, /<option value="5002"/);
  assert.doesNotMatch(html, new RegExp('<option value="' + rows[0].carroProgramado + '"'));
});
test('React bloqueia controles sem consulta oficial e usa icone de confirmacao acessivel', () => {
  const html = render(true);
  assert.match(html, /Consulta indisponivel/);
  assert.match(html, /aria-label="Confirmar linha [^"]+"[^>]*disabled=""/);
  assert.match(html, /lucide-check/);
  assert.doesNotMatch(html, /<input[^>]*value="03:50"/);
});
test('React diferencia linha confirmada apenas com fundo verde e preserva o botao', () => {
  const html = render(false, { schedules: [{ ...rows[0], carroSubstituido: '5001', confirmada: true }] });
  assert.match(html, /data-confirmada="true"/);
  assert.match(html, /bg-emerald-100 hover:bg-emerald-200\/70/);
  assert.match(html, /lucide-check/);
  assert.doesNotMatch(html, /lucide-check-check/);
  assert.doesNotMatch(html, />(Confirmada|Pendente|Alterada: confirmar novamente|Revisar e confirmar)</);
  assert.match(html, /aria-label="Linha confirmada [^"]+"[^>]*disabled=""/);
  // A referencia fixa bloqueada continua sinalizada, mesmo com substituto valido.
  assert.match(html, /text-rose-600 bg-rose-50/);
});
test('React nao mostra confirmacao valida para carro que passou a estar bloqueado', () => {
  const html = render(false, { schedules: [{ ...rows[0], confirmada: true }] });
  assert.match(html, /data-confirmada="false"/);
  assert.doesNotMatch(html, /bg-emerald-100 hover:bg-emerald-200\/70/);
  assert.doesNotMatch(html, />Pendente</);
  assert.doesNotMatch(html, /lucide-check-check/);
});
