export interface SolturaItem {
  id: string;
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
  updatedAt?: string;
  id?: string;
  prefixo: string;
  garagem?: "VCG" | "VCM" | "TODAS";
  tipo: "BLOQUEADO_CORRETIVA" | "EM_MANUTENCAO" | "REFORCO_REVISAO" | "BLOQUEADO_MOTOR" | "BLOQUEADO_MOLA" | "BLOQUEADO_CAMBIO" | "BLOQUEADO_FREIO" | "BLOQUEADO_MODULO" | "BLOQUEADO_AGETRAN" | "BLOQUEADO_AR" | "BLOQUEADO_SINISTRO";
  motivo: string;
  data: string;
  dataBloqueio?: string;
  hora?: string;
  gravidade?: "ALTA" | "MEDIA" | "BAIXA";
  responsavel?: string;
  previsao?: string;
  os?: string;
  status?: "BLOQUEADO" | "EM_MANUTENCAO" | "AGUARDANDO_PECA" | "TESTE_PISTA" | "LIBERADO";
  dataLiberacao?: string;
  motivoLiberacao?: string;
  responsavelLiberacao?: string;
  // Campos da Planilha CI - Solicitação de Veículos (CGU.REG.MT0005)
  categoriaPlanilha?: "PREVENTIVA" | "OFICINA" | "REFORCO" | "BLOQUEADO";
  setorOficina?: "MECANICA" | "ELEVADOR" | "ELETRICA" | "BORRACHARIA" | "FUNILARIA" | "TACOGRAFO" | "BILHETAGEM" | "LIMPEZA";
  tipoPreventiva?: "PREVENTIVA" | "LUBRIFICACAO" | "TROCA_OLEO" | "REVISAO_GERAL" | "SISEP";
  horarioReforco?: string;
  consorciada?: "VSF" | "VCG" | "JTU" | "VCM";
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


// ----------------------------------------------------
// VCG - VIAÇÃO CAMPO GRANDE (SEGUNDA A SEXTA)
// ----------------------------------------------------
// ----------------------------------------------------
// VCG - VIAÇÃO CAMPO GRANDE (SEGUNDA A SEXTA)
// ----------------------------------------------------
// Folha Matutino (Oficial PDF 2026 - 200 horários)
import { escalaOficialPdfVCG } from "./escalaOficialPdf";

export {
  escalaOficialPdfVCG,
  reservasGaragemVCG_Azul,
  reservasGaragemVCG_Vermelho,
  reservasGaragemVCG_Micro,
  bloqueadosCIPadraoPDF,
  rabichoPadraoPDF,
  terminaisReservaPDF,
  carrosExtrasPDF,
  type RabichoItem,
  type TerminalReservaPDF
} from "./escalaOficialPdf";

export const vcgSegundaSextaMatutino: SolturaItem[] = escalaOficialPdfVCG;

// Garantir que inicioBairro e inicioLinha contenham os horários da coluna Bairro / Chegada da planilha da soltura
vcgSegundaSextaMatutino.forEach(item => {
  if (item.chegadaGaragem) {
    item.inicioBairro = item.chegadaGaragem;
    item.inicioLinha = item.chegadaGaragem;
  }
});

// Folha Vespertino (10:30 até 17:40 - Completo 81 veículos conforme documento JTU.REG.OP.0001)
export const vcgSegundaSextaVespertino: SolturaItem[] = [
  // --- SOLTURA VESPERTINA V.C.G. (48 horários) ---
  { id: "vcg-vesp-001", ordem: 1, ordemTerminal: 1, linha: "326", tabela: "1", carroProgramado: "", saidaGaragem: "10:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-002", ordem: 2, ordemTerminal: 2, linha: "401", tabela: "3", carroProgramado: "", saidaGaragem: "13:40", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-003", ordem: 3, ordemTerminal: 3, linha: "354", tabela: "3", carroProgramado: "", saidaGaragem: "14:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-004", ordem: 4, ordemTerminal: 4, linha: "412", tabela: "2", carroProgramado: "", saidaGaragem: "14:38", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-005", ordem: 5, ordemTerminal: 5, linha: "317", tabela: "1", carroProgramado: "", saidaGaragem: "14:40", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-006", ordem: 6, ordemTerminal: 6, linha: "303", tabela: "2", carroProgramado: "", saidaGaragem: "14:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-007", ordem: 7, ordemTerminal: 7, linha: "225", tabela: "2", carroProgramado: "", saidaGaragem: "15:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-008", ordem: 8, ordemTerminal: 8, linha: "227", tabela: "1", carroProgramado: "", saidaGaragem: "15:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-009", ordem: 9, ordemTerminal: 9, linha: "076", tabela: "2", carroProgramado: "", saidaGaragem: "15:05", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-010", ordem: 10, ordemTerminal: 10, linha: "321", tabela: "3", carroProgramado: "", saidaGaragem: "15:06", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-011", ordem: 11, ordemTerminal: 11, linha: "412", tabela: "3", carroProgramado: "", saidaGaragem: "15:07", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-012", ordem: 12, ordemTerminal: 12, linha: "317", tabela: "2", carroProgramado: "", saidaGaragem: "15:10", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-013", ordem: 13, ordemTerminal: 13, linha: "414", tabela: "3", carroProgramado: "", saidaGaragem: "15:10", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-014", ordem: 14, ordemTerminal: 14, linha: "051", tabela: "3", carroProgramado: "", saidaGaragem: "15:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-015", ordem: 15, ordemTerminal: 15, linha: "321", tabela: "6", carroProgramado: "", saidaGaragem: "15:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-016", ordem: 16, ordemTerminal: 16, linha: "212", tabela: "1", carroProgramado: "", saidaGaragem: "15:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-017", ordem: 17, ordemTerminal: 17, linha: "408", tabela: "2", carroProgramado: "", saidaGaragem: "15:31", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-018", ordem: 18, ordemTerminal: 18, linha: "412", tabela: "4", carroProgramado: "", saidaGaragem: "15:31", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-019", ordem: 19, ordemTerminal: 19, linha: "215", tabela: "2", carroProgramado: "", saidaGaragem: "15:50", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-020", ordem: 20, ordemTerminal: 20, linha: "215", tabela: "3", carroProgramado: "", saidaGaragem: "15:50", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-021", ordem: 21, ordemTerminal: 21, linha: "073", tabela: "03", carroProgramado: "", saidaGaragem: "15:50", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-022", ordem: 22, ordemTerminal: 22, linha: "081", tabela: "5", carroProgramado: "", saidaGaragem: "15:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-023", ordem: 23, ordemTerminal: 23, linha: "414", tabela: "4", carroProgramado: "", saidaGaragem: "15:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-024", ordem: 24, ordemTerminal: 24, linha: "403", tabela: "1", carroProgramado: "", saidaGaragem: "15:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-025", ordem: 25, ordemTerminal: 25, linha: "212", tabela: "2", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-026", ordem: 26, ordemTerminal: 26, linha: "216", tabela: "1", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-027", ordem: 27, ordemTerminal: 27, linha: "423/071", tabela: "88/5", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-028", ordem: 28, ordemTerminal: 28, linha: "414", tabela: "5", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-029", ordem: 29, ordemTerminal: 29, linha: "325", tabela: "1", carroProgramado: "", saidaGaragem: "16:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-030", ordem: 30, ordemTerminal: 30, linha: "307", tabela: "2", carroProgramado: "", saidaGaragem: "16:20", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-031", ordem: 31, ordemTerminal: 31, linha: "321", tabela: "8", carroProgramado: "", saidaGaragem: "16:26", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-032", ordem: 32, ordemTerminal: 32, linha: "086", tabela: "5", carroProgramado: "", saidaGaragem: "16:29", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-033", ordem: 33, ordemTerminal: 33, linha: "431", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-034", ordem: 34, ordemTerminal: 34, linha: "410/074/427", tabela: "1/88", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-035", ordem: 35, ordemTerminal: 35, linha: "418", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-036", ordem: 36, ordemTerminal: 36, linha: "322", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-037", ordem: 37, ordemTerminal: 37, linha: "419/421", tabela: "1/4", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-038", ordem: 38, ordemTerminal: 38, linha: "422/085", tabela: "1/88", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-039", ordem: 39, ordemTerminal: 39, linha: "220", tabela: "1", carroProgramado: "", saidaGaragem: "16:35", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-040", ordem: 40, ordemTerminal: 40, linha: "326", tabela: "1", carroProgramado: "", saidaGaragem: "16:35", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-041", ordem: 41, ordemTerminal: 41, linha: "215", tabela: "4", carroProgramado: "", saidaGaragem: "16:38", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-042", ordem: 42, ordemTerminal: 42, linha: "403", tabela: "2", carroProgramado: "", saidaGaragem: "16:40", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-043", ordem: 43, ordemTerminal: 43, linha: "423/406", tabela: "88/88", carroProgramado: "", saidaGaragem: "17:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-044", ordem: 44, ordemTerminal: 44, linha: "060/61", tabela: "1/1", carroProgramado: "", saidaGaragem: "17:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-045", ordem: 45, ordemTerminal: 45, linha: "407", tabela: "2", carroProgramado: "", saidaGaragem: "17:05", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-046", ordem: 46, ordemTerminal: 46, linha: "421", tabela: "03", carroProgramado: "", saidaGaragem: "17:10", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-047", ordem: 47, ordemTerminal: 47, linha: "212", tabela: "5", carroProgramado: "", saidaGaragem: "17:22", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-048", ordem: 48, ordemTerminal: 48, linha: "212", tabela: "4", carroProgramado: "", saidaGaragem: "", observacoes: "V.C.G.", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. NOVA BAHIA (13 horários) ---
  { id: "vcg-vesp-049", ordem: 49, ordemTerminal: 1, linha: "205", tabela: "3", carroProgramado: "", saidaGaragem: "14:10", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-050", ordem: 50, ordemTerminal: 2, linha: "206", tabela: "2", carroProgramado: "", saidaGaragem: "15:00", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-051", ordem: 51, ordemTerminal: 3, linha: "223", tabela: "1", carroProgramado: "", saidaGaragem: "15:00", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-052", ordem: 52, ordemTerminal: 4, linha: "210", tabela: "4", carroProgramado: "", saidaGaragem: "15:10", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-053", ordem: 53, ordemTerminal: 5, linha: "526", tabela: "1", carroProgramado: "", saidaGaragem: "15:23", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-054", ordem: 54, ordemTerminal: 6, linha: "215", tabela: "1", carroProgramado: "", saidaGaragem: "15:30", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-055", ordem: 55, ordemTerminal: 7, linha: "201", tabela: "1", carroProgramado: "", saidaGaragem: "15:50", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-056", ordem: 56, ordemTerminal: 8, linha: "81", tabela: "4", carroProgramado: "", saidaGaragem: "16:03", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-057", ordem: 57, ordemTerminal: 9, linha: "234/234", tabela: "1/88", carroProgramado: "", saidaGaragem: "16:16", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-058", ordem: 58, ordemTerminal: 10, linha: "237", tabela: "2", carroProgramado: "", saidaGaragem: "16:30", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-059", ordem: 59, ordemTerminal: 11, linha: "215", tabela: "5", carroProgramado: "", saidaGaragem: "16:45", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-060", ordem: 60, ordemTerminal: 12, linha: "213", tabela: "2", carroProgramado: "", saidaGaragem: "17:03", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-061", ordem: 61, ordemTerminal: 13, linha: "230", tabela: "1", carroProgramado: "", saidaGaragem: "17:40", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. GEN. OSÓRIO (9 horários) ---
  { id: "vcg-vesp-062", ordem: 62, ordemTerminal: 1, linha: "601", tabela: "2", carroProgramado: "", saidaGaragem: "15:25", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-063", ordem: 63, ordemTerminal: 2, linha: "214", tabela: "2", carroProgramado: "", saidaGaragem: "15:35", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-064", ordem: 64, ordemTerminal: 3, linha: "473", tabela: "2", carroProgramado: "", saidaGaragem: "15:45", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-065", ordem: 65, ordemTerminal: 4, linha: "229", tabela: "2", carroProgramado: "", saidaGaragem: "15:50", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-066", ordem: 66, ordemTerminal: 5, linha: "246", tabela: "2", carroProgramado: "", saidaGaragem: "16:00", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-067", ordem: 67, ordemTerminal: 6, linha: "203", tabela: "2", carroProgramado: "", saidaGaragem: "16:23", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-068", ordem: 68, ordemTerminal: 7, linha: "212", tabela: "3", carroProgramado: "", saidaGaragem: "16:30", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-069", ordem: 69, ordemTerminal: 8, linha: "424", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-070", ordem: 70, ordemTerminal: 9, linha: "217", tabela: "2", carroProgramado: "", saidaGaragem: "16:55", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. JÚLIO CASTILHO (7 horários) ---
  { id: "vcg-vesp-071", ordem: 71, ordemTerminal: 1, linha: "413", tabela: "4", carroProgramado: "", saidaGaragem: "16:00", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-072", ordem: 72, ordemTerminal: 2, linha: "412", tabela: "5", carroProgramado: "", saidaGaragem: "16:00", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-073", ordem: 73, ordemTerminal: 3, linha: "86", tabela: "3", carroProgramado: "", saidaGaragem: "16:03", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-074", ordem: 74, ordemTerminal: 4, linha: "473", tabela: "6", carroProgramado: "", saidaGaragem: "16:17", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-075", ordem: 75, ordemTerminal: 5, linha: "423/086", tabela: "88/6", carroProgramado: "", saidaGaragem: "16:20", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-076", ordem: 76, ordemTerminal: 6, linha: "471", tabela: "2", carroProgramado: "", saidaGaragem: "16:24", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-077", ordem: 77, ordemTerminal: 7, linha: "430", tabela: "1", carroProgramado: "", saidaGaragem: "17:07", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. BANDEIRANTES (4 horários) ---
  { id: "vcg-vesp-078", ordem: 78, ordemTerminal: 1, linha: "317", tabela: "3", carroProgramado: "", saidaGaragem: "15:37", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
  { id: "vcg-vesp-079", ordem: 79, ordemTerminal: 2, linha: "304", tabela: "2", carroProgramado: "", saidaGaragem: "16:27", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
  { id: "vcg-vesp-080", ordem: 80, ordemTerminal: 3, linha: "309", tabela: "1", carroProgramado: "", saidaGaragem: "16:40", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
  { id: "vcg-vesp-081", ordem: 81, ordemTerminal: 4, linha: "309", tabela: "2", carroProgramado: "", saidaGaragem: "17:35", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
];

export const vcgSegundaSexta: SolturaItem[] = vcgSegundaSextaMatutino;

// ----------------------------------------------------
// VCG - SÁBADO
// ----------------------------------------------------
export const vcgSabado: SolturaItem[] = [
  { id: "vcg-sab-01", ordem: 1, linha: "302", tabela: "1", carroProgramado: "3959", saidaGaragem: "03:50", inicioBairro: "04:20", status: "PENDENTE" },
  { id: "vcg-sab-02", ordem: 2, linha: "210", tabela: "2", carroProgramado: "3065", saidaGaragem: "04:00", inicioBairro: "07:39", status: "PENDENTE" },
  { id: "vcg-sab-03", ordem: 3, linha: "308", tabela: "1", carroProgramado: "3206", saidaGaragem: "04:00", inicioBairro: "04:30", status: "PENDENTE" },
  { id: "vcg-sab-04", ordem: 4, linha: "209", tabela: "1", carroProgramado: "2715", saidaGaragem: "04:03", inicioBairro: "04:35", status: "PENDENTE" },
  { id: "vcg-sab-05", ordem: 5, linha: "214", tabela: "1", carroProgramado: "4233", saidaGaragem: "04:05", inicioBairro: "04:40", status: "PENDENTE" },
  { id: "vcg-sab-06", ordem: 6, linha: "235", tabela: "1", carroProgramado: "3903", saidaGaragem: "04:05", inicioBairro: "04:35", status: "PENDENTE" },
  { id: "vcg-sab-07", ordem: 7, linha: "237", tabela: "1", carroProgramado: "3222", saidaGaragem: "04:05", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-08", ordem: 8, linha: "211/216", tabela: "1", carroProgramado: "4277", saidaGaragem: "04:05", inicioBairro: "04:40", status: "PENDENTE" },
  { id: "vcg-sab-09", ordem: 9, linha: "204", tabela: "1", carroProgramado: "4266", saidaGaragem: "04:10", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-10", ordem: 10, linha: "217", tabela: "1", carroProgramado: "4260", saidaGaragem: "04:10", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-11", ordem: 11, linha: "304", tabela: "1", carroProgramado: "3214", saidaGaragem: "04:10", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-12", ordem: 12, linha: "307", tabela: "1", carroProgramado: "3271", saidaGaragem: "04:10", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-13", ordem: 13, linha: "315", tabela: "1", carroProgramado: "3220", saidaGaragem: "04:10", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-14", ordem: 14, linha: "413", tabela: "2", carroProgramado: "4217", saidaGaragem: "04:10", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-15", ordem: 15, linha: "474", tabela: "1", carroProgramado: "2712", saidaGaragem: "04:10", inicioBairro: "04:40", status: "PENDENTE" },
  { id: "vcg-sab-16", ordem: 16, linha: "203", tabela: "1", carroProgramado: "3902", saidaGaragem: "04:15", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcg-sab-17", ordem: 17, linha: "205", tabela: "1", carroProgramado: "3281", saidaGaragem: "04:15", inicioBairro: "04:55", status: "PENDENTE" },
  { id: "vcg-sab-18", ordem: 18, linha: "210", tabela: "1", carroProgramado: "2611", saidaGaragem: "04:15", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcg-sab-19", ordem: 19, linha: "213", tabela: "1", carroProgramado: "4258", saidaGaragem: "04:15", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcg-sab-20", ordem: 20, linha: "229", tabela: "1", carroProgramado: "4262", saidaGaragem: "04:15", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcg-sab-21", ordem: 21, linha: "305", tabela: "2", carroProgramado: "3950", saidaGaragem: "04:35", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcg-sab-22", ordem: 22, linha: "406", tabela: "1", carroProgramado: "4264", saidaGaragem: "04:35", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcg-sab-23", ordem: 23, linha: "071", tabela: "1", carroProgramado: "4192", saidaGaragem: "04:38", inicioBairro: "08:28", status: "PENDENTE" },
  { id: "vcg-sab-24", ordem: 24, linha: "302", tabela: "3", carroProgramado: "3035", saidaGaragem: "04:38", inicioBairro: "08:43", status: "PENDENTE" },
  { id: "vcg-sab-25", ordem: 25, linha: "403", tabela: "1", carroProgramado: "4220R", saidaGaragem: "04:40", inicioBairro: "07:45", status: "PENDENTE" },
  { id: "vcg-sab-26", ordem: 26, linha: "073", tabela: "4", carroProgramado: "4214", saidaGaragem: "04:40", inicioBairro: "07:58", status: "PENDENTE" },
  { id: "vcg-sab-27", ordem: 27, linha: "080", tabela: "2", carroProgramado: "4253", saidaGaragem: "04:40", inicioBairro: "05:05", status: "PENDENTE" },
  { id: "vcg-sab-28", ordem: 28, linha: "080", tabela: "5", carroProgramado: "4236", saidaGaragem: "04:40", inicioBairro: "05:05", status: "PENDENTE" },
  { id: "vcg-sab-29", ordem: 29, linha: "407", tabela: "2", carroProgramado: "4181", saidaGaragem: "05:27", inicioBairro: "07:27", status: "PENDENTE" },
  { id: "vcg-sab-30", ordem: 30, linha: "224", tabela: "1", carroProgramado: "2613", saidaGaragem: "05:30", inicioBairro: "08:54", status: "PENDENTE" },
  { id: "vcg-sab-31", ordem: 31, linha: "403", tabela: "2", carroProgramado: "2711R", saidaGaragem: "05:30", inicioBairro: "08:30", status: "PENDENTE" },
  { id: "vcg-sab-32", ordem: 32, linha: "086", tabela: "3", carroProgramado: "4250", saidaGaragem: "05:40", inicioBairro: "08:41", status: "PENDENTE" },
  { id: "vcg-sab-33", ordem: 33, linha: "216", tabela: "1", carroProgramado: "4182", saidaGaragem: "05:40", inicioBairro: "07:20", status: "PENDENTE" },
  { id: "vcg-sab-34", ordem: 34, linha: "086", tabela: "4", carroProgramado: "4273", saidaGaragem: "06:00", inicioBairro: "06:30", status: "PENDENTE" },
  { id: "vcg-sab-35", ordem: 35, linha: "242", tabela: "1", carroProgramado: "4229", saidaGaragem: "06:00", inicioBairro: "06:30", status: "PENDENTE" },
  { id: "vcg-sab-36", ordem: 36, linha: "413", tabela: "88", carroProgramado: "4184", saidaGaragem: "06:10", inicioBairro: "08:16", status: "PENDENTE" },
];

// ----------------------------------------------------
// VCG - DOMINGO & FERIADOS
// ----------------------------------------------------
export const vcgDomingoFeriado: SolturaItem[] = [
  { id: "vcg-dom-01", ordem: 1, linha: "302", variante: "", tabela: "1", carroProgramado: "3950", saidaGaragem: "04:00", status: "PENDENTE" },
  { id: "vcg-dom-02", ordem: 2, linha: "302", variante: "", tabela: "2", carroProgramado: "3958", saidaGaragem: "04:00", status: "PENDENTE" },
  { id: "vcg-dom-03", ordem: 3, linha: "053", variante: "", tabela: "1", carroProgramado: "4264", saidaGaragem: "04:05", status: "PENDENTE" },
  { id: "vcg-dom-04", ordem: 4, linha: "413", variante: "", tabela: "2", carroProgramado: "4195", saidaGaragem: "04:10", status: "PENDENTE" },
  { id: "vcg-dom-05", ordem: 5, linha: "204", variante: "", tabela: "2", carroProgramado: "4266", saidaGaragem: "04:10", status: "PENDENTE" },
  { id: "vcg-dom-06", ordem: 6, linha: "209", variante: "", tabela: "1", carroProgramado: "3263", saidaGaragem: "04:10", status: "PENDENTE" },
  { id: "vcg-dom-07", ordem: 7, linha: "211", variante: "", tabela: "1", carroProgramado: "3267", saidaGaragem: "04:15", status: "PENDENTE" },
  { id: "vcg-dom-08", ordem: 8, linha: "237", variante: "", tabela: "1", carroProgramado: "3222", saidaGaragem: "04:15", status: "PENDENTE" },
  { id: "vcg-dom-09", ordem: 9, linha: "235", variante: "", tabela: "1", carroProgramado: "4258", saidaGaragem: "04:15", status: "PENDENTE" },
  { id: "vcg-dom-10", ordem: 10, linha: "414", variante: "", tabela: "1", carroProgramado: "4268", saidaGaragem: "04:15", status: "PENDENTE" },
  { id: "vcg-dom-11", ordem: 11, linha: "308", variante: "", tabela: "2", carroProgramado: "3035", saidaGaragem: "04:17", status: "PENDENTE" },
  { id: "vcg-dom-12", ordem: 12, linha: "411", variante: "", tabela: "1", carroProgramado: "4223", saidaGaragem: "04:17", status: "PENDENTE" },
  { id: "vcg-dom-13", ordem: 13, linha: "214", variante: "", tabela: "1", carroProgramado: "2715", saidaGaragem: "04:20", status: "PENDENTE" },
  { id: "vcg-dom-14", ordem: 14, linha: "401", variante: "", tabela: "1", carroProgramado: "2355", saidaGaragem: "04:23", status: "PENDENTE" },
  { id: "vcg-dom-15", ordem: 15, linha: "208", variante: "", tabela: "1", carroProgramado: "3283", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcg-dom-16", ordem: 16, linha: "224", variante: "", tabela: "2", carroProgramado: "2352", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcg-dom-17", ordem: 17, linha: "474", variante: "", tabela: "1", carroProgramado: "3902", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcg-dom-18", ordem: 18, linha: "054", variante: "", tabela: "1", carroProgramado: "3257", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcg-dom-19", ordem: 19, linha: "217", variante: "", tabela: "1", carroProgramado: "4260", saidaGaragem: "04:28", status: "PENDENTE" },
  { id: "vcg-dom-20", ordem: 20, linha: "408", variante: "", tabela: "3", carroProgramado: "4256", saidaGaragem: "04:28", status: "PENDENTE" },
  { id: "vcg-dom-21", ordem: 21, linha: "053", variante: "", tabela: "2", carroProgramado: "4269", saidaGaragem: "04:28", status: "PENDENTE" },
  { id: "vcg-dom-22", ordem: 22, linha: "223", variante: "", tabela: "1", carroProgramado: "4267", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcg-dom-23", ordem: 23, linha: "246", variante: "", tabela: "1", carroProgramado: "3057", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcg-dom-24", ordem: 24, linha: "406", variante: "", tabela: "1", carroProgramado: "3900", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcg-dom-25", ordem: 25, linha: "307", variante: "", tabela: "1", carroProgramado: "3255", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcg-dom-26", ordem: 26, linha: "213", variante: "", tabela: "1", carroProgramado: "4257", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcg-dom-27", ordem: 27, linha: "306", variante: "", tabela: "1", carroProgramado: "2351", saidaGaragem: "04:35", status: "PENDENTE" },
  { id: "vcg-dom-28", ordem: 28, linha: "304", variante: "", tabela: "1", carroProgramado: "3250", saidaGaragem: "04:35", status: "PENDENTE" },
  { id: "vcg-dom-29", ordem: 29, linha: "305", variante: "", tabela: "1", carroProgramado: "3228", saidaGaragem: "04:45", status: "PENDENTE" },
  { id: "vcg-dom-30", ordem: 30, linha: "085", variante: "", tabela: "2", carroProgramado: "4252", saidaGaragem: "04:45", status: "PENDENTE" },
  { id: "vcg-dom-31", ordem: 31, linha: "086", variante: "", tabela: "1", carroProgramado: "3254", saidaGaragem: "04:45", status: "PENDENTE" },
  { id: "vcg-dom-32", ordem: 32, linha: "072", variante: "", tabela: "1", carroProgramado: "3269", saidaGaragem: "04:45", status: "PENDENTE" },
  { id: "vcg-dom-33", ordem: 33, linha: "073", variante: "", tabela: "2", carroProgramado: "4271", saidaGaragem: "04:45", status: "PENDENTE" },
];

// ----------------------------------------------------
// VCM - VIAÇÃO CIDADE MORENA (SEGUNDA A SEXTA)
// ----------------------------------------------------
export const vcmSegundaSexta: SolturaItem[] = [
  // Coluna 1
  { id: "vcm-ss-01", ordem: 1, linha: "053", tabela: "1", carroProgramado: "1381", saidaGaragem: "04:30", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-02", ordem: 2, linha: "053", tabela: "2", carroProgramado: "1354", saidaGaragem: "05:07", inicioBairro: "05:37", status: "PENDENTE" },
  { id: "vcm-ss-03", ordem: 3, linha: "053", tabela: "3", carroProgramado: "1383", saidaGaragem: "04:30", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-04", ordem: 4, linha: "58/521", tabela: "1/4", carroProgramado: "3071", saidaGaragem: "05:30", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcm-ss-05", ordem: 5, linha: "58/56", tabela: "2/2", carroProgramado: "1382", saidaGaragem: "04:20", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-06", ordem: 6, linha: "059", tabela: "1", carroProgramado: "1355", saidaGaragem: "06:20", inicioBairro: "06:45", status: "PENDENTE" },
  { id: "vcm-ss-07", ordem: 7, linha: "061", tabela: "1", carroProgramado: "1338", saidaGaragem: "04:35", inicioBairro: "04:55", status: "PENDENTE" },
  { id: "vcm-ss-08", ordem: 8, linha: "061", tabela: "2", carroProgramado: "1127", saidaGaragem: "04:40", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-09", ordem: 9, linha: "061", tabela: "3", carroProgramado: "1310", saidaGaragem: "04:59", inicioBairro: "05:19", status: "PENDENTE" },
  { id: "vcm-ss-10", ordem: 10, linha: "061", tabela: "4", carroProgramado: "1318", saidaGaragem: "05:20", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcm-ss-11", ordem: 11, linha: "061", tabela: "5", carroProgramado: "1234", saidaGaragem: "05:30", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcm-ss-12", ordem: 12, linha: "061", tabela: "6", carroProgramado: "1270", saidaGaragem: "05:35", inicioBairro: "06:00", status: "PENDENTE" },
  { id: "vcm-ss-13", ordem: 13, linha: "061", tabela: "7", carroProgramado: "1332", saidaGaragem: "05:35", inicioBairro: "06:00", status: "PENDENTE" },
  { id: "vcm-ss-14", ordem: 14, linha: "061", tabela: "8", carroProgramado: "1309", saidaGaragem: "05:41", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcm-ss-15", ordem: 15, linha: "061", tabela: "9", carroProgramado: "1316", saidaGaragem: "05:50", inicioBairro: "06:10", status: "PENDENTE" },
  { id: "vcm-ss-16", ordem: 16, linha: "061", tabela: "11", carroProgramado: "1315", saidaGaragem: "06:04", inicioBairro: "06:24", status: "PENDENTE" },
  { id: "vcm-ss-17", ordem: 17, linha: "061", tabela: "12", carroProgramado: "1314", saidaGaragem: "05:45", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcm-ss-18", ordem: 18, linha: "062", tabela: "1", carroProgramado: "1275", saidaGaragem: "05:22", inicioBairro: "05:42", status: "PENDENTE" },
  { id: "vcm-ss-19", ordem: 19, linha: "062", tabela: "2", carroProgramado: "2720", saidaGaragem: "05:35", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcm-ss-20", ordem: 20, linha: "062", tabela: "4", carroProgramado: "1384", saidaGaragem: "05:23", inicioBairro: "05:43", status: "PENDENTE" },
  { id: "vcm-ss-21", ordem: 21, linha: "063", tabela: "1", carroProgramado: "1207", saidaGaragem: "04:20", inicioBairro: "05:15", status: "PENDENTE" },
  { id: "vcm-ss-22", ordem: 22, linha: "063", tabela: "2", carroProgramado: "1342", saidaGaragem: "04:40", inicioBairro: "05:15", status: "PENDENTE" },
  { id: "vcm-ss-23", ordem: 23, linha: "063", tabela: "3", carroProgramado: "3016", saidaGaragem: "04:50", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-24", ordem: 24, linha: "064", tabela: "1", carroProgramado: "1379", saidaGaragem: "04:40", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-25", ordem: 25, linha: "064", tabela: "2", carroProgramado: "1380", saidaGaragem: "05:32", inicioBairro: "05:53", status: "PENDENTE" },
  { id: "vcm-ss-26", ordem: 26, linha: "070", tabela: "2", carroProgramado: "3851", saidaGaragem: "04:35", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-27", ordem: 27, linha: "070", tabela: "3", carroProgramado: "3213", saidaGaragem: "05:20", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcm-ss-28", ordem: 28, linha: "070", tabela: "4", carroProgramado: "3855", saidaGaragem: "06:10", inicioBairro: "06:40", status: "PENDENTE" },
  { id: "vcm-ss-29", ordem: 29, linha: "070", tabela: "5", carroProgramado: "3201", saidaGaragem: "04:15", inicioBairro: "05:05", status: "PENDENTE" },
  { id: "vcm-ss-30", ordem: 30, linha: "070", tabela: "7", carroProgramado: "3146", saidaGaragem: "04:45", inicioBairro: "05:30", status: "PENDENTE" },

  // Coluna 2 (Página 2)
  { id: "vcm-ss-31", ordem: 31, linha: "115", tabela: "1", carroProgramado: "2629", saidaGaragem: "04:35", inicioBairro: "05:12", status: "PENDENTE" },
  { id: "vcm-ss-32", ordem: 32, linha: "115", tabela: "2", carroProgramado: "1352", saidaGaragem: "04:50", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-33", ordem: 33, linha: "116", tabela: "1", carroProgramado: "1227", saidaGaragem: "04:40", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-34", ordem: 34, linha: "116", tabela: "2", carroProgramado: "1126", saidaGaragem: "05:07", inicioBairro: "05:27", status: "PENDENTE" },
  { id: "vcm-ss-35", ordem: 35, linha: "117", tabela: "1", carroProgramado: "1302", saidaGaragem: "04:40", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-36", ordem: 36, linha: "119", tabela: "1", carroProgramado: "1337", saidaGaragem: "05:00", inicioBairro: "05:20", status: "PENDENTE" },
  { id: "vcm-ss-37", ordem: 37, linha: "120", tabela: "1", carroProgramado: "1375", saidaGaragem: "04:35", inicioBairro: "05:12", status: "PENDENTE" },
  { id: "vcm-ss-38", ordem: 38, linha: "120", tabela: "2", carroProgramado: "1376", saidaGaragem: "04:35", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-39", ordem: 39, linha: "121", tabela: "1", carroProgramado: "1359", saidaGaragem: "04:35", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-40", ordem: 40, linha: "122", tabela: "2", carroProgramado: "1273", saidaGaragem: "04:52", inicioBairro: "05:22", status: "PENDENTE" },
  { id: "vcm-ss-41", ordem: 41, linha: "124", tabela: "1", carroProgramado: "1306", saidaGaragem: "04:30", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-42", ordem: 42, linha: "126", tabela: "1", carroProgramado: "1324", saidaGaragem: "04:30", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-43", ordem: 43, linha: "131", tabela: "1", carroProgramado: "1385", saidaGaragem: "04:10", inicioBairro: "04:40", status: "PENDENTE" },
  { id: "vcm-ss-44", ordem: 44, linha: "503", tabela: "1", carroProgramado: "1344", saidaGaragem: "04:20", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-45", ordem: 45, linha: "506", tabela: "1", carroProgramado: "1343", saidaGaragem: "04:25", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcm-ss-46", ordem: 46, linha: "507", tabela: "1", carroProgramado: "1366", saidaGaragem: "04:22", inicioBairro: "04:52", status: "PENDENTE" },
  { id: "vcm-ss-47", ordem: 47, linha: "508", tabela: "1", carroProgramado: "3212", saidaGaragem: "04:50", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-48", ordem: 48, linha: "509", tabela: "1", carroProgramado: "1368", saidaGaragem: "04:40", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcm-ss-49", ordem: 49, linha: "511", tabela: "1", carroProgramado: "1374", saidaGaragem: "04:30", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-50", ordem: 50, linha: "512", tabela: "1", carroProgramado: "1356", saidaGaragem: "05:25", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcm-ss-51", ordem: 51, linha: "513", tabela: "1", carroProgramado: "2354", saidaGaragem: "04:40", inicioBairro: "05:05", status: "PENDENTE" },
  { id: "vcm-ss-52", ordem: 52, linha: "514", tabela: "1", carroProgramado: "1373", saidaGaragem: "04:20", inicioBairro: "04:55", status: "PENDENTE" },
  { id: "vcm-ss-53", ordem: 53, linha: "516", tabela: "1", carroProgramado: "1229", saidaGaragem: "04:15", inicioBairro: "04:45", status: "PENDENTE" },
  { id: "vcm-ss-54", ordem: 54, linha: "517", tabela: "1", carroProgramado: "1275", saidaGaragem: "04:20", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-55", ordem: 55, linha: "518", tabela: "1", carroProgramado: "1370", saidaGaragem: "04:35", inicioBairro: "05:00", status: "PENDENTE" },
  { id: "vcm-ss-56", ordem: 56, linha: "520", tabela: "1", carroProgramado: "1386", saidaGaragem: "04:20", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-57", ordem: 57, linha: "522", tabela: "1", carroProgramado: "1388", saidaGaragem: "04:20", inicioBairro: "04:55", status: "PENDENTE" },
  { id: "vcm-ss-58", ordem: 58, linha: "527", tabela: "1", carroProgramado: "2714", saidaGaragem: "04:20", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcm-ss-59", ordem: 59, linha: "602", tabela: "1", carroProgramado: "1387", saidaGaragem: "05:40", inicioBairro: "06:00", status: "PENDENTE" },
];

// ----------------------------------------------------
// VCM - SÁBADO
// ----------------------------------------------------
export const vcmSabado: SolturaItem[] = [
  { id: "vcm-sab-01", ordem: 1, linha: "053", tabela: "1", carroProgramado: "1381", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcm-sab-02", ordem: 2, linha: "053", tabela: "2", carroProgramado: "1382", saidaGaragem: "05:07", status: "PENDENTE" },
  { id: "vcm-sab-03", ordem: 3, linha: "053", tabela: "3", carroProgramado: "1383", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcm-sab-04", ordem: 4, linha: "056", tabela: "1", carroProgramado: "1309", saidaGaragem: "05:00", status: "PENDENTE" },
  { id: "vcm-sab-05", ordem: 5, linha: "056", tabela: "2", carroProgramado: "1262", saidaGaragem: "05:40", status: "PENDENTE" },
  { id: "vcm-sab-06", ordem: 6, linha: "061", tabela: "1", carroProgramado: "1227", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-sab-07", ordem: 7, linha: "061", tabela: "2", carroProgramado: "1388", saidaGaragem: "04:55", status: "PENDENTE" },
  { id: "vcm-sab-08", ordem: 8, linha: "061", tabela: "3", carroProgramado: "1345", saidaGaragem: "05:10", status: "PENDENTE" },
  { id: "vcm-sab-09", ordem: 9, linha: "061", tabela: "4", carroProgramado: "1339", saidaGaragem: "05:25", status: "PENDENTE" },
  { id: "vcm-sab-10", ordem: 10, linha: "061", tabela: "5", carroProgramado: "1340", saidaGaragem: "05:40", status: "PENDENTE" },
  { id: "vcm-sab-11", ordem: 11, linha: "061", tabela: "6", carroProgramado: "1391", saidaGaragem: "05:55", status: "PENDENTE" },
  { id: "vcm-sab-12", ordem: 12, linha: "061", tabela: "7", carroProgramado: "1392", saidaGaragem: "05:40", status: "PENDENTE" },
  { id: "vcm-sab-13", ordem: 13, linha: "063", tabela: "1", carroProgramado: "3062", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-sab-14", ordem: 14, linha: "063", tabela: "2", carroProgramado: "1360", saidaGaragem: "04:55", status: "PENDENTE" },
  { id: "vcm-sab-15", ordem: 15, linha: "064", tabela: "1", carroProgramado: "1379", saidaGaragem: "05:05", status: "PENDENTE" },
  { id: "vcm-sab-16", ordem: 16, linha: "070", tabela: "1", carroProgramado: "3251", saidaGaragem: "04:18", status: "PENDENTE" },
  { id: "vcm-sab-17", ordem: 17, linha: "070", tabela: "2", carroProgramado: "3135", saidaGaragem: "04:35", status: "PENDENTE" },
  { id: "vcm-sab-18", ordem: 18, linha: "070", tabela: "3", carroProgramado: "2350", saidaGaragem: "04:47", status: "PENDENTE" },
  { id: "vcm-sab-19", ordem: 19, linha: "070", tabela: "4", carroProgramado: "3265", saidaGaragem: "05:05", status: "PENDENTE" },
  { id: "vcm-sab-20", ordem: 20, linha: "072", tabela: "2", carroProgramado: "1317", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-sab-21", ordem: 21, linha: "075", tabela: "1", carroProgramado: "1285", saidaGaragem: "04:55", status: "PENDENTE" },
  { id: "vcm-sab-22", ordem: 22, linha: "080", tabela: "1", carroProgramado: "3852", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-sab-23", ordem: 23, linha: "082", tabela: "1", carroProgramado: "3955", saidaGaragem: "04:43", status: "PENDENTE" },
  { id: "vcm-sab-24", ordem: 24, linha: "087", tabela: "1", carroProgramado: "1336", saidaGaragem: "04:45", status: "PENDENTE" },
  { id: "vcm-sab-25", ordem: 25, linha: "101", tabela: "1", carroProgramado: "1362", saidaGaragem: "04:48", status: "PENDENTE" },
  { id: "vcm-sab-26", ordem: 26, linha: "102", tabela: "1", carroProgramado: "1341", saidaGaragem: "04:27", status: "PENDENTE" },
  { id: "vcm-sab-27", ordem: 27, linha: "105", tabela: "1", carroProgramado: "1228", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-sab-28", ordem: 28, linha: "108", tabela: "3", carroProgramado: "1226", saidaGaragem: "04:59", status: "PENDENTE" },
  { id: "vcm-sab-29", ordem: 29, linha: "109", tabela: "1", carroProgramado: "1372", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-sab-30", ordem: 30, linha: "110", tabela: "1", carroProgramado: "1345", saidaGaragem: "04:06", status: "PENDENTE" },
];

// ----------------------------------------------------
// VCM - DOMINGO & FERIADOS
// ----------------------------------------------------
export const vcmDomingoFeriado: SolturaItem[] = [
  { id: "vcm-dom-01", ordem: 1, linha: "056", tabela: "1", carroProgramado: "1358", saidaGaragem: "05:05", status: "PENDENTE" },
  { id: "vcm-dom-02", ordem: 2, linha: "061", tabela: "1", carroProgramado: "1390", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-dom-03", ordem: 3, linha: "061", tabela: "2", carroProgramado: "1391", saidaGaragem: "05:10", status: "PENDENTE" },
  { id: "vcm-dom-04", ordem: 4, linha: "061", tabela: "3", carroProgramado: "1392", saidaGaragem: "06:00", status: "PENDENTE" },
  { id: "vcm-dom-05", ordem: 5, linha: "061", tabela: "4", carroProgramado: "1393", saidaGaragem: "06:10", status: "PENDENTE" },
  { id: "vcm-dom-06", ordem: 6, linha: "063", tabela: "1", carroProgramado: "1304", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-dom-07", ordem: 7, linha: "063", tabela: "2", carroProgramado: "1303", saidaGaragem: "04:55", status: "PENDENTE" },
  { id: "vcm-dom-08", ordem: 8, linha: "064", tabela: "1", carroProgramado: "1380", saidaGaragem: "05:15", status: "PENDENTE" },
  { id: "vcm-dom-09", ordem: 9, linha: "070", tabela: "1", carroProgramado: "3954", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-dom-10", ordem: 10, linha: "070", tabela: "2", carroProgramado: "3955", saidaGaragem: "04:35", status: "PENDENTE" },
  { id: "vcm-dom-11", ordem: 11, linha: "070", tabela: "3", carroProgramado: "3956", saidaGaragem: "05:05", status: "PENDENTE" },
  { id: "vcm-dom-12", ordem: 12, linha: "070", tabela: "4", carroProgramado: "3251", saidaGaragem: "04:55", status: "PENDENTE" },
  { id: "vcm-dom-13", ordem: 13, linha: "072", tabela: "2", carroProgramado: "1371", saidaGaragem: "04:50", status: "PENDENTE" },
  { id: "vcm-dom-14", ordem: 14, linha: "080", tabela: "1", carroProgramado: "3259", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-dom-15", ordem: 15, linha: "080", tabela: "4", carroProgramado: "3265", saidaGaragem: "05:02", status: "PENDENTE" },
  { id: "vcm-dom-16", ordem: 16, linha: "087", tabela: "1", carroProgramado: "1381", saidaGaragem: "05:00", status: "PENDENTE" },
  { id: "vcm-dom-17", ordem: 17, linha: "087", tabela: "2", carroProgramado: "2350", saidaGaragem: "05:20", status: "PENDENTE" },
  { id: "vcm-dom-18", ordem: 18, linha: "087", tabela: "3", carroProgramado: "1379", saidaGaragem: "04:50", status: "PENDENTE" },
  { id: "vcm-dom-19", ordem: 19, linha: "101", tabela: "1", carroProgramado: "1365", saidaGaragem: "04:45", status: "PENDENTE" },
  { id: "vcm-dom-20", ordem: 20, linha: "102", tabela: "2", carroProgramado: "1375", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcm-dom-21", ordem: 21, linha: "103", tabela: "2", carroProgramado: "1361", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-dom-22", ordem: 22, linha: "104", tabela: "1", carroProgramado: "1364", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-dom-23", ordem: 23, linha: "105", tabela: "1", carroProgramado: "1374", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-dom-24", ordem: 24, linha: "107", tabela: "1", carroProgramado: "1301", saidaGaragem: "04:30", status: "PENDENTE" },
  { id: "vcm-dom-25", ordem: 25, linha: "108", tabela: "1", carroProgramado: "1372", saidaGaragem: "04:20", status: "PENDENTE" },
  { id: "vcm-dom-26", ordem: 26, linha: "109", tabela: "1", carroProgramado: "2718", saidaGaragem: "04:40", status: "PENDENTE" },
  { id: "vcm-dom-27", ordem: 27, linha: "110", tabela: "1", carroProgramado: "1344", saidaGaragem: "04:10", status: "PENDENTE" },
  { id: "vcm-dom-28", ordem: 28, linha: "111", tabela: "1", carroProgramado: "1355", saidaGaragem: "04:25", status: "PENDENTE" },
  { id: "vcm-dom-29", ordem: 29, linha: "112", tabela: "1", carroProgramado: "2353", saidaGaragem: "04:15", status: "PENDENTE" },
  { id: "vcm-dom-30", ordem: 30, linha: "113", tabela: "1", carroProgramado: "1377", saidaGaragem: "04:55", status: "PENDENTE" },
];

// ----------------------------------------------------
// QUADRO CI - CARROS EM REVISÃO PREVENTIVA E CORRETIVA / BLOQUEADOS
// (Extraídos fielmente das planilhas CI das imagens 6, 8, 11)
// ----------------------------------------------------
export const ciCarrosBloqueados: BloqueioCarro[] = [
  { prefixo: "1000", tipo: "BLOQUEADO_CORRETIVA", motivo: "Bloqueado Corretiva Mecânica", data: "26/08/2026" },
  { prefixo: "1108", tipo: "BLOQUEADO_AGETRAN", motivo: "Bloqueio Pane Elétrica / Agetran", data: "27/08/2026" },
  { prefixo: "1114", tipo: "REFORCO_REVISAO", motivo: "Reforço de Revisão Preventiva", data: "27/08/2026" },
  { prefixo: "1115", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Geral de Pista", data: "26/08/2026" },
  { prefixo: "1117", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Elétrica", data: "26/08/2026" },
  { prefixo: "1119", tipo: "BLOQUEADO_CORRETIVA", motivo: "Bloqueado Corretiva - Pane Elétrica", data: "25/08/2026" },
  { prefixo: "1120", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Suspensão", data: "26/08/2026" },
  { prefixo: "1123", tipo: "BLOQUEADO_MOTOR", motivo: "Bloqueado Motor - Aquecimento", data: "26/08/2026" },
  { prefixo: "1125", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Freio", data: "26/08/2026" },
  { prefixo: "1127", tipo: "BLOQUEADO_MOTOR", motivo: "Bloqueado Motor - Óleo", data: "26/08/2026" },
  { prefixo: "1201", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Suspensão", data: "26/08/2026" },
  { prefixo: "1204", tipo: "BLOQUEADO_MOTOR", motivo: "Bloqueado Motor - Vibração", data: "26/08/2026" },
  { prefixo: "1206", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Motor", data: "26/08/2026" },
  { prefixo: "1207", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Revisão Geral", data: "26/08/2026" },
  { prefixo: "1214", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola Dianteira", data: "26/08/2026" },
  { prefixo: "1221", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Suporte Patim", data: "26/08/2026" },
  { prefixo: "1230", tipo: "BLOQUEADO_MOTOR", motivo: "Bloqueado Motor", data: "25/08/2026" },
  { prefixo: "1233", tipo: "BLOQUEADO_CORRETIVA", motivo: "Bloqueado Corretiva", data: "25/08/2026" },
  { prefixo: "1262", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Corretiva", data: "26/08/2026" },
  { prefixo: "1267", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Mangueira Radiador", data: "26/08/2026" },
  { prefixo: "1273", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Transmissão", data: "26/08/2026" },
  { prefixo: "1277", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Suporte Patim", data: "26/08/2026" },
  { prefixo: "1278", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Câmbio", data: "26/08/2026" },
  { prefixo: "1309", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Embreagem", data: "26/08/2026" },
  { prefixo: "1311", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola Traseira", data: "26/08/2026" },
  { prefixo: "1312", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola", data: "26/08/2026" },
  { prefixo: "1316", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Câmbio", data: "26/08/2026" },
  { prefixo: "1320", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Freio / Cuíca", data: "26/08/2026" },
  { prefixo: "1322", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Módulo / Agetran", data: "24/08/2026" },
  { prefixo: "1323", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Batido / Agetran", data: "24/08/2026" },
  { prefixo: "1324", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Manga de Eixo", data: "26/08/2026" },
  { prefixo: "1332", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Lubrificação", data: "26/08/2026" },
  { prefixo: "1333", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Módulo", data: "26/08/2026" },
  { prefixo: "1335", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Mola", data: "26/08/2026" },
  { prefixo: "1344", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Compressor", data: "26/08/2026" },
  { prefixo: "1345", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Motor", data: "26/08/2026" },
  { prefixo: "1346", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Lubrificação", data: "26/08/2026" },
  { prefixo: "1356", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Otimiza", data: "24/08/2026" },
  { prefixo: "1359", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Módulo", data: "26/08/2026" },
  { prefixo: "1365", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Mecânica", data: "26/08/2026" },
  { prefixo: "1367", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção", data: "26/08/2026" },
  { prefixo: "1368", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Motor", data: "26/08/2026" },
  { prefixo: "1374", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção", data: "26/08/2026" },
  { prefixo: "1388", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola", data: "27/08/2026" },
  { prefixo: "2516", tipo: "BLOQUEADO_CORRETIVA", motivo: "Bloqueado Corretiva / Agetran", data: "25/08/2026" },
  { prefixo: "2601", tipo: "BLOQUEADO_CORRETIVA", motivo: "Bloqueado Câmbio / Agetran", data: "25/08/2026" },
  { prefixo: "2629", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção", data: "26/08/2026" },
  { prefixo: "2637", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção", data: "26/08/2026" },
  { prefixo: "2701", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola", data: "26/08/2026" },
  { prefixo: "2716", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção", data: "26/08/2026" },
  { prefixo: "2718", tipo: "BLOQUEADO_MOTOR", motivo: "Bloqueado Motor", data: "26/08/2026" },
  { prefixo: "2720", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola", data: "26/08/2026" },
  { prefixo: "3011", tipo: "BLOQUEADO_CORRETIVA", motivo: "Bloqueado Vazamento Água", data: "27/08/2026" },
  { prefixo: "3071", tipo: "BLOQUEADO_MOLA", motivo: "Bloqueado Mola", data: "27/08/2026" },
  { prefixo: "3200", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Cuíca de Freio", data: "27/08/2026" },
  { prefixo: "3218", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção Geral", data: "26/08/2026" },
  { prefixo: "3850", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Pintura / Chaparia", data: "27/08/2026" },
  { prefixo: "3853", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Ar Condicionado", data: "26/08/2026" },
  { prefixo: "3956", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Revisão Preventiva", data: "27/08/2026" },
  { prefixo: "3141", tipo: "EM_MANUTENCAO", motivo: "Em Manutenção de Pista", data: "26/08/2026" },
  { prefixo: "4251", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Revisão", data: "26/08/2026" },
  { prefixo: "4252", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Revisão", data: "26/08/2026" },
  { prefixo: "4276", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Suspensão", data: "26/08/2026" },
  { prefixo: "3281", tipo: "EM_MANUTENCAO", motivo: "Bloqueado Módulo Eletrônico", data: "26/08/2026" },
];

// ----------------------------------------------------
// RESERVAS DE TERMINAIS
// ----------------------------------------------------
export const reservasGaragemVCG: string[] = ["4259", "3132", "4182"];

export const terminaisReservaVCG: TerminalReserva[] = [
  { terminal: "Term. General Osório", cor: "VERMELHO", carro1: "3271", horario: "04:30" },
  { terminal: "Term. Nova Bahia", cor: "VERMELHO", carro1: "4207", horario: "04:30" },
  { terminal: "Term. Bandeirantes", cor: "AZUL", carro1: "4229", horario: "04:40" },
  { terminal: "Term. Bandeirantes", cor: "VERMELHO", carro1: "3021", horario: "04:20" },
  { terminal: "Term. Júlio de Castilho", cor: "VERMELHO", carro1: "4251", horario: "04:20" },
  { terminal: "Term. Júlio de Castilho", cor: "AZUL", carro1: "4222", horario: "04:20" },
];

export const terminaisReservaVCM: TerminalReserva[] = [
  { terminal: "Term. Guaicurus", cor: "AZUL", carro1: "1226", carro2: "1375", horario: "04:20" },
  { terminal: "Term. Morenão", cor: "AZUL", carro1: "1219", carro2: "1349", horario: "04:20" },
  { terminal: "Term. Hércules", cor: "AZUL", carro1: "1220", carro2: "1346", horario: "04:20" },
  { terminal: "Term. Aero Rancho", cor: "AZUL", carro1: "3850", carro2: "3211", horario: "04:20" },
];

// ----------------------------------------------------
// CARROS PENDURADOS / ALTO CONSUMO
// ----------------------------------------------------
export interface CarroPendurado {
  prefixo: string;
  tipo: "AZUL" | "VERMELHO" | "MICRO" | "ARTICULADO" | "CINZA";
  garagem: "VCG" | "VCM";
}

export const carrosPendurados: CarroPendurado[] = [
  // VCM Pendurados (de vcm-sabado.jpeg / vcm-seg-sext-2.jpeg)
  { prefixo: "1108", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1109", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1110", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1112", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1264", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1265", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1266", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1268", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1270", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1308", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1329", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1330", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "1331", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "2321", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "2328", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "2329", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "2331", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "2422", tipo: "VERMELHO", garagem: "VCM" },
  { prefixo: "3855", tipo: "VERMELHO", garagem: "VCM" },
  // Azuis
  { prefixo: "1200", tipo: "AZUL", garagem: "VCM" },
  { prefixo: "1202", tipo: "AZUL", garagem: "VCM" },
  // Micros
  { prefixo: "2708", tipo: "MICRO", garagem: "VCM" },
  // Articulados
  { prefixo: "3070", tipo: "ARTICULADO", garagem: "VCM" },
  { prefixo: "3083", tipo: "ARTICULADO", garagem: "VCM" },
  // VCG Pendurados (vcg-seg-sext-2.jpeg)
  { prefixo: "3003", tipo: "VERMELHO", garagem: "VCG" },
];

