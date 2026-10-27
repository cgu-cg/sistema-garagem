import { z } from "zod";
import { hasValidReleaseTable } from '../services/solturaTemplateTable';
import { releaseExchangeCommandSchema } from '../services/releaseVehicleExchange';

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.string().refine((v) => ["ADMIN", "COLABORADOR", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR_CONTROLE_OPERACIONAL"].includes(v), "Tipo inválido"),
  garagem: z.string().nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.string().refine((v) => ["ADMIN", "COLABORADOR", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA", "COLABORADOR_CONTROLE_OPERACIONAL"].includes(v), "Tipo inválido").optional(),
  garagem: z.string().nullable().optional(),
});

export const createBusSchema = z.object({
  plate: z.string().min(1, "Placa obrigatória"),
  prefix: z.string().min(1, "Prefixo obrigatório"),
  model: z.string().min(1, "Modelo obrigatório"),
});

export const createAbastecimentoSchema = z.object({
  litersT1: z.number().positive("Litros do tanque 1 deve ser positivo"),
  fotoT1: z.string().min(1, "Foto do tanque 1 é obrigatória"),
  litersT2: z.number().positive("Litros do tanque 2 deve ser positivo"),
  fotoT2: z.string().min(1, "Foto do tanque 2 é obrigatória"),
  litersT3: z.number().positive("Litros do tanque 3 deve ser positivo").nullable().optional(),
  fotoT3: z.string().min(1, "Foto do tanque 3 é obrigatória").nullable().optional(),
});

export const createSolturaFields = z.object({
  busId: z.number().int().positive().optional().nullable(),
  programmedBusId: z.number().int().positive().optional().nullable(),
  scheduleId: z.string().optional().nullable(),
  carroProgramado: z.string().optional().nullable(),
  carroRealizado: z.string().optional().nullable(),
  linha: z.string().min(1, "Linha é obrigatória"),
  tabela: z.string(),
  driverCode: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  saidaGaragem: z.string().optional().nullable(),
  inicioLinha: z.string().optional().nullable(),
  horaLiberacao: z.string().optional().nullable(),
  garagem: z.string().optional().nullable(),
  turno: z.string().optional().nullable(),
  escalaTipo: z.string().optional().nullable(),
  dataOperacao: z.string().optional().nullable(),
  substituido: z.boolean().optional().nullable(),
  historicoTrocas: z.union([z.string(), z.array(z.any())]).optional().nullable(),
  trocaCarro: releaseExchangeCommandSchema.optional(),
  status: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export const createSolturaSchema = createSolturaFields.superRefine((item, ctx) => {
  if (!hasValidReleaseTable(item)) ctx.addIssue({ code: 'custom', path: ['tabela'], message: 'Tabela obrigatoria, exceto fretamentos identificados no molde.' });
});

export const batchSyncSolturaSchema = z.object({
  dataOperacao: z.string().min(1, "Data de operação é obrigatória"),
  garagem: z.string().min(1, "Garagem é obrigatória"),
  turno: z.string().optional().nullable(),
  escalaTipo: z.string().optional().nullable(),
  items: z.array(
    z.object({
      scheduleId: z.string().min(1),
      carroProgramado: z.string().optional().nullable(),
      carroRealizado: z.string().optional().nullable(),
      linha: z.string().min(1),
      tabela: z.string(),
      driverCode: z.string().optional().nullable(),
      driverName: z.string().optional().nullable(),
      saidaGaragem: z.string().optional().nullable(),
      inicioLinha: z.string().optional().nullable(),
      horaLiberacao: z.string().optional().nullable(),
      substituido: z.boolean().optional().nullable(),
      historicoTrocas: z.union([z.string(), z.array(z.any())]).optional().nullable(),
      trocaCarro: releaseExchangeCommandSchema.optional(),
      status: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
}).superRefine((payload, ctx) => {
  payload.items.forEach((item, index) => {
    if (!hasValidReleaseTable({ ...payload, ...item })) ctx.addIssue({ code: 'custom', path: ['items', index, 'tabela'], message: 'Tabela obrigatoria, exceto fretamentos identificados no molde.' });
  });
});

export const consisteCatracaQuerySchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  minDiff: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
});

export const datasIncorretasQuerySchema = z.object({
  startDate: z.string().optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
});

export const foraFrotaQuerySchema = z.object({
  startDate: z.string().optional(),
});

export const backupStatusQuerySchema = z.object({
  ids: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id))
        : undefined
    ),
});

export const updateBackupSchema = z.object({
  ids: z.array(z.number().int().positive("Carro inválido")),
  coletaBKPIni: z.string().min(1, "Data inicial de backup é obrigatória"),
  coletaBKPFim: z.string().min(1, "Data final de backup é obrigatória"),
});

export const detalhesVeiculoQuerySchema = z.object({
  idVeiculo: z.string().transform((v) => parseInt(v, 10)),
  date: z.string().min(1, "Data é obrigatória"),
});

export const startSessionSchema = z.object({
  matricula: z.string().min(1, "Matrícula do funcionário é obrigatória"),
  b1Ini: z.number().nullable().optional(),
  b2Ini: z.number().nullable().optional(),
  b3Ini: z.number().nullable().optional(),
  b4Ini: z.number().nullable().optional(),
  b5Ini: z.number().nullable().optional(),
  b6Ini: z.number().nullable().optional(),
});

export const finishSessionSchema = z.object({
  sessionId: z.number().int().positive("ID da sessão inválido"),
  b1Fim: z.number().nullable().optional(),
  b2Fim: z.number().nullable().optional(),
  b3Fim: z.number().nullable().optional(),
  b4Fim: z.number().nullable().optional(),
  b5Fim: z.number().nullable().optional(),
  b6Fim: z.number().nullable().optional(),
});

export const createAbastecimentoCarroItemSchema = z.object({
  sessionId: z.number().int().positive("ID da sessão inválido"),
  carro: z.string().min(1, "Veículo é obrigatório"),
  liters: z.number().positive("Litros deve ser maior que zero"),
  bomba: z.string().min(1, "Bomba é obrigatória"),
  foto: z.string().min(1, "Foto é obrigatória"),
});

export const createReservaTerminalSchema = z.object({
  carro: z.string().min(1, "Carro é obrigatório"),
  tipo: z.enum(["VERMELHO", "AZUL", "CORINGA", "MICRO", "ARTICULADO"]),
  terminal: z.string().min(1, "Terminal é obrigatório"),
  garagem: z.string().optional(),
});


