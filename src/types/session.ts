export type IntegrationStatus = 'pending' | 'connected' | 'failed';

export type SessionIntegration = {
  id: string;
  name: string;
  integrationType: string;
  status: IntegrationStatus;
};

export type SessionAutomation = {
  id: string;
  name: string;
  language: string;
  code: string;
  description?: string;
};

export type AutomationSession = {
  id: string;
  agentType: string;
  createdAt?: string;
  updatedAt?: string;
};
