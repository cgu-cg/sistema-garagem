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
async function ensureTableAndSeed() {
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

    // Limpa sementes antigas de teste (ci-doc-*) para que a tabela fique limpa apenas com os cadastros reais dos usuários
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ci_bloqueios WHERE id LIKE 'ci-doc-%'`);
    } catch (_) {}

    tableEnsured = true;
  } catch (err) {
    console.error("[CI Bloqueios] Erro ao verificar/criar tabela ci_bloqueios:", err);
  }
}

// 1. Listar Bloqueios da CI com filtros
export async function list(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { garagem, status, categoria } = req.query;
    const where: any = {};

    if (garagem && garagem !== "TODAS") {
      where.garagem = String(garagem);
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

    // Formatar para manter compatibilidade com a interface BloqueioCarro do frontend
    const mapped = records.map((r) => {
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
    await ensureTableAndSeed();

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
    const finalData = data || dataBloqueio || new Date().toISOString().split("T")[0];
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

// 3. Dar Baixa / Liberar Veículo da CI
export async function release(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { prefixo, id, motivoLiberacao, responsavelLiberacao } = req.body;

    if (!prefixo && !id) {
      return res.status(400).json({ error: "Informe o prefixo ou o ID do bloqueio para liberar." });
    }

    const agora = new Date();
    const dataLib = `${agora.toLocaleDateString("pt-BR")} às ${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    if (id) {
      await prisma.ciBloqueio.updateMany({
        where: { id },
        data: {
          status: "LIBERADO",
          dataLiberacao: dataLib,
          motivoLiberacao: motivoLiberacao || "Reparo concluído e testado",
          responsavelLiberacao: responsavelLiberacao || "Encarregado de Oficina",
        },
      });
    } else {
      await prisma.ciBloqueio.updateMany({
        where: { prefixo: String(prefixo), status: "BLOQUEADO" },
        data: {
          status: "LIBERADO",
          dataLiberacao: dataLib,
          motivoLiberacao: motivoLiberacao || "Reparo concluído e testado",
          responsavelLiberacao: responsavelLiberacao || "Encarregado de Oficina",
        },
      });
    }

    return res.json({ success: true, message: `Veículo ${prefixo || id} liberado com sucesso.` });
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro ao liberar veículo:", error);
    return res.status(500).json({ error: error?.message || "Erro ao liberar veículo." });
  }
}

// 4. Excluir Bloqueio da CI
export async function remove(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID não fornecido." });
    }

    // Tenta excluir por ID ou por prefixo
    await prisma.ciBloqueio.deleteMany({
      where: {
        OR: [{ id }, { prefixo: id }],
      },
    });

    return res.json({ success: true, message: "Bloqueio removido com sucesso." });
  } catch (error: any) {
    console.error("[CI Bloqueios] Erro ao remover bloqueio:", error);
    return res.status(500).json({ error: error?.message || "Erro ao remover bloqueio." });
  }
}

// 5. Sincronização em lote (Bulk Sync)
export async function sync(req: AuthRequest, res: Response) {
  try {
    await ensureTableAndSeed();

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
