import { operationalAccess } from '../middleware/operationalAccess';
import * as maintenanceBoardController from '../controllers/maintenanceBoard';
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
import * as releaseLifecycleController from '../controllers/releaseLifecycle';
import * as reservasTerminaisController from "../controllers/reservasTerminais";
import * as catracasController from "../controllers/catracas";
import * as controleOperacionalController from "../controllers/controleOperacional";
import * as ciBloqueiosController from "../controllers/ciBloqueios";
import * as manutencaoController from "../controllers/manutencao";
import * as c4Controller from '../controllers/c4';
import * as escalaCarrosController from '../controllers/escalaCarros';

const router: Router = Router();

router.get("/escala-carros", authenticate, operationalAccess('scale'), escalaCarrosController.list);
router.post("/escala-carros", authenticate, operationalAccess('admin'), escalaCarrosController.save);
router.get("/escala-carros/diaria", authenticate, operationalAccess('scale'), escalaCarrosController.listDaily);
router.post("/escala-carros/diaria", authenticate, operationalAccess('scaleWrite'), escalaCarrosController.saveDaily);

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
router.get("/solturas", authenticate, operationalAccess('dispatch'), solturaController.list);
router.get("/solturas/programacao", authenticate, operationalAccess('dispatch'), solturaController.programming);
router.get('/solturas/estado', authenticate, operationalAccess('dispatch'), releaseLifecycleController.read);
router.post('/solturas/estado', authenticate, operationalAccess('releaseLifecycle'), releaseLifecycleController.change);
router.get('/solturas/relatorio', authenticate, operationalAccess('dispatch'), releaseLifecycleController.report);
router.post("/solturas", authenticate, operationalAccess('dispatch'), validate(createSolturaSchema), solturaController.create);
router.post("/solturas/batch-sync", authenticate, operationalAccess('dispatch'), validate(batchSyncSolturaSchema), solturaController.syncBatch);
router.get("/solturas/reservas-terminais", authenticate, operationalAccess('reservations'), reservasTerminaisController.list);
router.post("/solturas/reservas-terminais", authenticate, operationalAccess('dispatch'), validate(createReservaTerminalSchema), reservasTerminaisController.create);
router.delete("/solturas/reservas-terminais/:id", authenticate, operationalAccess('deleteReservation'), reservasTerminaisController.remove);

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
router.get("/ci-bloqueios", authenticate, operationalAccess('read'), ciBloqueiosController.list);
router.get('/c4/contexto', authenticate, operationalAccess('read'), c4Controller.context);
router.post('/c4/ci/estado', authenticate, operationalAccess('read'), c4Controller.lifecycle);
router.post("/ci-bloqueios", authenticate, operationalAccess('read'), ciBloqueiosController.createOrUpdate);
router.post("/ci-bloqueios/release", authenticate, operationalAccess('read'), ciBloqueiosController.release);
router.post("/ci-bloqueios/sync", authenticate, operationalAccess('read'), ciBloqueiosController.sync);
router.delete("/ci-bloqueios/:id", authenticate, operationalAccess('read'), ciBloqueiosController.remove);

// Manutenção (Controle de Frota)
router.get("/manutencao", authenticate, operationalAccess('read'), maintenanceBoardController.list);
router.post("/manutencao", authenticate, operationalAccess('read'), manutencaoController.createOrUpdate);
router.put("/manutencao/:id", authenticate, operationalAccess('read'), manutencaoController.update);
router.delete("/manutencao/:id", authenticate, operationalAccess('read'), manutencaoController.remove);
router.post("/manutencao/sync", authenticate, operationalAccess('read'), maintenanceBoardController.save);
router.post("/manutencao/clear-list", authenticate, operationalAccess('read'), manutencaoController.clearList);
router.post("/manutencao/reset", authenticate, operationalAccess('read'), maintenanceBoardController.list);

export default router;

