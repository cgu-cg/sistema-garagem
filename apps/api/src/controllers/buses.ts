import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function list(req: AuthRequest, res: Response) {
  const buses = await prisma.bus.findMany({ orderBy: { prefix: "asc" } });
  return res.json(buses);
}

export async function create(req: AuthRequest, res: Response) {
  const { plate, prefix, model } = req.body;
  const bus = await prisma.bus.create({ data: { plate, prefix, model } });
  return res.status(201).json(bus);
}
