import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: number;
      role: string;
    };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    next();
  };
}
