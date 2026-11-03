import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createMaintenanceOffline, type MaintenanceLocal, type MaintenanceSnapshot } from '../../web/src/lib/maintenanceOffline';

const day='2026-10-30';
const row={id:'4000',prefixo:'4000',data:day,consorciada:'VCG' as const,observacao:'MOTOR',bloqueado:true,emExecucao:false,liberado:false};
function fixture() {
 const store=new Map<string,MaintenanceLocal>(), sent:any[]=[],applied=new Map<string,MaintenanceSnapshot>();
 let today=day,online=true,writeFailure=false,error:any=null,reads=0,server:MaintenanceSnapshot={garagem:'VCG',data:day,revisao:0,base:'0:empty',items:[],origem:'VAZIA'};
 const client=(key='user1:VCG:'+day)=>createMaintenanceOffline(key,'VCG',day,{
  get:async key=>structuredClone(store.get(key)??null), put:async(key,value)=>{if(writeFailure)throw Error('Quota');store.set(key,structuredClone(value));},
  read:async()=>{reads++;if(error)throw error;return structuredClone(server);},
  send:async command=>{sent.push(structuredClone(command));if(error)throw error;if(applied.has(command.operacaoId))return applied.get(command.operacaoId);
   if(command.base!==server.base)throw Object.assign(Error('Conflito'),{status:409});
   server={...server,items:structuredClone(command.items),revisao:server.revisao+1,base:String(server.revisao+1),origem:'PERSISTIDA'};
   applied.set(command.operacaoId,structuredClone(server));return structuredClone(server);},
  online:()=>online,uuid:randomUUID,today:()=>today,
 });
 return {client,store,sent,server:()=>server,date:(value:string)=>{today=value;},online:(value:boolean)=>{online=value;},fail:(value:any)=>{error=value;},quota:()=>{writeFailure=true;},reads:()=>reads};
}
test('offline exige copia carregada e guarda fotografia e fila em uma unica escrita',async()=>{
 const f=fixture(),client=f.client();f.online(false);await assert.rejects(client.load(),/conexao/);
 f.online(true);await client.load();f.online(false);
 const local=await client.save([row],false,[]);
 assert.equal(local.queue.length,1);assert.equal(local.snapshot.items[0].prefixo,'4000');assert.equal(f.sent.length,0);
 assert.equal(JSON.stringify(local).includes('token'),false);
 const reopened=await f.client().load();assert.deepEqual(reopened.snapshot.items,[row]);
});
test('Usado Portaria persiste no cache e na fila offline com comando especifico',async()=>{
 const f=fixture(),client=f.client();await client.load();
 const saved=await client.save([row],false,[]);f.online(false);
 const local=await client.save([{...row,usadoPortaria:true}],false,saved.snapshot.items,'USADO_PORTARIA');
 assert.equal(local.queue[0].operacao,'USADO_PORTARIA');assert.equal(local.snapshot.items[0].usadoPortaria,true);
 const reopened=await f.client().load();assert.equal(reopened.snapshot.items[0].usadoPortaria,true);
 f.online(true);const flushed=await f.client().load();
 assert.equal(flushed.queue.length,0);assert.equal(f.server().items[0].usadoPortaria,true);
 assert.equal(f.sent.at(-1)?.operacao,'USADO_PORTARIA');
});

test('reconexao envia FIFO com revisoes consecutivas e preserva alteracoes posteriores',async()=>{
 const f=fixture(),client=f.client();await client.load();f.online(false);
 await client.save([row],false,[]);
 const released={...row,bloqueado:false,liberado:true};await client.save([released],true,[row]);
 f.online(true);const local=await client.load();
 assert.deepEqual(f.sent.map(c=>c.base),['0:empty','1']);assert.equal(local.queue.length,0);assert.deepEqual(f.server().items,[released]);
});
test('conflito conserva fila e copia local; descarte exige consulta bem sucedida',async()=>{
 const f=fixture(),client=f.client();await client.load();f.online(false);await client.save([row],false,[]);
 f.online(true);f.fail(Object.assign(Error('Conflito'),{status:409}));
 const conflicted=await client.load();assert.equal(conflicted.queue.length,1);assert.equal(conflicted.offline,false);assert.match(conflicted.issue,/Conflito/);
 await assert.rejects(client.save([],false,[row]),/Revise/);
 await assert.rejects(client.discard());assert.equal(f.store.values().next().value!.queue.length,1);
 f.fail(null);await client.discard();assert.equal(f.store.values().next().value!.queue.length,0);
});
test('erro de autenticacao nao vira sucesso offline nem descarta fila',async()=>{
 const f=fixture(),client=f.client();await client.load();f.online(false);await client.save([row],false,[]);
 f.online(true);f.fail(Object.assign(Error('Sessao expirada'),{status:401}));const state=await client.load();
 assert.equal(state.offline,false);assert.equal(state.queue.length,1);assert.match(state.issue,/Sessao/);
});
test('quota de armazenamento impede sucesso e envio de alteracao nao duravel',async()=>{
 const f=fixture(),client=f.client();await client.load();f.quota();
 await assert.rejects(client.save([row],false,[]),/Quota/);assert.equal(f.sent.length,0);
});
test('fila de outro usuario/contexto nao e carregada nem sincronizada',async()=>{
 const f=fixture(),client=f.client();await client.load();f.online(false);await client.save([row],false,[]);
 await assert.rejects(f.client('user2:VCG:'+day).load(),/conexao/);
 assert.equal(f.sent.length,0);assert.equal(f.store.size,1);
});
test('formulario aberto antes de recarga nao sobrescreve baseline nova',async()=>{
 const f=fixture(),client=f.client();await client.load();await client.save([row],false,[]);
 await assert.rejects(client.save([],false,[]),/formulario/);
 assert.deepEqual(f.server().items,[row]);
});
test('duas tentativas simultaneas de sincronizar nao duplicam envios',async()=>{
 const f=fixture(),client=f.client();await client.load();f.online(false);await client.save([row],false,[]);f.online(true);
 await Promise.all([client.load(),client.load()]);assert.equal(f.sent.length,1);assert.equal(f.server().revisao,1);
});
test('falha de rede permite continuar local e preserva ids das operacoes para retry',async()=>{
 const f=fixture(),client=f.client();await client.load();f.fail(Error('Rede indisponivel'));
 const first=await client.save([row],false,[]);const id=first.queue[0].operacaoId;
 assert.equal(first.offline,true);f.fail(null);const synced=await client.load();
 assert.equal(f.sent.at(-1).operacaoId,id);assert.equal(synced.queue.length,0);
});
test('pendencia vencida e descartada sem envio, preservando ultimo estado confirmado',async()=>{
 const f=fixture(),client=f.client();await client.load();await client.save([row],false,[]);
 f.online(false);await client.save([],false,[row]);
 f.date('2026-10-31');const previous=await client.load();
 assert.equal(previous.queue.length,0);assert.deepEqual(previous.snapshot.items,[row]);
 assert.match(previous.notice!,/descartadas/);assert.equal(f.sent.length,1);
 assert.equal(f.server().items.length,1);
 await assert.rejects(client.save([],false,[row]),/dia atual/);
});
test('reconexao em outro dia descarta lote vencido sem executar comandos antigos',async()=>{
 const f=fixture(),client=f.client();await client.load();f.online(false);
 await client.save([row],false,[]);await client.save([],false,[row]);
 f.date('2026-10-31');f.online(true);const result=await client.load();
 assert.equal(result.queue.length,0);assert.equal(f.sent.length,0);assert.deepEqual(f.server().items,[]);
});
