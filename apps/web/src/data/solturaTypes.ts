export interface SolturaItem {
  id: string;
  suspensa?: boolean;
  ordem?: number;
  ordemTerminal?: number;
  linha: string;
  variante?: string;
  tabela: string;
  carroProgramado: string;
  carroRealizado?: string;
  motoristaCodigo?: string;
  motoristaNome?: string;
  saidaGaragem: string;
  chegadaGaragem?: string;
  inicioLinha?: string;
  inicioBairro?: string;
  status: "PENDENTE" | "LIBERADO" | "SUBSTITUIDO" | "ATRASADO";
  tipo?: "REGULAR" | "VCM" | "FRETAMENTO" | "EXTRA";
  observacoes?: string;
  horaLiberacao?: string;
}

export interface BloqueioCarro {
  bloqueadoPortaria?: boolean;
  usadoPortaria?: boolean;
  chaveItem?: string;
  tipoPosicao?: 'FIXO' | 'EXTRA' | null;
  ordemPosicao?: number | null;
  reforcoSlotId?: string;
  updatedAt?: string;
  id?: string;
  prefixo: string;
  garagem?: "VCG" | "VCM" | "TODAS";
  tipo: "BLOQUEADO_CORRETIVA" | "EM_MANUTENCAO" | "REFORCO_REVISAO" | "BLOQUEADO_MOTOR" | "BLOQUEADO_MOLA" | "BLOQUEADO_CAMBIO" | "BLOQUEADO_FREIO" | "BLOQUEADO_MODULO" | "BLOQUEADO_AGETRAN" | "BLOQUEADO_AR" | "BLOQUEADO_SINISTRO";
  motivo: string | null;
  data: string;
  dataBloqueio?: string | null;
  hora?: string | null;
  gravidade?: "ALTA" | "MEDIA" | "BAIXA" | null;
  responsavel?: string | null;
  previsao?: string;
  os?: string | null;
  status?: "BLOQUEADO" | "EM_MANUTENCAO" | "AGUARDANDO_PECA" | "TESTE_PISTA" | "LIBERADO" | null;
  dataLiberacao?: string | null;
  motivoLiberacao?: string | null;
  responsavelLiberacao?: string | null;
  // Campos da Planilha CI - Solicitação de Veículos (CGU.REG.MT0005)
  categoriaPlanilha?: "PREVENTIVA" | "OFICINA" | "REFORCO" | "BLOQUEADO";
  setorOficina?: "MECANICA" | "ELEVADOR" | "ELETRICA" | "BORRACHARIA" | "FUNILARIA" | "TACOGRAFO" | "BILHETAGEM" | "LIMPEZA" | null;
  tipoPreventiva?: "PREVENTIVA" | "LUBRIFICACAO" | "TROCA_OLEO" | "REVISAO_GERAL" | "SISEP" | null;
  horarioReforco?: string | null;
  consorciada?: "VSF" | "VCG" | "JTU" | "VCM" | null;
}

export interface TerminalReserva {
  terminal: string;
  cor: "AZUL" | "VERMELHO" | "MICRO" | "ARTICULADO";
  carro1?: string;
  carro2?: string;
  motorista?: string;
  horario?: string;
}

/**
 * Converte horário string (ex: "03:50", "04:15") em minutos decorridos desde 00:00 para ordenação precisa.
 * Strings vazias ou inválidas são enviadas para o final (99999).
 */
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 99999;
  const clean = timeStr.trim();
  if (!clean || clean === "—" || clean === "-") return 99999;
  const parts = clean.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  const num = parseInt(clean.replace(/\D/g, ""), 10);
  return isNaN(num) ? 99999 : num;
}
