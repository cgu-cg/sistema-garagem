const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaMssql } = require("@prisma/adapter-mssql");

const adapter = new PrismaMssql({
  user: "sa",
  password: "sbdpu2001",
  server: "192.168.0.3",
  port: 1433,
  database: "garagem",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
});
const prisma = new PrismaClient({ adapter });

async function run() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

  const groups = await prisma.group.findMany();
  console.log("Groups:", groups);

  const buses = await prisma.bus.findMany();
  console.log("Buses:", buses);

  const solturas = await prisma.soltura.findMany();
  console.log("Solturas count:", solturas.length);

  const abastecimentos = await prisma.abastecimento.findMany();
  console.log("Abastecimentos count:", abastecimentos.length);

  const controles = await prisma.controleOperacional.findMany();
  console.log("Controle Operacional count:", controles.length);

  await prisma.$disconnect();
}

run().catch(console.error);
