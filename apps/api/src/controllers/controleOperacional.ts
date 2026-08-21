import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import * as mssqlService from "../services/mssql";

const prisma = new PrismaClient();

// Helper to save base64 image
function saveBase64Image(base64Str: string, carro: string, indexStr: string): string {
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

  // Naming format: 
  // indexStr is "", "_1", or "_2" as requested:
  // exemplo foto1: carro_data (e.g. 101_20260814_140813.jpg)
  // exemplo foto2: carro_1_data (e.g. 101_1_20260814_140813.jpg)
  // exemplo foto3: carro_2_data (e.g. 101_2_20260814_140813.jpg)
  const filename = `${carro}${indexStr}_${dateStr}.${ext}`;
  
  const uploadDir = path.join(process.cwd(), "uploads", "controle-operacional");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  // Return the relative URL/path to serve it
  return `/api/uploads/controle-operacional/${filename}`;
}

export async function create(req: AuthRequest, res: Response) {
  const { carro, linha, garagem, foto1, foto2, foto3 } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  if (!carro || !linha || !garagem || !foto1 || !foto2 || !foto3) {
    return res.status(400).json({ error: "Campos obrigatórios: carro, linha, garagem, foto1, foto2 e foto3" });
  }

  try {
    const cleanCarro = carro.replace(/[^a-zA-Z0-9-]/g, "_");
    
    // Save photo 1
    const foto1Path = saveBase64Image(foto1, cleanCarro, "");

    // Save photo 2
    const foto2Path = saveBase64Image(foto2, cleanCarro, "_1");

    // Save photo 3
    const foto3Path = saveBase64Image(foto3, cleanCarro, "_2");

    const registration = await prisma.controleOperacional.create({
      data: {
        carro,
        linha,
        garagem,
        foto1: foto1Path,
        foto2: foto2Path,
        foto3: foto3Path,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return res.status(201).json(registration);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao cadastrar controle operacional" });
  }
}

export async function list(req: AuthRequest, res: Response) {
  const { date, garagem } = req.query;

  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, garagem: true },
    });

    const where: any = {};

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.dataInsercao = { gte: start, lte: end };
    }

    if (requestingUser && requestingUser.role !== "ADMIN" && requestingUser.garagem) {
      where.garagem = { contains: requestingUser.garagem };
    } else if (requestingUser?.role === "ADMIN" && garagem) {
      where.garagem = garagem as string;
    }

    const registrations = await prisma.controleOperacional.findMany({
      where,
      orderBy: {
        dataInsercao: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    return res.json(registrations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar controles operacionais" });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const record = await prisma.controleOperacional.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!record) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    // Attempt to delete files
    const deleteFile = (relPath: string | null) => {
      if (!relPath) return;
      try {
        const fullPath = path.join(process.cwd(), relPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error(`Falha ao excluir arquivo ${relPath}:`, err);
      }
    };

    deleteFile(record.foto1);
    deleteFile(record.foto2);
    deleteFile(record.foto3);

    await prisma.controleOperacional.delete({
      where: { id: parseInt(id, 10) },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao deletar registro" });
  }
}

export async function update(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { carro, linha, garagem, foto1, foto2, foto3 } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const record = await prisma.controleOperacional.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!record) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    const cleanCarro = carro.replace(/[^a-zA-Z0-9-]/g, "_");

    // Helper to process photo
    const processPhoto = (newPhoto: string, oldPhotoPath: string | null, indexStr: string) => {
      // If it is already a stored URL path, keep it
      if (newPhoto.startsWith("/api/uploads/")) {
        return newPhoto;
      }
      
      // Delete old photo file if it exists
      if (oldPhotoPath) {
        try {
          const fullPath = path.join(process.cwd(), oldPhotoPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (err) {
          console.error(`Falha ao excluir arquivo antigo ${oldPhotoPath}:`, err);
        }
      }

      // Save new base64 photo
      return saveBase64Image(newPhoto, cleanCarro, indexStr);
    };

    const foto1Path = processPhoto(foto1, record.foto1, "");
    const foto2Path = processPhoto(foto2, record.foto2, "_1");
    const foto3Path = processPhoto(foto3, record.foto3, "_2");

    const updated = await prisma.controleOperacional.update({
      where: { id: parseInt(id, 10) },
      data: {
        carro,
        linha,
        garagem,
        foto1: foto1Path,
        foto2: foto2Path,
        foto3: foto3Path,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar controle operacional" });
  }
}

export async function listVeiculos(req: AuthRequest, res: Response) {
  try {
    const data = await mssqlService.queryVeiculosSelect();
    return res.json(data);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar veículos do SQL Server: " + error.message });
  }
}

export async function listLinhas(req: AuthRequest, res: Response) {
  try {
    const data = await mssqlService.queryLinhasSelect();
    return res.json(data);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar linhas do SQL Server: " + error.message });
  }
}
