import { researchAgent } from './templates/research-agent';
import { webappDeveloperAgent } from './templates/webapp-developer-agent';
import { webCrawlerAgent } from './templates/web-crawler-agent';
import type { AgentTemplate } from './types';

export const AGENT_TEMPLATES: Record<string, AgentTemplate> = {
  research: researchAgent,
  webapp_developer: webappDeveloperAgent,
  web_crawler: webCrawlerAgent,
};

export function getAgentTemplate(agentType: string): AgentTemplate | null {
  return AGENT_TEMPLATES[agentType] || null;
}

export function listAgentTemplates(): AgentTemplate[] {
  return Object.values(AGENT_TEMPLATES);
}

export * from './types';