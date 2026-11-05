// Espelhado na API; o backend revalida o perfil e limita os campos alterados.
export function canMarkMaintenanceUsage(user: { role: string; garagem?: string | null } | null | undefined, garage: string) {
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'soltura' && user.garagem === garage));
}

export function maintenanceUsageLabel(item: { saidasPortaria?: string[];
  viagensPortaria?: { saidaGaragem: string; linha: string; tabela: string }[] }) {
  const trips = item.viagensPortaria ?? [];
  const entries = trips.map(trip => ({ hora: trip.saidaGaragem,
    label: `${trip.saidaGaragem} L ${trip.linha} T ${trip.tabela || '—'}` }));
  for (const hora of item.saidasPortaria ?? []) {
    if (!trips.some(trip => trip.saidaGaragem === hora)) entries.push({ hora, label: hora });
  }
  const labels = [...new Set(entries.sort((a, b) => a.hora.localeCompare(b.hora) || a.label.localeCompare(b.label)).map(entry => entry.label))];
  return `Usado Portaria${labels.length ? ` - ${labels.join(' / ')}` : ''}`;
}
