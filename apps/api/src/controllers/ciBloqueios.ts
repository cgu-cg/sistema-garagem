import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { saveCI } from "../services/mvpLegado";
import { MvpError } from "../services/mvpTemporal";
import { ZodError } from "zod";

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
    const where: any = {};
    if (data) where.dataBloqueio = String(data);

    // Identificação da Garagem Física do Usuário Logado (VCG ou VCM)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { garagem: true, email: true, role: true }
    });

    let userGaragem = user?.garagem?.toUpperCase();
    if (!userGaragem) {
      const emailLower = (user?.email || "").toLowerCase();
      if (emailLower.includes("vcg")) userGaragem = "VCG";
      else if (emailLower.includes("vcm")) userGaragem = "VCM";
    }

    const isAdmin = user?.role === "ADMIN";
    const effectiveGaragem = (!isAdmin && userGaragem)
      ? userGaragem
      : (garagem && garagem !== "TODAS" ? String(garagem).toUpperCase() : undefined);

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
    console.error("[CI Bloqueios] Erro ao listar bloqueios:", error);
    return res.status(500).json({ error: "Erro ao consultar CI; nenhum fallback representa sucesso." });
  }
}

// Snapshots direcionados: frontend manda contexto e versao lida antes da edicao.
export async function sync(req: AuthRequest, res: Response) {
  try { return res.json(await saveCI(prisma, req.userId, req.body)); }
  catch (error) {
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
