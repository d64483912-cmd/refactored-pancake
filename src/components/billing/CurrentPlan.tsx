import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Calendar, CreditCard, Settings, AlertTriangle, Users, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { SubscriptionWithDetails } from "@/lib/autumn";
import autumn from "../../../autumn.config";
import { useCustomer } from "autumn-js/react";

interface CurrentPlanProps {
  subscription: SubscriptionWithDetails | null;
  loading?: boolean;
  error?: string | null;
}

export function CurrentPlan({ subscription, loading, error }: CurrentPlanProps) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { openBillingPortal, customer } = useCustomer();

  const handleManageBilling = async () => {
    try {
      setBusy(true);
      setActionError(null);
      await openBillingPortal({ returnUrl: window.location.href });
    } catch (e) {
      console.error(e);
      setActionError("Failed to open billing portal");
    } finally {
      setBusy(false);
    }
  };


  // Get current plan from Autumn customer data
  const currentProduct = customer?.products?.[0];
  const planName = currentProduct?.name || "Free Plan";
  
  // Get additional product data from Autumn
  const productData = currentProduct as any;
  console.log('🔍 Current Product Data:', productData);
  const periodStart = productData?.current_period_start ? new Date(productData.current_period_start) : null;
  const periodEnd = productData?.current_period_end ? new Date(productData.current_period_end) : null;
  const canceledAt = productData?.canceled_at ? new Date(productData.canceled_at) : null;
  const startedAt = productData?.started_at ? new Date(productData.started_at) : null;
  const productStatus = productData?.status || 'unknown';
  
  // Determine status label
  const statusLabel = canceledAt ? "Canceling" : productStatus === 'active' ? "Active" : currentProduct ? "Active" : "Free";
  const showPeriod = Boolean(currentProduct && (periodStart || periodEnd));

  // Calculate trial progress if in trial
  const trialProgress = subscription?.isTrialing && subscription?.trialStart && subscription?.trialEnd
    ? Math.min(100, Math.max(0,
        ((Date.now() - new Date(subscription.trialStart).getTime()) /
         (new Date(subscription.trialEnd).getTime() - new Date(subscription.trialStart).getTime())) * 100
      ))
    : null;

  // Format dates for display
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{planName}</CardTitle>
              <CardDescription>
                {currentProduct ? "Premium features active" : "Upgrade to unlock all features"}
              </CardDescription>
            </div>
          </div>
          <Badge variant={
            canceledAt ? 'destructive' :
            currentProduct ? 'default' : 'outline'
          }>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        )}

        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentProduct && (
          <div className="space-y-4">
            {/* Trial Progress */}
            {subscription?.isTrialing && subscription?.trialStart && subscription?.trialEnd && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Clock className="h-4 w-4" />
                    Trial Period
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(subscription?.trialStart!)} - {formatDate(subscription?.trialEnd!)}
                  </span>
                </div>
                <Progress value={trialProgress || 0} className="h-2 mb-2 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(trialProgress || 0)}% of trial used • {Math.ceil((new Date(subscription?.trialEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </p>
              </div>
            )}

            {/* Current Period */}
            {showPeriod && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Current Period
                  </div>
                  <div className="text-sm font-medium">
                    {periodStart && periodEnd ? (
                      `${formatDate(periodStart)} – ${formatDate(periodEnd)}`
                    ) : (
                      <span className="text-muted-foreground">Active subscription</span>
                    )}
                  </div>
                </div>

                {/* Seats */}
                {subscription?.seats && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Team Seats
                    </div>
                    <div className="text-sm font-medium">
                      {subscription?.seats} {subscription?.seats === 1 ? 'seat' : 'seats'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancellation Warning */}
            {canceledAt && periodEnd && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription was canceled on {formatDate(canceledAt)} and will end on {formatDate(periodEnd)}.
                  You'll continue to have access until then.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Subscription Start Date */}
            {startedAt && !canceledAt && (
              <div className="p-3 bg-muted/40 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Subscribed since {formatDate(startedAt)}
                  </span>
                </div>
              </div>
            )}

            {/* Features */}
            {(() => {
              const productConfig = autumn.products.find(p => p.id === currentProduct?.id);
              const allItems = productConfig?.items || [];
              
              // Filter out price items, only show features (with defensive check)
              const features = Array.isArray(allItems) 
                ? allItems.filter((item: any) => item.type !== 'price')
                : [];
              
              if (features.length === 0) return null;
              
              // Helper to get feature name from autumn config
              const getFeatureName = (featureId: string) => {
                const feature = autumn.features.find(f => f.id === featureId);
                return feature?.name || featureId;
              };
              
              return (
                <div className="p-4 bg-muted/40 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <CheckCircle className="h-4 w-4" />
                    Active Features
                  </div>
                  <ul className="space-y-2 text-sm">
                    {features.map((item: any, i) => {
                      const featureName = item.feature_id ? getFeatureName(item.feature_id) : 'Unknown Feature';
                      const includedUsage = item.included_usage;
                      
                      return (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>
                            {featureName}
                            {includedUsage && ` (${includedUsage.toLocaleString()} included)`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}

        {actionError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleManageBilling} variant="outline" disabled={busy}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

