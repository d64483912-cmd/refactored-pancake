import type { SubscriptionWithDetails } from './autumn';

export interface UsageStats {
  messages: number;
  apiCalls: number;
}

export interface PlanLimits {
  messages?: number;
  apiCalls?: number;
}

export interface UsageCheck {
  withinLimit: boolean;
  current: number;
  limit: number | undefined;
  percentage: number;
}

export function getPlanLimits(subscription: SubscriptionWithDetails | null): PlanLimits {
  // Free tier defaults; paid plans are unlimited unless specified
  if (!subscription || !subscription.isActive) {
    return { messages: 100, apiCalls: 500 };
  }
  return {};
}

export function checkUsageLimit(
  usage: UsageStats,
  subscription: SubscriptionWithDetails | null,
  metric: keyof UsageStats
): UsageCheck {
  const limits = getPlanLimits(subscription);
  const current = usage[metric];
  const limit = limits[metric];

  if (!limit) {
    return {
      withinLimit: true,
      current,
      limit: undefined,
      percentage: 0
    };
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const withinLimit = current <= limit;

  return {
    withinLimit,
    current,
    limit,
    percentage
  };
}

export function canSendMessage(usage: UsageStats, subscription: SubscriptionWithDetails | null): boolean {
  return checkUsageLimit(usage, subscription, 'messages').withinLimit;
}

export function canMakeApiCall(usage: UsageStats, subscription: SubscriptionWithDetails | null): boolean {
  return checkUsageLimit(usage, subscription, 'apiCalls').withinLimit;
}

export function getUsageWarningMessage(
  usage: UsageStats,
  subscription: SubscriptionWithDetails | null,
  metric: keyof UsageStats
): string | null {
  const check = checkUsageLimit(usage, subscription, metric);
  
  if (!check.withinLimit) {
    return `You've reached your ${metric} limit. Upgrade your plan to continue.`;
  }
  
  if (check.percentage >= 90) {
    return `You're approaching your ${metric} limit (${Math.round(check.percentage)}% used). Consider upgrading soon.`;
  }
  
  if (check.percentage >= 75) {
    return `You've used ${Math.round(check.percentage)}% of your ${metric} limit.`;
  }
  
  return null;
}

export function getUpgradeSuggestion(
  usage: UsageStats,
  subscription: SubscriptionWithDetails | null
): string | null {
  const limits = getPlanLimits(subscription);
  
  // Check if user needs more of anything
  if (limits.messages && usage.messages >= limits.messages * 0.9) {
    return "Approaching message limit? Upgrade to our Pro plan for more messages.";
  }
  
  if (limits.apiCalls && usage.apiCalls >= limits.apiCalls * 0.9) {
    return "Approaching API limit? Upgrade for more API calls.";
  }
  
  return null;
}
