import prisma from "./prisma";

export async function ensureReservasTable() {
  try {
    const ddl = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='reservas_terminais' and xtype='U')
      BEGIN
          CREATE TABLE reservas_terminais (
              id INT IDENTITY(1,1) PRIMARY KEY,
              carro NVARCHAR(100) NOT NULL,
              tipo NVARCHAR(50) NOT NULL,
              terminal NVARCHAR(150) NOT NULL,
              datahora DATETIME2 NOT NULL DEFAULT GETDATE(),
              garagem NVARCHAR(20) NULL DEFAULT 'VCG',
              user_id INT NULL,
              created_at DATETIME2 NOT NULL DEFAULT GETDATE()
          );
          CREATE INDEX IX_reservas_terminais_garagem_terminal ON reservas_terminais(garagem, terminal);
      END
    `;

    await prisma.$executeRawUnsafe(ddl);
    console.log("[DB] Tabela reservas_terminais verificada/criada com sucesso.");
  } catch (error) {
    console.warn("[DB] Aviso ao verificar tabela reservas_terminais:", error);
  }
}

if (require.main === module) {
  ensureReservasTable().then(() => process.exit(0));
}
