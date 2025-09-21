import { useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";

export default function AppBoot({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const user = useAuthStore((s) => s.user);
  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const cached = localStorage.getItem('hyve_full_name');
        if (cached) {
          await supabase.from('profiles').upsert({ id: user.id, full_name: cached }, { onConflict: 'id' });
          localStorage.removeItem('hyve_full_name');
        }
      } catch {}
    })();
  }, [user?.id]);
  return <>{children}</>;
}
