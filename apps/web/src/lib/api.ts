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

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erro na requisição");
  }

  return data;
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

  // Buses
  listBuses: () => request("/buses"),
  createBus: (data: any) =>
    request("/buses", { method: "POST", body: JSON.stringify(data) }),

  // Abastecimento
  listAbastecimentos: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return request(`/abastecimentos${qs ? `?${qs}` : ""}`);
  },
  createAbastecimento: (data: any) =>
    request("/abastecimentos", { method: "POST", body: JSON.stringify(data) }),

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
  getBackupStatus: (ids: number[]) => {
    return request(`/catracas/backup?ids=${ids.join(",")}`);
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
};

