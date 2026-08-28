import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function list(req: AuthRequest, res: Response) {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });
    // Parse permissions field back to a string array
    const parsedGroups = groups.map((g: any) => ({
      ...g,
      permissions: typeof g.permissions === "string" ? JSON.parse(g.permissions || "[]") : (g.permissions || [])
    }));
    return res.json(parsedGroups);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { name, description, permissions } = req.body;

    const exists = await prisma.group.findUnique({ where: { name } });
    if (exists) {
      return res.status(409).json({ error: "Grupo já cadastrado com este nome" });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        permissions: JSON.stringify(permissions || []),
      },
    });

    return res.status(201).json({
      ...group,
      permissions: JSON.parse(group.permissions || "[]")
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (permissions !== undefined && Array.isArray(permissions)) {
      data.permissions = JSON.stringify(permissions);
    }

    const group = await prisma.group.update({
      where: { id: Number(id) },
      data,
    });

    return res.json({
      ...group,
      permissions: JSON.parse(group.permissions || "[]")
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Check if any users are connected to this group before deleting
    const groupWithUsers = await prisma.group.findUnique({
      where: { id: Number(id) },
      include: { users: { select: { id: true } } }
    });

    if (groupWithUsers && groupWithUsers.users.length > 0) {
      return res.status(400).json({ error: "Não é possível excluir um grupo que possui usuários vinculados" });
    }

    await prisma.group.delete({ where: { id: Number(id) } });
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
