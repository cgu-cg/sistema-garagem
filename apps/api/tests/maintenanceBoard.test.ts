import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readMaintenanceBoard, saveMaintenanceBoard } from '../src/services/maintenanceBoard';
import { eventInstant } from '../src/services/c4Temporal';

const day = '2026-10-30';
const row = (prefixo = '4000', status = 'EM_EXECUCAO', data = day) => ({ id: `manut-${data}-${prefixo}`, prefixo, data,
  consorciada: 'VCG' as const, observacao: 'MOTOR', bloqueado: status === 'BLOQUEADO', emExecucao: status === 'EM_EXECUCAO', liberado: status === 'LIBERADO' });
function fixture() {
  let records: any[] = [], user: any = { role: 'manutencao', garagem: 'VCG' }, time = eventInstant(day, 10);
  const locks: string[] = [];
  const table = {
    findUnique: async ({ where }: any) => records.find(r => r.garagem === where.garagem_dataOperacao.garagem && r.dataOperacao === where.garagem_dataOperacao.dataOperacao) ?? null,
    findFirst: async ({ where }: any) => records.filter(r => r.garagem === where.garagem && r.dataOperacao < where.dataOperacao.lt).sort((a,b) => b.dataOperacao.localeCompare(a.dataOperacao))[0] ?? null,
    create: async ({ data }: any) => { const value = { id: records.length + 1, ...data }; records.push(value); return value; },
    update: async ({ where, data }: any) => { const found = records.find(r => r.id === where.id); Object.assign(found, data); return found; },
  };
  const db: any = { controleManutencaoFolha: table, user: { findUnique: async () => user },
    $queryRaw: async (sql: TemplateStringsArray) => { locks.push(sql.join('?')); },
    $transaction: async (fn: any) => { const old = structuredClone(records); try { return await fn(db); } catch(e) { records = old; throw e; } },
    get folhaCI() { throw Error('Controle nao deve consultar CI'); },
    get cicloOperacional() { throw Error('Controle atual nao deve consultar ciclo CI'); },
    get estadoManutencao() { throw Error('Controle atual nao deve consultar estados acoplados'); },
    get manutencaoCarro() { throw Error('Controle atual nao deve consultar legado'); },
  };
  const now = () => time;
  const fleet: any = async () => ({ source: 'real', data: ['4000','4001','4002'].map(prefixo => ({ prefixo, idCarro: prefixo, garagem: 'VCG' })) });
  const read = (data = day) => readMaintenanceBoard(db, 1, { garagem: 'VCG', data }, now);
  const save = (value: any) => saveMaintenanceBoard(db, 1, { garagem: 'VCG', data: day, operacaoId: randomUUID(), ...value }, now, fleet);
  return { db, read, save, locks, records: () => records, user: (value: any) => { user = value; }, time: (date: Date) => { time = date; } };
}
test('controle salva os tres estados em folha independente sem ler/escrever CI', async () => {
  const f = fixture(), baseline = await f.read();
  assert.equal(baseline.origem, 'VAZIA'); assert.equal(f.records().length, 0);
  const saved = await f.save({ base: baseline.base, items: [row('4000','BLOQUEADO'),row('4001'),row('4002','LIBERADO')] });
  assert.equal(saved.revisao,1); assert.equal(saved.items.length,3);
  assert.match(f.locks[0], /controle_manutencao_folha.*UPDLOCK,HOLDLOCK/);
  assert.equal(JSON.parse(f.records()[0].conteudo).eventos[0].usuarioId,1);
});
test('virada preserva somente bloqueados e esvazia manutencao/liberados sem alterar historico', async () => {
  const f = fixture(), baseline = await f.read();
  await f.save({ base: baseline.base, items: [row('4000','BLOQUEADO'),row('4001'),row('4002','LIBERADO')] });
  const before = structuredClone(f.records()); f.time(eventInstant('2026-11-02',10));
  const current = await f.read('2026-11-02');
  assert.equal(current.origem,'VIRADA'); assert.equal(current.items.filter(i=>i.liberado).length,0);
  assert.equal(current.items.filter(i=>i.emExecucao).length,0); assert.equal(current.items.filter(i=>i.bloqueado).length,1);
  assert.equal(current.items.length,1);
  assert.ok(current.items.every(i=>i.data==='2026-11-02'));
  assert.deepEqual(f.records(),before);
  const historical = await f.read(day); assert.equal(historical.items.filter(i=>i.liberado).length,1);
});
test('folha vazia persistida impede ressuscitar carros de dias anteriores', async () => {
  const f = fixture(), baseline=await f.read();
  await f.save({base:baseline.base,items:[row()]});
  await f.save({base:'1',items:[]});
  f.time(eventInstant('2026-10-31',10));
  assert.deepEqual((await f.read('2026-10-31')).items,[]);
});
test('reenvio apos resposta perdida e idempotente e nao aceita payload adulterado', async () => {
  const f=fixture(),base=(await f.read()).base,operacaoId=randomUUID();
  const cmd={base,operacaoId,items:[row()]};
  await f.save(cmd); await f.save(cmd);
  assert.equal(f.records()[0].revisao,1);
  await assert.rejects(f.save({...cmd,items:[]}),/outro conteudo/);
});
test('conflito de revisao recusa overwrite e confirma antes de liberar bloqueado', async () => {
  const f=fixture(),base=(await f.read()).base;
  await f.save({base,items:[row('4000','BLOQUEADO')]});
  await assert.rejects(f.save({base,items:[]}),/outro dispositivo/);
  await assert.rejects(f.save({base:'1',items:[row('4000','LIBERADO')]}),/Confirme/);
  await f.save({base:'1',items:[row('4000','LIBERADO')],confirmRelease:true});
  assert.equal(f.records()[0].revisao,2);
});
test('backend revalida perfil, garagem, frota, data e exclusividade dos estados', async () => {
  const f=fixture(),base=(await f.read()).base;
  for (const user of [{role:'soltura',garagem:'VCG'},{role:'manutencao',garagem:'VCM'},null]) {
    f.user(user); await assert.rejects(f.save({base,items:[row()]}),(e:any)=>e.status===403);
  }
  f.user({role:'ADMIN'});
  await assert.rejects(f.save({base,items:[row('9999')]}),/frota/);
  await assert.rejects(f.save({base,items:[{...row(),bloqueado:true}]}),/somente um estado/);
  await assert.rejects(f.save({base,items:[row(),row()]}),/duplicado/);
  await assert.rejects(f.save({base,items:[row('4000','LIBERADO','2026-10-29')]}),/data/);
  await assert.rejects(f.save({base,items:[{...row(),observacao:'x'.repeat(256)}]}));
  assert.equal(f.records().length,0);
});
test('pendencia de outro dia e janela fechada nao sao transportadas nem gravadas', async () => {
  const f=fixture(),base=(await f.read()).base;
  for(const time of [eventInstant(day,2),eventInstant(day,20),eventInstant('2026-10-31',10)]) {
    f.time(time); await assert.rejects(f.save({base,items:[row()]}),/fora do dia/);
  }
  assert.equal(f.records().length,0);
});
test('virada durante transacao reverte a escrita',async()=>{
  const f=fixture(),base=(await f.read()).base,create=f.db.controleManutencaoFolha.create;
  f.db.controleManutencaoFolha.create=async(args:any)=>{const result=await create(args);f.time(eventInstant('2026-10-31',10));return result;};
  // A validacao imediatamente antes da gravacao e seguida de uma ultima validacao no commit.
  await assert.rejects(f.save({base,items:[row()]}),/fora do dia/);
  assert.equal(f.records().length,0);
});

test('historico legado preserva estados coexistentes sem reconstrucao pela CI',async()=>{
 const persisted={id:1,prefixo:'4000',consorciada:'VCG',observacaoBloqueio:'MOTOR',observacaoOficina:'FREIO',bloqueado:true,emExecucao:true,liberado:false};
 const db:any={controleManutencaoFolha:{findUnique:async()=>null},
  cicloOperacional:{findFirst:async()=>({id:1,dataOperacional:new Date('2026-10-29T00:00:00Z')})},
  estadoManutencao:{findMany:async()=>[persisted]},get folhaCI(){throw Error('Historico nao consulta CI');}};
 const {projectMaintenance}=await import('../src/services/maintenanceBoard');
 const result=await projectMaintenance(db,'VCG','2026-10-29',eventInstant(day,10));
 assert.equal(result.items[0].bloqueado,true);assert.equal(result.items[0].emExecucao,true);
 assert.equal(result.items[0].observacaoOficina,'FREIO');assert.equal(persisted.emExecucao,true);
});
