import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';

export const sessionsRoutes = new Hono<HonoContext>()
  .use('*', authenticatedOnly)
  .get('/:sessionId', async (c) => {
    const { sessionId } = c.req.param();
    return c.json({
      session: {
        id: sessionId,
        agentType: 'general',
      },
      integrations: [],
      automations: [],
    });
  })
  .post(
    '/:sessionId/messages',
    zValidator(
      'json',
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    ),
    async (c) => {
      const { sessionId } = c.req.param();
      const body = c.req.valid('json');
      // Placeholder: persist message to DB in future
      return c.json({ ok: true, sessionId, saved: !!body });
    }
  );
