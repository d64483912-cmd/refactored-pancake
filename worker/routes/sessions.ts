import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';
import { eq, sql } from 'drizzle-orm';
import { automationSessions, sessionIntegrations, sessionMessages } from '../db/schema';
import { extractContextFromMessages } from '../services/context-extractor';

export const sessionsRoutes = new Hono<HonoContext>()
  .use('*', authenticatedOnly)
  // List sessions for current user
  .get('/', async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    const sessions = await db
      .select()
      .from(automationSessions)
      .where(eq(automationSessions.userId, user!.id))
      .orderBy(sql`${automationSessions.createdAt} DESC`);
    return c.json({ sessions });
  })
  // Create a new session
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        agentType: z.string().default('general'),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { title, description, agentType } = c.req.valid('json');
      const sessionId = crypto.randomUUID();
      await db.insert(automationSessions).values({
        id: sessionId,
        userId: user!.id,
        title,
        description,
        agentType,
        status: 'active',
        metadata: JSON.stringify({
          requirements: [],
          constraints: [],
          techStack: [],
          databases: [],
        }),
      });
      return c.json({ sessionId });
    }
  )
  // Get session details + integrations
  .get(
    '/:sessionId',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      const integrations = await db
        .select()
        .from(sessionIntegrations)
        .where(eq(sessionIntegrations.sessionId, sessionId))
        .orderBy(sql`${sessionIntegrations.createdAt} DESC`);
      return c.json({
        session: session[0],
        integrations: integrations.map((i) => ({ ...i, config: JSON.parse(i.config || '{}') })),
        automations: [],
      });
    }
  )
  // Get messages
  .get(
    '/:sessionId/messages',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      const messages = await db
        .select()
        .from(sessionMessages)
        .where(eq(sessionMessages.sessionId, sessionId))
        .orderBy(sessionMessages.createdAt);
      return c.json({ messages });
    }
  )
  // Add message
  .post(
    '/:sessionId/messages',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator(
      'json',
      z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string().min(1) })
    ),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const { role, content } = c.req.valid('json');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      const messageId = crypto.randomUUID();
      await db.insert(sessionMessages).values({ id: messageId, sessionId, role, content });
      await db
        .update(automationSessions)
        .set({ updatedAt: sql`(unixepoch())` })
        .where(eq(automationSessions.id, sessionId));
      return c.json({ messageId });
    }
  )
  // Extract context
  .post(
    '/:sessionId/extract-context',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      const messages = await db
        .select()
        .from(sessionMessages)
        .where(eq(sessionMessages.sessionId, sessionId))
        .orderBy(sessionMessages.createdAt);
      const openRouterKey = c.env.OPENROUTER_API_KEY as string | undefined;
      if (!openRouterKey) {
        return c.json({ error: 'OpenRouter not configured' }, 500);
      }
      const extracted = await extractContextFromMessages(
        messages.map((m) => ({ role: m.role as any, content: m.content, id: m.id })),
        session[0].agentType,
        openRouterKey
      );
      const existing = await db
        .select()
        .from(sessionIntegrations)
        .where(eq(sessionIntegrations.sessionId, sessionId));
      const existingNames = new Set(existing.map((i) => i.name));
      for (const integration of extracted.integrations) {
        if (!existingNames.has(integration.name)) {
          await db.insert(sessionIntegrations).values({
            id: crypto.randomUUID(),
            sessionId,
            integrationType: integration.type,
            name: integration.name,
            config: JSON.stringify(integration.config || {}),
            status: 'pending',
          });
        }
      }
      const currentMetadata = session[0].metadata ? JSON.parse(session[0].metadata) : {};
      await db
        .update(automationSessions)
        .set({
          metadata: JSON.stringify({
            ...currentMetadata,
            requirements: extracted.requirements,
            constraints: extracted.constraints,
            techStack: extracted.techStack,
            databases: extracted.databases,
          }),
          updatedAt: sql`(unixepoch())`,
        })
        .where(eq(automationSessions.id, sessionId));
      return c.json({
        extracted,
        integrationsCreated: extracted.integrations.filter((i) => !existingNames.has(i.name)).length,
      });
    }
  )
  // Manually add integration
  .post(
    '/:sessionId/integrations',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator(
      'json',
      z.object({
        type: z.enum(['email', 'github', 'calendar', 'api', 'database']),
        name: z.string(),
        config: z.record(z.any()).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const { type, name, config } = c.req.valid('json');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      const integrationId = crypto.randomUUID();
      await db.insert(sessionIntegrations).values({
        id: integrationId,
        sessionId,
        integrationType: type,
        name,
        config: JSON.stringify(config || {}),
        status: 'pending',
      });
      return c.json({ integrationId });
    }
  )
  // Update integration
  .patch(
    '/:sessionId/integrations/:integrationId',
    zValidator('param', z.object({ sessionId: z.string().uuid(), integrationId: z.string().uuid() })),
    zValidator('json', z.object({ status: z.enum(['pending', 'configured', 'connected', 'error']), config: z.record(z.any()).optional() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId, integrationId } = c.req.valid('param');
      const { status, config } = c.req.valid('json');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      const updateData: any = { status };
      if (config !== undefined) updateData.config = JSON.stringify(config);
      updateData.updatedAt = sql`(unixepoch())`;
      await db.update(sessionIntegrations).set(updateData).where(eq(sessionIntegrations.id, integrationId));
      return c.json({ success: true });
    }
  )
  // Delete integration
  .delete(
    '/:sessionId/integrations/:integrationId',
    zValidator('param', z.object({ sessionId: z.string().uuid(), integrationId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId, integrationId } = c.req.valid('param');
      const session = await db
        .select()
        .from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      await db.delete(sessionIntegrations).where(eq(sessionIntegrations.id, integrationId));
      return c.json({ success: true });
    }
  );