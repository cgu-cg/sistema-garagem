import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { jwtSecret } from "../config";

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: {
      groups: {
        select: {
          id: true,
          name: true,
          permissions: true
        }
      }
    }
  });
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    jwtSecret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "365d") as jwt.SignOptions["expiresIn"] }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      garagem: user.garagem,
      groups: (user.groups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        permissions: typeof g.permissions === "string" ? JSON.parse(g.permissions || "[]") : (g.permissions || [])
      }))
    },
  });
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      garagem: true,
      createdAt: true,
      groups: {
        select: {
          id: true,
          name: true,
          permissions: true
        }
      }
    },
  });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  return res.json({
    ...user,
    groups: (user.groups || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      permissions: typeof g.permissions === "string" ? JSON.parse(g.permissions || "[]") : (g.permissions || [])
    }))
  });
}
