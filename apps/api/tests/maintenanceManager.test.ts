import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import { beginMutation, endMutation } from '../../web/src/lib/mvpTemporal';

test('manager independente usa cache por usuario/contexto, sem consultar ou atualizar CI', async t => {
 const prior={window:Object.getOwnPropertyDescriptor(globalThis,'window'),navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),CustomEvent:Object.getOwnPropertyDescriptor(globalThis,'CustomEvent'),Date};
 const RealDate=Date;
 let currentDay='2026-10-30';
 class FixedDate extends RealDate {constructor(value?:any){super(value===undefined?currentDay+'T15:00:00Z':value);}}
 const events=new EventTarget(),cache=new Map<string,any>(),calls:any[]=[],published:any[]=[];
 let owner=1,online=true,fail:any=null;
 const user=()=>({id:owner,role:'ADMIN',garagem:'VCG'});
 const snapshots=new Map<string,any>();
 const snapshot=(garage:string,data:string)=>{const key=`${owner}:${garage}:${data}`;if(!snapshots.has(key))snapshots.set(key,{garagem:garage,data,revisao:0,base:'0:empty',items:[],origem:'VAZIA'});return snapshots.get(key);};
 Object.defineProperty(globalThis,'window',{configurable:true,value:events});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{get onLine(){return online;}}});
 Object.defineProperty(globalThis,'CustomEvent',{configurable:true,value:class extends Event{detail:any;constructor(name:string,options:any){super(name);this.detail=options.detail;}}});
 globalThis.Date=FixedDate as any;
 events.addEventListener('manutencao_updated',(event:any)=>published.push(event.detail));
 const api={get:async(url:string,{params}:any)=>{calls.push({url,...params});if(fail)throw fail;return structuredClone(snapshot(params.garagem,params.data));},
  post:async(url:string,body:any)=>{calls.push({url,body});if(fail)throw fail;const old=snapshot(body.garagem,body.data);
   assert.equal(body.base,old.base);const next={...old,items:body.items,revisao:old.revisao+1,base:String(old.revisao+1),origem:'PERSISTIDA'};
   snapshots.set(`${owner}:${body.garagem}:${body.data}`,next);return structuredClone(next);}};
 const loader=(Module as any)._load;let manager:any;
 try {
  (Module as any)._load=function(request:string,parent:any,main:boolean){
   if(request==='@/stores/auth')return{useAuth:{getState:()=>({user:user()})}};
   if(request==='@/lib/api')return{api};
   if(request==='@/lib/offline-db')return{getCacheEntries:async(prefix:string)=>[...cache].filter(([key])=>key.startsWith(prefix)).map(([key,data])=>({key,data})),getCache:async(key:string)=>structuredClone(cache.get(key)??null),compareAndSaveCache:async(key:string,value:any,expected:string|null)=>{
    assert.equal(cache.has(key)?JSON.stringify(cache.get(key)):null,expected); cache.set(key,structuredClone(value));}};
   if(request.includes('ciManager')||request==='@/lib/c4')throw Error('Dependencia CI proibida');
   return loader.call(this,request.startsWith('@/')?path.resolve('apps/web/src',request.slice(2)+'.ts'):request,parent,main);
  };
  manager=require('../../web/src/pages/manutencao/manutencaoManager');
 }finally{(Module as any)._load=loader;}
 const day='2026-10-30',row={id:'m4000',prefixo:'4000',consorciada:'VCG',data:day,observacao:'MOTOR',bloqueado:true,emExecucao:false,liberado:false};
 try {
  await t.test('consulta nao compartilha lock/refreshRequired da CI',async()=>{
   beginMutation();try{assert.deepEqual(await manager.fetchManutencaoDataFromApi(day,'VCG'),[]);}finally{endMutation();}
   assert.deepEqual(calls.map(c=>c.url),['/manutencao']);
   await assert.rejects(manager.fetchManutencaoDataFromApi(day,'TODAS'),/explicitamente/);
  });
  await t.test('offline grava e publica pendencia sem enviar token ou comando CI',async()=>{
   online=false;await manager.saveManutencaoData(day,[row],false,[],[],'VCG');
   assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,1);
   assert.equal(calls.filter(c=>c.body).length,0);
   assert.equal(published.at(-1).userId,1);
   assert.deepEqual(await manager.listMaintenancePendingDates('VCG'),[{data:day,count:1}]);
  });
  await t.test('troca de usuario isola copia e fila anterior',async()=>{
   owner=2;assert.deepEqual(manager.getManutencaoData(day,'VCG'),[]);
   assert.deepEqual(await manager.fetchManutencaoDataFromApi(day,'VCG'),[]);
   assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,0);
   assert.deepEqual(await manager.listMaintenancePendingDates('VCG'),[]);
   owner=1;assert.equal((await manager.fetchManutencaoDataFromApi(day,'VCG')).length,1);
  });
  await t.test('reconexao sincroniza somente na sessao e contexto de origem',async()=>{
   online=true;await manager.fetchManutencaoDataFromApi(day,'VCG');
   const sent=calls.filter(c=>c.body);assert.equal(sent.length,1);assert.equal(sent[0].url,'/manutencao/sync');
   assert.equal(sent[0].body.garagem,'VCG');assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,0);
   assert.equal('token' in sent[0].body,false);
  });
  await t.test('conflito mantem quadro local e fila; descarte nao e automatico',async()=>{
   const before=manager.getManutencaoData(day,'VCG');fail=Object.assign(Error('Conflito do servidor'),{status:409});
   await manager.saveManutencaoData(day,[],false,before,[],'VCG');
   assert.deepEqual(manager.getManutencaoData(day,'VCG'),[]);
   assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,1);
   await assert.rejects(manager.discardMaintenancePending(day,'VCG'));assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,1);
   fail=null;await manager.discardMaintenancePending(day,'VCG');assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,0);
  });
  await t.test('novo dia offline usa somente bloqueados confirmados e descarta fila antiga',async()=>{
   online=false;const before=manager.getManutencaoData(day,'VCG');
   await manager.saveManutencaoData(day,[],false,before,[],'VCG');
   const sent=calls.filter(c=>c.body).length;currentDay='2026-10-31';
   const today=await manager.fetchManutencaoDataFromApi(currentDay,'VCG');
   assert.equal(today.length,1);assert.equal(today[0].bloqueado,true);assert.equal(today[0].data,currentDay);
   assert.equal(manager.getMaintenanceSyncStatus(day,'VCG').pending,0);
   assert.match(manager.getMaintenanceSyncStatus(currentDay,'VCG').notice,/descartadas/);
   assert.equal(calls.filter(c=>c.body).length,sent);
  });
 }finally{
  for(const name of ['window','navigator','CustomEvent'] as const){const descriptor=prior[name];if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}
  globalThis.Date=prior.Date;
 }
});
