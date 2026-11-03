import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { writeSafeRelease, AvailabilityError } from "../services/solturaAvailability";
import { MvpError } from "../services/mvpTemporal";
import { ZodError } from "zod";
import { readReleaseProgramming } from '../services/releaseProgramming';
import { releaseLineToken } from '../services/lineClearAudit';
import { clearReleaseLine } from '../services/releaseLineClear';

export async function programming(req: AuthRequest, res: Response) {
  try { return res.json(await readReleaseProgramming(prisma, req.query, req.userId)); }
  catch (error) {
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    if (error instanceof ZodError) return res.status(400).json({ error: 'Contexto de programacao invalido.' });
    return res.status(503).json({ error: 'Programacao da Soltura indisponivel. Recarregue antes de despachar.' });
  }
}

export async function list(req: AuthRequest, res: Response) {
  try {
    const { startDate, endDate, date, dataOperacao, garagem, turno, escalaTipo } = req.query;

    const where: any = {};
    // Linhas desfeitas ficam auditadas no banco, mas não são liberações ativas.
    where.OR = [{ status: null }, { status: { not: 'PENDENTE' } }];

    const opDate = (date as string) || (dataOperacao as string);
    if (opDate) {
      where.dataOperacao = opDate;
    } else if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (garagem) {
      where.garagem = garagem as string;
    }

    if (turno) {
      where.turno = turno as string;
    }

    if (escalaTipo) {
      where.escalaTipo = escalaTipo as string;
    }

    const records = await prisma.soltura.findMany({
      where,
      include: {
        bus: { select: { plate: true, prefix: true, model: true } },
        programmedBus: { select: { plate: true, prefix: true, model: true } },
        user: { select: { name: true } },
      },
      orderBy: [
        { dataOperacao: "desc" },
        { saidaGaragem: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Deserializar historicoTrocas se for string
    const formatted = records.map((r) => {
      let parsedTrocas = [];
      if (r.historicoTrocas) {
        try {
          parsedTrocas = typeof r.historicoTrocas === "string" ? JSON.parse(r.historicoTrocas) : r.historicoTrocas;
        } catch {
          parsedTrocas = [];
        }
      }
      return {
        ...r,
        baseLinha: releaseLineToken(r),
        historicoTrocas: parsedTrocas,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error("Erro ao listar solturas:", error);
    return res.status(500).json({ error: error?.message || "Erro interno ao listar solturas" });
  }
}

async function persist(req: AuthRequest, res: Response, batch: boolean) {
  try {
    const result = await writeSafeRelease(prisma, req.userId, req.body, batch);
    if ('items' in result) return res.json({ ...result, items: result.items.map(row => ({ ...row, baseLinha: releaseLineToken(row) })) });
    return res.json({ ...result, baseLinha: releaseLineToken(result) });
  }
  catch (error) {
    if (error instanceof AvailabilityError) return res.status(409).json({ code: error.code, error: error.message });
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    if (error instanceof ZodError) return res.status(400).json({ error: 'Contexto ou itens de soltura invalidos.' });
    return res.status(409).json({ code: 'DISPONIBILIDADE_NAO_CONFIRMADA', error: 'Consulta ou gravacao nao confirmada; nenhuma soltura autorizada por esta resposta. Recarregue o historico oficial antes de tentar novamente.' });
  }
}
export async function create(req: AuthRequest, res: Response) { return persist(req, res, false); }
export async function syncBatch(req: AuthRequest, res: Response) { return persist(req, res, true); }

export async function clearLine(req: AuthRequest, res: Response) {
  try { return res.json(await clearReleaseLine(prisma, req.userId, req.body)); }
  catch (error) {
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    if (error instanceof ZodError) return res.status(400).json({ error: 'Dados de limpeza inválidos. Recarregue a folha.' });
    return res.status(409).json({ error: 'Limpeza não confirmada. Recarregue antes de tentar novamente.' });
  }
}
