// Replaced Stripe integration with Autumn-based stubs.
// Keep filename for compatibility with existing imports.

export interface SubscriptionWithDetails {
  id: string;
  status: 'inactive' | 'trialing' | 'active' | 'canceled';
  plan?: string;
  planName?: string;
  periodStart?: string;
  periodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd?: boolean;
  seats?: number;
  statusText: string;
  isActive: boolean;
  isTrialing: boolean;
  isCancelled: boolean;
}

export async function getSubscription(_userId: string): Promise<SubscriptionWithDetails | null> {
  // TODO: Wire with Autumn subscription lookup via autumn-js or server endpoints
  return null; // Free tier by default
}

export interface CreateCheckoutSessionParams {
  userId: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
  annual?: boolean;
  returnUrl?: string;
}

export async function createCheckoutSession(_params: CreateCheckoutSessionParams): Promise<{ url: string } | null> {
  // TODO: Implement Autumn checkout flow
  return null;
}

export async function createBillingPortalSession(_userId: string): Promise<{ url: string } | null> {
  // TODO: Implement Autumn billing portal
  return null;
}

export async function cancelSubscription(_userId: string, _subscriptionId?: string): Promise<{ success: boolean }> {
  // TODO: Implement Autumn cancel subscription
  return { success: false };
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'canceled':
      return 'Cancelled';
    default:
      return 'Free';
  }
}

export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  return Boolean(sub && (sub.status === 'active' || sub.status === 'trialing'));
}

export function getDaysRemaining(subscription: SubscriptionWithDetails): number {
  if (!subscription.periodEnd) return 0;
  const endDate = new Date(subscription.periodEnd);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isSubscriptionEndingSoon(subscription: SubscriptionWithDetails): boolean {
  const days = getDaysRemaining(subscription);
  return days > 0 && days <= 7 && !subscription.isCancelled;
}

