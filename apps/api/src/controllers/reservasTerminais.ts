import { createReserva, removeReserva } from '../services/reservaTerminal';
import { MvpError } from '../services/mvpTemporal';
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
    const record = await createReserva(prisma, req.userId, req.body);

    return res.status(201).json(record);
  } catch (error) {
    if (error instanceof MvpError) return res.status(error.status).json({ error: error.message });
    console.error("Erro ao criar reserva de terminal:", error);
    return res.status(500).json({ message: "Erro ao criar reserva de terminal" });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    return res.json(await removeReserva(prisma, req.userId, Number(req.params.id)));
  } catch (error) {
    if (error instanceof MvpError) return res.status(error.status).json({ message: error.message });
    return res.status(503).json({ message: 'Exclusao de reserva nao confirmada. Recarregue antes de tentar novamente.' });
  }
}
