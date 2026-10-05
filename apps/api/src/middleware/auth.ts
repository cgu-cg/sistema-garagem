import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config";

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
    const decoded = jwt.verify(token, jwtSecret) as {
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

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    return next();
  };
}

import prisma from "../utils/prisma";

export function authorize(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId || !req.userRole) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    // 1. Se o papel estático estiver na lista de permitidos, avança
    if (roles.includes(req.userRole)) {
      return next();
    }

    // 2. Se não for ADMIN, verifica as permissões dos seus grupos no banco
    if (req.userRole !== "ADMIN") {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          include: {
            groups: true,
          },
        });

        if (user && user.groups && user.groups.length > 0) {
          const cleanPath = req.originalUrl.replace(/^\/api/, "").split("?")[0];

          const hasPermission = user.groups.some((group: any) => {
            let perms: string[] = [];
            try {
              perms = JSON.parse(group.permissions || "[]");
            } catch {
              perms = [];
            }
            return perms.some((permittedPath) => {
              if (permittedPath === "/home") return false;
              const cleanPermitted = permittedPath.split("?")[0];
              return cleanPath === cleanPermitted || cleanPath.startsWith(cleanPermitted + "/");
            });
          });

          if (hasPermission) {
            return next();
          }
        }
      } catch (err) {
        console.error("Erro no middleware de autorização de grupos:", err);
      }
    }

    return res.status(403).json({ error: "Sem permissão" });
  };
}
