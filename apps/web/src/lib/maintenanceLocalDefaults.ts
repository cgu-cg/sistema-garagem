import { INVENTORY_CARS } from '@/data/inventoryCars';
import type { InventoryVehicle } from './api';
import type { MaintenanceSnapshot } from './maintenanceOffline';

// Cadastro embarcado para selecao offline; consulta oficial pode atualizar a garagem.
// Convencao local ja usada pelo sistema: 1xxx/2002 VCM; demais VCG.
export const LOCAL_MAINTENANCE_FLEET: InventoryVehicle[] = INVENTORY_CARS.map(prefixo => {
  const vcm = prefixo.startsWith('1') || prefixo === '2002';
  return { prefixo, idCarro: prefixo, garagem: vcm ? 1 : 2, garagemNome: vcm ? 'VCM' : 'VCG' };
});

export async function localMaintenanceSnapshot(garagem: 'VCG' | 'VCM', data: string, previous?: MaintenanceSnapshot): Promise<MaintenanceSnapshot> {
  const source = previous?.garagem === garagem && previous.data < data && previous.origem === 'PERSISTIDA' ? previous : undefined;
  const items = source ? source.items.filter(item => item.bloqueado).map(item => ({ ...item,
    id: `manut-${data}-${item.prefixo}`, data, bloqueado: true, emExecucao: false, liberado: false })) : [];
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(source ? [source.data, source.revisao, items] : [])));
  const base = '0:' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return { garagem, data, revisao: 0, base, items, origem: source ? 'VIRADA' : 'VAZIA' };
}
