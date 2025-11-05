import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth";
import { useUsageData } from "@/hooks/useUsageData";
import { useSubscription } from "@/hooks/useSubscription";
import { BillingOverview } from "@/components/billing/BillingOverview";
export default function Billing() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authClient.getSession();
        setUserId(data?.user?.id ?? null);

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("success")) {
          setSuccess(true);
          setError(null);
        }
        if (urlParams.has("canceled")) {
          setError("Subscription process was canceled.");
        }
      } catch (err) {
        console.error("Failed to get session:", err);
        setError("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { usage, loading: usageLoading, error: usageError } = useUsageData(userId);
  const { subscription, loading: subLoading, error: subError, refetch } = useSubscription(userId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 lg:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing</h1>
          <p className="text-muted-foreground">Current plan and usage overview</p>
        </div>

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Subscription updated successfully</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !userId ? (
          <div className="text-sm text-muted-foreground">You must be signed in to view billing.</div>
        ) : (
          <div className="space-y-8">
            <BillingOverview
              userId={userId}
              usage={usage}
              subscription={subscription}
              loading={usageLoading || subLoading}
              error={usageError || subError}
              onRefresh={refetch}
            />
          </div>
        )}
      </main>
    </div>
  );
}
