import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";

export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

let tableEnsured = false;

// Garante que a tabela ci_bloqueios exista no SQL Server e esteja pronta para novos cadastros
async function ensureTable() {
  if (tableEnsured) return;

  try {
    // Cria a tabela se ainda não existir
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ci_bloqueios' AND xtype='U')
      BEGIN
        CREATE TABLE ci_bloqueios (
          id NVARCHAR(100) NOT NULL PRIMARY KEY,
          prefixo NVARCHAR(10) NOT NULL,
          garagem NVARCHAR(10) NOT NULL,
          consorciada NVARCHAR(10) NOT NULL,
          categoria NVARCHAR(20) NOT NULL,
          sub_tipo NVARCHAR(50) NULL,
          horario_reforco NVARCHAR(20) NULL,
          motivo NVARCHAR(255) NULL,
          data_bloqueio NVARCHAR(20) NOT NULL,
          hora_bloqueio NVARCHAR(10) NULL,
          gravidade NVARCHAR(10) DEFAULT 'ALTA',
          responsavel NVARCHAR(100) NULL,
          observacoes NVARCHAR(255) NULL,
          status NVARCHAR(20) DEFAULT 'BLOQUEADO',
          data_liberacao NVARCHAR(50) NULL,
          motivo_liberacao NVARCHAR(255) NULL,
          responsavel_liberacao NVARCHAR(100) NULL,
          user_id INT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );

        CREATE INDEX idx_ci_bloqueios_prefixo ON ci_bloqueios(prefixo);
        CREATE INDEX idx_ci_bloqueios_status ON ci_bloqueios(status);
        CREATE INDEX idx_ci_bloqueios_garagem ON ci_bloqueios(garagem);
      END
    `);

    tableEnsured = true;
  } catch (err) {
    console.error("[CI Bloqueios] Erro ao verificar/criar tabela ci_bloqueios:", err);
  }
}

// 1. Listar Bloqueios da CI com filtros
export async function list(req: AuthRequest, res: Response) {
  try {
    await ensureTable();

    const { garagem, status, categoria } = req.query;
    const where: any = {};

    // Identificação da Garagem Física do Usuário Logado (VCG ou VCM)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { garagem: true, email: true, role: true }
    });

    let userGaragem = user?.garagem?.toUpperCase();
    if (!userGaragem) {
      const emailLower = (user?.email || "").toLowerCase();
      if (emailLower.includes("vcg")) userGaragem = "VCG";
      else if (emailLower.includes("vcm")) userGaragem = "VCM";
    }

    const isAdmin = user?.role === "ADMIN";
    const effectiveGaragem = (!isAdmin && userGaragem)
      ? userGaragem
      : (garagem && garagem !== "TODAS" ? String(garagem).toUpperCase() : undefined);

    if (effectiveGaragem) {
      where.garagem = effectiveGaragem;
    }

    if (status) {
      where.status = String(status);
    }

    if (categoria) {
      where.categoria = String(categoria);
    }

    const records = await prisma.ciBloqueio.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { dataBloqueio: "desc" },
        { prefixo: "asc" },
      ],
    });

    // Se o usuário estiver restrito a VCG ou VCM, garante estritamente que apenas frotas de sua garagem física sejam retornadas
    let filteredRecords = records;
    if (effectiveGaragem === "VCG" || effectiveGaragem === "VCM") {
      filteredRecords = records.filter((r) => {
        const clean = (r.prefixo || "").replace(/\D/g, "");
        const carroGaragem = (clean.startsWith("1") || clean === "2002") ? "VCM" : "VCG";
        return carroGaragem === effectiveGaragem;
      });
    }

    // Formatar para manter compatibilidade com a interface BloqueioCarro do frontend
    const mapped = filteredRecords.map((r) => {
      const motivoLower = (r.motivo || "").toLowerCase();
      let tipo = "EM_MANUTENCAO";
      if (motivoLower.includes("motor")) {
        tipo = "BLOQUEADO_MOTOR";
      } else if (motivoLower.includes("freio")) {
        tipo = "BLOQUEADO_FREIO";
      } else if (motivoLower.includes("mola") || motivoLower.includes("suspens")) {
        tipo = "BLOQUEADO_MOLA";
      } else if (motivoLower.includes("câmbio") || motivoLower.includes("cambio") || motivoLower.includes("transmiss")) {
        tipo = "BLOQUEADO_CAMBIO";
      } else if (motivoLower.includes("elétrica") || motivoLower.includes("eletrica") || motivoLower.includes("módulo") || motivoLower.includes("modulo")) {
        tipo = "BLOQUEADO_MODULO";
      } else if (motivoLower.includes("sinistro")) {
        tipo = "BLOQUEADO_SINISTRO";
      } else if (r.categoria === "PREVENTIVA") {
        tipo = "REFORCO_REVISAO";
      }

      return {
        id: r.id,
        prefixo: (r.prefixo || "").trim(),
        garagem: r.garagem,
        consorciada: r.consorciada,
        categoriaPlanilha: r.categoria,
        setorOficina: r.categoria === "OFICINA" ? r.subTipo : undefined,
        tipoPreventiva: r.categoria === "PREVENTIVA" ? r.subTipo : undefined,
        horarioReforco: r.horarioReforco,
        tipo,
        motivo: r.motivo || "",
        data: r.dataBloqueio,
        hora: r.horaBloqueio,
        gravidade: r.gravidade || "ALTA",
        responsavel: r.responsavel,
        os: r.observacoes,
        status: r.status,
        dataLiberacao: r.dataLiberacao,
        motivoLiberacao: r.motivoLiberacao,
        responsavelLiberacao: r.responsavelLiberacao,
      };
    });

    return res.json(mapped);
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro ao listar bloqueios:", error);
    return res.json([]);
  }
}

// 2. Criar ou Atualizar Bloqueio na CI
export async function createOrUpdate(req: AuthRequest, res: Response) {
  try {
    await ensureTable();

    const {
      id,
      prefixo,
      garagem,
      consorciada,
      categoriaPlanilha,
      categoria,
      setorOficina,
      tipoPreventiva,
      subTipo,
      horarioReforco,
      motivo,
      data,
      dataBloqueio,
      hora,
      horaBloqueio,
      gravidade,
      responsavel,
      os,
      observacoes,
      status,
    } = req.body;

    if (!prefixo) {
      return res.status(400).json({ error: "Prefixo do veículo é obrigatório." });
    }

    const cleanPrefixo = String(prefixo).trim();
    const cat = String(categoriaPlanilha || categoria || "OFICINA").trim().toUpperCase();
    const rawSub = setorOficina || tipoPreventiva || subTipo;
    const sub = rawSub ? String(rawSub).trim().toUpperCase() : null;
    let finalData = new Date().toISOString().split("T")[0];
    const rawData = data || dataBloqueio;
    if (rawData) {
      const clean = String(rawData).trim().split(/[\sT]/)[0];
      if (clean.includes("/")) {
        const parts = clean.split("/");
        if (parts.length === 3) {
          finalData = parts[0].length === 4
            ? `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`
            : `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else {
          finalData = clean;
        }
      } else {
        finalData = clean;
      }
    }
    const finalHora = hora || horaBloqueio || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Se não forneceu ID, tenta localizar bloqueio ativo deste mesmo prefixo
    let recordId = id;
    if (!recordId) {
      const existingActive = await prisma.ciBloqueio.findFirst({
        where: {
          prefixo: cleanPrefixo,
          status: { not: "LIBERADO" }
        },
        orderBy: { createdAt: "desc" }
      });
      recordId = existingActive?.id || `ci-${Date.now()}-${cleanPrefixo}`;
    }

    // Se já houver um registro de bloqueio ativo para este carro, atualiza; senão cria
    const saved = await prisma.ciBloqueio.upsert({
      where: { id: recordId },
      create: {
        id: recordId,
        prefixo: cleanPrefixo,
        garagem: garagem || "VCG",
        consorciada: consorciada || "VCG",
        categoria: cat,
        subTipo: sub,
        horarioReforco: horarioReforco || null,
        motivo: motivo !== undefined && motivo !== null ? String(motivo).trim() : "",
        dataBloqueio: finalData,
        horaBloqueio: finalHora,
        gravidade: gravidade || "ALTA",
        responsavel: responsavel || "Oficina Central",
        observacoes: os || observacoes || null,
        status: status || "BLOQUEADO",
        userId: req.userId || null,
      },
      update: {
        prefixo: cleanPrefixo,
        garagem: garagem || "VCG",
        consorciada: consorciada || "VCG",
        categoria: cat,
        subTipo: sub,
        horarioReforco: horarioReforco || null,
        motivo: motivo !== undefined && motivo !== null ? String(motivo).trim() : "",
        dataBloqueio: finalData,
        horaBloqueio: finalHora,
        gravidade: gravidade || "ALTA",
        responsavel: responsavel || "Oficina Central",
        observacoes: os || observacoes || null,
        status: status || "BLOQUEADO",
        userId: req.userId || null,
      },
    });

    return res.json(saved);
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro ao salvar bloqueio:", error);
    return res.status(500).json({ error: error?.message || "Erro ao salvar bloqueio." });
  }
}

// 3. Dar Baixa / Liberar Veículo da CI (Remove da tabela ci_bloqueios)
export async function release(req: AuthRequest, res: Response) {
  try {
    await ensureTable();

    const { prefixo, id } = req.body;

    if (!prefixo && !id) {
      return res.status(400).json({ error: "Informe o prefixo ou o ID do bloqueio para liberar." });
    }

    const cleanPrefixo = prefixo ? String(prefixo).trim().replace(/\D/g, "") : undefined;

    // Remove fisicamente da tabela ci_bloqueios conforme solicitado
    await prisma.ciBloqueio.deleteMany({
      where: {
        OR: [
          ...(id ? [{ id: String(id) }] : []),
          ...(cleanPrefixo ? [{ prefixo: cleanPrefixo }] : []),
          ...(prefixo ? [{ prefixo: String(prefixo).trim() }] : []),
        ],
      },
    });

    // Se o carro constava estritamente como bloqueado permanente na folha de manutenção, desmarca o bloqueio
    // (As listas de em manutenção e liberados são 100% independentes e não recebem registros da CI)
    try {
      if (cleanPrefixo) {
        await prisma.manutencaoCarro.deleteMany({
          where: {
            prefixo: cleanPrefixo,
            bloqueado: true,
            emExecucao: false,
            liberado: false,
          },
        });
      }
    } catch (_) {}

    return res.json({ success: true, message: `Veículo ${prefixo || id} liberado e removido dos bloqueios da CI com sucesso.` });
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro ao liberar veículo:", error);
    return res.status(500).json({ error: error?.message || "Erro ao liberar veículo." });
  }
}

// 4. Excluir Bloqueio da CI
export async function remove(req: AuthRequest, res: Response) {
  try {
    await ensureTable();

    const { id } = req.params;
    const { prefixo } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID não fornecido." });
    }

    // Se o cliente enviou um ID específico, busca o prefixo do carro associado
    let carPrefixo = prefixo ? String(prefixo).trim() : undefined;
    if (!carPrefixo) {
      const found = await prisma.ciBloqueio.findFirst({
        where: { id },
        select: { prefixo: true }
      });
      if (found) {
        carPrefixo = found.prefixo.trim();
      }
    }

    // Condições para exclusão: apaga por ID e, se houver prefixo identificado, remove todos os bloqueios deste carro
    const orConditions: any[] = [{ id }, { prefixo: id }];
    if (carPrefixo) {
      orConditions.push({ prefixo: carPrefixo });
    }

    await prisma.ciBloqueio.deleteMany({
      where: {
        OR: orConditions,
      },
    });

    // Remove apenas se constava estritamente como bloqueado na folha (não altera em manutenção nem liberados)
    try {
      const cleanPref = (carPrefixo || id).replace(/\D/g, "");
      if (cleanPref) {
        await prisma.manutencaoCarro.deleteMany({
          where: {
            prefixo: cleanPref,
            bloqueado: true,
            emExecucao: false,
            liberado: false,
          }
        });
      }
    } catch (_) {}

    return res.json({ success: true, message: "Bloqueio removido com sucesso." });
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro ao remover bloqueio:", error);
    return res.status(500).json({ error: error?.message || "Erro ao remover bloqueio." });
  }
}

// 5. Sincronização em lote (Bulk Sync)
export async function sync(req: AuthRequest, res: Response) {
  try {
    await ensureTable();

    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items deve ser uma lista." });
    }

    for (const item of items) {
      const recordId = item.id || `ci-${Date.now()}-${item.prefixo}`;
      await prisma.ciBloqueio.upsert({
        where: { id: recordId },
        create: {
          id: recordId,
          prefixo: String(item.prefixo),
          garagem: item.garagem || "VCG",
          consorciada: item.consorciada || "VCG",
          categoria: item.categoriaPlanilha || item.categoria || "OFICINA",
          subTipo: item.setorOficina || item.tipoPreventiva || item.subTipo || null,
          horarioReforco: item.horarioReforco || null,
          motivo: item.motivo !== undefined ? item.motivo : "Em Manutenção",
          dataBloqueio: item.data || item.dataBloqueio || new Date().toISOString().split("T")[0],
          horaBloqueio: item.hora || item.horaBloqueio || null,
          gravidade: item.gravidade || "ALTA",
          responsavel: item.responsavel || "Oficina Central",
          observacoes: item.os || item.observacoes || null,
          status: item.status || "BLOQUEADO",
        },
        update: {
          status: item.status || "BLOQUEADO",
          motivo: item.motivo !== undefined ? item.motivo : "Em Manutenção",
          horarioReforco: item.horarioReforco || null,
        },
      });
    }

    return res.json({ success: true, count: items.length });
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro na sincronização em lote:", error);
    return res.status(500).json({ error: error?.message || "Erro na sincronização." });
  }
}
