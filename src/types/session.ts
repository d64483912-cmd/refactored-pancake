export interface AutomationSession {
  id: string;
  userId: string;
  agentType: 'research' | 'webapp_developer' | 'web_crawler' | 'general';
  title: string;
  status: 'active' | 'completed' | 'archived';
  metadata?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: string;
  createdAt: number;
}

export interface SessionIntegration {
  id: string;
  sessionId: string;
  integrationType: 'email' | 'github' | 'calendar' | 'api' | 'database';
  name: string;
  config?: string;
  status: 'pending' | 'connected' | 'failed';
  createdAt: number;
}

export interface SessionAutomation {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  language: 'python' | 'javascript' | 'bash' | 'typescript';
  code: string;
  status: 'draft' | 'ready' | 'downloaded';
  createdAt: number;
  updatedAt: number;
}
