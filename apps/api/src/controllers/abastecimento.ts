import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import fs from "fs";
import path from "path";

// Helper to save base64 image
function saveBase64Image(base64Str: string, tankName: string): string {
  // Extract content type and base64 data
  // base64Str format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  let ext = "jpg";
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    const contentType = matches[1];
    buffer = Buffer.from(matches[2], "base64");

    // Determine extension
    if (contentType.includes("png")) {
      ext = "png";
    } else if (contentType.includes("gif")) {
      ext = "gif";
    } else if (contentType.includes("webp")) {
      ext = "webp";
    }
  } else {
    // If not matching data URI pattern, try to parse it as raw base64 string
    buffer = Buffer.from(base64Str, "base64");
  }

  // Format date: YYYYMMDD_HHmmss
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const filename = `${tankName}_${dateStr}.${ext}`;

  const uploadDir = path.join(process.cwd(), "uploads", "abastecimento");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  // Return the relative URL/path to serve it
  return `/api/uploads/abastecimento/${filename}`;
}

export async function list(req: AuthRequest, res: Response) {
  const { date, garagem } = req.query;

  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, garagem: true }
    });

    const where: any = {};

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.createdAt = { gte: start, lte: end };
    }

    if (requestingUser && requestingUser.role !== "ADMIN") {
      where.garagem = requestingUser.garagem;
    } else if (requestingUser?.role === "ADMIN" && garagem) {
      where.garagem = garagem as string;
    }

    const records = await prisma.abastecimento.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(records);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar abastecimentos" });
  }
}

export async function create(req: AuthRequest, res: Response) {
  const { litersT1, fotoT1, litersT2, fotoT2, litersT3, fotoT3 } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  if (litersT1 === undefined || !fotoT1 || litersT2 === undefined || !fotoT2) {
    return res.status(400).json({ error: "Campos obrigatórios: litros e foto para ambos os tanques" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { garagem: true }
    });

    const isVCM = user?.garagem === "VCM";
    if (isVCM && (litersT3 === undefined || !fotoT3)) {
      return res.status(400).json({ error: "Campos obrigatórios para garagem VCM: litros e foto do Tanque 3" });
    }

    // Save photos
    const foto1Path = saveBase64Image(fotoT1, "t1");
    const foto2Path = saveBase64Image(fotoT2, "t2");
    let foto3Path: string | null = null;
    if (isVCM && fotoT3) {
      foto3Path = saveBase64Image(fotoT3, "t3");
    }

    const record = await prisma.abastecimento.create({
      data: {
        litersT1,
        fotoT1: foto1Path,
        litersT2,
        fotoT2: foto2Path,
        litersT3: isVCM && litersT3 !== undefined ? litersT3 : null,
        fotoT3: foto3Path,
        garagem: user?.garagem || null,
        userId: userId,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return res.status(201).json(record);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao registrar abastecimento: " + error.message });
  }
}
