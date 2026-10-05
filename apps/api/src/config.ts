import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const jwtSecret = requireEnvironmentVariable("JWT_SECRET");
const databaseUrl = requireEnvironmentVariable("DATABASE_URL");

if (!/^sqlserver:\/\//i.test(databaseUrl)) {
  throw new Error("DATABASE_URL must use the SQL Server URL format.");
}

let connectionUrl: URL;
try {
  connectionUrl = new URL(databaseUrl.replace(/^sqlserver:\/\//i, "http://"));
} catch {
  throw new Error("DATABASE_URL is not a valid SQL Server connection URL.");
}

const database = connectionUrl.pathname.replace(/^\//, "");
if (!connectionUrl.hostname || !database) {
  throw new Error("DATABASE_URL must include a SQL Server host and database.");
}

export const databaseConfig = {
  user: connectionUrl.username,
  password: connectionUrl.password,
  server: connectionUrl.hostname,
  port: connectionUrl.port ? Number(connectionUrl.port) : 1433,
  database,
};
