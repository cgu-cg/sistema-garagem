// A politica temporal D/D+1 e a fonte VCM ainda nao foram autorizadas.
// Nao ha caminho de gravacao enquanto a disponibilidade nao puder ser provada.
// Nao se usa um lock exclusivo da soltura para simular protecao dos escritores CI.
export const availabilityPending = {
  code: 'DISPONIBILIDADE_NAO_CONFIRMADA',
  error: 'Soltura impedida: fonte oficial de disponibilidade por data/garagem ainda pendente de validacao operacional. Nenhum registro foi gravado.',
} as const;

export function refuseUnconfirmedRelease(res: { status(code: number): { json(body: unknown): unknown } }) {
  return res.status(409).json(availabilityPending);
}
