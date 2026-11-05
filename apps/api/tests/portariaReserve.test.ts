import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { reserveAction } from '../src/services/reserveAction';
import { ciPortariaFlags, portariaMetadata, registerCiUse } from '../src/services/portariaEvents';
import { currentReleaseTemplate } from '../src/data/scheduleTemplates';

const contexto = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'VESPERTINO', dataOperacao: '2026-11-05' } as const;
const now = () => new Date('2026-11-05T18:00:00Z');
const fleet = async () => ({ source: 'real', data: ['4000','4001'].map(prefixo => ({ idCarro: prefixo, prefixo, garagem: 'VCG' })) });
function fixture() {
  const state: any = { role: 'soltura', garage: 'VCG', events: [], terminals: [], fail: false,
    ci: { id: 10, status: 'FINALIZADA', itens: [] },
    sheet: { status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1, eventos: [], itens: [{ ...currentReleaseTemplate(contexto)[0], carroProgramado: '' }] }) } };
  const db: any = {
    user: { findUnique: async () => ({ role: state.role, garagem: state.garage }) },
    $queryRaw: async () => [],
    folhaCI: { findUnique: async () => state.ci },
    escalaDiaria: { findUnique: async () => null },
    folhaSoltura: { findUnique: async () => state.sheet },
    soltura: { findMany: async () => [] },
    reservaTerminal: { findMany: async () => state.terminals },
    itemFolhaCI: {
      create: async ({ data }: any) => { state.ci.itens.push(data); return data; },
      findMany: async () => state.ci?.itens ?? [],
    },
    ciPortariaEvento: {
      findUnique: async ({ where }: any) => state.events.find((e: any) => e.operacaoId === where.operacaoId),
      findMany: async ({ where }: any) => state.events.filter((e: any) => e.garagem === where.garagem && e.dataOperacao === where.dataOperacao),
      create: async ({ data }: any) => { if (state.fail) throw Error('falha auditoria'); state.events.push(data); return data; },
    },
    $transaction: async (fn: any) => { const before = structuredClone(state); try { return await fn(db); } catch(e) { Object.assign(state, before); throw e; } },
  };
  const command = (tipo = 'BLOQUEIO_CI') => ({ contexto, modulo: 'SOLTURA', prefixo: '4000', tipo, descricao: 'Problema informado na portaria', operacaoId: randomUUID() });
  const act = (value: unknown) => reserveAction(db, 7, value, now, fleet);
  return { state, db, command, act };
}

test('Portaria bloqueia CI finalizada da propria data sem reabrir e retry nao duplica', async () => {
  const f = fixture(), command = f.command(); await f.act(command); await f.act(command);
  assert.equal(f.state.ci.status, 'FINALIZADA'); assert.equal(f.state.ci.itens.length, 1); assert.equal(f.state.events.length, 1);
  const item = f.state.ci.itens[0]; assert.equal(item.statusItem, 'BLOQUEADO'); assert.equal(item.motivo, command.descricao);
  assert.deepEqual(ciPortariaFlags(f.state.events, 10, item.chaveItem), { bloqueadoPortaria: true, usadoPortaria: false });
  assert.equal(f.state.events[0].usuarioId, 7); assert.equal(f.state.events[0].dataOperacao, contexto.dataOperacao);
  await assert.rejects(f.act({ ...command, descricao: 'Outro conteudo' }), /outro conteudo/);
});

test('Outro registra justificativa sem bloquear e metadata respeita turno data e garagem', async () => {
  const f = fixture(); await f.act(f.command('JUSTIFICATIVA'));
  assert.deepEqual(f.state.ci.itens, []);
  assert.equal((await portariaMetadata(f.db, contexto, 'SOLTURA')).justificativas.length, 1);
  for (const other of [{ ...contexto, turno: 'MATUTINO' }, { ...contexto, dataOperacao: '2026-11-06' }, { ...contexto, garagem: 'VCM' }])
    assert.deepEqual((await portariaMetadata(f.db, other, 'SOLTURA')).justificativas, []);
  await f.act(f.command('JUSTIFICATIVA')); assert.equal(f.state.events.length, 2);
});

test('uso Portaria preserva bloqueio e flag fica vinculada ao item CI original', async () => {
  const f = fixture(); await f.act(f.command()); const item = f.state.ci.itens[0];
  await registerCiUse(f.db, contexto, item, 7, 'Linha 326 / Tab 1', now());
  assert.equal(item.statusItem, 'BLOQUEADO'); assert.equal(f.state.ci.status, 'FINALIZADA');
  assert.deepEqual(ciPortariaFlags(f.state.events, 10, item.chaveItem), { bloqueadoPortaria: true, usadoPortaria: true });
  assert.deepEqual(ciPortariaFlags(f.state.events, 11, item.chaveItem), { bloqueadoPortaria: false, usadoPortaria: false });
  f.state.ci.itens[0] = { ...item, chaveItem: randomUUID() };
  assert.deepEqual((await portariaMetadata(f.db, contexto, 'SOLTURA')).ciPortaria, []);
});

test('falha na auditoria reverte bloqueio junto; CI ausente nao e criada implicitamente', async () => {
  const f = fixture(); f.state.fail = true; await assert.rejects(f.act(f.command()), /falha auditoria/);
  assert.deepEqual(f.state.ci.itens, []); assert.deepEqual(f.state.events, []);
  f.state.fail = false; f.state.ci = null; await assert.rejects(f.act(f.command()), /Inicie a CI/);
  await f.act(f.command('JUSTIFICATIVA')); assert.equal(f.state.events.length, 1);
});

test('backend recusa outra garagem perfil data passada folha finalizada e reserva terminal', async () => {
  for (const change of [(f: any) => f.state.garage = 'VCM', (f: any) => f.state.role = 'COLABORADOR',
    (f: any) => f.state.sheet.status = 'FINALIZADA', (f: any) => f.state.terminals.push({ carro: '4000' })]) {
    const f = fixture(); change(f); await assert.rejects(f.act(f.command())); assert.deepEqual(f.state.events, []); assert.deepEqual(f.state.ci.itens, []);
  }
  const f = fixture(); await assert.rejects(f.act({ ...f.command(), contexto: { ...contexto, dataOperacao: '2026-11-04' } }), /data passada/);
  await assert.rejects(f.act({ ...f.command(), prefixo: '9999' }), /disponivel/);
});

test('Escala finalizada permite acao na Reserva e recusa carro ainda alocado na linha', async () => {
  const f = fixture();
  const scale = { version: 3, itens: [], cards: [], confirmacoes: [], historicoTrocas: [],
    programacao: [{ id: 'linha-1', linha: '302', tabela: '1', carroProgramado: '4001', saidaGaragem: '04:00' }],
    fluxo: { status: 'FINALIZADA', iniciadaEm: '2026-11-04T18:00:00Z', finalizadaEm: '2026-11-04T19:00:00Z',
      fonteCI: { ciData: contexto.dataOperacao, bloqueados: [], ciAvisos: [] } } };
  f.db.escalaDiaria.findUnique = async () => ({ conteudo: JSON.stringify(scale) });
  const command = { ...f.command(), modulo: 'ESCALA', contexto: { ...contexto, turno: 'MATUTINO' } };
  await f.act(command); assert.equal(scale.fluxo.status, 'FINALIZADA');
  assert.equal(f.state.ci.itens[0].prefixo, '4000'); assert.equal(f.state.events[0].modulo, 'ESCALA');
  await assert.rejects(f.act({ ...command, operacaoId: randomUUID(), prefixo: '4001' }), /disponivel/);
});
