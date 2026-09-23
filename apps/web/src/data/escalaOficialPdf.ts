import { SolturaItem } from "./solturaData";

/**
 * ESCALA DIÁRIA DE VEÍCULOS EM OPERAÇÃO - GARAGEM V. C. GRANDE (VCG)
 * PLANO FUNCIONAL: SEGUNDA A SEXTA (2026)
 * Total de 200 horários oficiais do PDF
 */
export const escalaOficialPdfVCG: SolturaItem[] = [
  // --- PÁGINA 1 - BLOCO 1 (ORDENS 1 A 50) ---
  { id: "vcg-mat-001", ordem: 1, linha: "302/051", tabela: "1/1", saidaGaragem: "03:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3257", status: "PENDENTE" },
  { id: "vcg-mat-002", ordem: 2, linha: "308", tabela: "2", saidaGaragem: "03:55", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3204", status: "PENDENTE" },
  { id: "vcg-mat-003", ordem: 3, linha: "302/076", tabela: "2/1", saidaGaragem: "03:55", chegadaGaragem: "08:00", inicioLinha: "08:00", inicioBairro: "08:00", carroProgramado: "3098", status: "PENDENTE" },
  { id: "vcg-mat-004", ordem: 4, linha: "302/076", tabela: "88/2", saidaGaragem: "03:55", chegadaGaragem: "08:20", inicioLinha: "08:20", inicioBairro: "08:20", carroProgramado: "3022", status: "PENDENTE" },
  { id: "vcg-mat-005", ordem: 5, linha: "217", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4260", status: "PENDENTE" },
  { id: "vcg-mat-006", ordem: 6, linha: "413", tabela: "3", saidaGaragem: "04:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4197", status: "PENDENTE" },
  { id: "vcg-mat-007", ordem: 7, linha: "210", tabela: "2", saidaGaragem: "04:00", chegadaGaragem: "08:40", inicioLinha: "08:40", inicioBairro: "08:40", carroProgramado: "2323", status: "PENDENTE" },
  { id: "vcg-mat-008", ordem: 8, linha: "323", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4215", status: "PENDENTE" },
  { id: "vcg-mat-009", ordem: 9, linha: "317", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "08:20", inicioLinha: "08:20", inicioBairro: "08:20", carroProgramado: "3137", status: "PENDENTE" },
  { id: "vcg-mat-010", ordem: 10, linha: "321", tabela: "1", saidaGaragem: "04:00", chegadaGaragem: "08:30", inicioLinha: "08:30", inicioBairro: "08:30", carroProgramado: "4214", status: "PENDENTE" },
  { id: "vcg-mat-011", ordem: 11, linha: "215", tabela: "1", saidaGaragem: "04:05", chegadaGaragem: "07:50", inicioLinha: "07:50", inicioBairro: "07:50", carroProgramado: "2413", status: "PENDENTE" },
  { id: "vcg-mat-012", ordem: 12, linha: "211", tabela: "1", saidaGaragem: "04:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3267", status: "PENDENTE" },
  { id: "vcg-mat-013", ordem: 13, linha: "315", tabela: "1", saidaGaragem: "04:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3208", status: "PENDENTE" },
  { id: "vcg-mat-014", ordem: 14, linha: "302/079", tabela: "88/8", saidaGaragem: "04:10", chegadaGaragem: "07:00", inicioLinha: "07:00", inicioBairro: "07:00", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-015", ordem: 15, linha: "412/050", tabela: "9/1", saidaGaragem: "04:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4229", status: "PENDENTE" },
  { id: "vcg-mat-016", ordem: 16, linha: "237", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4220", status: "PENDENTE" },
  { id: "vcg-mat-017", ordem: 17, linha: "474", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2713", status: "PENDENTE" },
  { id: "vcg-mat-018", ordem: 18, linha: "204", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4266", status: "PENDENTE" },
  { id: "vcg-mat-019", ordem: 19, linha: "307", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3255", status: "PENDENTE" },
  { id: "vcg-mat-020", ordem: 20, linha: "212", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "08:02", inicioLinha: "08:02", inicioBairro: "08:02", carroProgramado: "2412", status: "PENDENTE" },
  { id: "vcg-mat-021", ordem: 21, linha: "413", tabela: "2", saidaGaragem: "04:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4219", status: "PENDENTE" },
  { id: "vcg-mat-022", ordem: 22, linha: "214", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4278", status: "PENDENTE" },
  { id: "vcg-mat-023", ordem: 23, linha: "414/085", tabela: "88/5", saidaGaragem: "04:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4270", status: "PENDENTE" },
  { id: "vcg-mat-024", ordem: 24, linha: "205", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3273", status: "PENDENTE" },
  { id: "vcg-mat-025", ordem: 25, linha: "229", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4272", status: "PENDENTE" },
  { id: "vcg-mat-026", ordem: 26, linha: "236", tabela: "2", saidaGaragem: "04:15", chegadaGaragem: "08:34", inicioLinha: "08:34", inicioBairro: "08:34", carroProgramado: "4231", status: "PENDENTE" },
  { id: "vcg-mat-027", ordem: 27, linha: "235", tabela: "1", saidaGaragem: "04:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4222", status: "PENDENTE" },
  { id: "vcg-mat-028", ordem: 28, linha: "408", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4234", status: "PENDENTE" },
  { id: "vcg-mat-029", ordem: 29, linha: "421", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4193", status: "PENDENTE" },
  { id: "vcg-mat-030", ordem: 30, linha: "306", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3279", status: "PENDENTE" },
  { id: "vcg-mat-031", ordem: 31, linha: "308", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3206", status: "PENDENTE" },
  { id: "vcg-mat-032", ordem: 32, linha: "302/081", tabela: "88/4", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4218", status: "PENDENTE" },
  { id: "vcg-mat-033", ordem: 33, linha: "203", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2711", status: "PENDENTE" },
  { id: "vcg-mat-034", ordem: 34, linha: "301", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3254", status: "PENDENTE" },
  { id: "vcg-mat-035", ordem: 35, linha: "213", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3222", status: "PENDENTE" },
  { id: "vcg-mat-036", ordem: 36, linha: "304", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3252", status: "PENDENTE" },
  { id: "vcg-mat-037", ordem: 37, linha: "210", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4274", status: "PENDENTE" },
  { id: "vcg-mat-038", ordem: 38, linha: "207", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3283", status: "PENDENTE" },
  { id: "vcg-mat-039", ordem: 39, linha: "321", tabela: "8", saidaGaragem: "04:20", chegadaGaragem: "08:45", inicioLinha: "08:45", inicioBairro: "08:45", carroProgramado: "3013", status: "PENDENTE" },
  { id: "vcg-mat-040", ordem: 40, linha: "325", tabela: "1", saidaGaragem: "04:20", chegadaGaragem: "08:30", inicioLinha: "08:30", inicioBairro: "08:30", carroProgramado: "3226", status: "PENDENTE" },
  { id: "vcg-mat-041", ordem: 41, linha: "401", tabela: "1", saidaGaragem: "04:22", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4261", status: "PENDENTE" },
  { id: "vcg-mat-042", ordem: 42, linha: "209", tabela: "1", saidaGaragem: "04:23", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3263", status: "PENDENTE" },
  { id: "vcg-mat-043", ordem: 43, linha: "217", tabela: "2", saidaGaragem: "04:23", chegadaGaragem: "07:53", inicioLinha: "07:53", inicioBairro: "07:53", carroProgramado: "4227", status: "PENDENTE" },
  { id: "vcg-mat-044", ordem: 44, linha: "414", tabela: "1", saidaGaragem: "04:25", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4239", status: "PENDENTE" },
  { id: "vcg-mat-045", ordem: 45, linha: "073/073", tabela: "88/3", saidaGaragem: "04:25", chegadaGaragem: "08:33", inicioLinha: "08:33", inicioBairro: "08:33", carroProgramado: "3959", status: "PENDENTE" },
  { id: "vcg-mat-046", ordem: 46, linha: "302/081", tabela: "88/6", saidaGaragem: "04:25", chegadaGaragem: "08:34", inicioLinha: "08:34", inicioBairro: "08:34", carroProgramado: "3147", status: "PENDENTE" },
  { id: "vcg-mat-047", ordem: 47, linha: "303", tabela: "1", saidaGaragem: "04:26", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4265", status: "PENDENTE" },
  { id: "vcg-mat-048", ordem: 48, linha: "321/302", tabela: "7/1", saidaGaragem: "04:28", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3953", status: "PENDENTE" },
  { id: "vcg-mat-049", ordem: 49, linha: "409", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4225", status: "PENDENTE" },
  { id: "vcg-mat-050", ordem: 50, linha: "070", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4246", status: "PENDENTE" },

  // --- PÁGINA 1 - BLOCO 2 (ORDENS 51 A 100) ---
  { id: "vcg-mat-051", ordem: 51, linha: "412/411", tabela: "1/1", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4223", status: "PENDENTE" },
  { id: "vcg-mat-052", ordem: 52, linha: "405", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3901", status: "PENDENTE" },
  { id: "vcg-mat-053", ordem: 53, linha: "085", tabela: "6", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4276", status: "PENDENTE" },
  { id: "vcg-mat-054", ordem: 54, linha: "421", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4192", status: "PENDENTE" },
  { id: "vcg-mat-055", ordem: 55, linha: "228", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3035", status: "PENDENTE" },
  { id: "vcg-mat-056", ordem: 56, linha: "220", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "08:20", inicioLinha: "08:20", inicioBairro: "08:20", carroProgramado: "2801", status: "PENDENTE" },
  { id: "vcg-mat-057", ordem: 57, linha: "403", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "07:45", inicioLinha: "07:45", inicioBairro: "07:45", carroProgramado: "4232", status: "PENDENTE" },
  { id: "vcg-mat-058", ordem: 58, linha: "073", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "07:52", inicioLinha: "07:52", inicioBairro: "07:52", carroProgramado: "2705", status: "PENDENTE" },
  { id: "vcg-mat-059", ordem: 59, linha: "306", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2351", status: "PENDENTE" },
  { id: "vcg-mat-060", ordem: 60, linha: "246/212", tabela: "2/5", saidaGaragem: "04:30", chegadaGaragem: "08:04", inicioLinha: "08:04", inicioBairro: "08:04", carroProgramado: "2410", status: "PENDENTE" },
  { id: "vcg-mat-061", ordem: 61, linha: "206", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4263", status: "PENDENTE" },
  { id: "vcg-mat-062", ordem: 62, linha: "215", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "08:22", inicioLinha: "08:22", inicioBairro: "08:22", carroProgramado: "2326", status: "PENDENTE" },
  { id: "vcg-mat-063", ordem: 63, linha: "227", tabela: "1", saidaGaragem: "04:30", chegadaGaragem: "09:35", inicioLinha: "09:35", inicioBairro: "09:35", carroProgramado: "2700", status: "PENDENTE" },
  { id: "vcg-mat-064", ordem: 64, linha: "309/051", tabela: "88/03", saidaGaragem: "04:30", chegadaGaragem: "08:50", inicioLinha: "08:50", inicioBairro: "08:50", carroProgramado: "4188", status: "PENDENTE" },
  { id: "vcg-mat-065", ordem: 65, linha: "214", tabela: "2", saidaGaragem: "04:30", chegadaGaragem: "08:40", inicioLinha: "08:40", inicioBairro: "08:40", carroProgramado: "2623", status: "PENDENTE" },
  { id: "vcg-mat-066", ordem: 66, linha: "317", tabela: "3", saidaGaragem: "04:30", chegadaGaragem: "08:45", inicioLinha: "08:45", inicioBairro: "08:45", carroProgramado: "3139", status: "PENDENTE" },
  { id: "vcg-mat-067", ordem: 67, linha: "411/073/424", tabela: "88/7/1", saidaGaragem: "04:30", chegadaGaragem: "07:15", inicioLinha: "07:15", inicioBairro: "07:15", carroProgramado: "4203", status: "PENDENTE" },
  { id: "vcg-mat-068", ordem: 68, linha: "302/321", tabela: "3/10", saidaGaragem: "04:30", chegadaGaragem: "08:38", inicioLinha: "08:38", inicioBairro: "08:38", carroProgramado: "3106", status: "PENDENTE" },
  { id: "vcg-mat-069", ordem: 69, linha: "071/071", tabela: "88/2", saidaGaragem: "04:34", chegadaGaragem: "07:32", inicioLinha: "07:32", inicioBairro: "07:32", carroProgramado: "4211", status: "PENDENTE" },
  { id: "vcg-mat-070", ordem: 70, linha: "307", tabela: "2", saidaGaragem: "04:35", chegadaGaragem: "08:45", inicioLinha: "08:45", inicioBairro: "08:45", carroProgramado: "3105", status: "PENDENTE" },
  { id: "vcg-mat-071", ordem: 71, linha: "208", tabela: "1", saidaGaragem: "04:35", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3261", status: "PENDENTE" },
  { id: "vcg-mat-072", ordem: 72, linha: "211", tabela: "2", saidaGaragem: "04:35", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3277", status: "PENDENTE" },
  { id: "vcg-mat-073", ordem: 73, linha: "223", tabela: "1", saidaGaragem: "04:35", chegadaGaragem: "09:30", inicioLinha: "09:30", inicioBairro: "09:30", carroProgramado: "2514", status: "PENDENTE" },
  { id: "vcg-mat-074", ordem: 74, linha: "226", tabela: "1", saidaGaragem: "04:35", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2352", status: "PENDENTE" },
  { id: "vcg-mat-075", ordem: 75, linha: "81", tabela: "8", saidaGaragem: "04:35", chegadaGaragem: "09:00", inicioLinha: "09:00", inicioBairro: "09:00", carroProgramado: "2421", status: "PENDENTE" },
  { id: "vcg-mat-076", ordem: 76, linha: "213", tabela: "2", saidaGaragem: "04:35", chegadaGaragem: "07:47", inicioLinha: "07:47", inicioBairro: "07:47", carroProgramado: "3224", status: "PENDENTE" },
  { id: "vcg-mat-077", ordem: 77, linha: "308/054", tabela: "4/2", saidaGaragem: "04:35", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3217", status: "PENDENTE" },
  { id: "vcg-mat-078", ordem: 78, linha: "073", tabela: "1", saidaGaragem: "04:37", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4243", status: "PENDENTE" },
  { id: "vcg-mat-079", ordem: 79, linha: "406", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4267", status: "PENDENTE" },
  { id: "vcg-mat-080", ordem: 80, linha: "407", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4255", status: "PENDENTE" },
  { id: "vcg-mat-081", ordem: 81, linha: "402", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4262", status: "PENDENTE" },
  { id: "vcg-mat-082", ordem: 82, linha: "237/526", tabela: "3/1", saidaGaragem: "04:40", chegadaGaragem: "09:10", inicioLinha: "09:10", inicioBairro: "09:10", carroProgramado: "4235", status: "PENDENTE" },
  { id: "vcg-mat-083", ordem: 83, linha: "414", tabela: "3", saidaGaragem: "04:40", chegadaGaragem: "07:42", inicioLinha: "07:42", inicioBairro: "07:42", carroProgramado: "4210", status: "PENDENTE" },
  { id: "vcg-mat-084", ordem: 84, linha: "305", tabela: "1", saidaGaragem: "04:40", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3951", status: "PENDENTE" },
  { id: "vcg-mat-085", ordem: 85, linha: "304/081", tabela: "2/9", saidaGaragem: "04:40", chegadaGaragem: "09:26", inicioLinha: "09:26", inicioBairro: "09:26", carroProgramado: "4195", status: "PENDENTE" },
  { id: "vcg-mat-086", ordem: 86, linha: "201/060", tabela: "01/01", saidaGaragem: "04:40", chegadaGaragem: "07:20", inicioLinha: "07:20", inicioBairro: "07:20", carroProgramado: "4191", status: "PENDENTE" },
  { id: "vcg-mat-087", ordem: 87, linha: "079", tabela: "3", saidaGaragem: "04:43", chegadaGaragem: "07:35", inicioLinha: "07:35", inicioBairro: "07:35", carroProgramado: "4185", status: "PENDENTE" },
  { id: "vcg-mat-088", ordem: 88, linha: "071", tabela: "1", saidaGaragem: "04:45", chegadaGaragem: "09:12", inicioLinha: "09:12", inicioBairro: "09:12", carroProgramado: "3100", status: "PENDENTE" },
  { id: "vcg-mat-089", ordem: 89, linha: "301", tabela: "2", saidaGaragem: "04:45", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3250", status: "PENDENTE" },
  { id: "vcg-mat-090", ordem: 90, linha: "209", tabela: "2", saidaGaragem: "04:45", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3952", status: "PENDENTE" },
  { id: "vcg-mat-091", ordem: 91, linha: "81", tabela: "1", saidaGaragem: "04:45", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2704", status: "PENDENTE" },
  { id: "vcg-mat-092", ordem: 92, linha: "212", tabela: "2", saidaGaragem: "04:45", chegadaGaragem: "08:31", inicioLinha: "08:31", inicioBairro: "08:31", carroProgramado: "2320", status: "PENDENTE" },
  { id: "vcg-mat-093", ordem: 93, linha: "313/054", tabela: "88/3", saidaGaragem: "04:45", chegadaGaragem: "09:23", inicioLinha: "09:23", inicioBairro: "09:23", carroProgramado: "4213", status: "PENDENTE" },
  { id: "vcg-mat-094", ordem: 94, linha: "321/302", tabela: "9/2", saidaGaragem: "04:47", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3958", status: "PENDENTE" },
  { id: "vcg-mat-095", ordem: 95, linha: "416", tabela: "1", saidaGaragem: "04:48", chegadaGaragem: "09:30", inicioLinha: "09:30", inicioBairro: "09:30", carroProgramado: "3078", status: "PENDENTE" },
  { id: "vcg-mat-096", ordem: 96, linha: "302/076", tabela: "4/4", saidaGaragem: "04:48", chegadaGaragem: "08:50", inicioLinha: "08:50", inicioBairro: "08:50", carroProgramado: "4206", status: "PENDENTE" },
  { id: "vcg-mat-097", ordem: 97, linha: "421/071", tabela: "88/4", saidaGaragem: "04:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4254", status: "PENDENTE" },
  { id: "vcg-mat-098", ordem: 98, linha: "401", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4268", status: "PENDENTE" },
  { id: "vcg-mat-099", ordem: 99, linha: "413", tabela: "4", saidaGaragem: "04:50", chegadaGaragem: "08:12", inicioLinha: "08:12", inicioBairro: "08:12", carroProgramado: "3132", status: "PENDENTE" },
  { id: "vcg-mat-100", ordem: 100, linha: "072", tabela: "1", saidaGaragem: "04:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3269", status: "PENDENTE" },

  // --- PÁGINA 1 - BLOCO 3 (ORDENS 101 A 150) ---
  { id: "vcg-mat-101", ordem: 101, linha: "229", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "09:20", inicioLinha: "09:20", inicioBairro: "09:20", carroProgramado: "4221", status: "PENDENTE" },
  { id: "vcg-mat-102", ordem: 102, linha: "223", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4273", status: "PENDENTE" },
  { id: "vcg-mat-103", ordem: 103, linha: "205", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3281", status: "PENDENTE" },
  { id: "vcg-mat-104", ordem: 104, linha: "210/234/210", tabela: "3/88/3", saidaGaragem: "04:50", chegadaGaragem: "07:00", inicioLinha: "07:00", inicioBairro: "07:00", carroProgramado: "3065", status: "PENDENTE" },
  { id: "vcg-mat-105", ordem: 105, linha: "408", tabela: "2", saidaGaragem: "04:50", chegadaGaragem: "07:34", inicioLinha: "07:34", inicioBairro: "07:34", carroProgramado: "3210", status: "PENDENTE" },
  { id: "vcg-mat-106", ordem: 106, linha: "412/414/412", tabela: "2/88/2", saidaGaragem: "04:50", chegadaGaragem: "08:35", inicioLinha: "08:35", inicioBairro: "08:35", carroProgramado: "4186", status: "PENDENTE" },
  { id: "vcg-mat-107", ordem: 107, linha: "73", tabela: "8", saidaGaragem: "04:52", chegadaGaragem: "08:27", inicioLinha: "08:27", inicioBairro: "08:27", carroProgramado: "4209", status: "PENDENTE" },
  { id: "vcg-mat-108", ordem: 108, linha: "413", tabela: "1", saidaGaragem: "04:55", chegadaGaragem: "08:28", inicioLinha: "08:28", inicioBairro: "08:28", carroProgramado: "4198", status: "PENDENTE" },
  { id: "vcg-mat-109", ordem: 109, linha: "070", tabela: "9", saidaGaragem: "04:55", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4241", status: "PENDENTE" },
  { id: "vcg-mat-110", ordem: 110, linha: "230", tabela: "1", saidaGaragem: "04:55", chegadaGaragem: "08:35", inicioLinha: "08:35", inicioBairro: "08:35", carroProgramado: "2327", status: "PENDENTE" },
  { id: "vcg-mat-111", ordem: 111, linha: "81", tabela: "11", saidaGaragem: "04:55", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4204", status: "PENDENTE" },
  { id: "vcg-mat-112", ordem: 112, linha: "54", tabela: "1", saidaGaragem: "04:55", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4245", status: "PENDENTE" },
  { id: "vcg-mat-113", ordem: 113, linha: "211", tabela: "3", saidaGaragem: "04:55", chegadaGaragem: "06:30", inicioLinha: "06:30", inicioBairro: "06:30", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-114", ordem: 114, linha: "406", tabela: "2", saidaGaragem: "04:55", chegadaGaragem: "07:28", inicioLinha: "07:28", inicioBairro: "07:28", carroProgramado: "3220", status: "PENDENTE" },
  { id: "vcg-mat-115", ordem: 115, linha: "085", tabela: "1", saidaGaragem: "04:57", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4236", status: "PENDENTE" },
  { id: "vcg-mat-116", ordem: 116, linha: "PLT/215", tabela: "4", saidaGaragem: "05:00", chegadaGaragem: "07:20", inicioLinha: "07:20", inicioBairro: "07:20", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-117", ordem: 117, linha: "409", tabela: "3", saidaGaragem: "05:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4264", status: "PENDENTE" },
  { id: "vcg-mat-118", ordem: 118, linha: "053", tabela: "4", saidaGaragem: "05:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4279", status: "PENDENTE" },
  { id: "vcg-mat-119", ordem: 119, linha: "601", tabela: "001A", saidaGaragem: "05:00", chegadaGaragem: "07:15", inicioLinha: "07:15", inicioBairro: "07:15", carroProgramado: "2355", status: "PENDENTE" },
  { id: "vcg-mat-120", ordem: 120, linha: "215", tabela: "3", saidaGaragem: "05:00", chegadaGaragem: "08:50", inicioLinha: "08:50", inicioBairro: "08:50", carroProgramado: "2424", status: "PENDENTE" },
  { id: "vcg-mat-121", ordem: 121, linha: "81", tabela: "7", saidaGaragem: "05:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4240", status: "PENDENTE" },
  { id: "vcg-mat-122", ordem: 122, linha: "407", tabela: "2", saidaGaragem: "05:00", chegadaGaragem: "08:29", inicioLinha: "08:29", inicioBairro: "08:29", carroProgramado: "4257", status: "PENDENTE" },
  { id: "vcg-mat-123", ordem: 123, linha: "321/302", tabela: "4/3", saidaGaragem: "05:00", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3957", status: "PENDENTE" },
  { id: "vcg-mat-124", ordem: 124, linha: "212", tabela: "4", saidaGaragem: "05:00", chegadaGaragem: "07:42", inicioLinha: "07:42", inicioBairro: "07:42", carroProgramado: "3136", status: "PENDENTE" },
  { id: "vcg-mat-125", ordem: 125, linha: "309/079", tabela: "3/5", saidaGaragem: "05:00", chegadaGaragem: "07:50", inicioLinha: "07:50", inicioBairro: "07:50", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-126", ordem: 126, linha: "317", tabela: "2", saidaGaragem: "05:00", chegadaGaragem: "07:35", inicioLinha: "07:35", inicioBairro: "07:35", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-127", ordem: 127, linha: "414/80/222/201", tabela: "4/88/4/1", saidaGaragem: "05:00", chegadaGaragem: "08:10", inicioLinha: "08:10", inicioBairro: "08:10", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-128", ordem: 128, linha: "321", tabela: "3", saidaGaragem: "05:02", chegadaGaragem: "07:37", inicioLinha: "07:37", inicioBairro: "07:37", carroProgramado: "3107", status: "PENDENTE" },
  { id: "vcg-mat-129", ordem: 129, linha: "222", tabela: "1", saidaGaragem: "05:03", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4230", status: "PENDENTE" },
  { id: "vcg-mat-130", ordem: 130, linha: "235", tabela: "2", saidaGaragem: "05:03", chegadaGaragem: "08:07", inicioLinha: "08:07", inicioBairro: "08:07", carroProgramado: "3214", status: "PENDENTE" },
  { id: "vcg-mat-131", ordem: 131, linha: "86", tabela: "1", saidaGaragem: "05:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4275", status: "PENDENTE" },
  { id: "vcg-mat-132", ordem: 132, linha: "246", tabela: "1", saidaGaragem: "05:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4015", status: "PENDENTE" },
  { id: "vcg-mat-133", ordem: 133, linha: "422", tabela: "1", saidaGaragem: "05:05", chegadaGaragem: "07:20", inicioLinha: "07:20", inicioBairro: "07:20", carroProgramado: "3950", status: "PENDENTE" },
  { id: "vcg-mat-134", ordem: 134, linha: "412", tabela: "3", saidaGaragem: "05:05", chegadaGaragem: "08:47", inicioLinha: "08:47", inicioBairro: "08:47", carroProgramado: "2420", status: "PENDENTE" },
  { id: "vcg-mat-135", ordem: 135, linha: "414/242", tabela: "2/1", saidaGaragem: "05:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4271", status: "PENDENTE" },
  { id: "vcg-mat-136", ordem: 136, linha: "225", tabela: "1", saidaGaragem: "05:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4228", status: "PENDENTE" },
  { id: "vcg-mat-137", ordem: 137, linha: "212", tabela: "3", saidaGaragem: "05:05", chegadaGaragem: "08:56", inicioLinha: "08:56", inicioBairro: "08:56", carroProgramado: "2325", status: "PENDENTE" },
  { id: "vcg-mat-138", ordem: 138, linha: "81", tabela: "3", saidaGaragem: "05:05", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3205", status: "PENDENTE" },
  { id: "vcg-mat-139", ordem: 139, linha: "234", tabela: "1", saidaGaragem: "05:05", chegadaGaragem: "08:25", inicioLinha: "08:25", inicioBairro: "08:25", carroProgramado: "4207", status: "PENDENTE" },
  { id: "vcg-mat-140", ordem: 140, linha: "303", tabela: "2", saidaGaragem: "05:05", chegadaGaragem: "08:00", inicioLinha: "08:00", inicioBairro: "08:00", carroProgramado: "3230", status: "PENDENTE" },
  { id: "vcg-mat-141", ordem: 141, linha: "070", tabela: "6", saidaGaragem: "05:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4237", status: "PENDENTE" },
  { id: "vcg-mat-142", ordem: 142, linha: "050", tabela: "2", saidaGaragem: "05:10", chegadaGaragem: "10:00", inicioLinha: "10:00", inicioBairro: "10:00", carroProgramado: "4258", status: "PENDENTE" },
  { id: "vcg-mat-143", ordem: 143, linha: "421", tabela: "4", saidaGaragem: "05:10", chegadaGaragem: "07:22", inicioLinha: "07:22", inicioBairro: "07:22", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-144", ordem: 144, linha: "81", tabela: "2", saidaGaragem: "05:10", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4190", status: "PENDENTE" },
  { id: "vcg-mat-145", ordem: 145, linha: "203", tabela: "2", saidaGaragem: "05:10", chegadaGaragem: "08:00", inicioLinha: "08:00", inicioBairro: "08:00", carroProgramado: "2715", status: "PENDENTE" },
  { id: "vcg-mat-146", ordem: 146, linha: "205", tabela: "3", saidaGaragem: "05:10", chegadaGaragem: "08:40", inicioLinha: "08:40", inicioBairro: "08:40", carroProgramado: "2409", status: "PENDENTE" },
  { id: "vcg-mat-147", ordem: 147, linha: "071", tabela: "3", saidaGaragem: "05:12", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4251", status: "PENDENTE" },
  { id: "vcg-mat-148", ordem: 148, linha: "080", tabela: "9", saidaGaragem: "05:13", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4247", status: "PENDENTE" },
  { id: "vcg-mat-149", ordem: 149, linha: "401", tabela: "3", saidaGaragem: "05:13", chegadaGaragem: "08:27", inicioLinha: "08:27", inicioBairro: "08:27", carroProgramado: "2710", status: "PENDENTE" },
  { id: "vcg-mat-150", ordem: 150, linha: "302/080", tabela: "88/7", saidaGaragem: "05:15", chegadaGaragem: "06:15", inicioLinha: "06:15", inicioBairro: "06:15", carroProgramado: "3209", status: "PENDENTE" },

  // --- PÁGINA 2 - BLOCO 1 (ORDENS 151 A 196) ---
  { id: "vcg-mat-151", ordem: 151, linha: "73", tabela: "4", saidaGaragem: "05:15", chegadaGaragem: "08:14", inicioLinha: "08:14", inicioBairro: "08:14", carroProgramado: "4178", status: "PENDENTE" },
  { id: "vcg-mat-152", ordem: 152, linha: "085", tabela: "2", saidaGaragem: "05:15", chegadaGaragem: "08:10", inicioLinha: "08:10", inicioBairro: "08:10", carroProgramado: "4187", status: "PENDENTE" },
  { id: "vcg-mat-153", ordem: 153, linha: "81", tabela: "10", saidaGaragem: "05:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2706", status: "PENDENTE" },
  { id: "vcg-mat-154", ordem: 154, linha: "51", tabela: "2", saidaGaragem: "05:15", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3253", status: "PENDENTE" },
  { id: "vcg-mat-155", ordem: 155, linha: "206", tabela: "2", saidaGaragem: "05:15", chegadaGaragem: "08:20", inicioLinha: "08:20", inicioBairro: "08:20", carroProgramado: "3228", status: "PENDENTE" },
  { id: "vcg-mat-156", ordem: 156, linha: "81", tabela: "5", saidaGaragem: "05:15", chegadaGaragem: "09:45", inicioLinha: "09:45", inicioBairro: "09:45", carroProgramado: "3138", status: "PENDENTE" },
  { id: "vcg-mat-157", ordem: 157, linha: "85", tabela: "3", saidaGaragem: "05:15", chegadaGaragem: "08:28", inicioLinha: "08:28", inicioBairro: "08:28", carroProgramado: "4212", status: "PENDENTE" },
  { id: "vcg-mat-158", ordem: 158, linha: "414/080/222", tabela: "5/88/2", saidaGaragem: "05:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4217", status: "PENDENTE" },
  { id: "vcg-mat-159", ordem: 159, linha: "418 / 414", tabela: "1/2", saidaGaragem: "05:20", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4238", status: "PENDENTE" },
  { id: "vcg-mat-160", ordem: 160, linha: "412", tabela: "4", saidaGaragem: "05:20", chegadaGaragem: "09:02", inicioLinha: "09:02", inicioBairro: "09:02", carroProgramado: "3034", status: "PENDENTE" },
  { id: "vcg-mat-161", ordem: 161, linha: "237", tabela: "2", saidaGaragem: "05:20", chegadaGaragem: "08:15", inicioLinha: "08:15", inicioBairro: "08:15", carroProgramado: "2426", status: "PENDENTE" },
  { id: "vcg-mat-162", ordem: 162, linha: "301", tabela: "4", saidaGaragem: "05:20", chegadaGaragem: "07:50", inicioLinha: "07:50", inicioBairro: "07:50", carroProgramado: "4226", status: "PENDENTE" },
  { id: "vcg-mat-163", ordem: 163, linha: "321", tabela: "5", saidaGaragem: "05:20", chegadaGaragem: "08:05", inicioLinha: "08:05", inicioBairro: "08:05", carroProgramado: "4189", status: "PENDENTE" },
  { id: "vcg-mat-164", ordem: 164, linha: "403", tabela: "2", saidaGaragem: "05:20", chegadaGaragem: "08:25", inicioLinha: "08:25", inicioBairro: "08:25", carroProgramado: "3904", status: "PENDENTE" },
  { id: "vcg-mat-165", ordem: 165, linha: "421 / 430", tabela: "88/01", saidaGaragem: "05:20", chegadaGaragem: "07:47", inicioLinha: "07:47", inicioBairro: "07:47", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-166", ordem: 166, linha: "474", tabela: "2", saidaGaragem: "05:22", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4233", status: "PENDENTE" },
  { id: "vcg-mat-167", ordem: 167, linha: "71", tabela: "5", saidaGaragem: "05:23", chegadaGaragem: "08:10", inicioLinha: "08:10", inicioBairro: "08:10", carroProgramado: "4196", status: "PENDENTE" },
  { id: "vcg-mat-168", ordem: 168, linha: "416", tabela: "2", saidaGaragem: "05:23", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4256", status: "PENDENTE" },
  { id: "vcg-mat-169", ordem: 169, linha: "086", tabela: "2", saidaGaragem: "05:25", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4252", status: "PENDENTE" },
  { id: "vcg-mat-170", ordem: 170, linha: "224", tabela: "1", saidaGaragem: "05:25", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2702", status: "PENDENTE" },
  { id: "vcg-mat-171", ordem: 171, linha: "322 / 414", tabela: "1/4", saidaGaragem: "05:25", chegadaGaragem: "07:54", inicioLinha: "07:54", inicioBairro: "07:54", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-172", ordem: 172, linha: "411 / 073", tabela: "88/6", saidaGaragem: "05:25", chegadaGaragem: "07:56", inicioLinha: "07:56", inicioBairro: "07:56", carroProgramado: "4016", status: "PENDENTE" },
  { id: "vcg-mat-173", ordem: 173, linha: "431 / 412", tabela: "1/7", saidaGaragem: "05:25", chegadaGaragem: "08:05", inicioLinha: "08:05", inicioBairro: "08:05", carroProgramado: "4248", status: "PENDENTE" },
  { id: "vcg-mat-174", ordem: 174, linha: "411/085/418", tabela: "88/7/", saidaGaragem: "05:25", chegadaGaragem: "08:20", inicioLinha: "08:20", inicioBairro: "08:20", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-175", ordem: 175, linha: "238/215", tabela: "01/07", saidaGaragem: "05:45", chegadaGaragem: "08:15", inicioLinha: "08:15", inicioBairro: "08:15", carroProgramado: "2625", status: "PENDENTE" },
  { id: "vcg-mat-176", ordem: 176, linha: "412 / 086", tabela: "88 / 3", saidaGaragem: "05:25", chegadaGaragem: "08:41", inicioLinha: "08:41", inicioBairro: "08:41", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-177", ordem: 177, linha: "073", tabela: "9", saidaGaragem: "05:27", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4202", status: "PENDENTE" },
  { id: "vcg-mat-178", ordem: 178, linha: "414", tabela: "6", saidaGaragem: "05:28", chegadaGaragem: "08:28", inicioLinha: "08:28", inicioBairro: "08:28", carroProgramado: "2627", status: "PENDENTE" },
  { id: "vcg-mat-179", ordem: 179, linha: "215", tabela: "6", saidaGaragem: "05:30", chegadaGaragem: "07:40", inicioLinha: "07:40", inicioBairro: "07:40", carroProgramado: "3108", status: "PENDENTE" },
  { id: "vcg-mat-180", ordem: 180, linha: "308/054", tabela: "88/4", saidaGaragem: "05:30", chegadaGaragem: "08:21", inicioLinha: "08:21", inicioBairro: "08:21", carroProgramado: "4018", status: "PENDENTE" },
  { id: "vcg-mat-181", ordem: 181, linha: "085", tabela: "8", saidaGaragem: "05:32", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4249", status: "PENDENTE" },
  { id: "vcg-mat-182", ordem: 182, linha: "412 / 086", tabela: "88/4", saidaGaragem: "05:35", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4253", status: "PENDENTE" },
  { id: "vcg-mat-183", ordem: 183, linha: "225", tabela: "2", saidaGaragem: "05:35", chegadaGaragem: "08:40", inicioLinha: "08:40", inicioBairro: "08:40", carroProgramado: "2615", status: "PENDENTE" },
  { id: "vcg-mat-184", ordem: 184, linha: "215", tabela: "5", saidaGaragem: "05:35", chegadaGaragem: "07:20", inicioLinha: "07:20", inicioBairro: "07:20", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-185", ordem: 185, linha: "412", tabela: "5", saidaGaragem: "05:35", chegadaGaragem: "09:17", inicioLinha: "09:17", inicioBairro: "09:17", carroProgramado: "3133", status: "PENDENTE" },
  { id: "vcg-mat-186", ordem: 186, linha: "414 / 242", tabela: "7/2", saidaGaragem: "05:36", chegadaGaragem: "09:00", inicioLinha: "09:00", inicioBairro: "09:00", carroProgramado: "4017", status: "PENDENTE" },
  { id: "vcg-mat-187", ordem: 187, linha: "SISEP", tabela: "1", saidaGaragem: "05:40", chegadaGaragem: "07:50", inicioLinha: "07:50", inicioBairro: "07:50", carroProgramado: "3057", status: "PENDENTE" },
  { id: "vcg-mat-188", ordem: 188, linha: "410 / 085", tabela: "01/04", saidaGaragem: "05:40", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "3219", status: "PENDENTE" },
  { id: "vcg-mat-189", ordem: 189, linha: "414", tabela: "8", saidaGaragem: "05:44", chegadaGaragem: "07:44", inicioLinha: "07:44", inicioBairro: "07:44", carroProgramado: "3140", status: "PENDENTE" },
  { id: "vcg-mat-190", ordem: 190, linha: "421 / 073", tabela: "3/5", saidaGaragem: "05:45", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "4250", status: "PENDENTE" },
  { id: "vcg-mat-191", ordem: 191, linha: "601", tabela: "2/3", saidaGaragem: "05:45", chegadaGaragem: "08:25", inicioLinha: "08:25", inicioBairro: "08:25", carroProgramado: "3103", status: "PENDENTE" },
  { id: "vcg-mat-192", ordem: 192, linha: "411 / 412", tabela: "88/8", saidaGaragem: "05:45", chegadaGaragem: "08:00", inicioLinha: "08:00", inicioBairro: "08:00", carroProgramado: "", status: "PENDENTE" },
  { id: "vcg-mat-193", ordem: 193, linha: "412 / 411", tabela: "6/6", saidaGaragem: "05:50", chegadaGaragem: "", inicioLinha: "", inicioBairro: "", carroProgramado: "2611", status: "PENDENTE" },
  { id: "vcg-mat-194", ordem: 194, linha: "326", tabela: "1", saidaGaragem: "05:55", chegadaGaragem: "08:25", inicioLinha: "08:25", inicioBairro: "08:25", carroProgramado: "3903", status: "PENDENTE" },
  { id: "vcg-mat-195", ordem: 195, linha: "414", tabela: "9", saidaGaragem: "06:02", chegadaGaragem: "08:02", inicioLinha: "08:02", inicioBairro: "08:02", carroProgramado: "4194", status: "PENDENTE" },
  { id: "vcg-mat-196", ordem: 196, linha: "309", tabela: "2", saidaGaragem: "04:40", chegadaGaragem: "08:10", inicioLinha: "08:10", inicioBairro: "08:10", carroProgramado: "2425", status: "PENDENTE" },

  // --- PÁGINA 2 - BLOCO 2 (ORDENS 197 A 200) ---
  { id: "vcg-mat-197", ordem: 197, linha: "316", tabela: "1", saidaGaragem: "04:10", chegadaGaragem: "08:40", inicioLinha: "08:40", inicioBairro: "08:40", carroProgramado: "2423", status: "PENDENTE" },
  { id: "vcg-mat-198", ordem: 198, linha: "312", tabela: "2", saidaGaragem: "04:15", chegadaGaragem: "08:50", inicioLinha: "08:50", inicioBairro: "08:50", carroProgramado: "3096", status: "PENDENTE" },
  { id: "vcg-mat-199", ordem: 199, linha: "082", tabela: "3", saidaGaragem: "04:37", chegadaGaragem: "08:15", inicioLinha: "08:15", inicioBairro: "08:15", carroProgramado: "3021", status: "PENDENTE" },
  { id: "vcg-mat-200", ordem: 200, linha: "313/070", tabela: "88/10", saidaGaragem: "05:20", chegadaGaragem: "09:05", inicioLinha: "09:05", inicioBairro: "09:05", carroProgramado: "3109", status: "PENDENTE" }
];

// --- PAINEL LATERAL OPERACIONAL VCG (DADOS DO PDF) ---

export const reservasGaragemVCG_Azul = [
  "4182", "4183", "4181", "2319",
  "4180", "4224", "2613", "4269",
  "4184-3026", "3014", "3028", "2411", "3008", "3134"
];

export const reservasGaragemVCG_Vermelho = [
  "4205", "4244", "3216", "4216",
  "4242-3202", "3099", "4277", "3003"
];

export const reservasGaragemVCG_Micro = [
  "4201", "3148", "4208",
  "4259", "3900", "3902", "3004"
];

export const bloqueadosCIPadraoPDF = [
  { prefixo: "3006", motivo: "Bloqueado CI - Manutenção" },
  { prefixo: "4199-4200", motivo: "Bloqueado CI - Manutenção" },
  { prefixo: "2800-2600", motivo: "Bloqueado CI - Manutenção" },
  { prefixo: "3005-2712", motivo: "Bloqueado CI - Manutenção" }
];

export interface RabichoItem {
  id: string;
  linha: string;
  tab: string;
  carro: string;
}

export const rabichoPadraoPDF: RabichoItem[] = [
  { id: "rab-1", linha: "470", tab: "1", carro: "" },
  { id: "rab-2", linha: "470", tab: "7", carro: "" },
  { id: "rab-3", linha: "480", tab: "7", carro: "" },
  { id: "rab-4", linha: "480", tab: "9", carro: "" }
];

export interface TerminalReservaPDF {
  terminal: string;
  carro: string;
  horario: string;
}

export const terminaisReservaPDF: TerminalReservaPDF[] = [
  { terminal: "TERMINAL GENERAL OSORIO", carro: "3271", horario: "04:30" },
  { terminal: "TERMINAL NOVA BAHIA", carro: "4207", horario: "04:30" },
  { terminal: "TERMINAL BANDEIRANTES", carro: "", horario: "04:40" }
];

export const carrosExtrasPDF = [
  { linha: "VCM", tab: "3141", horario: "", carro: "" }
];
