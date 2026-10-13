import { addDays, type Garage } from './c4Temporal';

export type C4Updated = { garagem: Garage; dataOperacional: string; dataFolha: string };
type Listener = (event: C4Updated) => void | Promise<void>;
const listeners = new Set<Listener>();

export function subscribeC4Updates(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// Chamado somente apos o commit. Transporte nunca invalida uma gravacao confirmada.
export async function notifyC4Updated(garagem: Garage, day: string) {
  const event: C4Updated = { garagem, dataOperacional: day, dataFolha: addDays(day, 1) };
  await Promise.all([...listeners].map(async listener => {
    try { await listener(event); }
    catch { console.warn('[C4 realtime] Falha de notificacao; dados oficiais preservados.'); }
  }));
}
