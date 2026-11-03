import test from 'node:test';
import assert from 'node:assert/strict';
import { changeReleaseLifecycle, readReleaseReport, assertReleaseStarted, completedReleaseRows } from '../src/services/releaseLifecycle';
import { currentReleaseTemplate } from '../src/data/scheduleTemplates';

const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-10-30' } as const;
const rows = currentReleaseTemplate(context).map(row => ({ ...row, carroProgramado: '' }));
const now = () => new Date('2026-10-30T17:00:00Z');
function fixture() {
 let sheet: any = null, records: any[] = [], role = 'soltura';
 const locks: string[] = [];
 const scale = { contexto: context, frota: ['4000', '4001'], reserva: ['4000', '4001'], bloqueados: [], cards: [],
  coresFrota: { '4000': 'AZUL', '4001': 'AZUL' }, reservaPorCor: { updatedAt: null }, fluxo: { ciFinalizada: false } };
 const prepare: any = async () => ({ contexto: context, escala: scale, itens: rows, disponibilidade: { reserva: scale.reserva, defeitosGaragem: [] } });
 const db: any = {
  user: { findUnique: async () => ({ role, garagem: 'VCG' }) },
  $queryRaw: async (sql: TemplateStringsArray) => { locks.push(sql.join('?')); },
  folhaSoltura: { findUnique: async () => sheet,
   create: async ({ data }: any) => { sheet = { id: 1, ...data }; return sheet; },
   update: async ({ data }: any) => { sheet = { ...sheet, ...data }; return sheet; } },
  soltura: { findMany: async ({ where }: any) => records.filter(r => Object.entries(where).every(([key, value]) => r[key] === value)) },
  reservaTerminal: { findMany: async () => [{ terminal: 'NOVA BAHIA', carro: '4001' }] },
  $transaction: async (fn: any) => { const before = structuredClone(sheet); try { return await fn(db); } catch (error) { sheet = before; throw error; } },
  get folhaCI() { throw Error('Vespertino nao deve consultar CI'); },
  get escalaDiaria() { throw Error('Vespertino nao deve consultar Escala'); },
 };
 const command = (operacao: string, revisao = sheet?.revisao ?? 0) => changeReleaseLifecycle(db, 1, { contexto: context, revisao, operacao }, now, prepare);
 return { db, command, locks, sheet: () => sheet, role: (value: string) => { role = value; },
  complete: () => { records = rows.map((row, i) => ({ ...context, id: i + 1, scheduleId: row.id, linha: row.linha, tabela: row.tabela,
    carroProgramado: null, carroRealizado: '4000', driverCode: String(i + 1), status: 'LIBERADO', historicoTrocas: '[]' })); },
  records: () => records };
}

test('inicio explicito persiste molde e nao consulta CI/Escala no vespertino', async () => {
 const f = fixture(); const started = await f.command('iniciar');
 assert.equal(started.status, 'EM_ANDAMENTO'); assert.equal(started.revisao, 1);
 assert.equal(started.itens?.length, rows.length); assert.ok(started.itens?.every(row => row.carroProgramado === ''));
 assert.ok(f.locks.every(sql => sql.includes('soltura_folha')));
 await assert.rejects(f.command('iniciar'), /ja iniciada/);
 await assert.rejects(f.command('finalizar'), /todas as viagens/);
 assert.equal(f.sheet().status, 'EM_ANDAMENTO');
});

test('folha com viagens suspensas finaliza e preserva suspensoes no relatorio historico', async () => {
 const f = fixture(); await f.command('iniciar');
 const content = JSON.parse(f.sheet().conteudo);
 content.itens = content.itens.map((row: any) => ({ ...row, suspensa: true }));
 f.sheet().conteudo = JSON.stringify(content);
 const closed = await f.command('finalizar'); assert.equal(closed.status, 'FINALIZADA');
 const snapshot = JSON.parse(f.sheet().conteudo).relatorio;
 assert.ok(snapshot.itens.every((row: any) => row.suspensa && row.status === 'SUSPENSA' && !row.carroRealizado && !row.motoristaCodigo));
 f.db.soltura.findMany = async () => { throw Error('Historico nao pode reconstruir suspensoes'); };
 assert.deepEqual(await readReleaseReport(f.db, context, 1), snapshot);
});

test('finaliza somente completa e fotografa relatorio; somente ADMIN reabre sem apagar despachos', async () => {
 const f = fixture(); await f.command('iniciar'); f.complete();
 const closed = await f.command('finalizar'); assert.equal(closed.status, 'FINALIZADA');
 const snapshot = JSON.parse(f.sheet().conteudo).relatorio;
 assert.equal(snapshot.itens.length, rows.length); assert.deepEqual(snapshot.reserva, ['4001']);
 const guard = f.db.soltura.findMany; f.db.soltura.findMany = async () => { throw Error('Nao reler dados atuais para relatorio finalizado'); };
 assert.deepEqual(await readReleaseReport(f.db, context, 1), snapshot);
 f.db.soltura.findMany = guard;
 await assert.rejects(f.command('reabrir'), (e: any) => e.status === 403);
 await assert.rejects(f.command('finalizar', 1), /outro posto/);
 f.role('ADMIN'); const before = structuredClone(f.records());
 const reopened = await f.command('reabrir'); assert.equal(reopened.status, 'EM_ANDAMENTO');
 assert.equal(reopened.eventos[2].operacao, 'reabrir'); assert.deepEqual(f.records(), before);
});

test('gravacao exige iniciada e em andamento; completude exige carro motorista e linha correta', () => {
 assert.throws(() => assertReleaseStarted(null), /Inicie/);
 assert.throws(() => assertReleaseStarted({ status: 'FINALIZADA' }), /finalizada/);
 assert.doesNotThrow(() => assertReleaseStarted({ status: 'EM_ANDAMENTO' }));
 const required = rows.slice(0, 1), row = required[0];
 const valid = { scheduleId: row.id, linha: row.linha, tabela: row.tabela, carroRealizado: '4000', driverCode: '123', status: 'LIBERADO' };
 assert.equal(completedReleaseRows(required, [valid]), true);
 for (const invalid of [{ ...valid, carroRealizado: '' }, { ...valid, driverCode: '' }, { ...valid, linha: 'outra' }, { ...valid, status: 'PENDENTE' }])
  assert.equal(completedReleaseRows(required, [invalid]), false);
 assert.equal(completedReleaseRows(required, [valid, valid]), false);
});

test('data anterior e usuario sem permissao nao alteram a folha', async () => {
 const f = fixture(); await assert.rejects(changeReleaseLifecycle(f.db, 1, { contexto: { ...context, dataOperacao: '2026-10-29' }, revisao: 0, operacao: 'iniciar' }, now), /dia da operacao/);
 f.role('COLABORADOR'); await assert.rejects(f.command('iniciar'), (e: any) => e.status === 403);
 assert.equal(f.sheet(), null);
});

test('historico sem folha usa campos persistidos, inclusive despacho sem scheduleId, sem consultar molde atual', async () => {
 const f = fixture(); f.complete();
 f.records()[0].scheduleId = null;
 const report: any = await readReleaseReport(f.db, context, 1, () => new Date('2026-10-31T16:00:00Z'));
 assert.equal(report.status, 'LEGADO'); assert.equal(report.auxiliaresIndisponiveis, true);
 assert.equal(report.itens.length, rows.length); assert.equal(report.itens[0].carroRealizado, '4000');
});
