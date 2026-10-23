import { MvpError } from './mvpTemporal';

// Aplicar em inclusoes/alteracoes, preservando itens antigos inalterados.
export function assertCompleteReinforcement(item: { categoriaPlanilha?: string; prefixo: string; motivo?: string | null;
  tipoPosicao?: string | null; horarioReforco?: string | null }) {
  const scheduled = item.tipoPosicao === 'FIXO' || (item.tipoPosicao == null && /^\d{1,2}:\d{2}/.test(item.horarioReforco?.trim() ?? ''));
  if (item.categoriaPlanilha === 'REFORCO' && scheduled && (!/^\d{1,10}$/.test(item.prefixo) || !item.motivo?.trim()))
    throw new MvpError(400, 'Reforco exige prefixo e motivo preenchidos.');
}
