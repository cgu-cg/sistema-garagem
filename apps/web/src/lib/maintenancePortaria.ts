// Espelhado na API; o backend revalida o perfil e limita os campos alterados.
export function canMarkMaintenanceUsage(user: { role: string; garagem?: string | null } | null | undefined, garage: string) {
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'soltura' && user.garagem === garage));
}
