import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

// Parse connection URL
const url = new URL(connectionString.replace("sqlserver://", "http://"));

const config: any = {
  user: url.username,
  password: url.password,
  server: url.hostname,
  port: parseInt(url.port) || 1433,
  database: url.pathname.replace("/", ""),
  options: {
    encrypt: false, // Forced false for compatibility with legacy SQL Server 2012
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 10000,
  requestTimeout: 30000
};

const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });

export default prisma;
