import { Router } from "express";
import { authenticate, authorize, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createBusSchema,
  createAbastecimentoSchema,
  createSolturaSchema,
  batchSyncSolturaSchema,
  startSessionSchema,
  finishSessionSchema,
  createAbastecimentoCarroItemSchema,
  createReservaTerminalSchema,
} from "../utils/schemas";

import * as authController from "../controllers/auth";
import * as usersController from "../controllers/users";
import * as groupsController from "../controllers/groups";
import * as busesController from "../controllers/buses";
import * as abastecimentoController from "../controllers/abastecimento";
import * as abastecimentoCarroController from "../controllers/abastecimentoCarro";
import * as solturaController from "../controllers/soltura";
import * as reservasTerminaisController from "../controllers/reservasTerminais";
import * as catracasController from "../controllers/catracas";
import * as controleOperacionalController from "../controllers/controleOperacional";
import * as ciBloqueiosController from "../controllers/ciBloqueios";
import * as manutencaoController from "../controllers/manutencao";
import * as c4Controller from '../controllers/c4';

const router: Router = Router();

// Auth
router.post("/auth/login", validate(loginSchema), authController.login);
router.get("/auth/me", authenticate, authController.me);

// Users (admin only)
router.get("/users", authenticate, requireRole("ADMIN"), usersController.list);
router.post("/users", authenticate, requireRole("ADMIN"), validate(createUserSchema), usersController.create);
router.put("/users/:id", authenticate, requireRole("ADMIN"), validate(updateUserSchema), usersController.update);
router.delete("/users/:id", authenticate, requireRole("ADMIN"), usersController.remove);

// Groups (admin only)
router.get("/groups", authenticate, authorize("ADMIN"), groupsController.list);
router.post("/groups", authenticate, authorize("ADMIN"), groupsController.create);
router.put("/groups/:id", authenticate, authorize("ADMIN"), groupsController.update);
router.delete("/groups/:id", authenticate, authorize("ADMIN"), groupsController.remove);

// Buses
router.get("/buses", authenticate, busesController.list);
router.get("/buses/inventory", authenticate, controleOperacionalController.listVeiculos);
router.post("/buses", authenticate, authorize("ADMIN"), validate(createBusSchema), busesController.create);

// Abastecimento
router.get("/abastecimentos", authenticate, authorize("ADMIN", "tanque", "abastecimento"), abastecimentoController.list);
router.post("/abastecimentos", authenticate, authorize("ADMIN", "tanque", "abastecimento"), validate(createAbastecimentoSchema), abastecimentoController.create);

// Abastecimento por Carro
router.get("/abastecimento-carro/session/active", authenticate, authorize("ADMIN", "abastecimento"), abastecimentoCarroController.getActiveSession);
router.post("/abastecimento-carro/session/start", authenticate, authorize("ADMIN", "abastecimento"), validate(startSessionSchema), abastecimentoCarroController.startSession);
router.post("/abastecimento-carro/item", authenticate, authorize("ADMIN", "abastecimento"), validate(createAbastecimentoCarroItemSchema), abastecimentoCarroController.createItem);
router.post("/abastecimento-carro/session/finish", authenticate, authorize("ADMIN", "abastecimento"), validate(finishSessionSchema), abastecimentoCarroController.finishSession);
router.get("/abastecimento-carro/sessions", authenticate, authorize("ADMIN", "abastecimento"), abastecimentoCarroController.listSessions);
router.get("/abastecimento-carro/sessions/:id", authenticate, authorize("ADMIN", "abastecimento"), abastecimentoCarroController.getSessionDetails);

// Soltura
router.get("/solturas", authenticate, authorize("ADMIN", "soltura"), solturaController.list);
router.post("/solturas", authenticate, authorize("ADMIN", "soltura"), validate(createSolturaSchema), solturaController.create);
router.post("/solturas/batch-sync", authenticate, authorize("ADMIN", "soltura"), validate(batchSyncSolturaSchema), solturaController.syncBatch);
router.get("/solturas/reservas-terminais", authenticate, authorize("ADMIN", "soltura", "COLABORADOR"), reservasTerminaisController.list);
router.post("/solturas/reservas-terminais", authenticate, authorize("ADMIN", "soltura"), validate(createReservaTerminalSchema), reservasTerminaisController.create);
router.delete("/solturas/reservas-terminais/:id", authenticate, authorize("ADMIN", "soltura"), reservasTerminaisController.remove);

// Catracas
router.use("/catracas", authenticate, requireRole("ADMIN"));
router.get("/catracas/consistencia", catracasController.getConsistenciaCatraca);
router.get("/catracas/datas-incorretas", catracasController.getDatasIncorretas);
router.get("/catracas/fora-frota", catracasController.getVeiculosForaFrota);
router.get("/catracas/veiculo-servicos", catracasController.getVeiculoServicos);
router.get("/catracas/backup", catracasController.getBackupStatus);
router.post("/catracas/backup/update", catracasController.updateBackupStatus);
router.get("/catracas/detalhes-veiculo", catracasController.getDetalhesVeiculo);
router.get("/catracas/diarios", catracasController.getDiarios);

// Controle Operacional
router.get("/controle-operacional", authenticate, controleOperacionalController.list);
router.get("/controle-operacional/veiculos", authenticate, controleOperacionalController.listVeiculos);
router.get("/controle-operacional/linhas", authenticate, controleOperacionalController.listLinhas);
router.post("/controle-operacional", authenticate, authorize("ADMIN", "operacional"), controleOperacionalController.create);
router.delete("/controle-operacional/:id", authenticate, authorize("ADMIN"), controleOperacionalController.remove);
router.put("/controle-operacional/:id", authenticate, authorize("ADMIN", "operacional"), controleOperacionalController.update);

// CI Manutenção & Bloqueios de Veículos (Soltura & Manutenção)
router.get("/ci-bloqueios", authenticate, ciBloqueiosController.list);
router.get('/c4/contexto', authenticate, c4Controller.context);
router.post("/ci-bloqueios", authenticate, ciBloqueiosController.createOrUpdate);
router.post("/ci-bloqueios/release", authenticate, ciBloqueiosController.release);
router.post("/ci-bloqueios/sync", authenticate, ciBloqueiosController.sync);
router.delete("/ci-bloqueios/:id", authenticate, ciBloqueiosController.remove);

// Manutenção (Controle de Frota)
router.get("/manutencao", authenticate, manutencaoController.list);
router.post("/manutencao", authenticate, manutencaoController.createOrUpdate);
router.put("/manutencao/:id", authenticate, manutencaoController.update);
router.delete("/manutencao/:id", authenticate, manutencaoController.remove);
router.post("/manutencao/sync", authenticate, manutencaoController.sync);
router.post("/manutencao/clear-list", authenticate, manutencaoController.clearList);
router.post("/manutencao/reset", authenticate, manutencaoController.reset);

export default router;

