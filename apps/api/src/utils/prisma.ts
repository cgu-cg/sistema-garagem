import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Hash for standard test password '123456'
const DEFAULT_HASH = bcrypt.hashSync("123456", 10);

// In-Memory Database Store
class InMemoryDB {
  groups: any[] = [];
  users: any[] = [];
  userGroups: { userId: number; groupId: number }[] = [];
  buses: any[] = [];
  abastecimentos: any[] = [];
  solturas: any[] = [];
  controlesOperacionais: any[] = [];
  abastecimentoCarroSessions: any[] = [];
  abastecimentoCarroItems: any[] = [];

  private nextId = {
    group: 1,
    user: 1,
    bus: 1,
    abastecimento: 1,
    soltura: 1,
    controle: 1,
    session: 1,
    item: 1,
  };

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Groups
    const gTodos = this.addGroup("Todos", "Acesso a Leitura de Tanques, Abastecimento por Carro, Soltura e Controle Operacional", [
      "/abastecimento",
      "/abastecimentos",
      "/abastecimento-carro",
      "/soltura",
      "/solturas",
      "/controle-operacional",
    ]);
    const gTanque = this.addGroup("Leitura de Tanques", "Acesso ao menu Leitura de Tanques", ["/abastecimento", "/abastecimentos"]);
    const gAbastCarro = this.addGroup("Abastecimento por Carro", "Acesso ao menu Abastecimento por Carro", ["/abastecimento-carro"]);
    const gSoltura = this.addGroup("Soltura", "Acesso ao menu Soltura", ["/soltura", "/solturas"]);
    const gOperacional = this.addGroup("Controle Operacional", "Acesso ao menu Controle Operacional", ["/controle-operacional"]);

    // 2. Users
    this.addUser("Administrador", "admin@teste.com", DEFAULT_HASH, "ADMIN", null, []);
    this.addUser("Teste", "teste@teste.com", DEFAULT_HASH, "COLABORADOR", null, [gTodos.id]);
    this.addUser("Tanque VCG", "tanque_vcg@teste.com", DEFAULT_HASH, "tanque", "VCG", [gTanque.id]);
    this.addUser("Tanque VCM", "tanque_vcm@teste.com", DEFAULT_HASH, "tanque", "VCM", [gTanque.id]);
    this.addUser("Abastecimento VCG", "abastecimento_vcg@teste.com", DEFAULT_HASH, "abastecimento", "VCG", [gAbastCarro.id]);
    this.addUser("Abastecimento VCM", "abastecimento_vcm@teste.com", DEFAULT_HASH, "abastecimento", "VCM", [gAbastCarro.id]);
    this.addUser("Soltura VCG", "soltura_vcg@teste.com", DEFAULT_HASH, "soltura", "VCG", [gSoltura.id]);
    this.addUser("Soltura VCM", "soltura_vcm@teste.com", DEFAULT_HASH, "soltura", "VCM", [gSoltura.id]);
    this.addUser("Operacional VCG", "operacional_vcg@teste.com", DEFAULT_HASH, "operacional", "VCG", [gOperacional.id]);
    this.addUser("Operacional VCM", "operacional_vcm@teste.com", DEFAULT_HASH, "operacional", "VCM", [gOperacional.id]);

    // 3. Buses
    const busList = [
      { plate: "ABC-1201", prefix: "1201", model: "Marcopolo Torino" },
      { plate: "ABC-1202", prefix: "1202", model: "Marcopolo Torino" },
      { plate: "ABC-1204", prefix: "1204", model: "Caio Apache Vip IV" },
      { plate: "ABC-1301", prefix: "1301", model: "Caio Millennium" },
      { plate: "ABC-1302", prefix: "1302", model: "Caio Millennium" },
      { plate: "ABC-2319", prefix: "2319", model: "Marcopolo Torino" },
      { plate: "ABC-2320", prefix: "2320", model: "Marcopolo Torino" },
      { plate: "ABC-3003", prefix: "3003", model: "Caio Apache Vip" },
      { plate: "ABC-4178", prefix: "4178", model: "Marcopolo Viale" },
      { plate: "ABC-4180", prefix: "4180", model: "Marcopolo Viale" },
    ];
    busList.forEach(b => this.addBus(b.plate, b.prefix, b.model));

    // 4. Sample Abastecimento Leitura Tanque
    this.abastecimentos.push({
      id: this.nextId.abastecimento++,
      litersT1: 14500,
      fotoT1: "https://placehold.co/400x300?text=Tanque+1",
      litersT2: 18200,
      fotoT2: "https://placehold.co/400x300?text=Tanque+2",
      litersT3: 12000,
      fotoT3: "https://placehold.co/400x300?text=Tanque+3",
      garagem: "VCG",
      userId: 1,
      createdAt: new Date(),
    });

    // 5. Sample Soltura
    this.solturas.push({
      id: this.nextId.soltura++,
      busId: 1,
      programmedBusId: 1,
      linha: "501 - Circular Centro",
      tabela: "01",
      driverCode: "01",
      driverName: "Motorista 01",
      saidaGaragem: "05:30",
      inicioLinha: "06:00",
      notes: "Soltura no horário",
      userId: 1,
      createdAt: new Date(),
    });

    // 6. Sample Controle Operacional
    this.controlesOperacionais.push({
      id: this.nextId.controle++,
      carro: "1201",
      linha: "501 - Circular Centro",
      garagem: "VCG",
      foto1: "https://placehold.co/400x300?text=Frente+1201",
      foto2: "https://placehold.co/400x300?text=Lateral+1201",
      foto3: "https://placehold.co/400x300?text=Traseira+1201",
      dataInsercao: new Date(),
      userId: 1,
    });
  }

  private addGroup(name: string, description: string, permissions: string[]) {
    const group = {
      id: this.nextId.group++,
      name,
      description,
      permissions: JSON.stringify(permissions),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.groups.push(group);
    return group;
  }

  private addUser(name: string, email: string, password: string, role: string, garagem: string | null, groupIds: number[]) {
    const user = {
      id: this.nextId.user++,
      name,
      email,
      password,
      role,
      garagem,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    groupIds.forEach(gid => this.userGroups.push({ userId: user.id, groupId: gid }));
    return user;
  }

  private addBus(plate: string, prefix: string, model: string) {
    const bus = {
      id: this.nextId.bus++,
      plate,
      prefix,
      model,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.buses.push(bus);
    return bus;
  }
}

const memoryDb = new InMemoryDB();

// Build Prisma-compatible API
const prismaMock = {
  $disconnect: async () => {},

  user: {
    findUnique: async ({ where, include, select }: any) => {
      const u = memoryDb.users.find(user => {
        if (where.id !== undefined) return user.id === Number(where.id);
        if (where.email !== undefined) return user.email.toLowerCase() === String(where.email).toLowerCase();
        return false;
      });
      if (!u) return null;

      const groupLinks = memoryDb.userGroups.filter(ug => ug.userId === u.id);
      const groups = groupLinks.map(ug => memoryDb.groups.find(g => g.id === ug.groupId)).filter(Boolean);

      const result: any = { ...u };
      if (include?.groups || select?.groups) {
        result.groups = groups.map(g => ({
          id: g.id,
          name: g.name,
          permissions: g.permissions,
        }));
      }

      if (select) {
        const filtered: any = {};
        for (const key of Object.keys(select)) {
          if (select[key]) filtered[key] = result[key];
        }
        return filtered;
      }
      return result;
    },

    findMany: async ({ where, select, orderBy }: any) => {
      let list = [...memoryDb.users];
      if (where?.role) list = list.filter(u => u.role === where.role);

      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return list.map(u => {
        const groupLinks = memoryDb.userGroups.filter(ug => ug.userId === u.id);
        const groups = groupLinks.map(ug => memoryDb.groups.find(g => g.id === ug.groupId)).filter(Boolean);
        const res: any = { ...u, groups: groups.map(g => ({ id: g.id, name: g.name, permissions: g.permissions })) };
        if (select) {
          const filtered: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) filtered[key] = res[key];
          }
          return filtered;
        }
        return res;
      });
    },

    create: async ({ data, select }: any) => {
      const newUser = {
        id: memoryDb["nextId"].user++,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || "COLABORADOR",
        garagem: data.garagem || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryDb.users.push(newUser);

      if (data.groups?.connect && Array.isArray(data.groups.connect)) {
        data.groups.connect.forEach((c: any) => {
          memoryDb.userGroups.push({ userId: newUser.id, groupId: Number(c.id) });
        });
      }

      return prismaMock.user.findUnique({ where: { id: newUser.id }, select });
    },

    update: async ({ where, data, select }: any) => {
      const idx = memoryDb.users.findIndex(u => u.id === Number(where.id));
      if (idx === -1) throw new Error("Usuário não encontrado");

      const u = memoryDb.users[idx];
      if (data.name !== undefined) u.name = data.name;
      if (data.email !== undefined) u.email = data.email;
      if (data.password !== undefined) u.password = data.password;
      if (data.role !== undefined) u.role = data.role;
      if (data.garagem !== undefined) u.garagem = data.garagem;
      u.updatedAt = new Date();

      if (data.groups?.set && Array.isArray(data.groups.set)) {
        memoryDb.userGroups = memoryDb.userGroups.filter(ug => ug.userId !== u.id);
        data.groups.set.forEach((c: any) => {
          memoryDb.userGroups.push({ userId: u.id, groupId: Number(c.id) });
        });
      }

      return prismaMock.user.findUnique({ where: { id: u.id }, select });
    },

    delete: async ({ where }: any) => {
      const id = Number(where.id);
      memoryDb.users = memoryDb.users.filter(u => u.id !== id);
      memoryDb.userGroups = memoryDb.userGroups.filter(ug => ug.userId !== id);
      return { id };
    },

    upsert: async ({ where, update, create }: any) => {
      const existing = await prismaMock.user.findUnique({ where });
      if (existing) {
        return prismaMock.user.update({ where, data: update });
      }
      return prismaMock.user.create({ data: create });
    },
  },

  group: {
    findUnique: async ({ where, include }: any) => {
      const g = memoryDb.groups.find(gr => {
        if (where.id !== undefined) return gr.id === Number(where.id);
        if (where.name !== undefined) return gr.name === where.name;
        return false;
      });
      if (!g) return null;
      const res: any = { ...g };
      if (include?.users) {
        const uids = memoryDb.userGroups.filter(ug => ug.groupId === g.id).map(ug => ug.userId);
        res.users = memoryDb.users.filter(u => uids.includes(u.id)).map(u => ({ id: u.id }));
      }
      return res;
    },

    findMany: async ({ orderBy }: any) => {
      const list = [...memoryDb.groups];
      if (orderBy?.name === "asc") {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list;
    },

    create: async ({ data }: any) => {
      const newGroup = {
        id: memoryDb["nextId"].group++,
        name: data.name,
        description: data.description || null,
        permissions: data.permissions || "[]",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryDb.groups.push(newGroup);
      return newGroup;
    },

    update: async ({ where, data }: any) => {
      const idx = memoryDb.groups.findIndex(g => g.id === Number(where.id));
      if (idx === -1) throw new Error("Grupo não encontrado");
      const g = memoryDb.groups[idx];
      if (data.name !== undefined) g.name = data.name;
      if (data.description !== undefined) g.description = data.description;
      if (data.permissions !== undefined) g.permissions = data.permissions;
      g.updatedAt = new Date();
      return g;
    },

    delete: async ({ where }: any) => {
      const id = Number(where.id);
      memoryDb.groups = memoryDb.groups.filter(g => g.id !== id);
      memoryDb.userGroups = memoryDb.userGroups.filter(ug => ug.groupId !== id);
      return { id };
    },

    upsert: async ({ where, update, create }: any) => {
      const existing = await prismaMock.group.findUnique({ where });
      if (existing) {
        return prismaMock.group.update({ where, data: update });
      }
      return prismaMock.group.create({ data: create });
    },
  },

  bus: {
    findMany: async ({ orderBy, select }: any) => {
      let list = [...memoryDb.buses];
      if (orderBy?.prefix === "asc") {
        list.sort((a, b) => a.prefix.localeCompare(b.prefix));
      }
      if (select) {
        return list.map(b => {
          const res: any = {};
          for (const key of Object.keys(select)) {
            if (select[key]) res[key] = (b as any)[key];
          }
          return res;
        });
      }
      return list;
    },

    create: async ({ data }: any) => {
      const newBus = {
        id: memoryDb["nextId"].bus++,
        plate: data.plate,
        prefix: data.prefix,
        model: data.model,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryDb.buses.push(newBus);
      return newBus;
    },
  },

  abastecimento: {
    findMany: async ({ where, include, orderBy }: any) => {
      let list = [...memoryDb.abastecimentos];
      if (where?.garagem) {
        list = list.filter(a => a.garagem === where.garagem);
      }
      if (where?.createdAt?.gte && where?.createdAt?.lte) {
        list = list.filter(a => a.createdAt >= where.createdAt.gte && a.createdAt <= where.createdAt.lte);
      }
      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return list.map(a => {
        const item: any = { ...a };
        if (include?.user) {
          const u = memoryDb.users.find(user => user.id === a.userId);
          item.user = u ? { name: u.name, email: u.email } : { name: "Usuário", email: "" };
        }
        return item;
      });
    },

    create: async ({ data, include }: any) => {
      const newItem = {
        id: memoryDb["nextId"].abastecimento++,
        litersT1: data.litersT1,
        fotoT1: data.fotoT1,
        litersT2: data.litersT2,
        fotoT2: data.fotoT2,
        litersT3: data.litersT3 ?? null,
        fotoT3: data.fotoT3 ?? null,
        garagem: data.garagem || null,
        userId: Number(data.userId),
        createdAt: new Date(),
      };
      memoryDb.abastecimentos.push(newItem);
      const res: any = { ...newItem };
      if (include?.user) {
        const u = memoryDb.users.find(user => user.id === newItem.userId);
        res.user = u ? { name: u.name } : { name: "Usuário" };
      }
      return res;
    },
  },

  abastecimentoCarroSession: {
    findFirst: async ({ where, include }: any) => {
      const session = memoryDb.abastecimentoCarroSessions.find(s => {
        if (where.userId && s.userId !== where.userId) return false;
        if (where.status && s.status !== where.status) return false;
        return true;
      });
      if (!session) return null;

      const res: any = { ...session };
      if (include?.items) {
        let items = memoryDb.abastecimentoCarroItems.filter(i => i.sessionId === session.id);
        if (include.items.orderBy?.dataHora === "desc") {
          items.sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());
        }
        res.items = items;
      }
      if (include?.user) {
        const u = memoryDb.users.find(user => user.id === session.userId);
        res.user = u ? { name: u.name, email: u.email } : { name: "Usuário", email: "" };
      }
      return res;
    },

    findUnique: async ({ where, include }: any) => {
      const session = memoryDb.abastecimentoCarroSessions.find(s => s.id === Number(where.id));
      if (!session) return null;

      const res: any = { ...session };
      if (include?.items) {
        let items = memoryDb.abastecimentoCarroItems.filter(i => i.sessionId === session.id);
        if (include.items.orderBy?.dataHora === "asc") {
          items.sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());
        }
        res.items = items;
      }
      if (include?.user) {
        const u = memoryDb.users.find(user => user.id === session.userId);
        res.user = u ? { name: u.name, email: u.email } : { name: "Usuário", email: "" };
      }
      return res;
    },

    findMany: async ({ where, include, orderBy }: any) => {
      let list = [...memoryDb.abastecimentoCarroSessions];
      if (where?.garagem) list = list.filter(s => s.garagem === where.garagem);
      if (orderBy?.dthIniAbastec === "desc") {
        list.sort((a, b) => b.dthIniAbastec.getTime() - a.dthIniAbastec.getTime());
      }
      return list.map(s => {
        const res: any = { ...s };
        if (include?.user) {
          const u = memoryDb.users.find(user => user.id === s.userId);
          res.user = u ? { name: u.name, email: u.email } : { name: "Usuário", email: "" };
        }
        if (include?._count?.items) {
          const cnt = memoryDb.abastecimentoCarroItems.filter(i => i.sessionId === s.id).length;
          res._count = { items: cnt };
        }
        return res;
      });
    },

    create: async ({ data }: any) => {
      const session = {
        id: memoryDb["nextId"].session++,
        matricula: data.matricula,
        b1Ini: data.b1Ini ?? null,
        b2Ini: data.b2Ini ?? null,
        b3Ini: data.b3Ini ?? null,
        b4Ini: data.b4Ini ?? null,
        b5Ini: data.b5Ini ?? null,
        b6Ini: data.b6Ini ?? null,
        b1Fim: null,
        b2Fim: null,
        b3Fim: null,
        b4Fim: null,
        b5Fim: null,
        b6Fim: null,
        status: data.status || "EM_ANDAMENTO",
        garagem: data.garagem || null,
        userId: Number(data.userId),
        dthIniAbastec: new Date(),
        dthFimAbastec: null,
        createdAt: new Date(),
      };
      memoryDb.abastecimentoCarroSessions.push(session);
      return session;
    },

    update: async ({ where, data }: any) => {
      const session = memoryDb.abastecimentoCarroSessions.find(s => s.id === Number(where.id));
      if (!session) throw new Error("Sessão não encontrada");
      if (data.b1Fim !== undefined) session.b1Fim = data.b1Fim;
      if (data.b2Fim !== undefined) session.b2Fim = data.b2Fim;
      if (data.b3Fim !== undefined) session.b3Fim = data.b3Fim;
      if (data.b4Fim !== undefined) session.b4Fim = data.b4Fim;
      if (data.b5Fim !== undefined) session.b5Fim = data.b5Fim;
      if (data.b6Fim !== undefined) session.b6Fim = data.b6Fim;
      if (data.status !== undefined) session.status = data.status;
      if (data.dthFimAbastec !== undefined) session.dthFimAbastec = data.dthFimAbastec;
      return session;
    },
  },

  abastecimentoCarroItem: {
    create: async ({ data }: any) => {
      const item = {
        id: memoryDb["nextId"].item++,
        sessionId: Number(data.sessionId),
        carro: data.carro,
        liters: data.liters,
        bomba: data.bomba,
        foto: data.foto,
        matricula: data.matricula,
        garagem: data.garagem || null,
        dataHora: new Date(),
      };
      memoryDb.abastecimentoCarroItems.push(item);
      return item;
    },
  },

  soltura: {
    findMany: async ({ where, include, orderBy }: any) => {
      let list = [...memoryDb.solturas];
      if (where?.createdAt?.gte && where?.createdAt?.lte) {
        list = list.filter(s => s.createdAt >= where.createdAt.gte && s.createdAt <= where.createdAt.lte);
      }
      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return list.map(s => {
        const item: any = { ...s };
        if (include?.bus) {
          const b = memoryDb.buses.find(bus => bus.id === s.busId);
          item.bus = b ? { plate: b.plate, prefix: b.prefix, model: b.model } : null;
        }
        if (include?.programmedBus) {
          const pb = memoryDb.buses.find(bus => bus.id === s.programmedBusId);
          item.programmedBus = pb ? { plate: pb.plate, prefix: pb.prefix, model: pb.model } : null;
        }
        if (include?.user) {
          const u = memoryDb.users.find(user => user.id === s.userId);
          item.user = u ? { name: u.name } : { name: "Usuário" };
        }
        return item;
      });
    },

    create: async ({ data, include }: any) => {
      const newItem = {
        id: memoryDb["nextId"].soltura++,
        busId: Number(data.busId),
        programmedBusId: data.programmedBusId ? Number(data.programmedBusId) : null,
        linha: data.linha,
        tabela: data.tabela,
        driverCode: data.driverCode,
        driverName: data.driverName,
        saidaGaragem: data.saidaGaragem,
        inicioLinha: data.inicioLinha,
        notes: data.notes || null,
        userId: Number(data.userId),
        createdAt: new Date(),
      };
      memoryDb.solturas.push(newItem);

      const res: any = { ...newItem };
      if (include?.bus) {
        const b = memoryDb.buses.find(bus => bus.id === newItem.busId);
        res.bus = b ? { plate: b.plate, prefix: b.prefix } : null;
      }
      if (include?.programmedBus) {
        const pb = memoryDb.buses.find(bus => bus.id === newItem.programmedBusId);
        res.programmedBus = pb ? { plate: pb.plate, prefix: pb.prefix } : null;
      }
      return res;
    },
  },

  controleOperacional: {
    findFirst: async ({ where }: any) => {
      return memoryDb.controlesOperacionais.find(c => {
        if (where.carro && c.carro.trim() === where.carro.trim()) return true;
        return false;
      }) || null;
    },

    findUnique: async ({ where }: any) => {
      return memoryDb.controlesOperacionais.find(c => c.id === Number(where.id)) || null;
    },

    findMany: async ({ where, include, orderBy }: any) => {
      let list = [...memoryDb.controlesOperacionais];
      if (where?.garagem) {
        if (typeof where.garagem === "string") {
          list = list.filter(c => c.garagem === where.garagem);
        } else if (where.garagem.contains) {
          list = list.filter(c => c.garagem && c.garagem.includes(where.garagem.contains));
        }
      }
      if (where?.dataInsercao?.gte && where?.dataInsercao?.lte) {
        list = list.filter(c => c.dataInsercao >= where.dataInsercao.gte && c.dataInsercao <= where.dataInsercao.lte);
      }
      if (orderBy?.dataInsercao === "desc") {
        list.sort((a, b) => b.dataInsercao.getTime() - a.dataInsercao.getTime());
      }

      return list.map(c => {
        const item: any = { ...c };
        if (include?.user) {
          const u = memoryDb.users.find(user => user.id === c.userId);
          item.user = u ? { id: u.id, name: u.name, email: u.email } : { id: 1, name: "Usuário", email: "" };
        }
        return item;
      });
    },

    create: async ({ data, include }: any) => {
      const newItem = {
        id: memoryDb["nextId"].controle++,
        carro: data.carro,
        linha: data.linha,
        garagem: data.garagem,
        foto1: data.foto1,
        foto2: data.foto2 || null,
        foto3: data.foto3 || null,
        dataInsercao: new Date(),
        userId: Number(data.userId),
      };
      memoryDb.controlesOperacionais.push(newItem);

      const res: any = { ...newItem };
      if (include?.user) {
        const u = memoryDb.users.find(user => user.id === newItem.userId);
        res.user = u ? { id: u.id, name: u.name, email: u.email } : { id: 1, name: "Usuário", email: "" };
      }
      return res;
    },

    update: async ({ where, data, include }: any) => {
      const idx = memoryDb.controlesOperacionais.findIndex(c => c.id === Number(where.id));
      if (idx === -1) throw new Error("Registro não encontrado");
      const c = memoryDb.controlesOperacionais[idx];
      if (data.carro !== undefined) c.carro = data.carro;
      if (data.linha !== undefined) c.linha = data.linha;
      if (data.garagem !== undefined) c.garagem = data.garagem;
      if (data.foto1 !== undefined) c.foto1 = data.foto1;
      if (data.foto2 !== undefined) c.foto2 = data.foto2;
      if (data.foto3 !== undefined) c.foto3 = data.foto3;

      const res: any = { ...c };
      if (include?.user) {
        const u = memoryDb.users.find(user => user.id === c.userId);
        res.user = u ? { id: u.id, name: u.name, email: u.email } : { id: 1, name: "Usuário", email: "" };
      }
      return res;
    },

    delete: async ({ where }: any) => {
      const id = Number(where.id);
      memoryDb.controlesOperacionais = memoryDb.controlesOperacionais.filter(c => c.id !== id);
      return { id };
    },
  },
};

export default prismaMock as any;
