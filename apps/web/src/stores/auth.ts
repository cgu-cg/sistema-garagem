import { create } from "zustand";
import { api } from "@/lib/api";

export type Role = "ADMIN" | "COLABORADOR" | "COLABORADOR_ABASTECIMENTO" | "COLABORADOR_SOLTURA";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  COLABORADOR: "Colaborador",
  COLABORADOR_ABASTECIMENTO: "Colaborador (Abastecimento)",
  COLABORADOR_SOLTURA: "Colaborador (Soltura)",
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,

  login: async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    set({ loading: true });
    try {
      const user = await api.me();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, user: null, loading: false });
    }
  },
}));
