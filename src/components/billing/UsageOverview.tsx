import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle } from "lucide-react";
import type { UsageStats } from "@/lib/usage-limits";
import type { SubscriptionWithDetails } from "@/lib/autumn";
import { checkUsageLimit, getUsageWarningMessage } from "@/lib/usage-limits";

interface UsageOverviewProps {
  usage: UsageStats;
  subscription: SubscriptionWithDetails | null;
}

export function UsageOverview({ usage, subscription }: UsageOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Usage Overview
        </CardTitle>
        <CardDescription>Track your resource usage and limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(["messages", "apiCalls"] as const).map((metric) => {
          const usageCheck = checkUsageLimit(usage, subscription, metric);
          const warning = getUsageWarningMessage(usage, subscription, metric);

          const getMetricLabel = (m: typeof metric) => {
            switch (m) {
              case "messages":
                return "Messages";
              case "apiCalls":
                return "API Calls";
              default:
                return m;
            }
          };

          return (
            <div key={metric} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{getMetricLabel(metric)}</div>
                <div className="text-right">
                  <div className="font-semibold">{usageCheck.current.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    of {usageCheck.limit ? usageCheck.limit.toLocaleString() : "Unlimited"}
                  </div>
                </div>
              </div>

              {usageCheck.limit && (
                <div className="space-y-2">
                  <Progress value={usageCheck.percentage} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{usageCheck.percentage.toFixed(1)}% used</span>
                    <span>{(usageCheck.limit - usageCheck.current).toLocaleString()} remaining</span>
                  </div>
                </div>
              )}

              {warning && (
                <Alert variant={usageCheck.withinLimit ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

