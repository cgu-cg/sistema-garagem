import { MvpError } from './mvpTemporal';

type Flags = { prefixo: string; bloqueado: boolean; emExecucao: boolean; liberado: boolean };
// Nao reescreve coexistencias antigas durante edicoes de outros campos.
export function assertMaintenanceTransition(next: Flags[], previous: Flags[]) {
  for (const prefixo of new Set(next.map(i => i.prefixo))) {
    const aggregate = (items: Flags[]) => ['bloqueado', 'emExecucao', 'liberado'].map(flag =>
      items.some(i => i.prefixo === prefixo && i[flag as keyof Flags] === true));
    const after = aggregate(next), before = aggregate(previous);
    const changed = after.some((value, index) => value !== before[index]);
    if (changed && after.filter(Boolean).length > 1)
      throw new MvpError(409, 'Escolha somente um estado: Bloqueado, Em Manutencao ou Liberado.');
  }
}
