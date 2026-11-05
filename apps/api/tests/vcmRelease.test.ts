import test from 'node:test';
import assert from 'node:assert/strict';
import { currentScaleTemplate, currentReleaseTemplate } from '../src/data/scheduleTemplates';
import { currentReleaseTemplate as clientTemplate } from '../../web/src/data/scheduleTemplates';
import { readReleaseProgramming } from '../src/services/releaseProgramming';
import { changeReleaseLifecycle, readReleaseReport } from '../src/services/releaseLifecycle';
import { writeSafeRelease } from '../src/services/solturaAvailability';
import { clearReleaseLine } from '../src/services/releaseLineClear';
import { treatReleaseCar } from '../src/services/releaseTreatment';
import { releaseWithdrawals } from '../src/services/releaseWithdrawals';
import { releaseLineToken } from '../src/services/lineClearAudit';
import { loadReleaseProgramming } from '../../web/src/lib/releaseProgramming';
import { api } from '../../web/src/lib/api';
import * as frontend from '../../web/src/lib/releaseSupport';
import * as backend from '../src/services/releaseSupport';
import { canOfferRelease } from '../../web/src/lib/operationalAccess';

const context = { garagem: 'VCM', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: '2026-11-05' } as const;
const now = () => new Date('2026-11-05T08:30:00Z');
const scaleRows = currentScaleTemplate(context), rows = currentReleaseTemplate(context);
const loadFleet = async () => ({ source: 'real', data: [...new Set([...scaleRows.map(row => row.carroProgramado), '1000', '1001'])]
  .map(prefixo => ({ prefixo, idCarro: prefixo, garagem: 1, garagemNome: 'VCM' })) });
function fixture() {
  const state: any = { user: { role: 'soltura', garagem: 'VCM' }, sheet: null, records: [], ciStatus: 'FINALIZADA', ciOrigin: 'IMPORTACAO',
    ciBlocks: [], scaleStatus: 'FINALIZADA', substitutions: [{ id: scaleRows[0].id, carroSubstituido: '1000' }] };
  const db: any = {
    user: { findUnique: async () => state.user }, $queryRaw: async () => [],
    folhaCI: { findUnique: async ({ where }: any) => {
      assert.equal(where.garagem_dataFolha.garagem, 'VCM');
      assert.equal(where.garagem_dataFolha.dataFolha.toISOString().slice(0,10), context.dataOperacao);
      return { id: 1, garagem: 'VCM', dataFolha: new Date(context.dataOperacao), status: state.ciStatus, origem: state.ciOrigin,
        itens: state.ciBlocks.map((prefixo: string) => ({ prefixo, categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' })) };
    } },
    escalaDiaria: {
      findFirst: async () => null,
      findUnique: async ({ where }: any) => {
        assert.deepEqual(where.garagem_escalaTipo_turno_dataOperacao, context);
        return { conteudo: JSON.stringify({ version: 3, itens: state.substitutions, cards: [], programacao: scaleRows,
          confirmacoes: [], fluxo: { status: state.scaleStatus, iniciadaEm: now().toISOString(), finalizadaEm: now().toISOString(),
            fonteCI: { ciData: context.dataOperacao, bloqueados: [], ciAvisos: [] } } }) };
      },
    },
    folhaSoltura: {
      findUnique: async ({ where }: any) => { assert.deepEqual(where.garagem_escalaTipo_turno_dataOperacao, context); return state.sheet; },
      create: async ({ data }: any) => { state.sheet = { id: 1, ...data }; return state.sheet; },
      update: async ({ data }: any) => Object.assign(state.sheet, data),
    },
    soltura: {
      findMany: async ({ where }: any) => state.records.filter((row: any) => Object.entries(where).every(([key, value]) => row[key] === value)),
      create: async ({ data }: any) => { const row = { id: state.records.length + 1, ...data }; state.records.push(row); return row; },
      update: async ({ where, data }: any) => Object.assign(state.records.find((row: any) => row.id === where.id), data),
    },
    reservaTerminal: { findMany: async () => [] },
    $transaction: async (fn: any) => { const before = structuredClone(state); try { return await fn(db); } catch (error) { Object.assign(state, before); throw error; } },
  };
  const programming = () => readReleaseProgramming(db, context, 1, loadFleet, async () => null);
  const lifecycle = (operacao: string) => changeReleaseLifecycle(db, 1, { contexto: context, revisao: state.sheet?.revisao ?? 0, operacao }, now, programming);
  const write = (carroRealizado = '', driverCode = '123', extra = {}) => writeSafeRelease(db, 1, { ...context, scheduleId: rows[0].id,
    linha: rows[0].linha, tabela: rows[0].tabela, carroRealizado, driverCode, ...extra }, false, now, () => [], loadFleet);
  return { state, db, programming, lifecycle, write };
}

test('VCM matutina tem 204 viagens da Escala, carros em branco no molde e horarios preservados', async () => {
  assert.equal(rows.length, 204); assert.ok(rows.every(row => row.carroProgramado === ''));
  assert.deepEqual(rows, clientTemplate(context));
  assert.deepEqual(rows.map(r => [r.linha, r.tabela, r.saidaGaragem, r.inicioLinha]), scaleRows.map(r => [r.linha, r.tabela, r.saidaGaragem, r.inicioLinha]));
  const f = fixture(), programming = await f.programming();
  assert.equal(programming.itens[0].carroProgramado, '1000'); assert.equal(programming.itens[1].carroProgramado, scaleRows[1].carroProgramado);
  const old = api.get;
  try { api.get = (async () => programming) as typeof api.get;
    const client = await loadReleaseProgramming(context); assert.equal(client.itens.length, 204); assert.equal(client.itens[0].carroProgramado, '1000');
  } finally { api.get = old; }
});

test('VCM exige inicio CI/Escala finalizadas e permite confirmar programado somente com MOTO', async () => {
  const f = fixture(); await assert.rejects(f.write(), /Inicie/);
  f.state.ciStatus = 'EM_PREPARACAO'; await assert.rejects(f.lifecycle('iniciar'), /CI/);
  f.state.ciStatus = 'FINALIZADA'; f.state.scaleStatus = 'EM_PREPARACAO'; await assert.rejects(f.lifecycle('iniciar'), /CI|Escala/);
  f.state.scaleStatus = 'FINALIZADA'; await f.lifecycle('iniciar');
  await f.write(); assert.equal(f.state.records[0].carroRealizado, '1000'); assert.equal(f.state.records[0].garagem, 'VCM');
  f.state.ciOrigin = 'RECUPERACAO'; await assert.rejects(f.write('', '456'), /CI_RECUPERADA/);
  f.state.ciOrigin = 'IMPORTACAO'; await assert.rejects(f.write('9999'), /FORA_DA_FROTA/);
});

test('VCM trata substituicao, limpa, suspende, finaliza e conserva fotografia do relatorio', async () => {
  const f = fixture(); await f.lifecycle('iniciar'); await f.write(); await f.write('1001');
  const retirada = releaseWithdrawals(f.state.records)[0]; assert.equal(retirada.prefixo, '1000');
  await treatReleaseCar(f.db, 1, { contexto: context, revisao: f.state.sheet.revisao, registroId: retirada.registroId,
    trocaId: retirada.trocaId, base: retirada.base, destino: 'RESERVA' }, now, loadFleet);
  await clearReleaseLine(f.db, 1, { contexto: context, scheduleId: rows[0].id, revisao: f.state.sheet.revisao,
    base: releaseLineToken(f.state.records[0]) }, now);
  assert.equal(f.state.records[0].carroRealizado, null); assert.equal(f.state.records[0].driverCode, null);
  await clearReleaseLine(f.db, 1, { contexto: context, scheduleId: rows[0].id, revisao: f.state.sheet.revisao, operacao: 'suspender-linha' }, now);
  const sheet = JSON.parse(f.state.sheet.conteudo); sheet.itens.forEach((r: any) => { r.suspensa = true; }); f.state.sheet.conteudo = JSON.stringify(sheet);
  await f.lifecycle('finalizar'); const snapshot = JSON.parse(f.state.sheet.conteudo).relatorio;
  assert.equal(snapshot.contexto.garagem, 'VCM'); assert.equal(snapshot.itens.length, 204);
  await assert.rejects(f.write(), /finalizada/);
  assert.deepEqual(await readReleaseReport(f.db, context, 1, now), snapshot);
});

test('politica habilita somente VCM Seg-Sex matutino e usuario de outra garagem nao despacha', async () => {
  for (const garagem of ['VCG','VCM']) for (const escalaTipo of ['SEG_SEX','SABADO','DOM_FER']) for (const turno of ['MATUTINO','VESPERTINO','PADRAO']) {
    const c = { garagem, escalaTipo, turno }, expected = garagem === 'VCG' || escalaTipo === 'SEG_SEX' && turno === 'MATUTINO';
    assert.equal(backend.supportsReleaseContext(c), expected); assert.equal(frontend.supportsReleaseContext(c), expected);
  }
  assert.equal(canOfferRelease({ role:'soltura', garagem:'VCM' }, 'VCM', true, 'FINALIZADA', context), true);
  const f = fixture(); await f.lifecycle('iniciar'); f.state.user.garagem = 'VCG';
  await assert.rejects(f.write(), (error: any) => error.status === 403);
  await assert.rejects(f.lifecycle('finalizar'), (error: any) => error.status === 403);
});

test('lote VCM conserva garagem e uso bloqueado CI exige anuencia especifica', async () => {
  const f = fixture(); await f.lifecycle('iniciar');
  await writeSafeRelease(f.db, 1, { ...context, items: rows.slice(0,2).map((row, i) => ({ scheduleId: row.id,
    linha: row.linha, tabela: row.tabela, driverCode: String(i + 1), carroRealizado: '' })) }, true, now, () => [], loadFleet);
  assert.ok(f.state.records.every((r: any) => r.garagem === 'VCM'));
  f.state.ciBlocks = ['1000'];
  await assert.rejects(f.write(), /Confirme explicitamente/);
  await f.write('', '123', { confirmarBloqueadoCI: '1000' });
  assert.equal(JSON.parse(f.state.sheet.conteudo).usosBloqueadosCI[0].prefixo, '1000');
  assert.deepEqual(f.state.ciBlocks, ['1000']);
});
