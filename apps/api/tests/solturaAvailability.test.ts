import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveReleaseContext, writeSafeRelease } from '../src/services/solturaAvailability';
import { eventInstant } from '../src/services/c4Temporal';
import { currentReleaseTemplate } from '../src/data/scheduleTemplates';
const day = '2026-10-08', target = '2026-10-09';
const item = { scheduleId: 'a', carroRealizado: '4000', linha: '10', tabela: '1', driverCode: '123' };
const body = { ...item, garagem: 'VCG', dataOperacao: target, turno: 'MATUTINO', escalaTipo: 'SEG_SEX' };
function fixture(status = 'FINALIZADA') {
  let rows: any[] = [], failRead = false, failWrite = false;
  const locks: string[] = [], states: any[] = [], ci: any[] = [];
  let cycle: any = { id: 1, origem: 'NORMAL' };
  const db: any = {
    user: { findUnique: async () => ({ role: 'soltura', garagem: 'VCG' }) },
    $queryRaw: async (parts: TemplateStringsArray) => { locks.push(parts.join('?')); },
    cicloOperacional: { findUnique: async () => cycle },
    folhaCI: { findUnique: async ({ where }: any) => {
      if (failRead) throw Error('SQL indisponivel');
      if (where.id) return { id: 1, garagem: 'VCG', dataFolha: new Date(day), status: 'FINALIZADA', origem: 'IMPORTACAO', folhaOrigemId: null, cicloPreparacaoId: null, itens: [] };
      return { id: 2, garagem: 'VCG', dataFolha: new Date(target), status, origem: 'NORMAL', folhaOrigemId: 1, cicloPreparacaoId: 1, itens: ci };
    } },
    estadoManutencao: { findMany: async () => states },
    soltura: {
      findMany: async ({ where }: any) => rows.filter(r => r.scheduleId === where.scheduleId),
      create: async ({ data }: any) => { if (failWrite && rows.length) throw Error('Escrita falhou'); const r = { id: rows.length + 1, ...data }; rows.push(r); return r; },
    },
    $transaction: async (fn: any, options: any) => {
      assert.equal(options.isolationLevel, 'Serializable'); const prior = structuredClone(rows);
      try { return await fn(db); } catch (e) { rows = prior; throw e; }
    },
  };
  return { db, locks, states, ci, rows: () => rows, failRead: () => { failRead = true; }, failWrite: () => { failWrite = true; }, missingCycle: () => { cycle = null; } };
}
const reason = (code: string) => (e: any) => e.status === 409 && e.code === code;
test('data explicita seleciona CI D+1 na tarde/noite e CI D+1 na madrugada seguinte', () => {
  for (const hour of [15, 22]) assert.deepEqual(resolveReleaseContext('VCG', target, eventInstant(day, hour)), { ciDate: target, maintenanceDate: day });
  assert.throws(() => resolveReleaseContext('VCG', target, eventInstant(target, 1)), reason('MANUTENCAO_ATUAL_NA_MADRUGADA_NAO_COMPROVADA'));
  assert.deepEqual(resolveReleaseContext('VCG', target, eventInstant(target, 3)), { ciDate: target, maintenanceDate: target });
  assert.throws(() => resolveReleaseContext('VCG', undefined, eventInstant(day, 15)), reason('DATA_OPERACIONAL_OBRIGATORIA'));
});
test('tarde: preparacao nao autoriza; noite: CI finalizada e manutencao oficial permitem gravacao', async () => {
  const prep = fixture('EM_PREPARACAO');
  await assert.rejects(writeSafeRelease(prep.db, 1, body, false, () => eventInstant(day, 15), () => ['VCG']), reason('CI_EM_PREPARACAO_NAO_AUTORIZA_SOLTURA'));
  assert.equal(prep.rows().length, 0);
  const ready = fixture();
  const row: any = await writeSafeRelease(ready.db, 1, body, false, () => eventInstant(day, 22), () => ['VCG']);
  assert.equal(row.status, 'LIBERADO'); assert.equal(row.dataOperacao, target);
  assert.match(ready.locks[0], /ciclo_operacional.*UPDLOCK, HOLDLOCK/);
  assert.match(ready.locks[1], /folha_ci.*UPDLOCK, HOLDLOCK/);
});
test('bloqueio CI e manutencao impeditiva recusam lote inteiro antes das escritas', async () => {
  for (const source of ['CI', 'BLOQUEADO', 'EXECUCAO']) {
    const f = fixture();
    if (source === 'CI') f.ci.push({ prefixo: '4001', categoria: 'BLOQUEADO' });
    else f.states.push({ prefixo: '4001', bloqueado: source === 'BLOQUEADO', emExecucao: source === 'EXECUCAO', liberado: false });
    await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [item, { ...item, scheduleId: 'b', carroRealizado: '4001' }] }, true, () => eventInstant(day, 22), () => ['VCG']));
    assert.equal(f.rows().length, 0);
  }
});
test('falha de consulta, ciclo ausente e erro na segunda escrita nunca deixam lote parcial', async () => {
  for (const fail of ['failRead', 'missingCycle', 'failWrite'] as const) {
    const f = fixture(); f[fail]();
    await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [item, { ...item, scheduleId: 'b' }] }, true, () => eventInstant(day, 22), () => ['VCG']));
    assert.equal(f.rows().length, 0);
  }
});
test('VCM e legado permanecem suspensos sem consultar banco', async () => {
  const db: any = { $transaction: () => { throw Error('Nao consultar'); } };
  await assert.rejects(writeSafeRelease(db, 1, { ...body, garagem: 'VCM' }, false), reason('FONTE_VCM_NAO_COMPROVADA'));
  await assert.rejects(writeSafeRelease(db, 1, body, false, () => eventInstant(day, 22), () => []), reason('LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL'));
});
test('bloqueio confirmado durante espera pelo lock e visto antes de gravar', async () => {
  const f = fixture();
  f.db.$queryRaw = async () => {
    if (!f.states.length) {
      f.states.push({ prefixo: '4000', bloqueado: true, emExecucao: false, liberado: false, consorciada: 'VCG' });
      f.ci.push({ prefixo: '4000', categoria: 'BLOQUEADO', consorciada: 'VCG' });
    }
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(day, 22), () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
  assert.equal(f.rows().length, 0);
});
test('virada de dia antes do commit desfaz a soltura', async () => {
  const f = fixture();
  await assert.rejects(writeSafeRelease(f.db, 1, body, false,
    () => f.rows().length ? eventInstant(target, 1) : eventInstant(day, 23), () => ['VCG']));
  assert.equal(f.rows().length, 0);
});
test('copia NORMAL de origem RECUPERACAO nao autoriza e divergencia CI/Controle recusa', async () => {
  const f = fixture(); const original = f.db.folhaCI.findUnique;
  f.db.folhaCI.findUnique = async (q: any) => {
    const record = await original(q);
    return q.where.id ? { ...record, origem: 'RECUPERACAO' } : record;
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(day, 22), () => ['VCG']), reason('ORIGEM_CI_NAO_CERTIFICADA'));
  assert.equal(f.rows().length, 0);
  const divergent = fixture(); divergent.states.push({ prefixo: '4001', bloqueado: true, emExecucao: false, liberado: false });
  await assert.rejects(writeSafeRelease(divergent.db, 1, body, false, () => eventInstant(day, 22), () => ['VCG']), reason('CI_MANUTENCAO_DIVERGENTES'));
});


test('soltura recusa usuario de outra garagem antes de gravar', async () => {
  const f = fixture();
  f.db.user.findUnique = async () => ({ role: 'soltura', garagem: 'VCM' });
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(day, 22), () => ['VCG']), (e: any) => e.status === 403);
  assert.equal(f.rows().length, 0);
});

for (const batch of [false, true]) test('fretamento sem tabela preserva o registro no banco simulado, lote=' + batch, async () => {
 const f = fixture(); const special = currentReleaseTemplate({ garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' }).find(i => i.tipo === 'FRETAMENTO')!;
 const entry = { ...item, scheduleId: special.id, linha: special.linha, tabela: '' };
 const command = batch ? { ...body, items: [entry] } : { ...body, ...entry };
 await writeSafeRelease(f.db, 1, command, batch, () => eventInstant(day, 12), () => ['VCG']);
 assert.equal(f.rows().length, 1); assert.equal(f.rows()[0].tabela, ''); assert.equal(f.rows()[0].linha, special.linha);
});
