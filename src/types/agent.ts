export interface AgentQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'multiple' | 'file';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helperText?: string;
  dependsOn?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  initialMessage: string;
  questions: AgentQuestion[];
  capabilities: string[];
  exampleOutputs: string[];
}

export interface AgentContext {
  sessionId: string;
  agentType: string;
  answers: Record<string, any>;
  currentStep: number;
  metadata: {
    integrations: string[];
    requirements: string[];
    constraints: string[];
  };
}

// Backwards-compatible minimal agent type used by session page
export type LegacyAgentTemplate = {
  type: string;
  name: string;
  systemPrompt?: string;
  initialMessage?: string;
};
