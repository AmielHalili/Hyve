import { create } from "zustand";
import { supabase } from "../lib/supabase";

type User = { id: string; email: string | null } | null;

type AuthState = {
  user: User;
  loading: boolean;
  init: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword:  (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    set({ user: s ? { id: s.user.id, email: s.user.email ?? null } : null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session ? { id: session.user.id, email: session.user.email ?? null } : null });
    });
  },

  // in store/auth.ts
signInWithPassword: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("[signInWithPassword] data:", data, "error:", error);
    return error ? { error: error.message } : {};
  },
  

  signUpWithPassword: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    try {
      const uid = data.user?.id ?? null;
      const hasSession = !!data.session;
      if (uid && hasSession) {
        // Save profile immediately when session exists
        // Initialize XP to 50 for new users
        await supabase.from('profiles').upsert({ id: uid, full_name: name ?? null, xp: 50 } as any, { onConflict: 'id' });
      } else if (name) {
        // Fallback: cache name until session exists (handled in AppBoot)
        localStorage.setItem('hyve_full_name', name);
      }
    } catch {}
    return {};
  },

  signInWithOAuth: async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  },

  sendMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error ? { error: error.message } : {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
