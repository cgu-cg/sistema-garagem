import { create } from "zustand";
import { api } from "@/lib/api";

export type Role = "ADMIN" | "COLABORADOR" | "tanque" | "abastecimento" | "soltura" | "operacional" | "manutencao";

export interface Group {
  id: number;
  name: string;
  permissions: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  groups?: Group[];
  garagem?: string;
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  COLABORADOR: "Colaborador",
  tanque: "Tanque",
  abastecimento: "Abastecimento",
  soltura: "Soltura",
  operacional: "Controle Operacional",
  manutencao: "Manutenção",
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const getCachedUser = (): User | null => {
  const cached = localStorage.getItem("user");
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
};

export const useAuth = create<AuthState>((set) => ({
  user: getCachedUser(),
  token: localStorage.getItem("token"),
  loading: !!localStorage.getItem("token"),

  login: async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    set({ loading: true });
    try {
      const user = await api.me();
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, loading: false });
    } catch (error: any) {
      const isAuthError = error.status === 401 || error.status === 403;
      if (!isAuthError) {
        const cachedUser = getCachedUser();
        if (cachedUser) {
          set({ user: cachedUser, loading: false });
          return;
        }
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ token: null, user: null, loading: false });
    }
  },
}));

export function getDefaultRoute(user: User | null): string {
  if (!user) return "/";
  if (user.role === "manutencao" || user.email?.toLowerCase().includes("manutencao")) return "/manutencao";
  if (user.email?.toLowerCase() === "teste@teste.com") return "/soltura";
  if (user.role === "ADMIN") return "/home";
  if (user.role === "tanque") return "/abastecimento";
  if (user.role === "soltura") return "/soltura";
  if (user.role === "operacional") return "/controle-operacional";
  if (user.role === "abastecimento") return "/abastecimento-carro";
  if (user.role === "COLABORADOR") return "/home";

  return "/home";
}
