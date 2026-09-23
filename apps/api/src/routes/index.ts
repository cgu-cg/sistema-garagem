import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
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

const router: Router = Router();

// Auth
router.post("/auth/login", validate(loginSchema), authController.login);
router.get("/auth/me", authenticate, authController.me);

// Users (admin only)
router.get("/users", authenticate, authorize("ADMIN"), usersController.list);
router.post("/users", authenticate, authorize("ADMIN"), validate(createUserSchema), usersController.create);
router.put("/users/:id", authenticate, authorize("ADMIN"), validate(updateUserSchema), usersController.update);
router.delete("/users/:id", authenticate, authorize("ADMIN"), usersController.remove);

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
router.get("/catracas/consistencia", authenticate, catracasController.getConsistenciaCatraca);
router.get("/catracas/datas-incorretas", authenticate, catracasController.getDatasIncorretas);
router.get("/catracas/fora-frota", authenticate, catracasController.getVeiculosForaFrota);
router.get("/catracas/veiculo-servicos", authenticate, catracasController.getVeiculoServicos);
router.get("/catracas/backup", authenticate, catracasController.getBackupStatus);
router.post("/catracas/backup/update", authenticate, catracasController.updateBackupStatus);
router.get("/catracas/detalhes-veiculo", authenticate, catracasController.getDetalhesVeiculo);
router.get("/catracas/diarios", authenticate, catracasController.getDiarios);

// Controle Operacional
router.get("/controle-operacional", authenticate, controleOperacionalController.list);
router.get("/controle-operacional/veiculos", authenticate, controleOperacionalController.listVeiculos);
router.get("/controle-operacional/linhas", authenticate, controleOperacionalController.listLinhas);
router.post("/controle-operacional", authenticate, authorize("ADMIN", "operacional"), controleOperacionalController.create);
router.delete("/controle-operacional/:id", authenticate, authorize("ADMIN"), controleOperacionalController.remove);
router.put("/controle-operacional/:id", authenticate, authorize("ADMIN", "operacional"), controleOperacionalController.update);

export default router;

