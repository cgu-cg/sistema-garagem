import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function list(req: AuthRequest, res: Response) {
  try {
    const { startDate, endDate, date, dataOperacao, garagem, turno, escalaTipo } = req.query;

    const where: any = {};

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
        historicoTrocas: parsedTrocas,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error("Erro ao listar solturas:", error);
    return res.status(500).json({ error: error?.message || "Erro interno ao listar solturas" });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const {
      busId,
      programmedBusId,
      scheduleId,
      carroProgramado,
      carroRealizado,
      linha,
      tabela,
      driverCode,
      driverName,
      saidaGaragem,
      inicioLinha,
      horaLiberacao,
      garagem,
      turno,
      escalaTipo,
      dataOperacao,
      substituido,
      historicoTrocas,
      status,
      notes,
    } = req.body;

    const strHistoricoTrocas =
      typeof historicoTrocas === "object" && historicoTrocas !== null
        ? JSON.stringify(historicoTrocas)
        : typeof historicoTrocas === "string"
        ? historicoTrocas
        : null;

    // Verificar se já existe registro desse scheduleId para a dataOperacao e garagem
    let existing = null;
    if (scheduleId && dataOperacao) {
      existing = await prisma.soltura.findFirst({
        where: {
          scheduleId,
          dataOperacao,
          ...(garagem ? { garagem } : {}),
          ...(turno ? { turno } : {}),
        },
      });
    }

    if (existing) {
      const updated = await prisma.soltura.update({
        where: { id: existing.id },
        data: {
          busId: busId ?? existing.busId,
          programmedBusId: programmedBusId ?? existing.programmedBusId,
          carroProgramado: carroProgramado ?? existing.carroProgramado,
          carroRealizado: carroRealizado ?? existing.carroRealizado,
          linha: linha ?? existing.linha,
          tabela: tabela ?? existing.tabela,
          driverCode: driverCode ?? existing.driverCode,
          driverName: driverName ?? existing.driverName,
          saidaGaragem: saidaGaragem ?? existing.saidaGaragem,
          inicioLinha: inicioLinha ?? existing.inicioLinha,
          horaLiberacao: horaLiberacao ?? existing.horaLiberacao,
          garagem: garagem ?? existing.garagem,
          turno: turno ?? existing.turno,
          escalaTipo: escalaTipo ?? existing.escalaTipo,
          substituido: substituido ?? existing.substituido,
          historicoTrocas: strHistoricoTrocas ?? existing.historicoTrocas,
          status: status ?? existing.status,
          notes: notes ?? existing.notes,
          userId: req.userId ?? existing.userId,
        },
      });
      return res.json(updated);
    }

    const record = await prisma.soltura.create({
      data: {
        busId: busId || null,
        programmedBusId: programmedBusId || null,
        scheduleId: scheduleId || null,
        carroProgramado: carroProgramado || null,
        carroRealizado,
        linha,
        tabela,
        driverCode: driverCode || null,
        driverName: driverName || null,
        saidaGaragem: saidaGaragem || null,
        inicioLinha: inicioLinha || null,
        horaLiberacao: horaLiberacao || null,
        garagem: garagem || null,
        turno: turno || null,
        escalaTipo: escalaTipo || null,
        dataOperacao: dataOperacao || null,
        substituido: !!substituido,
        historicoTrocas: strHistoricoTrocas,
        status: status || "LIBERADO",
        notes: notes || null,
        userId: req.userId || null,
      },
      include: {
        bus: { select: { plate: true, prefix: true } },
        programmedBus: { select: { plate: true, prefix: true } },
      },
    });

    return res.status(201).json(record);
  } catch (error: any) {
    console.error("Erro ao salvar soltura:", error);
    return res.status(500).json({ error: error?.message || "Erro interno ao salvar soltura" });
  }
}

export async function syncBatch(req: AuthRequest, res: Response) {
  try {
    const { dataOperacao, garagem, turno, escalaTipo, items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Array de items obrigatório" });
    }

    const savedRecords = [];

    for (const item of items) {
      const strHistoricoTrocas =
        typeof item.historicoTrocas === "object" && item.historicoTrocas !== null
          ? JSON.stringify(item.historicoTrocas)
          : typeof item.historicoTrocas === "string"
          ? item.historicoTrocas
          : null;

      let existing = await prisma.soltura.findFirst({
        where: {
          scheduleId: item.scheduleId,
          dataOperacao,
          ...(garagem ? { garagem } : {}),
          ...(turno ? { turno } : {}),
        },
      });

      if (existing) {
        const updated = await prisma.soltura.update({
          where: { id: existing.id },
          data: {
            carroProgramado: item.carroProgramado ?? existing.carroProgramado,
            carroRealizado: item.carroRealizado ?? existing.carroRealizado,
            linha: item.linha ?? existing.linha,
            tabela: item.tabela ?? existing.tabela,
            driverCode: item.driverCode ?? existing.driverCode,
            driverName: item.driverName ?? existing.driverName,
            saidaGaragem: item.saidaGaragem ?? existing.saidaGaragem,
            inicioLinha: item.inicioLinha ?? existing.inicioLinha,
            horaLiberacao: item.horaLiberacao ?? existing.horaLiberacao,
            substituido: item.substituido ?? existing.substituido,
            historicoTrocas: strHistoricoTrocas ?? existing.historicoTrocas,
            status: item.status ?? existing.status,
            notes: item.notes ?? existing.notes,
            userId: req.userId ?? existing.userId,
          },
        });
        savedRecords.push(updated);
      } else {
        const created = await prisma.soltura.create({
          data: {
            scheduleId: item.scheduleId,
            carroProgramado: item.carroProgramado || null,
            carroRealizado: item.carroRealizado,
            linha: item.linha,
            tabela: item.tabela,
            driverCode: item.driverCode || null,
            driverName: item.driverName || null,
            saidaGaragem: item.saidaGaragem || null,
            inicioLinha: item.inicioLinha || null,
            horaLiberacao: item.horaLiberacao || null,
            garagem: garagem || null,
            turno: turno || null,
            escalaTipo: escalaTipo || null,
            dataOperacao,
            substituido: !!item.substituido,
            historicoTrocas: strHistoricoTrocas,
            status: item.status || "LIBERADO",
            notes: item.notes || null,
            userId: req.userId || null,
          },
        });
        savedRecords.push(created);
      }
    }

    return res.json({ success: true, count: savedRecords.length, records: savedRecords });
  } catch (error: any) {
    console.error("Erro no syncBatch de soltura:", error);
    return res.status(500).json({ error: error?.message || "Erro interno na sincronização de soltura" });
  }
}
