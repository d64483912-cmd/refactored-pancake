import { authClient } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (!mounted) return;
        const hasSession = !!data?.session;
        const userRole = data?.user?.role;
        setAuthenticated(hasSession);
        setIsAdmin(hasSession && userRole === "admin");
      } catch {
        if (!mounted) return;
        setAuthenticated(false);
        setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!authenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  // Redirect to home if authenticated but not admin
  if (!isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
