import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Garantir carregamento das variáveis de ambiente da raiz do monorepo ou locais
const candidateEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

const defaultUrl = "sqlserver://sa:sbdpu2001@192.168.0.3:1433/garagem?encrypt=false&trustServerCertificate=true";
const rawConnectionString = process.env.DATABASE_URL || defaultUrl;

let config: any;
try {
  const connectionUrl = new URL(rawConnectionString.replace("sqlserver://", "http://"));
  config = {
    user: connectionUrl.username || process.env.SQL_SERVER_USER || "sa",
    password: connectionUrl.password || process.env.SQL_SERVER_PASSWORD || "",
    server: connectionUrl.hostname || process.env.SQL_SERVER_HOST || "localhost",
    port: parseInt(connectionUrl.port || process.env.SQL_SERVER_PORT || "1433"),
    database: connectionUrl.pathname.replace("/", "") || process.env.SQL_SERVER_DATABASE || "garagem",
    options: {
      encrypt: false, // Compatibilidade com SQL Server legados
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
  };
} catch (err) {
  console.warn("[Prisma] Formato inválido na DATABASE_URL, aplicando fallback de variáveis individuais");
  config = {
    user: process.env.SQL_SERVER_USER || "sa",
    password: process.env.SQL_SERVER_PASSWORD || "",
    server: process.env.SQL_SERVER_HOST || "192.168.0.3",
    port: parseInt(process.env.SQL_SERVER_PORT || "1433"),
    database: process.env.SQL_SERVER_DATABASE || "garagem",
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    connectionTimeout: 10000,
    requestTimeout: 30000,
  };
}

const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });

export default prisma;
