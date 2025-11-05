import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { InferResponseType } from 'hono/client';
import type { AppType } from 'worker/app';

export type AgentsList = InferResponseType<AppType['agents']['$get']>;
export type AgentDetail = InferResponseType<AppType['agents'][':agentType']['$get']>;

export function useAgentsList() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await apiClient.agents.$get();
      if (!res.ok) throw new Error('Failed to load agents');
      return res.json() as Promise<AgentsList>;
    },
  });
}

export function useAgentTemplate(agentType: string | undefined) {
  return useQuery({
    enabled: !!agentType,
    queryKey: ['agent', agentType],
    queryFn: async () => {
      const res = await apiClient.agents[':agentType'].$get({ param: { agentType: agentType! } });
      if (!res.ok) throw new Error('Failed to load agent');
      return res.json() as Promise<AgentDetail>;
    },
  });
}
