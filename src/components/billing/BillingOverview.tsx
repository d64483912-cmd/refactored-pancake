import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SubscriptionWithDetails } from "@/lib/autumn";
import { type UsageStats, getUpgradeSuggestion } from "@/lib/usage-limits";
import { TrendingUp } from "lucide-react";
import { AvailablePlans } from "./AvailablePlans";
import { CurrentPlan } from "./CurrentPlan";
import { HelpCard } from "./HelpCard";
import { UsageOverview } from "./UsageOverview";

interface BillingOverviewProps {
  userId: string;
  usage: UsageStats;
  subscription: SubscriptionWithDetails | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function BillingOverview({
  userId,
  usage,
  subscription,
  loading,
  error,
}: BillingOverviewProps) {
  const upgradeSuggestion = getUpgradeSuggestion(usage, subscription);

  return (
    <div className="space-y-6">
      <CurrentPlan
        subscription={subscription}
        loading={loading}
        error={error}
      />
      <UsageOverview usage={usage} subscription={subscription} />
      <AvailablePlans userId={userId} />
      <HelpCard />
      {upgradeSuggestion && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {upgradeSuggestion}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
