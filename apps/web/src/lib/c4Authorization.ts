export function canWriteC4(user: { role: string; garagem?: string | null } | null | undefined, scope: string) {
  return user?.role === 'ADMIN' || (user?.role === 'manutencao' && ['VCG', 'VCM'].includes(scope) && user.garagem === scope);
}
