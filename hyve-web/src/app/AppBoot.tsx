import { useEffect } from "react";
import { useAuthStore } from "../store/auth";

export default function AppBoot({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return <>{children}</>;
}

