 // src/pages/AuthDebug.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthDebug() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession();
      const u = await supabase.auth.getUser();
      setSession(s.data.session);
      setUser(u.data.user);
    })();
  }, []);

  return (
    <pre className="text-xs whitespace-pre-wrap p-4 border rounded">
      {JSON.stringify({ session, user }, null, 2)}
    </pre>
  );
}
