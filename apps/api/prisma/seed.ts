import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const colabPassword = await bcrypt.hash("colaborador123", 10);

  await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@teste.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "colaborador@teste.com" },
    update: {},
    create: {
      name: "Colaborador",
      email: "colaborador@teste.com",
      password: colabPassword,
      role: "COLABORADOR",
    },
  });

  const abastPassword = await bcrypt.hash("abastecimento123", 10);

  await prisma.user.upsert({
    where: { email: "abastecimento@teste.com" },
    update: {},
    create: {
      name: "Colaborador Abastecimento",
      email: "abastecimento@teste.com",
      password: abastPassword,
      role: "COLABORADOR_ABASTECIMENTO",
    },
  });

  const solturaPassword = await bcrypt.hash("soltura123", 10);

  await prisma.user.upsert({
    where: { email: "soltura@teste.com" },
    update: {},
    create: {
      name: "Colaborador Soltura",
      email: "soltura@teste.com",
      password: solturaPassword,
      role: "COLABORADOR_SOLTURA",
    },
  });

  const buses = [
    { plate: "ABC-1A23", prefix: "101", model: "Mercedes-Benz OF-1721" },
    { plate: "DEF-2B34", prefix: "102", model: "Volvo B270F" },
    { plate: "GHI-3C45", prefix: "103", model: "Scania K310" },
    { plate: "JKL-4D56", prefix: "104", model: "Iveco 170S28" },
    { plate: "MNO-5E67", prefix: "201", model: "Mercedes-Benz OF-1519" },
  ];

  for (const bus of buses) {
    await prisma.bus.upsert({
      where: { plate: bus.plate },
      update: {},
      create: bus,
    });
  }

  console.log("Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
