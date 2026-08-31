const mssql = require('mssql');

const prismaUrl = "sqlserver://sa:sbdpu2001@192.168.0.3:1433/garagem?encrypt=true&trustServerCertificate=true";

// Use standard URL API by temporarily changing the scheme
const url = new URL(prismaUrl.replace("sqlserver://", "http://"));

const config = {
  user: url.username,
  password: url.password,
  server: url.hostname,
  port: parseInt(url.port) || 1433,
  database: url.pathname.replace("/", ""),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 5000,
  requestTimeout: 10000
};

console.log("Parsed Config:", { ...config, password: "****" });

async function run() {
  try {
    const pool = new mssql.ConnectionPool(config);
    console.log("Connecting using connection pool...");
    await pool.connect();
    console.log("Connection successful!");
    
    const result = await pool.request().query("SELECT DB_NAME() as dbName, @@VERSION as version");
    console.log("Query Result:", result.recordset);
    
    await pool.close();
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

run();
