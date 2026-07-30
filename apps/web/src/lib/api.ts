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
};
