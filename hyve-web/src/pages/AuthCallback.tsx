import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    // Supabase handles parsing the URL; session is set via listener in store
    (async () => {
      // Optionally force a session check
      await supabase.auth.getSession();
      navigate("/dashboard", { replace: true });
    })();
  }, [navigate]);
  return <p className="text-sm text-black">Completing sign-in…</p>;
}

