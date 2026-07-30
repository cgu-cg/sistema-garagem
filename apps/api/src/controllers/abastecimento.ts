import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function list(req: AuthRequest, res: Response) {
  const { startDate, endDate } = req.query;

  const where: any = {};

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const records = await prisma.abastecimento.findMany({
    where,
    include: {
      bus: { select: { plate: true, prefix: true, model: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(records);
}

export async function create(req: AuthRequest, res: Response) {
  const { busId, liters, value, driverName, odometer } = req.body;

  const record = await prisma.abastecimento.create({
    data: {
      busId,
      liters,
      value,
      driverName,
      odometer,
      userId: req.userId!,
    },
    include: {
      bus: { select: { plate: true, prefix: true } },
    },
  });

  return res.status(201).json(record);
}
