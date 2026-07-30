import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"] }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  return res.json(user);
}
