import type { BloqueioCarro } from '../data/solturaTypes';

// Somente o proprio item fornece informacao conhecida; nunca consultar prefixo/frota.
export function c4KnownFields(item?: BloqueioCarro) {
  return {
    consorciada: item?.consorciada ?? null,
    hora: item?.hora ?? null,
    gravidade: item?.gravidade ?? null,
    responsavel: item?.responsavel ?? null,
    status: item?.status ?? null,
  };
}

// String vazia do input e apresentacao. Sem edicao, preservar o valor original.
export function c4EditedText(input: string, original?: string | null) {
  return input === (original ?? '') ? original ?? null : input.trim() || null;
}
