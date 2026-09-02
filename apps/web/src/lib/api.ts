const API_URL = "/api";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos de timeout

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 204) return null;

    let data: any = {};
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text.length < 150 ? text : `Erro na comunicação com o servidor (${res.status})` };
      }
    }

    if (!res.ok) {
      const errorMsg =
        data?.error ||
        (res.status === 502 || res.status === 504 || res.status === 500
          ? "Servidor da API indisponível. Verifique se o backend está em execução."
          : `Erro na requisição (${res.status})`);
      const error = new Error(errorMsg) as any;
      error.status = res.status;
      throw error;
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("TIMEOUT_ERROR");
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request("/auth/me"),

  // Users
  listUsers: () => request("/users"),
  createUser: (data: any) =>
    request("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request(`/users/${id}`, { method: "DELETE" }),

  // Groups
  listGroups: () => request("/groups"),
  createGroup: (data: any) =>
    request("/groups", { method: "POST", body: JSON.stringify(data) }),
  updateGroup: (id: number, data: any) =>
    request(`/groups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteGroup: (id: number) =>
    request(`/groups/${id}`, { method: "DELETE" }),

  // Buses
  listBuses: () => request("/buses"),
  createBus: (data: any) =>
    request("/buses", { method: "POST", body: JSON.stringify(data) }),

  // Abastecimento
  listAbastecimentos: (params?: { date?: string; garagem?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.garagem) query.set("garagem", params.garagem);
    const qs = query.toString();
    return request(`/abastecimentos${qs ? `?${qs}` : ""}`);
  },
  createAbastecimento: (data: any) =>
    request("/abastecimentos", { method: "POST", body: JSON.stringify(data) }),

  // Abastecimento por Carro
  getActiveAbastecimentoCarroSession: () => request("/abastecimento-carro/session/active"),
  startAbastecimentoCarroSession: (data: any) =>
    request("/abastecimento-carro/session/start", { method: "POST", body: JSON.stringify(data) }),
  createAbastecimentoCarroItem: (data: any) =>
    request("/abastecimento-carro/item", { method: "POST", body: JSON.stringify(data) }),
  finishAbastecimentoCarroSession: (data: any) =>
    request("/abastecimento-carro/session/finish", { method: "POST", body: JSON.stringify(data) }),
  listAbastecimentoCarroSessions: () => request("/abastecimento-carro/sessions"),
  getAbastecimentoCarroSessionDetails: (id: number) => request(`/abastecimento-carro/sessions/${id}`),

  // Soltura
  listSolturas: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return request(`/solturas${qs ? `?${qs}` : ""}`);
  },
  createSoltura: (data: any) =>
    request("/solturas", { method: "POST", body: JSON.stringify(data) }),

  // Catracas
  getConsistenciaCatraca: (params: { date: string; minDiff?: number }) => {
    const query = new URLSearchParams({ date: params.date });
    if (params.minDiff !== undefined) query.set("minDiff", params.minDiff.toString());
    return request(`/catracas/consistencia?${query.toString()}`);
  },
  getDatasIncorretas: (params?: { startDate?: string; year?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.year) query.set("year", params.year);
    const qs = query.toString();
    return request(`/catracas/datas-incorretas${qs ? `?${qs}` : ""}`);
  },
  getVeiculosForaFrota: (params?: { startDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    const qs = query.toString();
    return request(`/catracas/fora-frota${qs ? `?${qs}` : ""}`);
  },
  getVeiculoServicos: (params: { idVeiculo: number; startDate?: string }) => {
    const query = new URLSearchParams({ idVeiculo: params.idVeiculo.toString() });
    if (params.startDate) query.set("startDate", params.startDate);
    return request(`/catracas/veiculo-servicos?${query.toString()}`);
  },
  getBackupStatus: (ids?: number[]) => {
    const qs = ids && ids.length > 0 ? `?ids=${ids.join(",")}` : "";
    return request(`/catracas/backup${qs}`);
  },
  updateBackupStatus: (data: { ids: number[]; coletaBKPIni: string; coletaBKPFim: string }) => {
    return request("/catracas/backup/update", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getDetalhesVeiculo: (params: { idVeiculo: number; date: string }) => {
    const query = new URLSearchParams({ idVeiculo: params.idVeiculo.toString(), date: params.date });
    return request(`/catracas/detalhes-veiculo?${query.toString()}`);
  },
  getDiarios: (params: {
    carro: string;
    startDate: string;
    endDate: string;
    dateSV1?: string | null;
    dateSV2?: string | null;
  }) => {
    const query = new URLSearchParams({
      carro: params.carro,
      startDate: params.startDate,
      endDate: params.endDate,
    });
    if (params.dateSV1) query.set("dateSV1", params.dateSV1);
    if (params.dateSV2) query.set("dateSV2", params.dateSV2);
    return request(`/catracas/diarios?${query.toString()}`);
  },

  // Controle Operacional
  listControleOperacional: (params?: { date?: string; garagem?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.garagem) query.set("garagem", params.garagem);
    const qs = query.toString();
    return request(`/controle-operacional${qs ? `?${qs}` : ""}`);
  },
  listOperacionalVeiculos: () => request("/controle-operacional/veiculos"),
  listOperacionalLinhas: () => request("/controle-operacional/linhas"),
  createControleOperacional: (data: any) =>
    request("/controle-operacional", { method: "POST", body: JSON.stringify(data) }),
  deleteControleOperacional: (id: number) =>
    request(`/controle-operacional/${id}`, { method: "DELETE" }),
  updateControleOperacional: (id: number, data: any) =>
    request(`/controle-operacional/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Reservas de Terminais
  listReservasTerminais: (params?: { garagem?: string; date?: string; terminal?: string }) => {
    const query = new URLSearchParams();
    if (params?.garagem) query.set("garagem", params.garagem);
    if (params?.date) query.set("date", params.date);
    if (params?.terminal) query.set("terminal", params.terminal);
    const qs = query.toString();
    return request(`/solturas/reservas-terminais${qs ? `?${qs}` : ""}`);
  },
  createReservaTerminal: (data: { carro: string; tipo: string; terminal: string; garagem?: string }) =>
    request("/solturas/reservas-terminais", { method: "POST", body: JSON.stringify(data) }),
  deleteReservaTerminal: (id: number) =>
    request(`/solturas/reservas-terminais/${id}`, { method: "DELETE" }),
};


