import type { BloqueioCarro } from '@/data/solturaData';

// Retira somente o registro salvo dessa posicao/data, preservando coexistencias.
export async function removeSavedReinforcement(
  baseline: BloqueioCarro[], saved: BloqueioCarro, commit: (next: BloqueioCarro[]) => Promise<boolean>,
): Promise<boolean> {
  if (saved.categoriaPlanilha !== 'REFORCO') throw new Error('Posicao de reforco invalida.');
  const next = baseline.filter(item => !(item.id === saved.id && item.data === saved.data
    && item.garagem === saved.garagem && item.categoriaPlanilha === 'REFORCO'));
  if (next.length === baseline.length) throw new Error('Posicao alterada. Recarregue a CI antes de retirar o carro.');
  return commit(next);
}
