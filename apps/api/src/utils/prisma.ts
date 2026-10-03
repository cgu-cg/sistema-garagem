import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { databaseConfig } from "../config";

const config = {
  ...databaseConfig,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  connectionTimeout: 10000,
  requestTimeout: 30000,
};

const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });

export default prisma;
