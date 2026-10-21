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
    return require('../../web/src/pages/soltura/AlterarCarroProgramadoView');
  } finally {
    (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
  }
}
const { AlterarCarroProgramadoView: View, pickerOptions } = loadView();
const contexto = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-10-14' } as const;
const rows = fixedScheduleRows(contexto).slice(0, 2);
const official: DailyEscala = { contexto, revisao: 0, itens: [], cardsOrigem: 'salvo', omitidosPadrao: 0,
  confirmadas: [],
  reservaPorCor: { updatedAt: '2026-10-16T15:00:00Z', grupos: ['AZUL', 'VERMELHO', 'MICRO', 'VERMELHO_AZUL', 'PRATA', 'OUTRO'].map(id => ({ id, titulo: id === 'VERMELHO_AZUL' ? 'VERMELHO/AZUL' : id, prefixos: id === 'AZUL' ? ['5001'] : [] })) },
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
  assert.match(html, /AZUL \(1\)/);
  assert.match(html, /font-bold[^"]*text-rose-600/);
  assert.match(html, /aria-label="Ver ocorrencias do carro/);
  assert.match(html, /Carro fixo/);
  assert.match(html, /Carro substituido/);
});
test('React usa seletor de carros personalizado sem seletor nativo ou troca de garagem', () => {
  const html = render(false);
  assert.doesNotMatch(html, />Garagem VCG<\/span>/); assert.doesNotMatch(html, />VCM<\/button>/);
  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-autocomplete="list"/);
  assert.doesNotMatch(html, /<datalist/);
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
  assert.match(html, /font-bold[^"]*text-rose-600/);
});
test('React nao mostra confirmacao valida para carro que passou a estar bloqueado', () => {
  const html = render(false, { schedules: [{ ...rows[0], confirmada: true }] });
  assert.match(html, /data-confirmada="false"/);
  assert.doesNotMatch(html, /bg-emerald-100 hover:bg-emerald-200\/70/);
  assert.doesNotMatch(html, />Pendente</);
  assert.doesNotMatch(html, /lucide-check-check/);
});

test('React agrupa terminais e mostra mais no Rabicho sem cadastro de posicoes', () => {
  const html = render(false, { official: { ...official, cards: [
    ...official.cards,
    { id: 'TERMINAL_0', titulo: 'TERMINAL GENERAL OSORIO', modo: 'unico', itens: [{ id: 't1', prefixo: '' }] },
    { id: 'RABICHO', titulo: 'RABICHO', modo: 'rabicho', itens: [{ id: 'r1', linha: '470', tabela: '1', prefixo: '' }] },
  ] } });
  assert.match(html, /RESERVA TERMINAL/);
  assert.match(html, /grid-cols-2/);
  assert.match(html, /grid-cols-3/);
  assert.doesNotMatch(html, /aria-label="Adicionar em RABICHO"/);
  assert.match(html, /aria-label="Definir carro da linha 470 tabela 1"/);
});

test('seletores ocultam carros efetivos das linhas, inclusive da propria linha, e liberam fixo substituido', () => {
  const fixed = rows[0].carroProgramado;
  for (const ownKey of ['linha:' + rows[0].id, 'card:AZUL:1', 'card:RABICHO:1']) {
    assert.ok(!pickerOptions(official, ownKey).some((o: any) => o.prefixo === fixed));
    const replaced = { ...official, bloqueados: [], ocupacoes: [{ prefixo: '5001', chave: 'linha:' + rows[0].id, local: 'Linha' }] };
    assert.ok(pickerOptions(replaced, ownKey).some((o: any) => o.prefixo === fixed && !o.unavailable));
    assert.ok(!pickerOptions(replaced, ownKey).some((o: any) => o.prefixo === '5001'));
  }
});

test('reserva por cor e automatica em seis grupos, sem adicionar/remover ou card duplicado', () => {
  const html = render(false);
  for (const title of ['AZUL', 'VERMELHO', 'MICRO', 'PRATA', 'OUTRO']) assert.ok(html.includes(title));
  assert.doesNotMatch(html, /aria-label="Adicionar em (AZUL|VERMELHO|MICRO)"/);
  assert.match(html, /class="text-rose-600">VERMELHO\/<\/span><span class="text-sky-600">AZUL \(0\)<\/span>/);
  assert.doesNotMatch(html, /aria-label="Retirar 5001/);
  assert.doesNotMatch(html, />RESERVA \(/);
});

test('carro da CI tem aviso amarelo acessivel sem desabilitar confirmacao', () => {
  const prefixo = rows[1].carroProgramado;
  const state = { ...official, frota: [...official.frota, prefixo], ciAvisos: [{ prefixo, categoria: 'OFICINA', subTipo: 'ELEVADOR', horario: null, tipoPosicao: null, ordemPosicao: null }] };
  const html = render(false, { schedules: [rows[1]], official: state });
  assert.match(html, /text-amber-500/);
  assert.ok(html.includes('Ver ocorrencias do carro ' + prefixo + ' na CI 2026-10-15'));
  assert.match(html, /aria-label="Confirmar linha [^"]+"/);
  assert.doesNotMatch(html, /aria-label="Confirmar linha [^"]+"[^>]*disabled=""/);
});

test('bloqueado conserva prioridade vermelha sobre ocorrencia informativa na CI', () => {
  const prefixo = rows[0].carroProgramado;
  const html = render(false, { official: { ...official, ciAvisos: [{ prefixo, categoria: 'OFICINA', subTipo: 'ELEVADOR', horario: null, tipoPosicao: null, ordemPosicao: null }] } });
  assert.match(html, /font-bold[^"]*text-rose-600/);
  assert.ok(html.includes('Ver ocorrencias do carro ' + prefixo));
  assert.doesNotMatch(html, /text-amber-500/);
});

test('substituto da CI tambem recebe alerta amarelo sem impedir selecao', () => {
  const html = render(false, { schedules: [{ ...rows[0], carroSubstituido: '5001' }], official: { ...official, ciAvisos: [{ prefixo: '5001', categoria: 'REFORCO', subTipo: null, horario: '07:15 - A', tipoPosicao: 'FIXO', ordemPosicao: 1 }] } });
  assert.match(html, /border-amber-400 text-amber-500/);
  assert.match(html, /Ver ocorrencias do carro 5001 na CI 2026-10-15/);
});
