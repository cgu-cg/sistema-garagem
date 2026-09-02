import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function list(req: AuthRequest, res: Response) {
  try {
    const { garagem, terminal, date } = req.query;

    const where: any = {};

    if (garagem) {
      where.garagem = String(garagem);
    }

    if (terminal) {
      where.terminal = String(terminal);
    }

    if (date) {
      // Filtrar por dia (00:00:00 até 23:59:59)
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59.999`);
      where.dataHora = {
        gte: dayStart,
        lte: dayEnd,
      };
    }

    const records = await prisma.reservaTerminal.findMany({
      where,
      orderBy: { dataHora: "asc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return res.json(records);
  } catch (error) {
    console.error("Erro ao listar reservas de terminais:", error);
    return res.status(500).json({ message: "Erro ao listar reservas de terminais" });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { carro, tipo, terminal, garagem } = req.body;

    const record = await prisma.reservaTerminal.create({
      data: {
        carro: String(carro).trim(),
        tipo: String(tipo).toUpperCase(),
        terminal: String(terminal).trim(),
        garagem: garagem ? String(garagem).toUpperCase() : "VCG",
        userId: req.userId || null,
        dataHora: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json(record);
  } catch (error) {
    console.error("Erro ao criar reserva de terminal:", error);
    return res.status(500).json({ message: "Erro ao criar reserva de terminal" });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    await prisma.reservaTerminal.delete({
      where: { id },
    });

    return res.json({ message: "Reserva removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover reserva de terminal:", error);
    return res.status(500).json({ message: "Erro ao remover reserva de terminal" });
  }
}
