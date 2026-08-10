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
} from "../utils/schemas";

import * as authController from "../controllers/auth";
import * as usersController from "../controllers/users";
import * as busesController from "../controllers/buses";
import * as abastecimentoController from "../controllers/abastecimento";
import * as solturaController from "../controllers/soltura";
import * as catracasController from "../controllers/catracas";

const router = Router();

// Auth
router.post("/auth/login", validate(loginSchema), authController.login);
router.get("/auth/me", authenticate, authController.me);

// Users (admin only)
router.get("/users", authenticate, authorize("ADMIN"), usersController.list);
router.post("/users", authenticate, authorize("ADMIN"), validate(createUserSchema), usersController.create);
router.put("/users/:id", authenticate, authorize("ADMIN"), validate(updateUserSchema), usersController.update);
router.delete("/users/:id", authenticate, authorize("ADMIN"), usersController.remove);

// Buses
router.get("/buses", authenticate, busesController.list);
router.post("/buses", authenticate, authorize("ADMIN"), validate(createBusSchema), busesController.create);

// Abastecimento
router.get("/abastecimentos", authenticate, authorize("ADMIN", "COLABORADOR_ABASTECIMENTO"), abastecimentoController.list);
router.post("/abastecimentos", authenticate, authorize("ADMIN", "COLABORADOR_ABASTECIMENTO"), validate(createAbastecimentoSchema), abastecimentoController.create);

// Soltura
router.get("/solturas", authenticate, authorize("ADMIN", "COLABORADOR_SOLTURA"), solturaController.list);
router.post("/solturas", authenticate, authorize("ADMIN", "COLABORADOR_SOLTURA"), validate(createSolturaSchema), solturaController.create);

// Catracas
router.get("/catracas/consistencia", authenticate, catracasController.getConsistenciaCatraca);
router.get("/catracas/datas-incorretas", authenticate, catracasController.getDatasIncorretas);
router.get("/catracas/fora-frota", authenticate, catracasController.getVeiculosForaFrota);
router.get("/catracas/veiculo-servicos", authenticate, catracasController.getVeiculoServicos);
router.get("/catracas/backup", authenticate, catracasController.getBackupStatus);
router.post("/catracas/backup/update", authenticate, catracasController.updateBackupStatus);
router.get("/catracas/detalhes-veiculo", authenticate, catracasController.getDetalhesVeiculo);
router.get("/catracas/diarios", authenticate, catracasController.getDiarios);

export default router;

