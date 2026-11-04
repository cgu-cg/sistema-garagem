export function canEditHistoricalRelease(role: string | undefined, date: string, today: string, status: string | undefined) {
  return role === 'ADMIN' && date < today && status === 'EM_ANDAMENTO';
}
