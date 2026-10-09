import { SolturaItem } from '@/data/solturaData';
import { api } from './api';
export interface EscalaContext { garagem: 'VCG' | 'VCM'; escalaTipo: 'SEG_SEX' | 'SABADO' | 'DOM_FER'; turno: 'MATUTINO' | 'VESPERTINO' | 'PADRAO' }
export interface SharedEscala { contexto: EscalaContext; revisao: number; publicada: boolean; itens: SolturaItem[] }
export function scaleItems(items: SolturaItem[]) {
  // Somente programacao: nunca publicar despachos junto da escala.
  return items.map(i => ({ id: i.id, ordem: i.ordem, linha: i.linha, tabela: i.tabela,
    carroProgramado: i.carroProgramado, motoristaCodigo: i.motoristaCodigo, motoristaNome: i.motoristaNome,
    saidaGaragem: i.saidaGaragem, chegadaGaragem: i.chegadaGaragem, inicioLinha: i.inicioLinha,
    inicioBairro: i.inicioBairro, status: 'PENDENTE' as const, tipo: i.tipo, observacoes: i.observacoes }));
}
export const loadSharedEscala = (contexto: EscalaContext) => api.get<SharedEscala>('/escala-carros', { params: { ...contexto } });
export const saveSharedEscala = (contexto: EscalaContext, revisao: number, itens: SolturaItem[]) =>
  api.post<SharedEscala>('/escala-carros', { contexto, revisao, itens: scaleItems(itens) });
