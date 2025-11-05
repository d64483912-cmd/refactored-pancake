import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCustomer, usePricingTable } from "autumn-js/react";
import { useState } from "react";

interface AvailablePlansProps {
  userId: string;
}

export function AvailablePlans({ userId }: AvailablePlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { customer, attach } = useCustomer();

  // Load products from Autumn's pricing table
  const { products } = usePricingTable();

  const handleSubscribe = async (productId: string) => {
    try {
      setLoadingPlan(productId);
      // Let Autumn handle the dialog and payment flow
      await attach({ productId, successUrl: window.location.href });
    } catch (error) {
      console.error("Failed to attach product:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  if (!products?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Loading subscription options...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Plans</CardTitle>
        <CardDescription>
          Choose the perfect plan for your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {products?.map((product: any) => {
            const isPopular = product.id === "pro";

            // Check if this is the current plan using Autumn customer data
            // Only match active products (status === 'active')
            const isCurrentPlan =
              customer?.products?.some((p: any) => 
                p.id === product.id && p.status === 'active'
              ) || false;
            
            console.log(`🔍 Product ${product.id}:`, { 
              isCurrentPlan, 
              customerProducts: customer?.products?.map((p: any) => ({ id: p.id, status: p.status }))
            });

            // Extract pricing information from product items
            const priceItem = product.items?.find(
              (item: any) => item.type === "price"
            );
            const hasPrice = !!priceItem;

            // Format price display
            const formatPriceDisplay = () => {
              if (!priceItem?.display) return null;
              const { primary_text, secondary_text } = priceItem.display;
              return (
                <div className="mt-2">
                  <div className="text-3xl font-semibold">{primary_text}</div>
                  {secondary_text && (
                    <div className="text-sm text-muted-foreground">
                      {secondary_text}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <Card
                key={product.id}
                className={`transition-all duration-200 ${
                  isCurrentPlan ?
                    "border-2 border-primary bg-primary/5 shadow-md"
                  : isPopular ? "border-2 border-primary"
                  : ""
                }`}
              >
                <div className="flex justify-center pt-2 gap-2">
                  {isCurrentPlan && (
                    <Badge
                      variant="default"
                      className="bg-primary text-primary-foreground"
                    >
                      Current Plan
                    </Badge>
                  )}
                  {isPopular && !isCurrentPlan && <Badge>Most Popular</Badge>}
                </div>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription>
                    {product.id === "free" ?
                      "Basic features for getting started"
                    : product.id === "pro" ?
                      "Professional features for growing teams"
                    : "Advanced features for large organizations"}
                  </CardDescription>
                  {formatPriceDisplay()}
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.items?.length ?
                    <ul className="space-y-2 text-sm">
                      {product.items.map((item: any, i: number) => {
                        // Skip price items as they're shown above
                        if (item.type === "price") return null;

                        // Use the display text from the API response
                        if (item.display?.primary_text) {
                          return (
                            <li key={i} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <div>
                                <div>{item.display.primary_text}</div>
                                {item.display.secondary_text && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.display.secondary_text}
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        }

                        // Fallback to feature name
                        const featureName =
                          item.feature?.name || `Feature ${item.feature_id}`;
                        return (
                          <li key={i} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{featureName}</span>
                          </li>
                        );
                      })}
                    </ul>
                  : <div className="text-sm text-muted-foreground text-center py-2">
                      No features included
                    </div>
                  }

                  {hasPrice ?
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(product.id)}
                      disabled={
                        !userId || loadingPlan === product.id || isCurrentPlan
                      }
                      variant={isCurrentPlan ? "outline" : "default"}
                    >
                      {isCurrentPlan ?
                        "Current Plan"
                      : loadingPlan === product.id ?
                        "Processing…"
                      : `Choose ${product.name}`}
                    </Button>
                  : <div className="flex flex-col items-center gap-2">
                      <Button
                        className="w-full"
                        disabled
                        title="Free plan is always available"
                      >
                        Current Plan
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Free plan included
                      </p>
                    </div>
                  }
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
