import { useEffect, useState, useCallback } from "react";
import type { SubscriptionWithDetails } from "@/lib/autumn";
import { getSubscription } from "@/lib/autumn";

export function useSubscription(userId: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sub = await getSubscription(userId);
      setSubscription(sub);
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError("Unable to load subscription details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
}

