import { create } from "zustand";
import { api } from "../lib/api";

type User = { id: string; email: string } | null;
type Credentials = { email: string; password: string };

type AuthState = {
  user: User;
  signIn: (cred: Credentials) => Promise<void>;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  signIn: async ({ email, password }) => {
    // TODO replace with real endpoint
    await api.post("/auth/login", { email, password }).catch(() => {});
    set({ user: { id: "u1", email } });
  },
  signOut: () => set({ user: null }),
}));
