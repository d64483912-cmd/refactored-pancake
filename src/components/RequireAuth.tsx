import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (!mounted) return;
        setAuthenticated(!!data?.session);
      } catch {
        if (!mounted) return;
        setAuthenticated(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Checking session…</div>;
  if (!authenticated) return <Navigate to="/sign-in" replace state={{ from: location }} />;
  return <>{children}</>;
}

