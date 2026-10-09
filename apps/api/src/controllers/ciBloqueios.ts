import { explicitGarage } from '../services/operationalAccess';
import { assertC4Read } from '../services/c4Authorization';
import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { saveCI } from "../services/mvpLegado";
import { MvpError } from "../services/mvpTemporal";
import { ZodError } from "zod";
import { enabledGarages, garage, civil, mutationMode } from '../services/c4Temporal';
import { readContext, saveC4 } from '../services/c4Flow';
import { operationalContext } from '../services/mvpTemporal';

export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 1. Listar Bloqueios da CI com filtros
export async function list(req: AuthRequest, res: Response) {
  try {
    const { garagem, status, categoria, data } = req.query;
    const enabled = enabledGarages();
    if (enabled.length && (!garagem || garagem === 'TODAS')) return res.status(400).json({ error: 'C4 exige contexto explicito VCG ou VCM.' });
    if (enabled.length) garage(garagem);
    if (enabled.includes(garagem as 'VCG' | 'VCM')) {
      await assertC4Read(prisma, req.userId, garage(garagem));
      const snapshot = await readContext(prisma, garage(garagem), operationalContext().today);
      return res.json(snapshot.ci.filter(i => (!data || i.data === civil(data)) && (!categoria || i.categoriaPlanilha === categoria) && (!status || i.status === status)));
    }
    const where: any = {};
    if (data) where.dataBloqueio = String(data);

    // Identificação da Garagem Física do Usuário Logado (VCG ou VCM)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { garagem: true, email: true, role: true }
    });

    const userGaragem = explicitGarage(user);
    if (user?.role !== 'ADMIN' && !userGaragem) throw new MvpError(403, 'Usuario sem garagem cadastrada.');

    const isAdmin = user?.role === "ADMIN";
    const effectiveGaragem = (!isAdmin && userGaragem)
      ? userGaragem
      : (garagem && garagem !== "TODAS" ? String(garagem).toUpperCase() : undefined);
    if (enabled.includes(effectiveGaragem as 'VCG' | 'VCM')) throw new MvpError(400, 'Consulte a garagem C4 explicitamente; legado nao e fallback.');

    if (effectiveGaragem) {
      where.garagem = effectiveGaragem;
    }

    if (status) {
      where.status = String(status);
    }

    if (categoria) {
      where.categoria = String(categoria);
    }

    const records = await prisma.ciBloqueio.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { dataBloqueio: "desc" },
        { prefixo: "asc" },
      ],
    });

    // Se o usuário estiver restrito a VCG ou VCM, garante estritamente que apenas frotas de sua garagem física sejam retornadas
    let filteredRecords = records;
    if (effectiveGaragem === "VCG" || effectiveGaragem === "VCM") {
      filteredRecords = records.filter((r) => {
        const clean = (r.prefixo || "").replace(/\D/g, "");
        const carroGaragem = (clean.startsWith("1") || clean === "2002") ? "VCM" : "VCG";
        return carroGaragem === effectiveGaragem;
      });
    }

    // Formatar para manter compatibilidade com a interface BloqueioCarro do frontend
    const mapped = filteredRecords.map((r) => {
      const motivoLower = (r.motivo || "").toLowerCase();
      let tipo = "EM_MANUTENCAO";
      if (motivoLower.includes("motor")) {
        tipo = "BLOQUEADO_MOTOR";
      } else if (motivoLower.includes("freio")) {
        tipo = "BLOQUEADO_FREIO";
      } else if (motivoLower.includes("mola") || motivoLower.includes("suspens")) {
        tipo = "BLOQUEADO_MOLA";
      } else if (motivoLower.includes("câmbio") || motivoLower.includes("cambio") || motivoLower.includes("transmiss")) {
        tipo = "BLOQUEADO_CAMBIO";
      } else if (motivoLower.includes("elétrica") || motivoLower.includes("eletrica") || motivoLower.includes("módulo") || motivoLower.includes("modulo")) {
        tipo = "BLOQUEADO_MODULO";
      } else if (motivoLower.includes("sinistro")) {
        tipo = "BLOQUEADO_SINISTRO";
      } else if (r.categoria === "PREVENTIVA") {
        tipo = "REFORCO_REVISAO";
      }

      return {
        id: r.id,
        updatedAt: r.updatedAt,
        prefixo: (r.prefixo || "").trim(),
        garagem: r.garagem,
        consorciada: r.consorciada,
        categoriaPlanilha: r.categoria,
        setorOficina: r.categoria === "OFICINA" ? r.subTipo : undefined,
        tipoPreventiva: r.categoria === "PREVENTIVA" ? r.subTipo : undefined,
        horarioReforco: r.horarioReforco,
        tipo,
        motivo: r.motivo || "",
        data: r.dataBloqueio,
        hora: r.horaBloqueio,
        gravidade: r.gravidade || "ALTA",
        responsavel: r.responsavel,
        os: r.observacoes,
        status: r.status,
        dataLiberacao: r.dataLiberacao,
        motivoLiberacao: r.motivoLiberacao,
        responsavelLiberacao: r.responsavelLiberacao,
      };
    });

    return res.json(mapped);
  } catch (error: any) {
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    console.error("[CI Bloqueios] Erro ao listar bloqueios:", error);
    return res.status(500).json({ error: "Erro ao consultar CI; nenhum fallback representa sucesso." });
  }
}

// Snapshots direcionados: frontend manda contexto e versao lida antes da edicao.
export async function sync(req: AuthRequest, res: Response) {
  try {
    return res.json(mutationMode(req.body.garagem) === 'C4' ? await saveC4(prisma, req.userId, req.body, 'ci') : await saveCI(prisma, req.userId, req.body));
  }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && ['P2034', 'P2002'].includes(String(error.code))) return res.status(409).json({ error: 'Conflito concorrente. Recarregue CI e Controle.' });
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    if (error instanceof ZodError) return res.status(400).json({ error: 'Dados invalidos para CI.' });
    return res.status(500).json({ error: 'CI nao foi salva. Recarregue e tente novamente.' });
  }
}
// Contratos antigos sem contexto/versao nao podem continuar alterando historico.
export async function createOrUpdate(_req: AuthRequest, res: Response) {
  return res.status(409).json({ error: 'Use sincronizacao da CI com data, itens e versao atual.' });
}
export const release = createOrUpdate;
export const remove = createOrUpdate;
