import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.string().refine((v) => ["ADMIN", "COLABORADOR", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA"].includes(v), "Tipo inválido"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.string().refine((v) => ["ADMIN", "COLABORADOR", "COLABORADOR_ABASTECIMENTO", "COLABORADOR_SOLTURA"].includes(v), "Tipo inválido").optional(),
});

export const createBusSchema = z.object({
  plate: z.string().min(1, "Placa obrigatória"),
  prefix: z.string().min(1, "Prefixo obrigatório"),
  model: z.string().min(1, "Modelo obrigatório"),
});

export const createAbastecimentoSchema = z.object({
  busId: z.number().int().positive("Ônibus inválido"),
  liters: z.number().positive("Litros deve ser positivo"),
  value: z.number().positive("Valor deve ser positivo"),
  driverName: z.string().min(1, "Nome do motorista obrigatório"),
  odometer: z.number().int().positive("Odômetro deve ser positivo"),
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
