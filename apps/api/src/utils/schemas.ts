import { z } from "zod";

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

export const createSolturaSchema = z.object({
  busId: z.number().int().positive("Ônibus realizado inválido"),
  programmedBusId: z.number().int().positive().optional().nullable(),
  linha: z.string().min(1, "Linha é obrigatória"),
  tabela: z.string().min(1, "Tabela é obrigatória"),
  driverCode: z.string().min(1, "Código do motorista (MOTO) é obrigatório"),
  driverName: z.string().min(1, "Nome do motorista é obrigatório"),
  saidaGaragem: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de saída inválido (HH:mm)"),
  inicioLinha: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de início inválido (HH:mm)"),
  notes: z.string().optional().nullable(),
});

export const consisteCatracaQuerySchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  minDiff: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
});

export const datasIncorretasQuerySchema = z.object({
  startDate: z.string().optional(),
  year: z.string().optional(),
});

export const foraFrotaQuerySchema = z.object({
  startDate: z.string().optional(),
});

export const backupStatusQuerySchema = z.object({
  ids: z.string().min(1, "IDs de carros obrigatórios").transform((v) =>
    v.split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
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

