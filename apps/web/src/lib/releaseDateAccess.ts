// Espelhado na API, que revalida a folha e o perfil dentro da transação.
export function canEditHistoricalRelease(role: string | undefined, date: string, today: string, status: string | undefined) {
  return role === 'ADMIN' && date < today && status === 'EM_ANDAMENTO';
}
