import prisma from "../src/utils/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const password = await bcrypt.hash("123456", 10);

  // ── Groups ──────────────────────────────────────────────

  const groupTodos = await prisma.group.upsert({
    where: { name: "Todos" },
    update: {
      description: "Acesso a Leitura de Tanques, Abastecimento por Carro, Soltura, Manutenção, Soltura ADM, Escala Carros e Controle Operacional",
      permissions: JSON.stringify([
        "/abastecimento",
        "/abastecimento-carro",
        "/soltura",
        "/manutencao",
        "/soltura-adm",
        "/escala-carros",
        "/escala-carros/alterar-carro-programado",
        "/controle-operacional",
      ]),
    },
    create: {
      name: "Todos",
      description: "Acesso a Leitura de Tanques, Abastecimento por Carro, Soltura, Manutenção, Soltura ADM, Escala Carros e Controle Operacional",
      permissions: JSON.stringify([
        "/abastecimento",
        "/abastecimento-carro",
        "/soltura",
        "/manutencao",
        "/soltura-adm",
        "/escala-carros",
        "/escala-carros/alterar-carro-programado",
        "/controle-operacional",
      ]),
    },
  });

  const groupEscalaCarros = await prisma.group.upsert({
    where: { name: "Escala Carros" },
    update: {
      description: "Acesso ao menu Escala Carros",
      permissions: JSON.stringify([
        "/escala-carros",
        "/escala-carros/alterar-carro-programado",
        "/alterar-carro-programado",
      ]),
    },
    create: {
      name: "Escala Carros",
      description: "Acesso ao menu Escala Carros",
      permissions: JSON.stringify([
        "/escala-carros",
        "/escala-carros/alterar-carro-programado",
        "/alterar-carro-programado",
      ]),
    },
  });

  const groupTanque = await prisma.group.upsert({
    where: { name: "Leitura de Tanques" },
    update: {
      description: "Acesso ao menu Leitura de Tanques",
      permissions: JSON.stringify(["/abastecimento", "/abastecimentos"]),
    },
    create: {
      name: "Leitura de Tanques",
      description: "Acesso ao menu Leitura de Tanques",
      permissions: JSON.stringify(["/abastecimento", "/abastecimentos"]),
    },
  });

  const groupAbastCarro = await prisma.group.upsert({
    where: { name: "Abastecimento por Carro" },
    update: {
      description: "Acesso ao menu Abastecimento por Carro",
      permissions: JSON.stringify(["/abastecimento-carro"]),
    },
    create: {
      name: "Abastecimento por Carro",
      description: "Acesso ao menu Abastecimento por Carro",
      permissions: JSON.stringify(["/abastecimento-carro"]),
    },
  });

  const groupSoltura = await prisma.group.upsert({
    where: { name: "Soltura" },
    update: {
      description: "Acesso ao menu Soltura",
      permissions: JSON.stringify(["/soltura", "/solturas"]),
    },
    create: {
      name: "Soltura",
      description: "Acesso ao menu Soltura",
      permissions: JSON.stringify(["/soltura", "/solturas"]),
    },
  });

  const groupManutencao = await prisma.group.upsert({
    where: { name: "Manutenção" },
    update: {
      description: "Acesso ao menu Manutenção (CI Manutenção)",
      permissions: JSON.stringify([
        "/manutencao",
        "/manutencao/ci-manutencao",
        "/ci-manutencao",
      ]),
    },
    create: {
      name: "Manutenção",
      description: "Acesso ao menu Manutenção (CI Manutenção)",
      permissions: JSON.stringify([
        "/manutencao",
        "/manutencao/ci-manutencao",
        "/ci-manutencao",
      ]),
    },
  });

  const groupOperacional = await prisma.group.upsert({
    where: { name: "Controle Operacional" },
    update: {
      description: "Acesso ao menu Controle Operacional",
      permissions: JSON.stringify(["/controle-operacional"]),
    },
    create: {
      name: "Controle Operacional",
      description: "Acesso ao menu Controle Operacional",
      permissions: JSON.stringify(["/controle-operacional"]),
    },
  });

  // ── Users ───────────────────────────────────────────────

  // admin@teste.com — ADMIN, vê tudo
  await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@teste.com",
      password,
      role: "ADMIN",
    },
  });

  // manutencao_vcg@teste.com — Manutenção, VCG (acesso exclusivo a /manutencao e /manutencao/ci-manutencao)
  await prisma.user.upsert({
    where: { email: "manutencao_vcg@teste.com" },
    update: {
      name: "Manutenção VCG",
      password,
      role: "manutencao",
      garagem: "VCG",
      groups: { set: [{ id: groupManutencao.id }] },
    },
    create: {
      name: "Manutenção VCG",
      email: "manutencao_vcg@teste.com",
      password,
      role: "manutencao",
      garagem: "VCG",
      groups: { connect: [{ id: groupManutencao.id }] },
    },
  });

  // teste@teste.com — COLABORADOR com acesso a todos os menus
  await prisma.user.upsert({
    where: { email: "teste@teste.com" },
    update: {
      groups: { set: [{ id: groupTodos.id }] },
    },
    create: {
      name: "Teste",
      email: "teste@teste.com",
      password,
      role: "COLABORADOR",
      groups: { connect: [{ id: groupTodos.id }] },
    },
  });

  // tanque_vcg@teste.com — Leitura de Tanques, VCG
  await prisma.user.upsert({
    where: { email: "tanque_vcg@teste.com" },
    update: {
      role: "tanque",
      garagem: "VCG",
      groups: { set: [{ id: groupTanque.id }] },
    },
    create: {
      name: "Tanque VCG",
      email: "tanque_vcg@teste.com",
      password,
      role: "tanque",
      garagem: "VCG",
      groups: { connect: [{ id: groupTanque.id }] },
    },
  });

  // tanque_vcm@teste.com — Leitura de Tanques, VCM
  await prisma.user.upsert({
    where: { email: "tanque_vcm@teste.com" },
    update: {
      role: "tanque",
      garagem: "VCM",
      groups: { set: [{ id: groupTanque.id }] },
    },
    create: {
      name: "Tanque VCM",
      email: "tanque_vcm@teste.com",
      password,
      role: "tanque",
      garagem: "VCM",
      groups: { connect: [{ id: groupTanque.id }] },
    },
  });

  // abastecimento_vcg@teste.com — Abastecimento por Carro, VCG
  await prisma.user.upsert({
    where: { email: "abastecimento_vcg@teste.com" },
    update: {
      role: "abastecimento",
      garagem: "VCG",
      groups: { set: [{ id: groupAbastCarro.id }] },
    },
    create: {
      name: "Abastecimento VCG",
      email: "abastecimento_vcg@teste.com",
      password,
      role: "abastecimento",
      garagem: "VCG",
      groups: { connect: [{ id: groupAbastCarro.id }] },
    },
  });

  // abastecimento_vcm@teste.com — Abastecimento por Carro, VCM
  await prisma.user.upsert({
    where: { email: "abastecimento_vcm@teste.com" },
    update: {
      role: "abastecimento",
      garagem: "VCM",
      groups: { set: [{ id: groupAbastCarro.id }] },
    },
    create: {
      name: "Abastecimento VCM",
      email: "abastecimento_vcm@teste.com",
      password,
      role: "abastecimento",
      garagem: "VCM",
      groups: { connect: [{ id: groupAbastCarro.id }] },
    },
  });

  // soltura_vcg@teste.com — Soltura, VCG
  await prisma.user.upsert({
    where: { email: "soltura_vcg@teste.com" },
    update: {
      role: "soltura",
      garagem: "VCG",
      groups: { set: [{ id: groupSoltura.id }] },
    },
    create: {
      name: "Soltura VCG",
      email: "soltura_vcg@teste.com",
      password,
      role: "soltura",
      garagem: "VCG",
      groups: { connect: [{ id: groupSoltura.id }] },
    },
  });

  // soltura_vcm@teste.com — Soltura, VCM
  await prisma.user.upsert({
    where: { email: "soltura_vcm@teste.com" },
    update: {
      role: "soltura",
      garagem: "VCM",
      groups: { set: [{ id: groupSoltura.id }] },
    },
    create: {
      name: "Soltura VCM",
      email: "soltura_vcm@teste.com",
      password,
      role: "soltura",
      garagem: "VCM",
      groups: { connect: [{ id: groupSoltura.id }] },
    },
  });

  // operacional_vcg@teste.com — Controle Operacional, VCG
  await prisma.user.upsert({
    where: { email: "operacional_vcg@teste.com" },
    update: {
      role: "operacional",
      garagem: "VCG",
      groups: { set: [{ id: groupOperacional.id }] },
    },
    create: {
      name: "Operacional VCG",
      email: "operacional_vcg@teste.com",
      password,
      role: "operacional",
      garagem: "VCG",
      groups: { connect: [{ id: groupOperacional.id }] },
    },
  });

  // operacional_vcm@teste.com — Controle Operacional, VCM
  await prisma.user.upsert({
    where: { email: "operacional_vcm@teste.com" },
    update: {
      role: "operacional",
      garagem: "VCM",
      groups: { set: [{ id: groupOperacional.id }] },
    },
    create: {
      name: "Operacional VCM",
      email: "operacional_vcm@teste.com",
      password,
      role: "operacional",
      garagem: "VCM",
      groups: { connect: [{ id: groupOperacional.id }] },
    },
  });

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
