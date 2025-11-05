import { Hono } from 'hono';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';

export const agentsRoutes = new Hono<HonoContext>()
  .use('*', authenticatedOnly)
  .get('/:agentType', async (c) => {
    const { agentType } = c.req.param();
    const name = agentType.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    return c.json({
      agent: {
        type: agentType,
        name: `${name} Agent`,
        systemPrompt:
          'You are a helpful automation agent. Answer succinctly and ask clarifying questions when needed. Prefer practical steps.',
        initialMessage: 'Hi! I\'m ready to help. What would you like to accomplish today?',
      },
    });
  });
