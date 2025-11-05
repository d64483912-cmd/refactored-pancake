import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';
import { automationSessions, sessionMessages, sessionIntegrations, sessionAutomations } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const sessionRoutes = new Hono<HonoContext>()
  .use('*', authenticatedOnly)

  // POST /api/sessions - Create new session
  .post(
    '/',
    zValidator('json', z.object({
      agentType: z.enum(['research', 'webapp_developer', 'web_crawler', 'general']),
      title: z.string().optional(),
      initialMessage: z.string().optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { agentType, title, initialMessage } = c.req.valid('json');

      const sessionId = crypto.randomUUID();

      await db.insert(automationSessions).values({
        id: sessionId,
        userId: user!.id,
        agentType,
        title: title || `${agentType} automation`,
        status: 'active',
      });

      if (initialMessage) {
        await db.insert(sessionMessages).values({
          id: crypto.randomUUID(),
          sessionId,
          role: 'user',
          content: initialMessage,
        });
      }

      return c.json({ sessionId, agentType });
    }
  )

  // GET /api/sessions/:sessionId - Get session details
  .get(
    '/:sessionId',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');

      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);

      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }

      const messages = await db.select().from(sessionMessages)
        .where(eq(sessionMessages.sessionId, sessionId))
        .orderBy(sessionMessages.createdAt);

      const integrations = await db.select().from(sessionIntegrations)
        .where(eq(sessionIntegrations.sessionId, sessionId));

      const automations = await db.select().from(sessionAutomations)
        .where(eq(sessionAutomations.sessionId, sessionId));

      return c.json({
        session: session[0],
        messages,
        integrations,
        automations,
      });
    }
  )

  // GET /api/sessions - List user's sessions
  .get('/', async (c) => {
    const db = c.get('db');
    const user = c.get('user');

    const sessions = await db.select().from(automationSessions)
      .where(eq(automationSessions.userId, user!.id))
      .orderBy(desc(automationSessions.updatedAt));

    return c.json({ sessions });
  })

  // POST /api/sessions/:sessionId/messages - Add message to session
  .post(
    '/:sessionId/messages',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator('json', z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      metadata: z.string().optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const { role, content, metadata } = c.req.valid('json');

      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);

      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }

      const messageId = crypto.randomUUID();
      await db.insert(sessionMessages).values({
        id: messageId,
        sessionId,
        role,
        content,
        metadata,
      });

      return c.json({ messageId });
    }
  );
