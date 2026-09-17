export interface SolturaItem {
  id: string;
  ordem?: number;
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
  id?: string;
  prefixo: string;
  garagem?: "VCG" | "VCM" | "TODAS";
  tipo: "BLOQUEADO_CORRETIVA" | "EM_MANUTENCAO" | "REFORCO_REVISAO" | "BLOQUEADO_MOTOR" | "BLOQUEADO_MOLA" | "BLOQUEADO_CAMBIO" | "BLOQUEADO_FREIO" | "BLOQUEADO_MODULO" | "BLOQUEADO_AGETRAN" | "BLOQUEADO_AR" | "BLOQUEADO_SINISTRO";
  motivo: string;
  data: string;
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
// Folha Matutino (Página 01 e Página 02 - Completo 197 veículos)
export const vcgSegundaSextaMatutino: SolturaItem[] = [
  // ---------------------------------------------------------------------------------
  // PÁGINA 1 - COLUNA 01 (ORDENS 001 A 052) — OFICIAL CGU.REG.OP.0001 (Rev 1)
  // ---------------------------------------------------------------------------------
  { id: "vcg-mat-001", ordem: 1, linha: "302/051", tabela: "1/1", saidaGaragem: "03:50", chegadaGaragem: "04:30", inicioLinha: "04:30", inicioBairro: "04:30", carroProgramado: "3950", status: "PENDENTE" },
  { id: "vcg-mat-002", ordem: 2, linha: "308", tabela: "2", saidaGaragem: "03:55", chegadaGaragem: "04:40", inicioLinha: "04:40", inicioBairro: "04:40", carroProgramado: "3204", status: "PENDENTE" },
  { id: "vcg-mat-003", ordem: 3, linha: "302/076", tabela: "2/1", saidaGaragem: "03:55", chegadaGaragem: "04:50", inicioLinha: "04:50", inicioBairro: "04:50", carroProgramado: "3138", status: "PENDENTE" },
  { id: "vcg-mat-004", ordem: 4, linha: "302/076", tabela: "88/2", saidaGaragem: "03:55", chegadaGaragem: "04:35", inicioLinha: "04:35", inicioBairro: "04:35", carroProgramado: "2704", status: "PENDENTE" },
  { id: "vcg-mat-005", ordem: 5, linha: "217", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "04:47", inicioLinha: "04:47", inicioBairro: "04:47", carroProgramado: "4260", status: "PENDENTE" },
  { id: "vcg-mat-006", ordem: 6, linha: "413", tabela: "3", saidaGaragem: "04:00", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "4197", status: "PENDENTE" },
  { id: "vcg-mat-007", ordem: 7, linha: "210", tabela: "2/4", saidaGaragem: "04:00", chegadaGaragem: "04:40", inicioLinha: "04:40", inicioBairro: "04:40", carroProgramado: "2320", status: "PENDENTE" },
  { id: "vcg-mat-008", ordem: 8, linha: "317", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "3139", status: "PENDENTE" },
  { id: "vcg-mat-009", ordem: 9, linha: "321", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4249", status: "PENDENTE" },
  { id: "vcg-mat-010", ordem: 10, linha: "215", tabela: "1", saidaGaragem: "04:05", chegadaGaragem: "04:43", inicioLinha: "04:43", inicioBairro: "04:43", carroProgramado: "2413", status: "PENDENTE" },
  { id: "vcg-mat-011", ordem: 11, linha: "211", tabela: "1", saidaGaragem: "04:05", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4276", status: "PENDENTE" },
  { id: "vcg-mat-012", ordem: 12, linha: "315", tabela: "1", saidaGaragem: "04:05", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "3226", status: "PENDENTE" },
  { id: "vcg-mat-013", ordem: 13, linha: "412/050", tabela: "9/1", saidaGaragem: "04:10", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "4227", status: "PENDENTE" },
  { id: "vcg-mat-014", ordem: 14, linha: "237", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "04:50", inicioLinha: "04:50", inicioBairro: "04:50", carroProgramado: "2712", status: "PENDENTE" },
  { id: "vcg-mat-015", ordem: 15, linha: "474", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "2713", status: "PENDENTE" },
  { id: "vcg-mat-016", ordem: 16, linha: "204", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4266", status: "PENDENTE" },
  { id: "vcg-mat-017", ordem: 17, linha: "307", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4270", status: "PENDENTE" },
  { id: "vcg-mat-018", ordem: 18, linha: "212", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "2412", status: "PENDENTE" },
  { id: "vcg-mat-019", ordem: 19, linha: "413", tabela: "2", saidaGaragem: "04:15", chegadaGaragem: "05:05", inicioLinha: "05:05", inicioBairro: "05:05", carroProgramado: "3035", status: "PENDENTE" },
  { id: "vcg-mat-020", ordem: 20, linha: "214", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "4278", status: "PENDENTE" },
  { id: "vcg-mat-021", ordem: 21, linha: "414/085", tabela: "88/5", saidaGaragem: "04:15", chegadaGaragem: "04:45", inicioLinha: "04:45", inicioBairro: "04:45", carroProgramado: "2705", status: "PENDENTE" },
  { id: "vcg-mat-022", ordem: 22, linha: "205", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "04:57", inicioLinha: "04:57", inicioBairro: "04:57", carroProgramado: "3273", status: "PENDENTE" },
  { id: "vcg-mat-023", ordem: 23, linha: "229", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "04:43", inicioLinha: "04:43", inicioBairro: "04:43", carroProgramado: "3255", status: "PENDENTE" },
  { id: "vcg-mat-024", ordem: 24, linha: "236", tabela: "2", saidaGaragem: "04:15", chegadaGaragem: "05:05", inicioLinha: "05:05", inicioBairro: "05:05", carroProgramado: "4231", status: "PENDENTE" },
  { id: "vcg-mat-025", ordem: 25, linha: "235", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4194", status: "PENDENTE" },
  { id: "vcg-mat-026", ordem: 26, linha: "408", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:50", inicioLinha: "04:50", inicioBairro: "04:50", carroProgramado: "4234", status: "PENDENTE" },
  { id: "vcg-mat-027", ordem: 27, linha: "421", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:50", inicioLinha: "04:50", inicioBairro: "04:50", carroProgramado: "4204", status: "PENDENTE" },
  { id: "vcg-mat-028", ordem: 28, linha: "306", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "3279", status: "PENDENTE" },
  { id: "vcg-mat-029", ordem: 29, linha: "308", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "3137", status: "PENDENTE" },
  { id: "vcg-mat-030", ordem: 30, linha: "302/081", tabela: "88/4", saidaGaragem: "04:20", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "4218", status: "PENDENTE" },
  { id: "vcg-mat-031", ordem: 31, linha: "203", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4226", status: "PENDENTE" },
  { id: "vcg-mat-032", ordem: 32, linha: "301", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "3254", status: "PENDENTE" },
  { id: "vcg-mat-033", ordem: 33, linha: "213", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "3222", status: "PENDENTE" },
  { id: "vcg-mat-034", ordem: 34, linha: "304", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "3224", status: "PENDENTE" },
  { id: "vcg-mat-035", ordem: 35, linha: "210", tabela: "1/5", saidaGaragem: "04:20", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "3257", status: "PENDENTE" },
  { id: "vcg-mat-036", ordem: 36, linha: "207", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "04:58", inicioLinha: "04:58", inicioBairro: "04:58", carroProgramado: "3283", status: "PENDENTE" },
  { id: "vcg-mat-037", ordem: 37, linha: "321", tabela: "8", saidaGaragem: "04:20", chegadaGaragem: "05:18", inicioLinha: "05:18", inicioBairro: "05:18", carroProgramado: "3148", status: "PENDENTE" },
  { id: "vcg-mat-038", ordem: 38, linha: "325", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "05:05", inicioLinha: "05:05", inicioBairro: "05:05", carroProgramado: "3208", status: "PENDENTE" },
  { id: "vcg-mat-039", ordem: 39, linha: "401", tabela: "1", saidaGaragem: "04:22", chegadaGaragem: "04:57", inicioLinha: "04:57", inicioBairro: "04:57", carroProgramado: "4261", status: "PENDENTE" },
  { id: "vcg-mat-040", ordem: 40, linha: "209", tabela: "1", saidaGaragem: "04:23", chegadaGaragem: "05:08", inicioLinha: "05:08", inicioBairro: "05:08", carroProgramado: "3263", status: "PENDENTE" },
  { id: "vcg-mat-041", ordem: 41, linha: "217", tabela: "2", saidaGaragem: "04:25", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "4221", status: "PENDENTE" },
  { id: "vcg-mat-042", ordem: 42, linha: "323", tabela: "1", saidaGaragem: "04:25", chegadaGaragem: "05:07", inicioLinha: "05:07", inicioBairro: "05:07", carroProgramado: "4215", status: "PENDENTE" },
  { id: "vcg-mat-043", ordem: 43, linha: "414", tabela: "1", saidaGaragem: "04:25", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4238", status: "PENDENTE" },
  { id: "vcg-mat-044", ordem: 44, linha: "073/073", tabela: "88/3", saidaGaragem: "04:25", chegadaGaragem: "04:50", inicioLinha: "04:50", inicioBairro: "04:50", carroProgramado: "3271", status: "PENDENTE" },
  { id: "vcg-mat-045", ordem: 45, linha: "302/081", tabela: "88/06", saidaGaragem: "04:25", chegadaGaragem: "05:35", inicioLinha: "05:35", inicioBairro: "05:35", carroProgramado: "3147", status: "PENDENTE" },
  { id: "vcg-mat-046", ordem: 46, linha: "303", tabela: "1", saidaGaragem: "04:26", chegadaGaragem: "05:01", inicioLinha: "05:01", inicioBairro: "05:01", carroProgramado: "4265", status: "PENDENTE" },
  { id: "vcg-mat-047", ordem: 47, linha: "321/302", tabela: "7/1", saidaGaragem: "04:28", chegadaGaragem: "05:23", inicioLinha: "05:23", inicioBairro: "05:23", carroProgramado: "2423", status: "PENDENTE" },
  { id: "vcg-mat-048", ordem: 48, linha: "409", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "4225", status: "PENDENTE" },
  { id: "vcg-mat-049", ordem: 49, linha: "070", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "4246", status: "PENDENTE" },
  { id: "vcg-mat-050", ordem: 50, linha: "412/411", tabela: "1/1", saidaGaragem: "04:30", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "3216", status: "PENDENTE" },
  { id: "vcg-mat-051", ordem: 51, linha: "405", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "04:55", inicioLinha: "04:55", inicioBairro: "04:55", carroProgramado: "3901", status: "PENDENTE" },
  { id: "vcg-mat-052", ordem: 52, linha: "085", tabela: "6", saidaGaragem: "04:30", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "4277", status: "PENDENTE" },

  // ---------------------------------------------------------------------------------
  // PÁGINA 1 - COLUNA 02 (ORDENS 053 A 104) — OFICIAL CGU.REG.OP.0001 (Rev 1)
  // ---------------------------------------------------------------------------------
  { id: "vcg-mat-053", ordem: 53, linha: "421", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "4192", status: "PENDENTE" },
  { id: "vcg-mat-054", ordem: 54, linha: "228", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "05:12", inicioLinha: "05:12", inicioBairro: "05:12", carroProgramado: "3230", status: "PENDENTE" },
  { id: "vcg-mat-055", ordem: 55, linha: "220", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "2801", status: "PENDENTE" },
  { id: "vcg-mat-056", ordem: 56, linha: "403", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "05:05", inicioLinha: "05:05", inicioBairro: "05:05", carroProgramado: "4216", status: "PENDENTE" },
  { id: "vcg-mat-057", ordem: 57, linha: "073", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "4210", status: "PENDENTE" },
  { id: "vcg-mat-058", ordem: 58, linha: "306", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "2351", status: "PENDENTE" },
  { id: "vcg-mat-059", ordem: 59, linha: "246/212", tabela: "2/5", saidaGaragem: "04:30", chegadaGaragem: "04:59", inicioLinha: "04:59", inicioBairro: "04:59", carroProgramado: "2410", status: "PENDENTE" },
  { id: "vcg-mat-060", ordem: 60, linha: "206", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "4263", status: "PENDENTE" },
  { id: "vcg-mat-061", ordem: 61, linha: "215", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "2319", status: "PENDENTE" },
  { id: "vcg-mat-062", ordem: 62, linha: "227", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "2700", status: "PENDENTE" },
  { id: "vcg-mat-063", ordem: 63, linha: "309/051", tabela: "88/3", saidaGaragem: "04:30", chegadaGaragem: "05:18", inicioLinha: "05:18", inicioBairro: "05:18", carroProgramado: "4235", status: "PENDENTE" },
  { id: "vcg-mat-064", ordem: 64, linha: "214", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "2623", status: "PENDENTE" },
  { id: "vcg-mat-065", ordem: 65, linha: "317", tabela: "3", saidaGaragem: "04:30", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "4213", status: "PENDENTE" },
  { id: "vcg-mat-066", ordem: 66, linha: "411/073/424", tabela: "88/7/1", saidaGaragem: "04:30", chegadaGaragem: "05:12", inicioLinha: "05:12", inicioBairro: "05:12", carroProgramado: "3267", status: "PENDENTE" },
  { id: "vcg-mat-067", ordem: 67, linha: "302/321", tabela: "3/88", saidaGaragem: "04:30", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", carroProgramado: "4188", status: "PENDENTE" },
  { id: "vcg-mat-068", ordem: 68, linha: "071/071", tabela: "88/2", saidaGaragem: "04:34", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "4247", status: "PENDENTE" },
  { id: "vcg-mat-069", ordem: 69, linha: "307", tabela: "2", saidaGaragem: "04:35", chegadaGaragem: "04:57", inicioLinha: "04:57", inicioBairro: "04:57", carroProgramado: "2615", status: "PENDENTE" },
  { id: "vcg-mat-070", ordem: 70, linha: "208", tabela: "1", saidaGaragem: "04:35", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "3261", status: "PENDENTE" },
  { id: "vcg-mat-071", ordem: 71, linha: "211", tabela: "2", saidaGaragem: "04:35", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "3277", status: "PENDENTE" },
  { id: "vcg-mat-072", ordem: 72, linha: "223", tabela: "1", saidaGaragem: "04:35", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "2514", status: "PENDENTE" },
  { id: "vcg-mat-073", ordem: 73, linha: "226", tabela: "1", saidaGaragem: "04:35", chegadaGaragem: "05:05", inicioLinha: "05:05", inicioBairro: "05:05", carroProgramado: "2352", status: "PENDENTE" },
  { id: "vcg-mat-074", ordem: 74, linha: "081", tabela: "8", saidaGaragem: "04:35", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "2421", status: "PENDENTE" },
  { id: "vcg-mat-075", ordem: 75, linha: "213", tabela: "2", saidaGaragem: "04:35", chegadaGaragem: "05:12", inicioLinha: "05:12", inicioBairro: "05:12", carroProgramado: "2613", status: "PENDENTE" },
  { id: "vcg-mat-076", ordem: 76, linha: "308/054", tabela: "4/2", saidaGaragem: "04:35", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", carroProgramado: "3217", status: "PENDENTE" },
  { id: "vcg-mat-077", ordem: 77, linha: "73", tabela: "1", saidaGaragem: "04:37", chegadaGaragem: "05:07", inicioLinha: "05:07", inicioBairro: "05:07", carroProgramado: "4250", status: "PENDENTE" },
  { id: "vcg-mat-078", ordem: 78, linha: "406", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "4249", status: "PENDENTE" },
  { id: "vcg-mat-079", ordem: 79, linha: "407", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "05:00", inicioLinha: "05:00", inicioBairro: "05:00", carroProgramado: "4257", status: "PENDENTE" },
  { id: "vcg-mat-080", ordem: 80, linha: "402", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "4262", status: "PENDENTE" },
  { id: "vcg-mat-081", ordem: 81, linha: "237/526", tabela: "3/1", saidaGaragem: "04:40", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", carroProgramado: "3057", status: "PENDENTE" },
  { id: "vcg-mat-082", ordem: 82, linha: "414", tabela: "3", saidaGaragem: "04:40", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "4017", status: "PENDENTE" },
  { id: "vcg-mat-083", ordem: 83, linha: "305", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "3959", status: "PENDENTE" },
  { id: "vcg-mat-084", ordem: 84, linha: "304/081", tabela: "2/9", saidaGaragem: "04:40", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "4267", status: "PENDENTE" },
  { id: "vcg-mat-085", ordem: 85, linha: "201/060", tabela: "1/1", saidaGaragem: "04:40", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "3014", status: "PENDENTE" },
  { id: "vcg-mat-086", ordem: 86, linha: "79", tabela: "3", saidaGaragem: "04:43", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "3008", status: "PENDENTE" },
  { id: "vcg-mat-087", ordem: 87, linha: "71", tabela: "1", saidaGaragem: "04:45", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "3034", status: "PENDENTE" },
  { id: "vcg-mat-088", ordem: 88, linha: "301", tabela: "2", saidaGaragem: "04:45", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", carroProgramado: "3250", status: "PENDENTE" },
  { id: "vcg-mat-089", ordem: 89, linha: "209", tabela: "2", saidaGaragem: "04:45", chegadaGaragem: "05:31", inicioLinha: "05:31", inicioBairro: "05:31", carroProgramado: "3952", status: "PENDENTE" },
  { id: "vcg-mat-090", ordem: 90, linha: "81", tabela: "1", saidaGaragem: "04:45", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "3013", status: "PENDENTE" },
  { id: "vcg-mat-091", ordem: 91, linha: "212", tabela: "2", saidaGaragem: "04:45", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "2323", status: "PENDENTE" },
  { id: "vcg-mat-092", ordem: 92, linha: "313/054", tabela: "88/3", saidaGaragem: "04:45", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", carroProgramado: "4205", status: "PENDENTE" },
  { id: "vcg-mat-093", ordem: 93, linha: "321/302", tabela: "9/2", saidaGaragem: "04:47", chegadaGaragem: "05:42", inicioLinha: "05:42", inicioBairro: "05:42", carroProgramado: "3958", status: "PENDENTE" },
  { id: "vcg-mat-094", ordem: 94, linha: "416", tabela: "1", saidaGaragem: "04:48", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "4184", status: "PENDENTE" },
  { id: "vcg-mat-095", ordem: 95, linha: "302/076", tabela: "4/4", saidaGaragem: "04:48", chegadaGaragem: "05:43", inicioLinha: "05:43", inicioBairro: "05:43", carroProgramado: "4212", status: "PENDENTE" },
  { id: "vcg-mat-096", ordem: 96, linha: "421/071", tabela: "88/4", saidaGaragem: "04:50", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", carroProgramado: "4254", status: "PENDENTE" },
  { id: "vcg-mat-097", ordem: 97, linha: "401", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "3214", status: "PENDENTE" },
  { id: "vcg-mat-098", ordem: 98, linha: "413", tabela: "4", saidaGaragem: "04:50", chegadaGaragem: "05:32", inicioLinha: "05:32", inicioBairro: "05:32", carroProgramado: "4195", status: "PENDENTE" },
  { id: "vcg-mat-099", ordem: 99, linha: "072", tabela: "1", saidaGaragem: "04:50", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", carroProgramado: "3269", status: "PENDENTE" },
  { id: "vcg-mat-100", ordem: 100, linha: "229", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "05:20", inicioLinha: "05:20", inicioBairro: "05:20", carroProgramado: "4229", status: "PENDENTE" },
  { id: "vcg-mat-101", ordem: 101, linha: "223", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", carroProgramado: "4273", status: "PENDENTE" },
  { id: "vcg-mat-102", ordem: 102, linha: "205", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", carroProgramado: "4268", status: "PENDENTE" },
  { id: "vcg-mat-103", ordem: 103, linha: "210/234", tabela: "3/88", saidaGaragem: "04:50", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", carroProgramado: "2711", status: "PENDENTE" },
  { id: "vcg-mat-104", ordem: 104, linha: "408", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", carroProgramado: "2715", status: "PENDENTE" },

  // ---------------------------------------------------------------------------------
  // PÁGINA 2 - COLUNA 01 (ORDENS 105 A 156) — OFICIAL CGU.REG.OP.0001 (Rev 1)
  // ---------------------------------------------------------------------------------
  { id: "vcg-mat-105", ordem: 105, linha: "412/414", tabela: "2/88", carroProgramado: "4186", saidaGaragem: "04:50", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", status: "PENDENTE" },
  { id: "vcg-mat-106", ordem: 106, linha: "73", tabela: "8", carroProgramado: "4210", saidaGaragem: "04:52", chegadaGaragem: "05:12", inicioLinha: "05:12", inicioBairro: "05:12", status: "PENDENTE" },
  { id: "vcg-mat-107", ordem: 107, linha: "413", tabela: "1", carroProgramado: "4219", saidaGaragem: "04:55", chegadaGaragem: "05:15", inicioLinha: "05:15", inicioBairro: "05:15", status: "PENDENTE" },
  { id: "vcg-mat-108", ordem: 108, linha: "70", tabela: "9", carroProgramado: "4241", saidaGaragem: "04:55", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", status: "PENDENTE" },
  { id: "vcg-mat-109", ordem: 109, linha: "230", tabela: "2/1", carroProgramado: "2327", saidaGaragem: "04:55", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", status: "PENDENTE" },
  { id: "vcg-mat-110", ordem: 110, linha: "211/81", tabela: "3/11", carroProgramado: "3003", saidaGaragem: "04:55", chegadaGaragem: "05:57", inicioLinha: "05:57", inicioBairro: "05:57", status: "PENDENTE" },
  { id: "vcg-mat-111", ordem: 111, linha: "309/54", tabela: "88/1", carroProgramado: "4245", saidaGaragem: "04:55", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", status: "PENDENTE" },
  { id: "vcg-mat-112", ordem: 112, linha: "406", tabela: "2", carroProgramado: "4233", saidaGaragem: "04:55", chegadaGaragem: "05:10", inicioLinha: "05:10", inicioBairro: "05:10", status: "PENDENTE" },
  { id: "vcg-mat-113", ordem: 113, linha: "85", tabela: "1", carroProgramado: "4236", saidaGaragem: "04:57", chegadaGaragem: "05:17", inicioLinha: "05:17", inicioBairro: "05:17", status: "PENDENTE" },
  { id: "vcg-mat-114", ordem: 114, linha: "215", tabela: "4", carroProgramado: "3140", saidaGaragem: "05:00", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-115", ordem: 115, linha: "309", tabela: "2", carroProgramado: "2425", saidaGaragem: "05:00", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-116", ordem: 116, linha: "409", tabela: "2/3", carroProgramado: "2352", saidaGaragem: "05:00", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", status: "PENDENTE" },
  { id: "vcg-mat-117", ordem: 117, linha: "53", tabela: "4", carroProgramado: "4279", saidaGaragem: "05:00", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-118", ordem: 118, linha: "601", tabela: "1/A", carroProgramado: "2355", saidaGaragem: "05:00", chegadaGaragem: "06:30", inicioLinha: "06:30", inicioBairro: "06:30", status: "PENDENTE" },
  { id: "vcg-mat-119", ordem: 119, linha: "215", tabela: "3", carroProgramado: "2411", saidaGaragem: "05:00", chegadaGaragem: "05:35", inicioLinha: "05:35", inicioBairro: "05:35", status: "PENDENTE" },
  { id: "vcg-mat-120", ordem: 120, linha: "81", tabela: "7", carroProgramado: "4240", saidaGaragem: "05:00", chegadaGaragem: "05:31", inicioLinha: "05:31", inicioBairro: "05:31", status: "PENDENTE" },
  { id: "vcg-mat-121", ordem: 121, linha: "407", tabela: "2", carroProgramado: "4258", saidaGaragem: "05:00", chegadaGaragem: "05:27", inicioLinha: "05:27", inicioBairro: "05:27", status: "PENDENTE" },
  { id: "vcg-mat-122", ordem: 122, linha: "321/302", tabela: "4/3", carroProgramado: "3133", saidaGaragem: "05:00", chegadaGaragem: "05:37", inicioLinha: "05:37", inicioBairro: "05:37", status: "PENDENTE" },
  { id: "vcg-mat-123", ordem: 123, linha: "212", tabela: "4", carroProgramado: "", saidaGaragem: "05:00", chegadaGaragem: "05:35", inicioLinha: "05:35", inicioBairro: "05:35", status: "PENDENTE" },
  { id: "vcg-mat-124", ordem: 124, linha: "79", tabela: "5", carroProgramado: "", saidaGaragem: "05:00", chegadaGaragem: "06:10", inicioLinha: "06:10", inicioBairro: "06:10", status: "PENDENTE" },
  { id: "vcg-mat-125", ordem: 125, linha: "317", tabela: "2", carroProgramado: "", saidaGaragem: "05:00", chegadaGaragem: "05:48", inicioLinha: "05:48", inicioBairro: "05:48", status: "PENDENTE" },
  { id: "vcg-mat-126", ordem: 126, linha: "414/222/201", tabela: "4/4/1", carroProgramado: "4212", saidaGaragem: "05:00", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", status: "PENDENTE" },
  { id: "vcg-mat-127", ordem: 127, linha: "86", tabela: "1", carroProgramado: "4275", saidaGaragem: "05:00", chegadaGaragem: "05:25", inicioLinha: "05:25", inicioBairro: "05:25", status: "PENDENTE" },
  { id: "vcg-mat-128", ordem: 128, linha: "321", tabela: "3", carroProgramado: "4015", saidaGaragem: "05:02", chegadaGaragem: "05:57", inicioLinha: "05:57", inicioBairro: "05:57", status: "PENDENTE" },
  { id: "vcg-mat-129", ordem: 129, linha: "235", tabela: "2", carroProgramado: "", saidaGaragem: "05:03", chegadaGaragem: "05:37", inicioLinha: "05:37", inicioBairro: "05:37", status: "PENDENTE" },
  { id: "vcg-mat-130", ordem: 130, linha: "422", tabela: "1", carroProgramado: "3957", saidaGaragem: "05:03", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-131", ordem: 131, linha: "222", tabela: "1", carroProgramado: "4230", saidaGaragem: "05:03", chegadaGaragem: "05:35", inicioLinha: "05:35", inicioBairro: "05:35", status: "PENDENTE" },
  { id: "vcg-mat-132", ordem: 132, linha: "412", tabela: "3", carroProgramado: "2420", saidaGaragem: "05:05", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", status: "PENDENTE" },
  { id: "vcg-mat-133", ordem: 133, linha: "414/242", tabela: "2/1", carroProgramado: "4271", saidaGaragem: "05:05", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-134", ordem: 134, linha: "225", tabela: "1", carroProgramado: "4228", saidaGaragem: "05:05", chegadaGaragem: "05:30", inicioLinha: "05:30", inicioBairro: "05:30", status: "PENDENTE" },
  { id: "vcg-mat-135", ordem: 135, linha: "212", tabela: "3", carroProgramado: "2319", saidaGaragem: "05:05", chegadaGaragem: "05:43", inicioLinha: "05:43", inicioBairro: "05:43", status: "PENDENTE" },
  { id: "vcg-mat-136", ordem: 136, linha: "81", tabela: "3", carroProgramado: "3205", saidaGaragem: "05:05", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-137", ordem: 137, linha: "234", tabela: "1/2", carroProgramado: "4208", saidaGaragem: "05:05", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-138", ordem: 138, linha: "303", tabela: "2", carroProgramado: "3014", saidaGaragem: "05:05", chegadaGaragem: "05:41", inicioLinha: "05:41", inicioBairro: "05:41", status: "PENDENTE" },
  { id: "vcg-mat-139", ordem: 139, linha: "246", tabela: "1", carroProgramado: "4015", saidaGaragem: "05:05", chegadaGaragem: "05:33", inicioLinha: "05:33", inicioBairro: "05:33", status: "PENDENTE" },
  { id: "vcg-mat-140", ordem: 140, linha: "70", tabela: "6", carroProgramado: "4237", saidaGaragem: "05:10", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-141", ordem: 141, linha: "50", tabela: "2", carroProgramado: "3903", saidaGaragem: "05:10", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-142", ordem: 142, linha: "421/085", tabela: "4/7", carroProgramado: "3281", saidaGaragem: "05:10", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-143", ordem: 143, linha: "81", tabela: "2", carroProgramado: "4190", saidaGaragem: "05:10", chegadaGaragem: "05:28", inicioLinha: "05:28", inicioBairro: "05:28", status: "PENDENTE" },
  { id: "vcg-mat-144", ordem: 144, linha: "203", tabela: "2", carroProgramado: "3900", saidaGaragem: "05:10", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-145", ordem: 145, linha: "205", tabela: "3", carroProgramado: "3904", saidaGaragem: "05:10", chegadaGaragem: "05:55", inicioLinha: "05:55", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcg-mat-146", ordem: 146, linha: "71", tabela: "3", carroProgramado: "4251", saidaGaragem: "05:12", chegadaGaragem: "05:32", inicioLinha: "05:32", inicioBairro: "05:32", status: "PENDENTE" },
  { id: "vcg-mat-147", ordem: 147, linha: "080", tabela: "9", carroProgramado: "4242", saidaGaragem: "05:13", chegadaGaragem: "05:48", inicioLinha: "05:48", inicioBairro: "05:48", status: "PENDENTE" },
  { id: "vcg-mat-148", ordem: 148, linha: "401", tabela: "3", carroProgramado: "4226", saidaGaragem: "05:13", chegadaGaragem: "05:43", inicioLinha: "05:43", inicioBairro: "05:43", status: "PENDENTE" },
  { id: "vcg-mat-149", ordem: 149, linha: "302/080", tabela: "88/7", carroProgramado: "3209", saidaGaragem: "05:15", chegadaGaragem: "04:50", inicioLinha: "04:50", inicioBairro: "04:50", status: "PENDENTE" },
  { id: "vcg-mat-150", ordem: 150, linha: "073", tabela: "4", carroProgramado: "", saidaGaragem: "05:15", chegadaGaragem: "05:35", inicioLinha: "05:35", inicioBairro: "05:35", status: "PENDENTE" },
  { id: "vcg-mat-151", ordem: 151, linha: "085", tabela: "2", carroProgramado: "3261", saidaGaragem: "05:15", chegadaGaragem: "06:05", inicioLinha: "06:05", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcg-mat-152", ordem: 152, linha: "081", tabela: "10", carroProgramado: "2706", saidaGaragem: "05:15", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-153", ordem: 153, linha: "051", tabela: "2", carroProgramado: "3253", saidaGaragem: "05:15", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-154", ordem: 154, linha: "206", tabela: "2", carroProgramado: "3096", saidaGaragem: "05:15", chegadaGaragem: "05:55", inicioLinha: "05:55", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcg-mat-155", ordem: 155, linha: "081", tabela: "5", carroProgramado: "3138", saidaGaragem: "05:15", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-156", ordem: 156, linha: "085", tabela: "3", carroProgramado: "4243", saidaGaragem: "05:15", chegadaGaragem: "05:35", inicioLinha: "05:35", inicioBairro: "05:35", status: "PENDENTE" },

  // ---------------------------------------------------------------------------------
  // PÁGINA 2 - COLUNA 02 (ORDENS 157 A 202) — OFICIAL CGU.REG.OP.0001 (Rev 1)
  // ---------------------------------------------------------------------------------
  { id: "vcg-mat-157", ordem: 157, linha: "414/080/222", tabela: "5/88/2", carroProgramado: "4194", saidaGaragem: "05:20", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-158", ordem: 158, linha: "418/414", tabela: "1/2", carroProgramado: "4238", saidaGaragem: "05:20", chegadaGaragem: "05:55", inicioLinha: "05:55", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcg-mat-159", ordem: 159, linha: "412", tabela: "4", carroProgramado: "3034", saidaGaragem: "05:20", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-160", ordem: 160, linha: "301", tabela: "4", carroProgramado: "4233", saidaGaragem: "05:20", chegadaGaragem: "05:55", inicioLinha: "05:55", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcg-mat-161", ordem: 161, linha: "321", tabela: "5", carroProgramado: "2426", saidaGaragem: "05:20", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-162", ordem: 162, linha: "403", tabela: "2", carroProgramado: "4230", saidaGaragem: "05:20", chegadaGaragem: "05:50", inicioLinha: "05:50", inicioBairro: "05:50", status: "PENDENTE" },
  { id: "vcg-mat-163", ordem: 163, linha: "237", tabela: "2", carroProgramado: "4189", saidaGaragem: "05:20", chegadaGaragem: "05:37", inicioLinha: "05:37", inicioBairro: "05:37", status: "PENDENTE" },
  { id: "vcg-mat-164", ordem: 164, linha: "474", tabela: "2", carroProgramado: "2615", saidaGaragem: "05:22", chegadaGaragem: "05:43", inicioLinha: "05:43", inicioBairro: "05:43", status: "PENDENTE" },
  { id: "vcg-mat-165", ordem: 165, linha: "71", tabela: "5", carroProgramado: "4272", saidaGaragem: "05:23", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-166", ordem: 166, linha: "416", tabela: "2", carroProgramado: "4256", saidaGaragem: "05:23", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-167", ordem: 167, linha: "309", tabela: "3", carroProgramado: "4184", saidaGaragem: "05:23", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-168", ordem: 168, linha: "86", tabela: "2", carroProgramado: "4252", saidaGaragem: "05:25", chegadaGaragem: "05:48", inicioLinha: "05:48", inicioBairro: "05:48", status: "PENDENTE" },
  { id: "vcg-mat-169", ordem: 169, linha: "224", tabela: "1", carroProgramado: "2702", saidaGaragem: "05:25", chegadaGaragem: "06:05", inicioLinha: "06:05", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcg-mat-170", ordem: 170, linha: "322/414", tabela: "1/4", carroProgramado: "", saidaGaragem: "05:25", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-171", ordem: 171, linha: "411/073", tabela: "88/6", carroProgramado: "", saidaGaragem: "05:25", chegadaGaragem: "05:45", inicioLinha: "05:45", inicioBairro: "05:45", status: "PENDENTE" },
  { id: "vcg-mat-172", ordem: 172, linha: "431/412", tabela: "1/7", carroProgramado: "", saidaGaragem: "05:25", chegadaGaragem: "06:23", inicioLinha: "06:23", inicioBairro: "06:23", status: "PENDENTE" },
  { id: "vcg-mat-173", ordem: 173, linha: "238/215", tabela: "1/7", carroProgramado: "3065", saidaGaragem: "05:25", chegadaGaragem: "05:40", inicioLinha: "05:40", inicioBairro: "05:40", status: "PENDENTE" },
  { id: "vcg-mat-174", ordem: 174, linha: "412/086", tabela: "88/3", carroProgramado: "", saidaGaragem: "05:25", chegadaGaragem: "05:47", inicioLinha: "05:47", inicioBairro: "05:47", status: "PENDENTE" },
  { id: "vcg-mat-175", ordem: 175, linha: "73", tabela: "9", carroProgramado: "4202", saidaGaragem: "05:27", chegadaGaragem: "06:00", inicioLinha: "06:00", inicioBairro: "06:00", status: "PENDENTE" },
  { id: "vcg-mat-176", ordem: 176, linha: "79", tabela: "8", carroProgramado: "", saidaGaragem: "05:28", chegadaGaragem: "05:58", inicioLinha: "05:58", inicioBairro: "05:58", status: "PENDENTE" },
  { id: "vcg-mat-177", ordem: 177, linha: "414", tabela: "6", carroProgramado: "", saidaGaragem: "05:28", chegadaGaragem: "06:21", inicioLinha: "06:21", inicioBairro: "06:21", status: "PENDENTE" },
  { id: "vcg-mat-178", ordem: 178, linha: "215", tabela: "6", carroProgramado: "3202", saidaGaragem: "05:30", chegadaGaragem: "06:15", inicioLinha: "06:15", inicioBairro: "06:15", status: "PENDENTE" },
  { id: "vcg-mat-179", ordem: 179, linha: "308/054", tabela: "88/4", carroProgramado: "4018", saidaGaragem: "05:30", chegadaGaragem: "05:52", inicioLinha: "05:52", inicioBairro: "05:52", status: "PENDENTE" },
  { id: "vcg-mat-180", ordem: 180, linha: "085", tabela: "8", carroProgramado: "4249", saidaGaragem: "05:32", chegadaGaragem: "05:55", inicioLinha: "05:55", inicioBairro: "05:55", status: "PENDENTE" },
  { id: "vcg-mat-181", ordem: 181, linha: "412/086", tabela: "88/4", carroProgramado: "4253", saidaGaragem: "05:35", chegadaGaragem: "06:07", inicioLinha: "06:07", inicioBairro: "06:07", status: "PENDENTE" },
  { id: "vcg-mat-182", ordem: 182, linha: "225", tabela: "2", carroProgramado: "", saidaGaragem: "05:35", chegadaGaragem: "06:05", inicioLinha: "06:05", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcg-mat-183", ordem: 183, linha: "215", tabela: "5", carroProgramado: "", saidaGaragem: "05:35", chegadaGaragem: "06:00", inicioLinha: "06:00", inicioBairro: "06:00", status: "PENDENTE" },
  { id: "vcg-mat-184", ordem: 184, linha: "412", tabela: "5", carroProgramado: "3099", saidaGaragem: "05:35", chegadaGaragem: "06:06", inicioLinha: "06:06", inicioBairro: "06:06", status: "PENDENTE" },
  { id: "vcg-mat-185", ordem: 185, linha: "414/242", tabela: "2/7", carroProgramado: "4017", saidaGaragem: "05:36", chegadaGaragem: "06:05", inicioLinha: "06:05", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcg-mat-186", ordem: 186, linha: "410/085", tabela: "1/4", carroProgramado: "3219", saidaGaragem: "05:40", chegadaGaragem: "06:14", inicioLinha: "06:14", inicioBairro: "06:14", status: "PENDENTE" },
  { id: "vcg-mat-187", ordem: 187, linha: "414", tabela: "8", carroProgramado: "", saidaGaragem: "05:44", chegadaGaragem: "06:15", inicioLinha: "06:15", inicioBairro: "06:15", status: "PENDENTE" },
  { id: "vcg-mat-188", ordem: 188, linha: "421/073", tabela: "3/5", carroProgramado: "4248", saidaGaragem: "05:45", chegadaGaragem: "06:15", inicioLinha: "06:15", inicioBairro: "06:15", status: "PENDENTE" },
  { id: "vcg-mat-189", ordem: 189, linha: "601", tabela: "2/3", carroProgramado: "3103", saidaGaragem: "05:45", chegadaGaragem: "06:05", inicioLinha: "06:05", inicioBairro: "06:05", status: "PENDENTE" },
  { id: "vcg-mat-190", ordem: 190, linha: "411/412", tabela: "88/8", carroProgramado: "2613", saidaGaragem: "05:45", chegadaGaragem: "06:15", inicioLinha: "06:15", inicioBairro: "06:15", status: "PENDENTE" },
  { id: "vcg-mat-191", ordem: 191, linha: "412/411", tabela: "6/6", carroProgramado: "2611", saidaGaragem: "05:50", chegadaGaragem: "06:15", inicioLinha: "06:15", inicioBairro: "06:15", status: "PENDENTE" },
  { id: "vcg-mat-192", ordem: 192, linha: "326", tabela: "1", carroProgramado: "4257", saidaGaragem: "05:55", chegadaGaragem: "06:32", inicioLinha: "06:32", inicioBairro: "06:32", status: "PENDENTE" },
  { id: "vcg-mat-193", ordem: 193, linha: "211", tabela: "3", carroProgramado: "", saidaGaragem: "05:55", chegadaGaragem: "06:32", inicioLinha: "06:32", inicioBairro: "06:32", observacoes: "2ª VOLTA", status: "PENDENTE" },
  { id: "vcg-mat-194", ordem: 194, linha: "414", tabela: "9", carroProgramado: "", saidaGaragem: "06:02", chegadaGaragem: "06:45", inicioLinha: "06:45", inicioBairro: "06:45", status: "PENDENTE" },
  { id: "vcg-mat-195", ordem: 195, linha: "321", tabela: "10", carroProgramado: "", saidaGaragem: "06:02", chegadaGaragem: "08:45", inicioLinha: "08:45", inicioBairro: "08:45", status: "PENDENTE" },
  { id: "vcg-mat-196", ordem: 196, linha: "421", tabela: "4", carroProgramado: "", saidaGaragem: "06:02", chegadaGaragem: "06:45", inicioLinha: "06:45", inicioBairro: "06:45", observacoes: "2ª VOLTA", status: "PENDENTE" },
  { id: "vcg-mat-197", ordem: 197, linha: "430", tabela: "1", carroProgramado: "", saidaGaragem: "06:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", status: "PENDENTE" },
  { id: "vcg-mat-198", ordem: 198, linha: "246", tabela: "2", carroProgramado: "", saidaGaragem: "06:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", observacoes: "2ª VOLTA", status: "PENDENTE" },

  // MOTORISTAS VCM QUE SAEM DA VCG
  { id: "vcg-mat-199", ordem: 199, linha: "316", tabela: "01", carroProgramado: "3109", saidaGaragem: "04:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", tipo: "VCM", observacoes: "VCM", status: "PENDENTE" },
  { id: "vcg-mat-200", ordem: 200, linha: "312", tabela: "2", carroProgramado: "3014", saidaGaragem: "", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", tipo: "VCM", observacoes: "VCM", status: "PENDENTE" },

  // ESPECIAL FRETAMENTO
  { id: "vcg-mat-201", ordem: 201, linha: "SISEP", tabela: "1", carroProgramado: "", saidaGaragem: "06:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", tipo: "FRETAMENTO", observacoes: "FRETAMENTO", status: "PENDENTE" },
  { id: "vcg-mat-202", ordem: 202, linha: "ESP.VCM", tabela: "1", carroProgramado: "", saidaGaragem: "06:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", tipo: "FRETAMENTO", observacoes: "FRETAMENTO", status: "PENDENTE" },
];

// Garantir que inicioBairro e inicioLinha contenham os horários da coluna Bairro / Chegada da planilha da soltura
vcgSegundaSextaMatutino.forEach(item => {
  if (item.chegadaGaragem) {
    item.inicioBairro = item.chegadaGaragem;
    item.inicioLinha = item.chegadaGaragem;
  }
});

// Folha Vespertino (10:30 até 17:40 - Completo 81 veículos)
export const vcgSegundaSextaVespertino: SolturaItem[] = [
  // --- SOLTURA VESPERTINA V.C.G. ---
  { id: "vcg-vesp-001", ordem: 1, linha: "326", tabela: "1", carroProgramado: "", saidaGaragem: "10:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-002", ordem: 2, linha: "401", tabela: "3", carroProgramado: "", saidaGaragem: "13:40", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-003", ordem: 3, linha: "354", tabela: "3", carroProgramado: "", saidaGaragem: "14:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-004", ordem: 4, linha: "412", tabela: "2", carroProgramado: "", saidaGaragem: "14:38", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-005", ordem: 5, linha: "317", tabela: "1", carroProgramado: "", saidaGaragem: "14:40", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-006", ordem: 6, linha: "303", tabela: "2", carroProgramado: "", saidaGaragem: "14:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-007", ordem: 7, linha: "225", tabela: "2", carroProgramado: "", saidaGaragem: "15:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-008", ordem: 8, linha: "227", tabela: "1", carroProgramado: "", saidaGaragem: "15:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-009", ordem: 9, linha: "076", tabela: "2", carroProgramado: "", saidaGaragem: "15:05", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-010", ordem: 10, linha: "321", tabela: "3", carroProgramado: "", saidaGaragem: "15:06", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-011", ordem: 11, linha: "412", tabela: "3", carroProgramado: "", saidaGaragem: "15:07", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-012", ordem: 12, linha: "317", tabela: "2", carroProgramado: "", saidaGaragem: "15:10", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-013", ordem: 13, linha: "414", tabela: "3", carroProgramado: "", saidaGaragem: "15:10", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-014", ordem: 14, linha: "051", tabela: "3", carroProgramado: "", saidaGaragem: "15:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-015", ordem: 15, linha: "321", tabela: "6", carroProgramado: "", saidaGaragem: "15:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-016", ordem: 16, linha: "212", tabela: "1", carroProgramado: "", saidaGaragem: "15:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-017", ordem: 17, linha: "408", tabela: "2", carroProgramado: "", saidaGaragem: "15:31", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-018", ordem: 18, linha: "412", tabela: "4", carroProgramado: "", saidaGaragem: "15:31", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-019", ordem: 19, linha: "215", tabela: "2", carroProgramado: "", saidaGaragem: "15:50", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-020", ordem: 20, linha: "215", tabela: "3", carroProgramado: "", saidaGaragem: "15:50", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-021", ordem: 21, linha: "073", tabela: "03", carroProgramado: "", saidaGaragem: "15:50", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-022", ordem: 22, linha: "081", tabela: "5", carroProgramado: "", saidaGaragem: "15:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-023", ordem: 23, linha: "414", tabela: "4", carroProgramado: "", saidaGaragem: "15:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-024", ordem: 24, linha: "403", tabela: "1", carroProgramado: "", saidaGaragem: "15:55", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-025", ordem: 25, linha: "212", tabela: "2", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-026", ordem: 26, linha: "216", tabela: "1", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-027", ordem: 27, linha: "423-071", tabela: "88-5", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-028", ordem: 28, linha: "414", tabela: "5", carroProgramado: "", saidaGaragem: "16:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-029", ordem: 29, linha: "325", tabela: "1", carroProgramado: "", saidaGaragem: "16:15", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-030", ordem: 30, linha: "307", tabela: "2", carroProgramado: "", saidaGaragem: "16:20", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-031", ordem: 31, linha: "321", tabela: "8", carroProgramado: "", saidaGaragem: "16:26", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-032", ordem: 32, linha: "086", tabela: "5", carroProgramado: "", saidaGaragem: "16:29", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-033", ordem: 33, linha: "431", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-034", ordem: 34, linha: "410-074-427", tabela: "1-88", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-035", ordem: 35, linha: "418", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-036", ordem: 36, linha: "322", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-037", ordem: 37, linha: "419-421", tabela: "1-4", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-038", ordem: 38, linha: "422-085", tabela: "1-88", carroProgramado: "", saidaGaragem: "16:30", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-039", ordem: 39, linha: "220", tabela: "1", carroProgramado: "", saidaGaragem: "16:35", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-040", ordem: 40, linha: "326", tabela: "1", carroProgramado: "", saidaGaragem: "16:35", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-041", ordem: 41, linha: "215", tabela: "4", carroProgramado: "", saidaGaragem: "16:38", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-042", ordem: 42, linha: "403", tabela: "2", carroProgramado: "", saidaGaragem: "16:40", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-043", ordem: 43, linha: "423-406", tabela: "88-88", carroProgramado: "", saidaGaragem: "17:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-044", ordem: 44, linha: "060-61", tabela: "1-1", carroProgramado: "", saidaGaragem: "17:00", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-045", ordem: 45, linha: "407", tabela: "2", carroProgramado: "", saidaGaragem: "17:05", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-046", ordem: 46, linha: "421", tabela: "03", carroProgramado: "", saidaGaragem: "17:10", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-047", ordem: 47, linha: "212", tabela: "5", carroProgramado: "", saidaGaragem: "17:22", observacoes: "V.C.G.", status: "PENDENTE" },
  { id: "vcg-vesp-048", ordem: 48, linha: "212", tabela: "4", carroProgramado: "", saidaGaragem: "17:30", observacoes: "V.C.G.", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. NOVA BAHIA ---
  { id: "vcg-vesp-049", ordem: 49, linha: "205", tabela: "3", carroProgramado: "", saidaGaragem: "14:10", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-050", ordem: 50, linha: "206", tabela: "2", carroProgramado: "", saidaGaragem: "15:00", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-051", ordem: 51, linha: "223", tabela: "1", carroProgramado: "", saidaGaragem: "15:00", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-052", ordem: 52, linha: "210", tabela: "4", carroProgramado: "", saidaGaragem: "15:10", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-053", ordem: 53, linha: "526", tabela: "1", carroProgramado: "", saidaGaragem: "15:23", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-054", ordem: 54, linha: "215", tabela: "1", carroProgramado: "", saidaGaragem: "15:30", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-055", ordem: 55, linha: "201", tabela: "1", carroProgramado: "", saidaGaragem: "15:50", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-056", ordem: 56, linha: "81", tabela: "4", carroProgramado: "", saidaGaragem: "16:03", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-057", ordem: 57, linha: "234-234", tabela: "1-88", carroProgramado: "", saidaGaragem: "16:16", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-058", ordem: 58, linha: "237", tabela: "2", carroProgramado: "", saidaGaragem: "16:30", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-059", ordem: 59, linha: "215", tabela: "5", carroProgramado: "", saidaGaragem: "16:45", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-060", ordem: 60, linha: "213", tabela: "2", carroProgramado: "", saidaGaragem: "17:03", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },
  { id: "vcg-vesp-061", ordem: 61, linha: "230", tabela: "1", carroProgramado: "", saidaGaragem: "17:40", observacoes: "T. NOVA BAHIA", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. GEN. OSÓRIO ---
  { id: "vcg-vesp-062", ordem: 62, linha: "601", tabela: "2", carroProgramado: "", saidaGaragem: "15:25", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-063", ordem: 63, linha: "214", tabela: "2", carroProgramado: "", saidaGaragem: "15:35", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-064", ordem: 64, linha: "473", tabela: "2", carroProgramado: "", saidaGaragem: "15:45", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-065", ordem: 65, linha: "229", tabela: "2", carroProgramado: "", saidaGaragem: "15:50", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-066", ordem: 66, linha: "246", tabela: "2", carroProgramado: "", saidaGaragem: "16:00", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-067", ordem: 67, linha: "203", tabela: "2", carroProgramado: "", saidaGaragem: "16:23", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-068", ordem: 68, linha: "212", tabela: "3", carroProgramado: "", saidaGaragem: "16:30", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-069", ordem: 69, linha: "424", tabela: "1", carroProgramado: "", saidaGaragem: "16:30", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },
  { id: "vcg-vesp-070", ordem: 70, linha: "217", tabela: "2", carroProgramado: "", saidaGaragem: "16:55", observacoes: "T. GEN. OSÓRIO", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. JÚLIO CASTILHO ---
  { id: "vcg-vesp-071", ordem: 71, linha: "413", tabela: "4", carroProgramado: "", saidaGaragem: "16:00", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-072", ordem: 72, linha: "412", tabela: "5", carroProgramado: "", saidaGaragem: "16:00", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-073", ordem: 73, linha: "86", tabela: "3", carroProgramado: "", saidaGaragem: "16:03", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-074", ordem: 74, linha: "473", tabela: "6", carroProgramado: "", saidaGaragem: "16:17", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-075", ordem: 75, linha: "423-086", tabela: "88-6", carroProgramado: "", saidaGaragem: "16:20", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-076", ordem: 76, linha: "471", tabela: "2", carroProgramado: "", saidaGaragem: "16:24", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },
  { id: "vcg-vesp-077", ordem: 77, linha: "430", tabela: "1", carroProgramado: "", saidaGaragem: "17:07", observacoes: "T. JÚLIO CASTILHO", status: "PENDENTE" },

  // --- SOLTURA VESPERTINA T. BANDEIRANTES ---
  { id: "vcg-vesp-078", ordem: 78, linha: "317", tabela: "3", carroProgramado: "", saidaGaragem: "15:37", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
  { id: "vcg-vesp-079", ordem: 79, linha: "304", tabela: "2", carroProgramado: "", saidaGaragem: "16:27", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
  { id: "vcg-vesp-080", ordem: 80, linha: "309", tabela: "1", carroProgramado: "", saidaGaragem: "16:40", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
  { id: "vcg-vesp-081", ordem: 81, linha: "309", tabela: "2", carroProgramado: "", saidaGaragem: "17:35", observacoes: "T. BANDEIRANTES", status: "PENDENTE" },
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
  { id: "vcg-sab-08", ordem: 8, linha: "211-216", tabela: "1", carroProgramado: "4277", saidaGaragem: "04:05", inicioBairro: "04:40", status: "PENDENTE" },
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

