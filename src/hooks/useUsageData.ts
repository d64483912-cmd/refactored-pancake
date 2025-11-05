import { useCustomer } from 'autumn-js/react';
import type { UsageStats } from '@/lib/usage-limits';

export function useUsageData(_userId: string | null) {
  const { customer, refetch } = useCustomer();

  // Map Autumn customer features to UsageStats format
  const usage: UsageStats = {
    messages: customer?.features?.messages?.usage || 0,
    apiCalls: customer?.features?.api_calls?.usage || 0,
  };

  return { 
    usage, 
    loading: false, 
    error: null, 
    refetch 
  };
}
