import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { maintenanceOperationId, maintenanceRevisionHash } from '../../web/src/lib/maintenanceCompatibility';
import { localMaintenanceSnapshot } from '../../web/src/lib/maintenanceLocalDefaults';

test('SHA-256 de revisao coincide com servidor em UTF-8 e limites dos blocos',()=>{
 const inputs=['','abc','[]','MECÂNICA / revisão 🚍','x'.repeat(55),'x'.repeat(56),'x'.repeat(63),'x'.repeat(64),'x'.repeat(65),'x'.repeat(127),'x'.repeat(128),'x'.repeat(65536)];
 for(const value of inputs) assert.equal(maintenanceRevisionHash(value),createHash('sha256').update(value).digest('hex'));
});
test('HTTP sem subtle nem randomUUID permite iniciar fotografia e gerar UUID v4',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try {
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:webcrypto.getRandomValues.bind(webcrypto)}});
  const snapshot=await localMaintenanceSnapshot('VCG','2026-10-30');
  assert.equal(snapshot.base,'0:'+createHash('sha256').update('[]').digest('hex'));
  const ids=Array.from({length:100},()=>maintenanceOperationId());
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ids)assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 }finally{if(original)Object.defineProperty(globalThis,'crypto',original);else Reflect.deleteProperty(globalThis,'crypto');}
});
test('ausencia de aleatoriedade nao gera identificador fraco ou repetido',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});assert.throws(()=>maintenanceOperationId(),/Navegador sem suporte/);}
 finally{if(original)Object.defineProperty(globalThis,'crypto',original);else Reflect.deleteProperty(globalThis,'crypto');}
});
