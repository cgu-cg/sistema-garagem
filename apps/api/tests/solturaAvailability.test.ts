import { currentScaleTemplate } from '../src/data/scheduleTemplates';
import { programReleaseRows, releaseScaleContext } from '../src/services/releaseProgramming';
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveReleaseContext, writeSafeRelease } from '../src/services/solturaAvailability';
import { eventInstant } from '../src/services/c4Temporal';
import { currentReleaseTemplate } from '../src/data/scheduleTemplates';
import { clearReleaseLine } from '../src/services/releaseLineClear';
import { releaseLineToken } from '../src/services/lineClearAudit';
import { ReleaseDuplicateUseError } from '../src/services/releaseDuplicateUse';
import { releaseWithdrawals } from '../src/services/releaseWithdrawals';
const day = '2026-10-08', target = '2026-10-09';
const context = { garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO', dataOperacao: target } as const;
const [first, second] = currentReleaseTemplate(context);
const item = { scheduleId: first.id, carroRealizado: '4000', linha: first.linha, tabela: first.tabela, driverCode: '123' };
const secondItem = { ...item, driverCode: '456', scheduleId: second.id, linha: second.linha, tabela: second.tabela, carroRealizado: '4001' };
function scaleContent(status = 'FINALIZADA') { return JSON.stringify({ version: 3, itens: [], cards: [], confirmacoes: [],
 fluxo: { status, iniciadaEm: '2026-10-08T15:00:00Z', finalizadaEm: status === 'FINALIZADA' ? '2026-10-08T16:00:00Z' : null,
 fonteCI: { ciData: target, bloqueados: [], ciAvisos: [] } } }); }
const body = { ...item, garagem: 'VCG', dataOperacao: target, turno: 'MATUTINO', escalaTipo: 'SEG_SEX' };
function fixture(status = 'FINALIZADA') {
  let rows: any[] = [], failRead = false, failWrite = false;
  const locks: string[] = [], states: any[] = [], ci: any[] = [];
  let cycle: any = { id: 1, origem: 'NORMAL' };
  const db: any = {
    user: { findUnique: async () => ({ role: 'soltura', garagem: 'VCG' }) },
    $queryRaw: async (parts: TemplateStringsArray) => { locks.push(parts.join('?')); },
    folhaSoltura: { findUnique: async ({ where }: any) => ({ status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1,
      itens: programReleaseRows(where.garagem_escalaTipo_turno_dataOperacao, currentScaleTemplate(releaseScaleContext(where.garagem_escalaTipo_turno_dataOperacao)), []), eventos: [] }) }) },
    escalaDiaria: { findUnique: async () => ({ conteudo: scaleContent() }) },
    reservaTerminal: { findMany: async () => [] },
    cicloOperacional: { findUnique: async () => cycle },
    folhaCI: { findUnique: async ({ where }: any) => {
      if (failRead) throw Error('SQL indisponivel');
      if (where.id) return { id: 1, garagem: 'VCG', dataFolha: new Date(day), status: 'FINALIZADA', origem: 'IMPORTACAO', folhaOrigemId: null, cicloPreparacaoId: null, itens: [] };
      return { id: 2, garagem: 'VCG', dataFolha: new Date(target), status, origem: 'NORMAL', folhaOrigemId: 1, cicloPreparacaoId: 1, itens: ci };
    } },
    estadoManutencao: { findMany: async () => states },
    soltura: {
      findMany: async ({ where }: any) => rows.filter(r => Object.entries(where).every(([key, value]) => r[key] === value)),
      update: async ({ where, data }: any) => { const index = rows.findIndex(row => row.id === where.id); rows[index] = { ...rows[index], ...data }; return rows[index]; },
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

function duplicateFixture() {
  const f = fixture(), evening = { ...context, turno: 'VESPERTINO' } as const;
  const rows = currentReleaseTemplate(evening).slice(0, 2).map(row => ({ ...row, carroProgramado: '' }));
  const sheet = { id: 7, revisao: 1, status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1, itens: rows, eventos: [] }) };
  f.db.folhaSoltura.findUnique = async () => sheet;
  f.db.folhaSoltura.update = async ({ data }: any) => Object.assign(sheet, data);
  const clock = () => eventInstant(target, 14);
  const fleet = async () => ({ source: 'real', data: ['4000', '4001', '4002'].map(prefixo => ({ prefixo, idCarro: prefixo, garagem: 'VCG' })) });
  const entry = (index: number, carroRealizado = '4000', driverCode = '123') => ({ scheduleId: rows[index].id,
    linha: rows[index].linha, tabela: rows[index].tabela, carroRealizado, driverCode });
  const write = (data: object, batch = false) => writeSafeRelease(f.db, 1, { ...evening, ...data }, batch, clock, () => [], fleet);
  const notice = async (data: object, batch = false) => {
    let details!: ReleaseDuplicateUseError['details'];
    await assert.rejects(write(data, batch), (error: unknown) => {
      assert.ok(error instanceof ReleaseDuplicateUseError); details = error.details; return true;
    });
    return details;
  };
  return { ...f, evening, sheet, entry, write, notice };
}

test('carro e MOTO repetidos exigem confirmacao exata, mostram linhas e registram anuencia', async () => {
  const f = duplicateFixture(); await f.write(f.entry(0));
  const prior = structuredClone(f.rows());
  const aviso = await f.notice(f.entry(1));
  assert.deepEqual(f.rows(), prior); // pedir/cancelar o aviso nao grava nada
  assert.deepEqual(aviso.conflitos.map(c => c.tipo), ['CARRO', 'MOTO']);
  assert.equal(aviso.conflitos[0].outras[0].scheduleId, f.entry(0).scheduleId);
  assert.equal(aviso.conflitos[0].outras[0].linha, f.entry(0).linha);
  await f.notice({ ...f.entry(1), confirmarRepeticao: '0'.repeat(64) });
  await f.write({ ...f.entry(1), confirmarRepeticao: aviso.token });
  assert.equal(f.rows().length, 2); assert.equal(f.rows()[1].driverCode, '123');
  assert.equal(f.rows()[1].carroRealizado, '4000'); assert.equal('confirmarRepeticao' in f.rows()[1], false);
  const audit = JSON.parse(JSON.parse(f.sheet.conteudo).limpezas[0].anterior);
  assert.equal(audit.operacao, 'USO_REPETIDO_CONFIRMADO'); assert.equal(audit.token, aviso.token);
});

test('repeticao isolada de motorista e mudanca concorrente exigem novo aviso', async () => {
  const f = duplicateFixture(); await f.write(f.entry(0));
  const aviso = await f.notice(f.entry(1, '4001'));
  assert.deepEqual(aviso.conflitos.map(c => c.tipo), ['MOTO']);
  f.rows()[0].driverCode = '999';
  const changed = await f.notice({ ...f.entry(1, '4000', '999'), confirmarRepeticao: aviso.token });
  assert.notEqual(changed.token, aviso.token);
  assert.deepEqual(changed.conflitos.map(c => c.tipo), ['CARRO', 'MOTO']); assert.equal(f.rows().length, 1);
});

test('lote repetido e atomico e confirmacao se limita a garagem data tipo e turno', async () => {
  const f = duplicateFixture(); const items = [f.entry(0), f.entry(1)];
  const aviso = await f.notice({ items }, true); assert.equal(f.rows().length, 0);
  assert.equal(aviso.conflitos.length, 4);
  await f.write({ items, confirmarRepeticao: aviso.token }, true); assert.equal(f.rows().length, 2);
  for (const field of ['turno', 'escalaTipo', 'dataOperacao', 'garagem']) {
    const isolated = duplicateFixture();
    isolated.rows().push({ id: 90, ...isolated.evening, ...isolated.entry(0), [field]: 'OUTRO', status: 'LIBERADO' });
    await isolated.write(isolated.entry(1)); assert.equal(isolated.rows().length, 2);
  }
});

test('trocar carro compartilhado nao cria retirada ate a ultima linha deixar de usa-lo', async () => {
  const f = duplicateFixture(); const items = [f.entry(0), f.entry(1)];
  const aviso = await f.notice({ items }, true);
  await f.write({ items, confirmarRepeticao: aviso.token }, true);
  const troca = f.entry(0, '4001', '456'); await f.write(troca);
  assert.deepEqual(releaseWithdrawals(f.rows()), []);
  assert.equal(JSON.parse(f.rows()[0].historicoTrocas)[0].destino, 'DESFEITO');
  await f.write(f.entry(1, '4002', '789'));
  assert.deepEqual(releaseWithdrawals(f.rows()), []);
  assert.ok(f.rows().some(r => JSON.parse(r.historicoTrocas ?? '[]').some(e => e.carroAnterior === '4000' && e.destino === 'RESERVA')));
});

test('troca de todas as linhas compartilhadas em lote gera uma unica tratativa do carro retirado', async () => {
  const f = duplicateFixture(); const items = [f.entry(0), f.entry(1)];
  const aviso = await f.notice({ items }, true);
  await f.write({ items, confirmarRepeticao: aviso.token }, true);
  await f.write({ items: [f.entry(0, '4001', '456'), f.entry(1, '4002', '789')] }, true);
  assert.deepEqual(releaseWithdrawals(f.rows()), []);
  assert.ok(f.rows().some(r => JSON.parse(r.historicoTrocas ?? '[]').some(e => e.carroAnterior === '4000' && e.destino === 'RESERVA')));
});

test('Soltura usa bloqueado CI somente com confirmacao, audita e preserva motorista sem confirmar outra vez', async () => {
  const f = fixture(), clock = () => eventInstant(target, 4);
  const portaria: any[] = [];
  f.db.ciPortariaEvento = { create: async ({ data }: any) => { portaria.push(data); return data; } };
  const sheet: any = { ...await f.db.folhaSoltura.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: context } }), id: 7, revisao: 1 };
  f.db.folhaSoltura.findUnique = async () => sheet;
  f.db.folhaSoltura.update = async ({ data }: any) => Object.assign(sheet, data);
  f.ci.push({ folhaId: 2, chaveItem: '11111111-1111-4111-8111-111111111111', prefixo: '4000', categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' });
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, confirmarBloqueadoCI: '4001' }, false, clock, () => ['VCG']), /outro carro/);
  await writeSafeRelease(f.db, 1, { ...body, confirmarBloqueadoCI: '4000' }, false, clock, () => ['VCG']);
  let saved = JSON.parse(sheet.conteudo);
  assert.equal(saved.usosBloqueadosCI[0].prefixo, '4000'); assert.equal(saved.usosBloqueadosCI[0].usuarioId, 1);
  assert.equal(saved.usosBloqueadosCI[0].linhaId, first.id); assert.equal(f.ci[0].statusItem, 'BLOQUEADO');
  assert.equal(portaria.length, 1); assert.equal(portaria[0].tipo, 'USO_CI'); assert.equal(portaria[0].folhaId, 2);
  assert.equal(portaria[0].itemChave, f.ci[0].chaveItem); assert.equal(portaria[0].dataOperacao, target);
  assert.ok(saved.limpezas.some((a: any) => JSON.parse(a.anterior).operacao === 'USO_BLOQUEADO_CI'));
  await writeSafeRelease(f.db, 1, { ...body, driverCode: '999' }, false, clock, () => ['VCG']);
  assert.equal(f.rows()[0].driverCode, '999');
  assert.equal(portaria.length, 1, 'alterar apenas MOTO nao duplica a flag de uso');
  await clearReleaseLine(f.db, 1, { contexto: context, scheduleId: first.id, revisao: sheet.revisao, base: releaseLineToken(f.rows()[0]) }, clock);
  saved = JSON.parse(sheet.conteudo); assert.deepEqual(saved.usosBloqueadosCI, []);
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
});

test('lote exige confirmacao por carro e reverte tudo se uma linha bloqueada nao for confirmada', async () => {
  const f = fixture(), clock = () => eventInstant(target, 4);
  const sheet: any = { ...await f.db.folhaSoltura.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: context } }), id: 7, revisao: 1 };
  f.db.folhaSoltura.findUnique = async () => sheet;
  f.db.folhaSoltura.update = async ({ data }: any) => Object.assign(sheet, data);
  f.ci.push(...['4000', '4001'].map(prefixo => ({ prefixo, categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' })));
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [{ ...item, confirmarBloqueadoCI: '4000' }, secondItem] }, true, clock, () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
  assert.equal(f.rows().length, 0); assert.equal(sheet.revisao, 1);
  await writeSafeRelease(f.db, 1, { ...body, items: [{ ...item, confirmarBloqueadoCI: '4000' }, { ...secondItem, confirmarBloqueadoCI: '4001' }] }, true, clock, () => ['VCG']);
  assert.equal(f.rows().length, 2); assert.equal(JSON.parse(sheet.conteudo).usosBloqueadosCI.length, 2);
});

test('vespertino tambem exige confirmacao de bloqueado CI sem exigir CI finalizada ou Escala', async () => {
  const f = fixture(), clock = () => eventInstant(target, 14);
  const evening = { ...context, turno: 'VESPERTINO' } as const, row = currentReleaseTemplate(evening)[0];
  const sheet: any = { status: 'EM_ANDAMENTO', id: 7, revisao: 1,
    conteudo: JSON.stringify({ version: 1, itens: [{ ...row, carroProgramado: '' }], eventos: [] }) };
  f.db.folhaSoltura.findUnique = async () => sheet;
  f.db.folhaSoltura.update = async ({ data }: any) => Object.assign(sheet, data);
  f.db.folhaCI.findUnique = async () => ({ status: 'EM_PREPARACAO', itens: [{ prefixo: '4000', categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' }] });
  f.db.escalaDiaria.findUnique = async () => { throw Error('Vespertino nao exige escala'); };
  const request = { ...body, ...evening, scheduleId: row.id, linha: row.linha, tabela: row.tabela };
  const fleet = async () => ({ source: 'real', data: [{ prefixo: '4000', idCarro: '4000', garagem: 'VCG' }] });
  await assert.rejects(writeSafeRelease(f.db, 1, request, false, clock, () => [], fleet), reason('VEICULO_BLOQUEADO_NA_CI'));
  await writeSafeRelease(f.db, 1, { ...request, confirmarBloqueadoCI: '4000' }, false, clock, () => [], fleet);
  assert.equal(f.rows()[0].carroRealizado, '4000'); assert.equal(JSON.parse(sheet.conteudo).usosBloqueadosCI[0].prefixo, '4000');
});

test('confirmacao da CI nao ignora Portaria nem autorizacao falsificada no corpo', async () => {
  const f = fixture(), clock = () => eventInstant(target, 4);
  f.ci.push({ prefixo: '4000', categoria: 'BLOQUEADO', statusItem: 'BLOQUEADO' });
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, usosBloqueadosCI: [{ prefixo: '4000', usuarioId: 999 }] }, false, clock, () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
  const scale = JSON.parse(scaleContent());
  scale.cards = [{ id: 'PORTARIA', titulo: 'BLOQUEADOS PORTARIA', modo: 'lista', itens: [{ id: 'blocked', prefixo: '4000' }] }];
  f.db.escalaDiaria.findUnique = async () => ({ conteudo: JSON.stringify(scale) });
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, confirmarBloqueadoCI: '4000' }, false, clock, () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_PORTARIA'));
  assert.equal(f.rows().length, 0);
});

test('ADMIN edita Soltura anterior em andamento, inclusive lote e MOTO, com auditoria dos valores anteriores', async () => {
  const f = fixture(); const during = () => eventInstant(target, 4), later = () => eventInstant('2026-10-10', 10);
  const original = await f.db.folhaSoltura.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: context } });
  const sheet = { ...original, id: 1, revisao: 1 };
  f.db.folhaSoltura.findUnique = async () => sheet;
  f.db.folhaSoltura.update = async ({ data }: any) => Object.assign(sheet, data);
  await writeSafeRelease(f.db, 1, body, false, during, () => ['VCG']);
  const before = structuredClone(f.rows()[0]);
  f.db.user.findUnique = async () => ({ role: 'ADMIN', garagem: 'VCG' });
  await writeSafeRelease(f.db, 1, { ...body, driverCode: '999' }, false, later, () => ['VCG']);
  assert.equal(f.rows()[0].driverCode, '999'); assert.equal(f.rows()[0].dataOperacao, target);
  let content = JSON.parse(sheet.conteudo);
  assert.deepEqual(JSON.parse(content.limpezas[0].anterior).registro, before);
  assert.equal(content.limpezas[0].registradoEm, later().toISOString());
  assert.equal(sheet.revisao, 2);
  await writeSafeRelease(f.db, 1, { ...body, items: [{ ...item, driverCode: '888' }, { ...secondItem, driverCode: '777' }] }, true, later, () => ['VCG']);
  assert.equal(f.rows().length, 2); content = JSON.parse(sheet.conteudo);
  assert.equal(content.limpezas.length, 3); assert.equal(JSON.parse(content.limpezas[1].anterior).registro.driverCode, '999');
  assert.equal(JSON.parse(content.limpezas[2].anterior).registro, null);
  sheet.status = 'FINALIZADA'; const frozen = structuredClone(f.rows());
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, later, () => ['VCG']), /finalizada/);
  assert.deepEqual(f.rows(), frozen);
});

test('edicao anterior exige folha iniciada e ADMIN atual, recusa futuro e reverte falha na auditoria', async () => {
  const later = () => eventInstant('2026-10-10', 10);
  const missing = fixture(); missing.db.user.findUnique = async () => ({ role: 'ADMIN' });
  missing.db.folhaSoltura.findUnique = async () => null;
  await assert.rejects(writeSafeRelease(missing.db, 1, body, false, later, () => ['VCG']), /Inicie/);
  const revoked = fixture(); let calls = 0;
  revoked.db.user.findUnique = async () => ({ role: ++calls === 1 ? 'ADMIN' : 'soltura', garagem: 'VCG' });
  await assert.rejects(writeSafeRelease(revoked.db, 1, body, false, later, () => ['VCG']), reason('DATA_FORA_DO_CONTEXTO'));
  assert.equal(revoked.rows().length, 0);
  const failed = fixture(); failed.db.user.findUnique = async () => ({ role: 'ADMIN' });
  failed.db.folhaSoltura.update = async () => { throw Error('Falha auditoria'); };
  await assert.rejects(writeSafeRelease(failed.db, 1, body, false, later, () => ['VCG']), /Falha auditoria/);
  assert.equal(failed.rows().length, 0);
  await assert.rejects(writeSafeRelease(failed.db, 1, { ...body, dataOperacao: '2026-10-11' }, false, later, () => ['VCG']), reason('DATA_FORA_DO_CONTEXTO'));
});

test('limpar libera o carro para a linha correta e permite preencher a antiga sem duplicar registro', async () => {
  const f = fixture(), clock = () => eventInstant(target, 4);
  const initial = await f.db.folhaSoltura.findUnique({ where: { garagem_escalaTipo_turno_dataOperacao: context } });
  const sheet = { ...initial, id: 1, revisao: 1 };
  f.db.folhaSoltura.findUnique = async () => sheet;
  f.db.folhaSoltura.update = async ({ data }: any) => Object.assign(sheet, data);
  const saved: any = await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']);
  await clearReleaseLine(f.db, 1, { contexto: context, scheduleId: first.id, revisao: 1, base: releaseLineToken(saved) }, clock);
  await writeSafeRelease(f.db, 1, { ...body, ...secondItem, carroRealizado: '4000', driverCode: '123' }, false, clock, () => ['VCG']);
  await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', driverCode: '456' }, false, clock, () => ['VCG']);
  assert.equal(f.rows().length, 2);
  assert.equal(f.rows().find(r => r.scheduleId === first.id).id, saved.id);
  assert.equal(f.rows().find(r => r.scheduleId === second.id).carroRealizado, '4000');
  assert.equal(JSON.parse(sheet.conteudo).limpezas.length, 1);
});

test('linha suspensa rejeita despacho simples e lote sem atribuir carro ou motorista', async () => {
  const f = fixture();
  const original = f.db.folhaSoltura.findUnique;
  f.db.folhaSoltura.findUnique = async (args: any) => {
    const record = await original(args); const sheet = JSON.parse(record.conteudo);
    sheet.itens.find((row: any) => row.id === first.id).suspensa = true;
    return { ...record, conteudo: JSON.stringify(sheet) };
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 4), () => ['VCG']), reason('LINHA_SUSPENSA_REATIVE_ANTES_DE_LIBERAR'));
  await assert.rejects(writeSafeRelease(f.db, 1, { garagem: 'VCG', dataOperacao: target, turno: 'MATUTINO', escalaTipo: 'SEG_SEX', items: [secondItem, item] }, true,
    () => eventInstant(target, 4), () => ['VCG']));
  assert.equal(f.rows().length, 0);
});

test('pendente vinculada revalida programado corrigido; liberada e folha finalizada nao acompanham origem', async () => {
  const f = fixture(), clock = () => eventInstant(target, 4);
  let sheet: any = { id: 7, revisao: 1, status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1,
    itens: [{ ...first, carroProgramado: '4000' }], eventos: [], escalaVinculadaIds: [first.id] }) };
  const sourceRow = currentScaleTemplate(releaseScaleContext(context)).find(row => row.linha === first.linha && row.tabela === first.tabela)!;
  let substitute = '4001';
  f.db.escalaDiaria.findUnique = async () => {
    const state = JSON.parse(scaleContent()); state.programacao = [sourceRow];
    state.itens = [{ id: sourceRow.id, carroSubstituido: substitute }]; return { conteudo: JSON.stringify(state) };
  };
  f.db.folhaSoltura = { findUnique: async () => sheet,
    update: async ({ data }: any) => { sheet = { ...sheet, ...data }; return sheet; } };
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, carroProgramado: '4000' }, false, clock, () => ['VCG']), reason('CARRO_PROGRAMADO_ALTERADO_RECARREGUE'));
  assert.equal(f.rows().length, 0); assert.equal(sheet.revisao, 1);
  const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroProgramado: '4001', carroRealizado: '4001' }, false, clock, () => ['VCG']);
  assert.equal(saved.carroProgramado, '4001'); assert.equal(sheet.revisao, 2);
  assert.equal(JSON.parse(sheet.conteudo).itens[0].carroProgramado, '4001');
  substitute = '4002';
  const edited: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', driverCode: '999' }, false, clock, () => ['VCG']);
  assert.equal(edited.carroProgramado, '4001'); assert.equal(sheet.revisao, 2);
  sheet.status = 'FINALIZADA';
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']), /finalizada/);
  assert.equal(f.rows()[0].driverCode, '999');
});

test('falha ao persistir a atualizacao do vinculo desfaz o despacho inteiro', async () => {
  const f = fixture();
  const source = currentScaleTemplate(releaseScaleContext(context)).find(row => row.linha === first.linha && row.tabela === first.tabela)!;
  f.db.escalaDiaria.findUnique = async () => { const state = JSON.parse(scaleContent()); state.programacao = [source];
    state.itens = [{ id: source.id, carroSubstituido: '4001' }]; return { conteudo: JSON.stringify(state) }; };
  f.db.folhaSoltura = { findUnique: async () => ({ id: 7, revisao: 1, status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1,
    itens: [{ ...first, carroProgramado: '4000' }], eventos: [], escalaVinculadaIds: [first.id] }) }),
    update: async () => { throw Error('falha snapshot'); } };
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001' }, false, () => eventInstant(target, 4), () => ['VCG']), /falha snapshot/);
  assert.equal(f.rows().length, 0);
});

test('fretamento criado no Tráfego depende do tipo na fotografia, nunca da identificação enviada', async () => {
  for (const tipo of ['REGULAR', 'FRETAMENTO']) {
    const f = fixture();
    const row = { ...first, id: 'trafego-9a367235-3370-4e41-81f2-317513ef8ee6', linha: 'ESPECIAL', tabela: '', tipo };
    f.db.folhaSoltura.findUnique = async () => ({ status: 'EM_ANDAMENTO', conteudo: JSON.stringify({ version: 1, itens: [row], eventos: [] }) });
    const command = { ...body, scheduleId: row.id, linha: row.linha, tabela: '' };
    const save = () => writeSafeRelease(f.db, 1, command, false, () => eventInstant(target, 4), () => ['VCG']);
    if (tipo === 'REGULAR') { await assert.rejects(save(), reason('TABELA_OBRIGATORIA')); assert.equal(f.rows().length, 0); }
    else { await save(); assert.equal(f.rows()[0].linha, 'ESPECIAL'); }
  }
});

test('alteracao de MOTO preserva carro, liberacao e historico de troca salvo', async () => {
 const f = fixture(), clock = () => eventInstant(target, 4);
 const save = (request: unknown) => writeSafeRelease(f.db, 1, request, false, clock, () => ['VCG']);
 await save({ ...body, horaLiberacao: '04:10' });
 const exchanged: any = await save({ ...body, carroRealizado: '4001', horaLiberacao: '04:10', trocaCarro: { carroAnterior: '4000', motivo: 'Adicionado equivocadamente' } });
 const saved: any = await save({ ...body, carroRealizado: '4001', horaLiberacao: exchanged.horaLiberacao, driverCode: '5422', driverName: 'Motorista teste', historicoTrocas: [] });
 assert.equal(f.rows().length, 1);
 assert.equal(saved.driverCode, '5422'); assert.equal(saved.driverName, 'Motorista teste');
 assert.equal(saved.carroRealizado, exchanged.carroRealizado);
 assert.equal(saved.carroProgramado, exchanged.carroProgramado);
 assert.equal(saved.horaLiberacao, exchanged.horaLiberacao);
 assert.equal(saved.historicoTrocas, exchanged.historicoTrocas);
 f.db.folhaSoltura.findUnique = async () => ({ status: 'FINALIZADA' });
 await assert.rejects(save({ ...body, carroRealizado: '4001', driverCode: '999' }), /finalizada/);
 assert.equal(f.rows()[0].driverCode, '5422');
});

test('despacho individual e lote exigem Soltura iniciada e recusam finalizada', async () => {
 for (const batch of [false, true]) for (const status of [null, 'FINALIZADA']) {
  const f = fixture(); f.db.folhaSoltura.findUnique = async () => status ? { status } : null;
  const request = batch ? { ...body, items: [item] } : body;
  await assert.rejects(writeSafeRelease(f.db, 1, request, batch, () => eventInstant(target, 4), () => ['VCG']), (e: any) => e.status === 409 && /Soltura/.test(e.message));
  assert.equal(f.rows().length, 0);
 }
});

test('vespertino consulta bloqueios opcionais sem exigir CI finalizada, manutencao ou escala', async () => {
 const f = fixture();
 const forbid = async () => { throw Error('Dependencia proibida no vespertino'); };
 f.db.folhaCI.findUnique = async () => null; f.db.cicloOperacional.findUnique = forbid;
 f.db.escalaDiaria.findUnique = forbid; f.db.$queryRaw = async (sql: TemplateStringsArray) => { assert.match(sql.join('?'), /soltura_folha|folha_ci|ciclo_operacional/); return []; };
 const evening = { ...context, turno: 'VESPERTINO' } as const;
 const row = currentReleaseTemplate(evening)[0];
 const request = { ...body, turno: 'VESPERTINO', scheduleId: row.id, linha: row.linha, tabela: row.tabela, carroProgramado: '9999' };
 const fleet = async () => ({ source: 'real', data: [{ prefixo: '4000', idCarro: '4000', garagem: 'VCG' }] });
 const save = (value: unknown) => writeSafeRelease(f.db, 1, value, false, () => eventInstant(target, 14), () => [], fleet);
 const saved: any = await save(request);
 assert.equal(saved.carroProgramado, null); assert.equal(saved.carroRealizado, '4000'); assert.equal(saved.substituido, false);
 await assert.rejects(save({ ...request, carroRealizado: '' }), reason('CARRO_REALIZADO_OU_PROGRAMADO_OBRIGATORIO'));
 await assert.rejects(save({ ...request, carroRealizado: '9999' }), reason('VEICULO_FORA_DA_FROTA'));
 await assert.rejects(save({ ...request, driverCode: '' }));
 assert.equal(f.rows().length, 1);
});

test('vespertino mantem permissoes, data, molde e defeitos da propria Soltura', async () => {
 const f = fixture(); const evening = { ...context, turno: 'VESPERTINO' } as const;
 const [row, next] = currentReleaseTemplate(evening);
 const request = { ...body, turno: 'VESPERTINO', scheduleId: row.id, linha: row.linha, tabela: row.tabela };
 const fleet = async () => ({ source: 'real', data: ['4000', '4001'].map(prefixo => ({ prefixo, idCarro: prefixo, garagem: 'VCG' })) });
 const save = (value: unknown, batch = false) => writeSafeRelease(f.db, 1, value, batch, () => eventInstant(target, 14), () => [], fleet);
 await save(request);
 const changed: any = await save({ ...request, carroRealizado: '4001', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' } });
 assert.equal(JSON.parse(changed.historicoTrocas)[0].usuarioId, 1);
 const before = structuredClone(f.rows());
 await assert.rejects(save({ ...request, scheduleId: next.id, linha: next.linha, tabela: next.tabela }), reason('VEICULO_COM_DEFEITO_GARAGEM'));
 await assert.rejects(save({ ...request, linha: 'invalida' }), reason('VIAGEM_FORA_DO_MOLDE'));
 await assert.rejects(save({ ...request, dataOperacao: day }), reason('DATA_FORA_DO_CONTEXTO'));
 f.db.user.findUnique = async () => ({ role: 'COLABORADOR', garagem: 'VCG' });
 await assert.rejects(save(request), (e: any) => e.status === 403);
 assert.deepEqual(f.rows(), before);
});

test('carro realizado vazio usa programado oficial e exige motorista e disponibilidade', async () => {
 const f = fixture();
 const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '', carroProgramado: '9999' }, false, () => eventInstant(target, 4), () => ['VCG']);
 assert.ok(saved.carroProgramado); assert.equal(saved.carroRealizado, saved.carroProgramado); assert.notEqual(saved.carroRealizado, '9999');
 assert.equal(saved.substituido, false);
 const g = fixture(); g.ci.push({ prefixo: saved.carroProgramado, categoria: 'BLOQUEADO' });
 await assert.rejects(writeSafeRelease(g.db, 1, { ...body, carroRealizado: undefined }, false, () => eventInstant(target, 4), () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
 await assert.rejects(writeSafeRelease(f.db, 1, { ...body, carroRealizado: '', driverCode: '' }, false, () => eventInstant(target, 4), () => ['VCG']));
 assert.equal(g.rows().length, 0);
});

test('troca por defeito salva descricao e autor no servidor e impede outro despacho', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']);
 const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: '  Pneu furado  ' } }, false, clock, () => ['VCG']);
 const history = JSON.parse(saved.historicoTrocas);
 assert.equal(history.length, 2); assert.equal(history[1].descricaoDefeito, 'Pneu furado'); assert.equal(history[1].usuarioId, 1);
 assert.equal(history[1].registradoEm, clock().toISOString()); assert.equal(history[1].carroAnterior, '4000');
 assert.equal(f.ci.length, 0);
 const before = structuredClone(f.rows());
 await assert.rejects(writeSafeRelease(f.db, 1, { ...body, ...secondItem, carroRealizado: '4000' }, false, clock, () => ['VCG']), reason('VEICULO_COM_DEFEITO_GARAGEM'));
 assert.deepEqual(f.rows(), before);
 const same: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', historicoTrocas: [] }, false, clock, () => ['VCG']);
 assert.deepEqual(JSON.parse(same.historicoTrocas), history);
});

test('comando legado de troca valida descricao de defeito e prefixo anterior atual sem gravacao parcial', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']); const before = structuredClone(f.rows());
 for (const trocaCarro of [{ carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: '  ' },
   { carroAnterior: '4002', motivo: 'Adicionado equivocadamente' }, { carroAnterior: '4000', motivo: 'Outro' },
   { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Pneu', usuarioId: 99 }]) {
   await assert.rejects(writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', trocaCarro }, false, clock, () => ['VCG']));
   assert.deepEqual(f.rows(), before);
 }
});

test('equivoco registra troca sem criar defeito; cliente nao pode inventar historico', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 const forged = [{ carroAnterior: '4001', motivo: 'Defeito Garagem' }];
 const initial: any = await writeSafeRelease(f.db, 1, { ...body, historicoTrocas: forged }, false, clock, () => ['VCG']);
 assert.equal(JSON.parse(initial.historicoTrocas).length, 1);
 assert.equal(JSON.parse(initial.historicoTrocas)[0].destino, 'RESERVA');
 assert.notEqual(JSON.parse(initial.historicoTrocas)[0].carroAnterior, '4001');
 const saved: any = await writeSafeRelease(f.db, 1, { ...body, carroRealizado: '4001', trocaCarro: { carroAnterior: '4000', motivo: 'Adicionado equivocadamente' } }, false, clock, () => ['VCG']);
 assert.equal(JSON.parse(saved.historicoTrocas).at(-1).motivo, 'Adicionado equivocadamente');
 await writeSafeRelease(f.db, 1, { ...body, ...secondItem, carroRealizado: '4000' }, false, clock, () => ['VCG']);
 assert.equal(f.rows().length, 2);
});

test('defeito de outro turno bloqueia; outra data ou garagem nao transporta bloqueio', async () => {
 const clock = () => eventInstant(target, 4);
 for (const [garagem, dataOperacao, shouldBlock] of [['VCG', target, true], ['VCM', target, false], ['VCG', day, false]] as const) {
  const f = fixture(); f.rows().push({ id: 99, garagem, dataOperacao, turno: 'VESPERTINO', escalaTipo: 'SEG_SEX', scheduleId: 'outro', carroRealizado: '4002',
    historicoTrocas: JSON.stringify([{ carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' }]) });
  const request = writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']);
  if (shouldBlock) await assert.rejects(request, reason('VEICULO_COM_DEFEITO_GARAGEM')); else await request;
 }
});

test('defeito em lote impede reutilizacao no mesmo lote e reverte tudo', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']); const before = structuredClone(f.rows());
 for (const reverse of [false, true]) {
  const rows = [{ ...item, carroRealizado: '4002', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' } }, { ...secondItem, carroRealizado: '4000' }];
  await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: reverse ? rows.reverse() : rows }, true, clock, () => ['VCG']), reason('VEICULO_COM_DEFEITO_GARAGEM'));
  assert.deepEqual(f.rows(), before);
 }
});

test('falha ao persistir lote reverte troca e historico de defeito ja preparados', async () => {
 const f = fixture(); const clock = () => eventInstant(target, 4);
 await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']); const before = structuredClone(f.rows()); f.failWrite();
 await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [
  { ...item, carroRealizado: '4002', trocaCarro: { carroAnterior: '4000', motivo: 'Defeito Garagem', descricaoDefeito: 'Motor' } }, secondItem,
 ] }, true, clock, () => ['VCG']), /Escrita falhou/);
 assert.deepEqual(f.rows(), before);
});
test('somente a data atual permite despacho, inclusive antes das 03h', () => {
 for (const hour of [0, 1, 3, 22]) assert.deepEqual(resolveReleaseContext('VCG', target, eventInstant(target, hour)), { ciDate: target, maintenanceDate: target });
 for (const hour of [15, 22]) assert.throws(() => resolveReleaseContext('VCG', target, eventInstant(day, hour)), reason('DATA_FORA_DO_CONTEXTO'));
 assert.throws(() => resolveReleaseContext('VCG', undefined, eventInstant(day, 15)), reason('DATA_OPERACIONAL_OBRIGATORIA'));
});

test('tarde: preparacao nao autoriza; noite: CI finalizada e manutencao oficial permitem gravacao', async () => {
  const prep = fixture('EM_PREPARACAO');
  await assert.rejects(writeSafeRelease(prep.db, 1, body, false, () => eventInstant(target, 15), () => ['VCG']), reason('CI_EM_PREPARACAO_NAO_AUTORIZA_SOLTURA'));
  assert.equal(prep.rows().length, 0);
  const ready = fixture();
  const row: any = await writeSafeRelease(ready.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']);
  assert.equal(row.status, 'LIBERADO'); assert.equal(row.dataOperacao, target);
  assert.match(ready.locks[0], /ciclo_operacional.*UPDLOCK, HOLDLOCK/);
  assert.match(ready.locks[1], /folha_ci.*UPDLOCK, HOLDLOCK/);
});
test('matutino considera bloqueio da CI; Controle independente nao impede lote', async () => {
  for (const source of ['CI', 'BLOQUEADO', 'EXECUCAO']) {
    const f = fixture();
    if (source === 'CI') f.ci.push({ prefixo: '4001', categoria: 'BLOQUEADO' });
    else f.states.push({ prefixo: '4001', bloqueado: source === 'BLOQUEADO', emExecucao: source === 'EXECUCAO', liberado: false });
    const save = () => writeSafeRelease(f.db, 1, { ...body, items: [item, secondItem] }, true, () => eventInstant(target, 22), () => ['VCG']);
    if (source === 'CI') { await assert.rejects(save(), reason('VEICULO_BLOQUEADO_NA_CI')); assert.equal(f.rows().length, 0); }
    else { await save(); assert.equal(f.rows().length, 2); }
  }
});
test('falha de consulta e erro na segunda escrita nunca deixam lote parcial', async () => {
  for (const fail of ['failRead', 'failWrite'] as const) {
    const f = fixture(); f[fail]();
    await assert.rejects(writeSafeRelease(f.db, 1, { ...body, items: [item, secondItem] }, true, () => eventInstant(target, 22), () => ['VCG']));
    assert.equal(f.rows().length, 0);
  }
});
test('VCM fora do matutino Seg-Sex e legado VCG permanecem suspensos sem consultar banco', async () => {
  const db: any = { $transaction: () => { throw Error('Nao consultar'); } };
  await assert.rejects(writeSafeRelease(db, 1, { ...body, garagem: 'VCM', turno: 'VESPERTINO' }, false), reason('FONTE_VCM_NAO_COMPROVADA'));
  await assert.rejects(writeSafeRelease(db, 1, body, false, () => eventInstant(target, 22), () => []), reason('LEGADO_SEM_FOLHA_FINALIZADA_CERTIFICAVEL'));
});
test('bloqueio confirmado durante espera pelo lock e visto antes de gravar', async () => {
  const f = fixture();
  f.db.$queryRaw = async () => {
    if (!f.states.length) {
      f.states.push({ prefixo: '4000', bloqueado: true, emExecucao: false, liberado: false, consorciada: 'VCG' });
      f.ci.push({ prefixo: '4000', categoria: 'BLOQUEADO', consorciada: 'VCG' });
    }
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), reason('VEICULO_BLOQUEADO_NA_CI'));
  assert.equal(f.rows().length, 0);
});
test('virada de dia antes do commit desfaz a soltura', async () => {
  const f = fixture();
  await assert.rejects(writeSafeRelease(f.db, 1, body, false,
    () => f.rows().length ? eventInstant('2026-10-10', 1) : eventInstant(target, 23), () => ['VCG']));
  assert.equal(f.rows().length, 0);
});
test('copia NORMAL de origem RECUPERACAO nao autoriza; manutencao deixou de ser fonte', async () => {
  const f = fixture(); const original = f.db.folhaCI.findUnique;
  f.db.folhaCI.findUnique = async (q: any) => {
    const record = await original(q);
    return q.where.id ? { ...record, origem: 'RECUPERACAO' } : record;
  };
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), reason('ORIGEM_CI_NAO_CERTIFICADA'));
  assert.equal(f.rows().length, 0);
  const divergent = fixture(); divergent.states.push({ prefixo: '4000', bloqueado: true, emExecucao: false, liberado: false });
  divergent.db.estadoManutencao.findMany = async () => { throw Error('Soltura nao deve consultar manutencao'); };
  divergent.db.cicloOperacional.findUnique = async () => { throw Error('Soltura nao deve consultar ciclo de manutencao'); };
  await writeSafeRelease(divergent.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']);
  assert.equal(divergent.rows().length, 1);
});


test('soltura recusa usuario de outra garagem antes de gravar', async () => {
  const f = fixture();
  f.db.user.findUnique = async () => ({ role: 'soltura', garagem: 'VCM' });
  await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 22), () => ['VCG']), (e: any) => e.status === 403);
  assert.equal(f.rows().length, 0);
});

for (const batch of [false, true]) test('fretamento sem tabela preserva o registro no banco simulado, lote=' + batch, async () => {
 const f = fixture(); const special = currentReleaseTemplate({ garagem: 'VCG', escalaTipo: 'SEG_SEX', turno: 'MATUTINO' }).find(i => i.tipo === 'FRETAMENTO')!;
 const entry = { ...item, scheduleId: special.id, linha: special.linha, tabela: '' };
 const command = batch ? { ...body, items: [entry] } : { ...body, ...entry };
 await writeSafeRelease(f.db, 1, command, batch, () => eventInstant(target, 12), () => ['VCG']);
 assert.equal(f.rows().length, 1); assert.equal(f.rows()[0].tabela, ''); assert.equal(f.rows()[0].linha, special.linha);
});

 test('sem ciclo de manutencao e sem CI de amanha, CI e Escala da data bastam antes das 03h', async () => {
 const f = fixture(); f.missingCycle(); const read = f.db.folhaCI.findUnique;
 f.db.folhaCI.findUnique = async (q: any) => q.where.garagem_dataFolha && q.where.garagem_dataFolha.dataFolha.toISOString().slice(0,10) !== target ? null : read(q);
 await writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 1), () => ['VCG']);
 assert.equal(f.rows().length, 1);
 });
 for (const value of [null, { conteudo: scaleContent('EM_PREPARACAO') }]) test('Escala ausente ou em preparacao recusa despacho', async () => {
 const f = fixture(); f.db.escalaDiaria.findUnique = async () => value;
 await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 4), () => ['VCG']), reason('ESCALA_NAO_FINALIZADA'));
 assert.equal(f.rows().length, 0);
 });
 test('backend ignora carro programado adulterado e preserva programacao apos despacho', async () => {
 const f = fixture(); const row: any = await writeSafeRelease(f.db, 1, { ...body, carroProgramado: '9999' }, false, () => eventInstant(target, 4), () => ['VCG']);
 assert.notEqual(row.carroProgramado, '9999'); const saved = row.carroProgramado;
 f.db.escalaDiaria.findUnique = async () => { const state=JSON.parse(scaleContent()); state.itens=[{ id: first.id, carroSubstituido: '5001' }]; return { conteudo: JSON.stringify(state) }; };
 const corrected: any = await writeSafeRelease(f.db, 1, { ...body, carroProgramado: '8888', saidaGaragem:'23:59' }, false, () => eventInstant(target, 5), () => ['VCG']);
 assert.equal(corrected.carroProgramado, saved); assert.equal(corrected.saidaGaragem, first.saidaGaragem);
 });
 test('perfil sem autorizacao de despacho e viagem adulterada sao recusados', async () => {
 const f = fixture(); f.db.user.findUnique = async () => ({ role: 'manutencao', garagem: 'VCG' });
 await assert.rejects(writeSafeRelease(f.db, 1, body, false, () => eventInstant(target, 4), () => ['VCG']), (e:any)=> e.status===403);
 const g = fixture(); await assert.rejects(writeSafeRelease(g.db, 1, {...body, tabela:'ADULTERADA'}, false, () => eventInstant(target,4), () => ['VCG']),reason('VIAGEM_FORA_DO_MOLDE'));
 assert.equal(g.rows().length,0);
 });

test('primeiro preenchimento com outro realizado retira programado oficial; so motorista usa programado', async () => {
  const f = fixture(), clock = () => eventInstant(target, 4);
  const saved: any = await writeSafeRelease(f.db, 1, body, false, clock, () => ['VCG']);
  const first = JSON.parse(saved.historicoTrocas);
  assert.equal(first.length, 1); assert.equal(first[0].carroAnterior, saved.carroProgramado);
  assert.equal(first[0].novoCarro, '4000'); assert.equal(first[0].destino, 'RESERVA');
  const g = fixture();
  const same: any = await writeSafeRelease(g.db, 1, { ...body, carroRealizado: '' }, false, clock, () => ['VCG']);
  assert.equal(same.carroRealizado, same.carroProgramado); assert.deepEqual(JSON.parse(same.historicoTrocas), []);
});
