import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Helper to save base64 image
function saveBase64Image(base64Str: string, tankName: string): string {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  let ext = "jpg";
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    const contentType = matches[1];
    buffer = Buffer.from(matches[2], "base64");

    if (contentType.includes("png")) {
      ext = "png";
    } else if (contentType.includes("gif")) {
      ext = "gif";
    } else if (contentType.includes("webp")) {
      ext = "webp";
    }
  } else {
    buffer = Buffer.from(base64Str, "base64");
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const filename = `${tankName}_${dateStr}.${ext}`;

  const uploadDir = path.join(process.cwd(), "uploads", "abastecimento-carro");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/api/uploads/abastecimento-carro/${filename}`;
}

export async function getActiveSession(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const activeSession = await prisma.abastecimentoCarroSession.findFirst({
      where: {
        userId,
        status: "EM_ANDAMENTO",
      },
      include: {
        items: {
          orderBy: { dataHora: "desc" },
        },
      },
    });

    return res.json(activeSession);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar sessão ativa: " + error.message });
  }
}

export async function startSession(req: AuthRequest, res: Response) {
  const userId = req.userId;
  const { matricula, b1Ini, b2Ini, b3Ini, b4Ini, b5Ini, b6Ini } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    // Check if there is already an active session
    const existing = await prisma.abastecimentoCarroSession.findFirst({
      where: { userId, status: "EM_ANDAMENTO" },
    });

    if (existing) {
      return res.status(400).json({ error: "Você já possui um abastecimento em andamento." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { garagem: true },
    });

    const session = await prisma.abastecimentoCarroSession.create({
      data: {
        matricula,
        b1Ini,
        b2Ini,
        b3Ini,
        b4Ini,
        b5Ini,
        b6Ini,
        status: "EM_ANDAMENTO",
        garagem: user?.garagem || null,
        userId,
      },
    });

    return res.status(201).json(session);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao iniciar abastecimento: " + error.message });
  }
}

export async function createItem(req: AuthRequest, res: Response) {
  const userId = req.userId;
  const { sessionId, carro, liters, bomba, foto } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const session = await prisma.abastecimentoCarroSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "EM_ANDAMENTO") {
      return res.status(400).json({ error: "Sessão de abastecimento não encontrada ou já encerrada." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { garagem: true },
    });

    // Save image
    const cleanCarro = carro.replace(/[^a-zA-Z0-9-]/g, "_");
    const fotoPath = saveBase64Image(foto, `car_${cleanCarro}`);

    const item = await prisma.abastecimentoCarroItem.create({
      data: {
        sessionId,
        carro,
        liters,
        bomba,
        foto: fotoPath,
        matricula: session.matricula,
        garagem: user?.garagem || null,
      },
    });

    return res.status(201).json(item);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao cadastrar veículo: " + error.message });
  }
}

export async function finishSession(req: AuthRequest, res: Response) {
  const userId = req.userId;
  const { sessionId, b1Fim, b2Fim, b3Fim, b4Fim, b5Fim, b6Fim } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const session = await prisma.abastecimentoCarroSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== "EM_ANDAMENTO") {
      return res.status(400).json({ error: "Sessão não encontrada ou já encerrada." });
    }

    const updated = await prisma.abastecimentoCarroSession.update({
      where: { id: sessionId },
      data: {
        b1Fim,
        b2Fim,
        b3Fim,
        b4Fim,
        b5Fim,
        b6Fim,
        status: "FINALIZADO",
        dthFimAbastec: new Date(),
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao finalizar abastecimento: " + error.message });
  }
}

export async function listSessions(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, garagem: true },
    });

    const where: any = {};
    if (user && user.role !== "ADMIN") {
      where.garagem = user.garagem;
    }

    const sessions = await prisma.abastecimentoCarroSession.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { dthIniAbastec: "desc" },
    });

    return res.json(sessions);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar sessões: " + error.message });
  }
}

export async function getSessionDetails(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const session = await prisma.abastecimentoCarroSession.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          orderBy: { dataHora: "asc" },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Sessão não encontrada." });
    }

    return res.json(session);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar detalhes da sessão: " + error.message });
  }
}
