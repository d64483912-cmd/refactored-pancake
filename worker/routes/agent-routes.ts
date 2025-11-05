import { Hono } from 'hono';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';
import { getAgentTemplate, listAgentTemplates } from '../agents';

export const agentRoutes = new Hono<HonoContext>()
  .use('*', authenticatedOnly)
  
  // GET /api/agents - List all available agents
  .get('/', (c) => {
    const templates = listAgentTemplates();
    return c.json({ agents: templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      capabilities: t.capabilities,
    }))});
  })
  
  // GET /api/agents/:agentType - Get specific agent template
  .get('/:agentType', (c) => {
    const agentType = c.req.param('agentType');
    const template = getAgentTemplate(agentType);
    
    if (!template) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    return c.json({ agent: template });
  });