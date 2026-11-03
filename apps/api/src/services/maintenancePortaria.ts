import { MvpError } from './mvpTemporal';

export function canMarkMaintenanceUsage(user: { role: string; garagem?: string | null } | null | undefined, garage: string) {
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'soltura' && user.garagem === garage));
}

// O comando da Portaria pode somente acrescentar a marca a um carro em manutenção.
export function assertMaintenanceUsageChange<T extends { id: string; usadoPortaria?: boolean; emExecucao: boolean; bloqueado: boolean; liberado: boolean }>(before: T[], after: T[]) {
  const normalize = (items: T[]) => items.map(({ usadoPortaria: _usage, ...item }) => item);
  if (JSON.stringify(normalize(before)) !== JSON.stringify(normalize(after)))
    throw new MvpError(403, 'Usado Portaria não permite editar defeitos, estados ou outros dados do Controle.');
  const changed = after.filter((item, index) => Boolean(item.usadoPortaria) !== Boolean(before[index].usadoPortaria));
  if (changed.length !== 1 || !changed[0].usadoPortaria || !changed[0].emExecucao || changed[0].bloqueado || changed[0].liberado)
    throw new MvpError(409, 'Marque somente um carro em manutenção ainda não marcado como Usado Portaria.');
}
