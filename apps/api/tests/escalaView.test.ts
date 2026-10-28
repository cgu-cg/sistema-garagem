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
    return { ...require('../../web/src/pages/soltura/AlterarCarroProgramadoView'),
      ...require('../../web/src/pages/soltura/PreparationOverlay'),
      FleetInput: require('../../web/src/pages/soltura/FleetVehicleInput').FleetVehicleInput,
      Toolbar: require('../../web/src/pages/soltura/ReleaseToolbar').ReleaseToolbar,
      Sidebar: require('../../web/src/pages/soltura/ScaleFleetSidebar').ScaleFleetSidebar,
      Lifecycle: require('../../web/src/pages/soltura/DailyScaleLifecycle').DailyScaleLifecycle,
      Notice: require('../../web/src/pages/soltura/CiVehicleNotice').CiVehicleNotice,
      TrocaCarro: require('../../web/src/pages/soltura/CarroTrocaPopover').CarroTrocaPopover };
  } finally {
    (Module as any)._resolveFilename = resolver;
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
  }
}
const { AlterarCarroProgramadoView: View, pickerOptions, Lifecycle, Toolbar, Sidebar, FleetInput, PreparationOverlay, releasePreparationMessage, Notice, TrocaCarro } = loadView();
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

test('Soltura mostra Defeito Garagem abaixo de Bloqueados CI, sem adicionar esse card na Escala', () => {
  const html = renderToStaticMarkup(React.createElement(Sidebar, { state: official, garage: 'VCG', defeitosGaragem: [
    { prefixo: '4000', descricao: 'Pneu furado', registradoEm: '2026-10-27T12:00:00Z' },
  ] }));
  assert.ok(html.indexOf('BLOQUEADOS CI') < html.indexOf('DEFEITO GARAGEM'));
  assert.match(html, /Ver ocorrencias do carro 4000/); assert.match(html, /4000/);
  assert.doesNotMatch(html, /title="Pneu furado"/);
  assert.doesNotMatch(html, />Pneu furado</);
  assert.doesNotMatch(render(false), /DEFEITO GARAGEM/);
});

test('carro realizado substituido por defeito mostra alertas simultaneos sem fundo azul no botao', () => {
  const prefixo = '4001';
  const state = { ...official, bloqueados: [prefixo], ciAvisos: [{ prefixo, categoria: 'OFICINA', subTipo: 'ELEVADOR', horario: null, tipoPosicao: null, ordemPosicao: null }] };
  const html = renderToStaticMarkup(React.createElement(TrocaCarro, { item: rows[0], scaleState: state, carroAtual: prefixo,
    historicoTrocas: [{ carroAnterior: '4000', novoCarro: prefixo, motivo: 'Defeito Garagem', descricaoDefeito: 'Motor', dataHora: '27/10 10:00' }], onTrocarCarro: async () => true }));
  assert.match(html, /data-ci-alert="bloqueado"/); assert.match(html, /data-ci-alert="pedido"/);
  assert.match(html.match(/<svg[^>]*data-ci-alert="defeito-garagem"[^>]*>/)![0], /text-blue-600/);
  assert.match(html, /inline-flex items-center -space-x-1/);
  assert.doesNotMatch(html, /<button[^>]*class="[^"]*bg-blue/);
  assert.doesNotMatch(html, /title="Defeito Garagem:/);
});

test('carro com defeito e pedido CI mantem ambos os icones e respeita ocultacao nos cards', () => {
  const prefixo = '4000';
  const state = { ...official, bloqueados: [], defeitosGaragem: [{ prefixo, descricao: 'Pneu' }],
    ciAvisos: [{ prefixo, categoria: 'REFORCO', subTipo: null, horario: '07:15', tipoPosicao: null, ordemPosicao: null }] };
  const html = renderToStaticMarkup(React.createElement(Notice, { state, prefixo }));
  assert.match(html, /data-ci-alert="pedido"/); assert.match(html, /data-ci-alert="defeito-garagem"/);
  assert.doesNotMatch(html, /data-ci-alert="bloqueado"/);
  const hidden = renderToStaticMarkup(React.createElement(Notice, { state, prefixo, hideIcon: true }));
  assert.doesNotMatch(hidden, /data-ci-alert=/);
});

test('Portaria e erro de alocacao nao recebem triangulo de bloqueio CI', () => {
  const prefixo = rows[0].carroProgramado;
  const state: DailyEscala = { ...official, bloqueados: [], ocupacoes: [],
    cards: [{ id: 'PORTARIA', titulo: 'BLOQUEADOS PORTARIA', modo: 'lista', itens: [{ id: 'p1', prefixo }] }] };
  const html = render(false, { official: state });
  assert.doesNotMatch(html, /data-ci-alert="bloqueado"/);
  assert.match(html, /Ver ocorrencias do carro .* na Portaria/);
  const releaseHtml = renderToStaticMarkup(React.createElement(TrocaCarro, { item: rows[0], scaleState: state,
    carroAtual: prefixo, onTrocarCarro: async () => true }));
  assert.doesNotMatch(releaseHtml, /data-ci-alert="bloqueado"/);
  assert.equal(pickerOptions(state, 'linha:' + rows[0].id).find((p: any) => p.prefixo === prefixo)?.blocked, true);
  const ciHtml = render(false, { official: { ...state, bloqueados: [prefixo] } });
  assert.match(ciHtml, /data-ci-alert="bloqueado"/);
});

test('troca por equivoco nao recebe alerta de defeito de troca anterior', () => {
  const html = renderToStaticMarkup(React.createElement(TrocaCarro, { item: rows[0], scaleState: { ...official, bloqueados: [] }, carroAtual: '4002',
    historicoTrocas: [{ carroAnterior: '4000', novoCarro: '4001', motivo: 'Defeito Garagem', dataHora: '10:00' },
      { carroAnterior: '4001', novoCarro: '4002', motivo: 'Adicionado equivocadamente', dataHora: '10:01' }], onTrocarCarro: async () => true }));
  assert.doesNotMatch(html, /data-ci-alert="defeito-garagem"/);
});

test('carro realizado sem ocorrencia ou historico nao recebe aviso generico da CI', () => {
  const html = renderToStaticMarkup(React.createElement(TrocaCarro, { item: rows[0], scaleState: { ...official, bloqueados: [] },
    carroAtual: '3141', historicoTrocas: [], onTrocarCarro: async () => true }));
  assert.doesNotMatch(html, /Ver ocorrencias do carro 3141/);
  assert.doesNotMatch(html, /data-ci-alert=/);
  assert.match(html, /aria-label="Carro realizado. Clique para alterar ou ver histórico."/);
});

test('linha sem carro fixo mostra traco sem alerta e continua sem confirmacao valida', () => {
  const html = render(false, { schedules: [{ ...rows[0], carroProgramado: '', confirmada: false }] });
  assert.doesNotMatch(html, /data-ci-alert=/);
  assert.match(html, /data-confirmada="false"/);
  assert.doesNotMatch(html, /Ver ocorrencias do carro —/);
});

test('reserva tem lista unica com contadores por cor e bloqueados nao repetem icones', () => {
  const html = render(false, { schedules: [] });
  assert.match(html, /aria-label="Quantidade por cor"/);
  assert.match(html, /aria-label="Carros da reserva"/);
  assert.match(html, /AZUL \(1\)/);
  assert.doesNotMatch(html, /data-ci-alert=/);
  assert.match(html, /Ver ocorrencias do carro/);
});
test('React mostra CI do dia seguinte, Reserva e carro fixo bloqueado em vermelho', () => {
  const html = render(false);
  assert.match(html, /BLOQUEADOS CI 2026-10-15/);
  assert.match(html, /AZUL \(1\)/);
  assert.match(html, /data-ci-alert="bloqueado"/);
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
  assert.match(html, /data-ci-alert="bloqueado"/);
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
  assert.match(html, /aria-label="Carros da reserva"/);
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

test('bloqueado e pedido CI exibem alertas vermelho e amarelo juntos', () => {
  const prefixo = rows[0].carroProgramado;
  const html = render(false, { official: { ...official, ciAvisos: [{ prefixo, categoria: 'OFICINA', subTipo: 'ELEVADOR', horario: null, tipoPosicao: null, ordemPosicao: null }] } });
  assert.match(html, /data-ci-alert="bloqueado"/);
  assert.ok(html.includes('Ver ocorrencias do carro ' + prefixo));
  assert.match(html, /data-ci-alert="pedido"/);
});

test('substituto da CI tambem recebe alerta amarelo sem impedir selecao', () => {
  const html = render(false, { schedules: [{ ...rows[0], carroSubstituido: '5001' }], official: { ...official, ciAvisos: [{ prefixo: '5001', categoria: 'REFORCO', subTipo: null, horario: '07:15 - A', tipoPosicao: 'FIXO', ordemPosicao: 1 }] } });
  assert.match(html, /data-ci-alert="pedido"/);
  assert.match(html, /Ver ocorrencias do carro 5001 na CI 2026-10-15/);
});

test('prefixo vermelho/azul preserva duas cores mesmo bloqueado e alerta flutua separado', () => {
  const prefixo = '4120';
  const html = render(false, { schedules: [{ ...rows[0], carroProgramado: prefixo }], official: {
    ...official, frota: [...official.frota, prefixo], bloqueados: [prefixo], coresFrota: { [prefixo]: 'VERMELHO/AZUL' },
  } });
  assert.match(html, /text-rose-600 dark:text-rose-400">41<\/span><span class="text-sky-600 dark:text-sky-400">20<\/span>/);
  assert.match(html, /class="[^"]*absolute -right-2 -top-2[^>]*><svg[^>]*data-ci-alert="bloqueado"/);
});

test('pedido da CI nao substitui cor azul do carro pelo amarelo', () => {
  const prefixo = rows[1].carroProgramado;
  const html = render(false, { schedules: [rows[1]], official: { ...official,
    frota: [...official.frota, prefixo], coresFrota: { [prefixo]: 'AZUL' }, bloqueados: [],
    ciAvisos: [{ prefixo, categoria: 'OFICINA', subTipo: 'ELEVADOR', horario: null, tipoPosicao: null, ordemPosicao: null }],
  } });
  assert.match(html, /class="font-bold text-sky-600 dark:text-sky-400"/);
  assert.match(html, /data-ci-alert="pedido"/);
});

const lifecycleHtml = (status: string, ciFinalizada = true, proximaIniciada = false, future = true, allowed = true) =>
  renderToStaticMarkup(React.createElement(Lifecycle, { state: { ...official, ciData: contexto.dataOperacao,
    fluxo: { status, ciFinalizada, proximaIniciada, iniciadaEm: null, finalizadaEm: null } },
    future, allowed, dirty: false, pending: false, onChange() {}, onNext() {} }));

test('ciclo da escala mostra inicio condicionado a CI finalizada da mesma data', () => {
  assert.match(lifecycleHtml('NAO_INICIADA'), />Iniciar Escala<\/button>/);
  assert.match(lifecycleHtml('NAO_INICIADA', false), /<button[^>]*disabled=""[^>]*>Iniciar Escala<\/button>/);
  assert.doesNotMatch(lifecycleHtml('NAO_INICIADA', true, false, false), />Iniciar Escala</);
  assert.doesNotMatch(lifecycleHtml('NAO_INICIADA', true, false, true, false), />Iniciar Escala</);
});

test('ciclo da escala impede reabrir apos virada ou proxima iniciada, e permite finalizar pendencia', () => {
  assert.match(lifecycleHtml('FINALIZADA'), />Reabrir Escala</);
  assert.doesNotMatch(lifecycleHtml('FINALIZADA', true, true), />Reabrir Escala</);
  assert.doesNotMatch(lifecycleHtml('FINALIZADA', true, false, false), />Reabrir Escala</);
  assert.match(lifecycleHtml('EM_PREPARACAO', true, false, false), />Finalizar Escala</);
  assert.doesNotMatch(lifecycleHtml('LEGADO'), />Iniciar Escala|>Reabrir Escala|>Finalizar Escala/);
});

test('referencia provisoria identifica CI de origem sem confundir finalizacao da CI da escala', () => {
  const html = renderToStaticMarkup(React.createElement(Lifecycle, { state: { ...official, ciData: '2026-10-13', ciProvisoria: true,
    fluxo: { status: 'NAO_INICIADA', ciFinalizada: false, proximaIniciada: false, iniciadaEm: null, finalizadaEm: null } },
    future: true, allowed: true, dirty: false, pending: false, onChange() {}, onNext() {} }));
  assert.match(html, /CI de 14\/10\/2026: aguardando/);
  assert.match(html, /Bloqueios provisórios da CI de 13\/10\/2026/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Iniciar Escala<\/button>/);
});

 test('toolbar da Soltura tem historico por data e seletores sem emojis, preservando impressao A4', () => {
 const html = renderToStaticMarkup(React.createElement(Toolbar, { date:'2026-10-24', garage:'VCG', dayType:'SEG_SEX', period:'VESPERTINO',
 onDate:()=>{},onDayType:()=>{},onPeriod:()=>{},onPrint:()=>{} }));
 assert.match(html,/24\/10\/2026/); assert.match(html,/Data da Soltura/); assert.match(html,/Imprimir A4/);
 assert.match(html,/aria-pressed="true"[^>]*>Vespertino/);
 assert.doesNotMatch(html,/Exportar|Sincronizar|Total Programado|Controle de Soltura|[\u2600\u{1F319}]/u);
 });
 test('sidebar compartilhada da Soltura mostra reserva acima dos bloqueados e desconta carros ocupados', () => {
 const state = { ...official, reserva: ['5001','5002'], bloqueados: ['5003'], coresFrota: { '5001':'VERMELHO/AZUL','5003':'AZUL' } };
 const html=renderToStaticMarkup(React.createElement(Sidebar,{state,garage:'VCG',reserve:['5001']}));
 assert.ok(html.indexOf('RESERVA GARAGEM VCG')<html.indexOf('BLOQUEADOS CI'));
 assert.doesNotMatch(html,/data-ci-alert="bloqueado"/); assert.doesNotMatch(html,/>5002</);
 assert.match(html,/text-rose-600[^>]*>50</); assert.match(html,/text-sky-600[^>]*>01</);
 });

 test('campo de carro preserva prefixo e input nativo, com duas cores e alerta flutuante independente', () => {
 const state={...official,bloqueados:['4120'],coresFrota:{'4120':'VERMELHO/AZUL'}};
 const html=renderToStaticMarkup(React.createElement(FleetInput,{fleetState:state,defaultValue:'4120',disabled:true,id:'carro-test'}));
 assert.match(html,/<input[^>]*id="carro-test"[^>]*value="4120"/);
 assert.match(html,/text-rose-600[^>]*>41</); assert.match(html,/text-sky-600[^>]*>20</);
 assert.match(html,/data-ci-alert="bloqueado"/); assert.match(html,/pointer-events-none absolute z-10/);
 });

 test('aviso central desfoca conteudo e impede foco/acao por inert sem bloquear seletores externos', () => {
 const html=renderToStaticMarkup(React.createElement(PreparationOverlay,{title:'Aguardando',message:'Finalize a CI'},React.createElement('button',null,'Conteudo')));
 assert.match(html,/<div inert="" aria-hidden="true"[^>]*blur-sm/);
 assert.match(html,/absolute inset-0[^>]*items-center justify-center/);
 assert.match(html,/role="status" aria-live="polite"/);
 assert.ok(html.indexOf('Conteudo') < html.indexOf('role="status"'));
 const ready=renderToStaticMarkup(React.createElement(PreparationOverlay,{title:'Pronto',message:null},React.createElement('button',null,'Iniciar')));
 assert.doesNotMatch(ready,/inert=|aria-hidden="true"|blur-sm|role="status"/);
 assert.match(ready,/>Iniciar</);
 });
 test('Soltura informa exatamente quais finalizacoes estao pendentes', () => {
 assert.match(releasePreparationMessage(false,false),/CI e a Escala/);
 assert.match(releasePreparationMessage(false,true),/^Finalize a CI desta data/);
 assert.match(releasePreparationMessage(true,false),/^Finalize a Escala de Carros/);
 assert.equal(releasePreparationMessage(true,true),null);
 });
 test('Escala com CI pendente move os avisos para popup e preserva pesquisa fora do bloqueio', () => {
 const flow={status:'NAO_INICIADA',ciFinalizada:false,proximaIniciada:false,iniciadaEm:null,finalizadaEm:null};
 const html=render(true,{official:{...official,ciData:'2026-10-13',ciProvisoria:true,fluxo:flow},readOnlyReason:'AVISO ANTIGO',lifecycleControl:React.createElement('div',null,'BANNER ANTIGO')});
 assert.match(html,/Escala aguardando a CI/); assert.match(html,/CI de 14\/10\/2026/); assert.match(html,/CI de 13\/10\/2026/);
 assert.doesNotMatch(html,/AVISO ANTIGO|BANNER ANTIGO/);
 assert.ok(html.indexOf('Pesquisar uma linha') < html.indexOf('inert=""'));
 assert.match(html,/<div inert="" aria-hidden="true"/);
 });
 test('Escala apos finalizar CI libera area e mantem controle de iniciar; legado permanece consultavel', () => {
 const flow={status:'NAO_INICIADA',ciFinalizada:true,proximaIniciada:false,iniciadaEm:null,finalizadaEm:null};
 const html=render(true,{official:{...official,fluxo:flow},lifecycleControl:React.createElement('button',null,'Iniciar Escala')});
 assert.doesNotMatch(html,/inert=|blur-sm|Escala aguardando a CI/); assert.match(html,/>Iniciar Escala</);
 const legacy=render(true,{official:{...official,fluxo:{...flow,status:'LEGADO',ciFinalizada:false}}});
 assert.doesNotMatch(legacy,/inert=|blur-sm/);
 });
