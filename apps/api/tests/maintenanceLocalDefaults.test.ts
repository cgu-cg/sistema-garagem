import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { LOCAL_MAINTENANCE_FLEET, localMaintenanceSnapshot } from '../../web/src/lib/maintenanceLocalDefaults';
import { INVENTORY_CARS } from '../../web/src/data/inventoryCars';
import { maintenanceSnapshotSchema } from '../../web/src/lib/maintenanceOffline';
import { rolloverMaintenance, projectMaintenance } from '../src/services/maintenanceBoard';

test('cadastro embarcado contem a lista existente e nao preenche os quadros',async()=>{
 assert.deepEqual(LOCAL_MAINTENANCE_FLEET.map(car=>car.prefixo),INVENTORY_CARS);
 assert.ok(LOCAL_MAINTENANCE_FLEET.every(car=>car.garagem===(car.prefixo.startsWith('1')||car.prefixo==='2002'?1:2)));
 const empty=await localMaintenanceSnapshot('VCG','2026-10-31');
 assert.deepEqual(empty.items,[]);assert.equal(empty.base,'0:'+createHash('sha256').update('[]').digest('hex'));
});
test('virada offline e backend iniciam todos os quadros vazios com a mesma base',async()=>{
 const previous=maintenanceSnapshotSchema.parse({garagem:'VCG',data:'2026-10-30',revisao:3,base:'3',origem:'PERSISTIDA',items:[
  {id:'m1',prefixo:'4000',consorciada:'VCG',data:'2026-10-30',observacao:'MOTOR',bloqueado:true,emExecucao:false,liberado:false},
  {id:'m2',prefixo:'4001',consorciada:'VCG',data:'2026-10-30',observacao:'FREIO',bloqueado:false,emExecucao:true,liberado:false},
  {id:'m3',prefixo:'4002',consorciada:'VCG',data:'2026-10-30',observacao:null,bloqueado:false,emExecucao:false,liberado:true},
 ]});
 const next=await localMaintenanceSnapshot('VCG','2026-10-31',previous);
 const official=rolloverMaintenance(previous.items,'2026-10-31');
 assert.deepEqual(next.items,official);assert.deepEqual(next.items,[]);
 assert.equal(next.base,'0:'+createHash('sha256').update(JSON.stringify([previous.data,previous.revisao,official])).digest('hex'));
 const db:any={controleManutencaoFolha:{findUnique:async()=>null,findFirst:async()=>({id:999,dataOperacao:previous.data,revisao:previous.revisao,
  conteudo:JSON.stringify({version:1,items:previous.items,eventos:[]})})}};
 const server=await projectMaintenance(db,'VCG','2026-10-31',new Date('2026-10-31T15:00:00Z'));
 assert.equal(next.base,server.base);assert.deepEqual(next.items,server.items);
 assert.equal(previous.items.length,3);
 const other=await localMaintenanceSnapshot('VCM','2026-10-31',previous);assert.deepEqual(other.items,[]);
});
