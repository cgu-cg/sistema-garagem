import { Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function list(req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      garagem: true,
      createdAt: true,
      groups: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(users);
}

export async function create(req: AuthRequest, res: Response) {
  const { name, email, password, role, groupIds, garagem } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ error: "Email já cadastrado" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hashed, 
      role,
      garagem: garagem || null,
      groups: groupIds && Array.isArray(groupIds) ? {
        connect: groupIds.map((gid: number) => ({ id: Number(gid) }))
      } : undefined
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      garagem: true,
      createdAt: true,
      groups: {
        select: { id: true, name: true }
      }
    },
  });

  return res.status(201).json(user);
}

export async function update(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, email, password, role, groupIds, garagem } = req.body;

  const data: any = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);
  if (garagem !== undefined) data.garagem = garagem || null;

  if (groupIds !== undefined && Array.isArray(groupIds)) {
    data.groups = {
      set: groupIds.map((gid: number) => ({ id: Number(gid) }))
    };
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      garagem: true,
      createdAt: true,
      groups: {
        select: { id: true, name: true }
      }
    },
  });

  return res.json(user);
}

export async function remove(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (Number(id) === req.userId) {
    return res.status(400).json({ error: "Não é possível excluir a si mesmo" });
  }

  await prisma.user.delete({ where: { id: Number(id) } });
  return res.status(204).send();
}
