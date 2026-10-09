// Politica operacional pura. Espelhada no frontend/API e verificada por testes de paridade.
export type AccessUser = { role: string; garagem?: string | null; groups?: { permissions: unknown }[] };
export function explicitGarage(user: AccessUser | null | undefined): 'VCG' | 'VCM' | undefined {
  return user?.garagem === 'VCG' || user?.garagem === 'VCM' ? user.garagem : undefined;
}
export function groupAllows(user: AccessUser, paths: string[]) {
  return (user.groups || []).some(g => {
    let values: unknown = g.permissions;
    try { if (typeof values === 'string') values = JSON.parse(values); } catch { return false; }
    return Array.isArray(values) && values.some(p => typeof p === 'string' && paths.includes(p.split('?')[0]));
  });
}
export function canDispatch(user: AccessUser | null | undefined) {
  return Boolean(user && (user.role === 'ADMIN' || (explicitGarage(user) &&
    (user.role === 'soltura' || groupAllows(user, ['/soltura', '/solturas'])))));
}
export function canReadScale(user: AccessUser | null | undefined) {
  return Boolean(user && (user.role === 'ADMIN' || (explicitGarage(user) &&
    (['soltura', 'COLABORADOR'].includes(user.role) ||
      groupAllows(user, ['/soltura', '/solturas', '/escala-carros'])))));
}
export function canReadOperation(user: AccessUser | null | undefined) {
  // Mantem a consulta autenticada existente, agora exigindo garagem cadastrada.
  return Boolean(user && (user.role === 'ADMIN' || explicitGarage(user)));
}
export function operationPageAccess(user: AccessUser | null | undefined, path: string): boolean | undefined {
  if (['/soltura-adm', '/alterar-folha', '/soltura/alterar-folha'].some(p => path === p || path.startsWith(p + '/')))
    return user?.role === 'ADMIN';
  if (['/manutencao', '/ci-manutencao', '/soltura/ci-manutencao'].some(p => path === p || path.startsWith(p + '/')))
    return canReadOperation(user);
  if (['/escala-carros', '/alterar-carro-programado', '/soltura/alterar-carro-programado', '/soltura/carro-realizado'].some(p => path === p || path.startsWith(p + '/')))
    return canReadScale(user);
  if (path === '/soltura' || path.startsWith('/soltura/')) return canDispatch(user);
  return undefined;
}

// Apenas impedimentos ja conhecidos pela tela; a API revalida fontes e concorrencia.
export function canOfferRelease(user: AccessUser | null | undefined, garage: string, c4: boolean, status?: string) {
  return canDispatch(user) && (user?.role === 'ADMIN' || explicitGarage(user) === garage) && garage === 'VCG' && c4 && status === 'FINALIZADA';
}

export function canReadReservations(user: AccessUser | null | undefined) {
  return Boolean(user && (user.role === 'ADMIN' || (explicitGarage(user) &&
    (['soltura', 'COLABORADOR'].includes(user.role) || groupAllows(user,
      ['/soltura', '/solturas', '/solturas/reservas-terminais'])))));
}
