import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { authenticatedOnly } from "../middleware/auth";
import { extractContextFromMessages } from "../services/context-extractor";
import type { HonoContext } from "../types";
import { 
  automationSessions, 
  sessionMessages, 
  sessionIntegrations
} from "../db/schema";

export const sessionRoutes = new Hono<HonoContext>()
  // Get all sessions for the current user
  .get("/", authenticatedOnly, async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    
    const sessions = await db.select().from(automationSessions)
      .where(eq(automationSessions.userId, user!.id))
      .orderBy(sql`${automationSessions.createdAt} DESC`);
    
    return c.json({ sessions });
  })
  
  // Create a new session
  .post(
    "/",
    zValidator('json', z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      agentType: z.string().default("general"),
    })),
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
  
  // Get a specific session with its integrations
  .get(
    "/:sessionId",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // Get integrations
      const integrations = await db.select().from(sessionIntegrations)
        .where(eq(sessionIntegrations.sessionId, sessionId))
        .orderBy(sql`${sessionIntegrations.createdAt} DESC`);
      
      return c.json({ 
        session: session[0], 
        integrations: integrations.map(i => ({
          ...i,
          config: JSON.parse(i.config || '{}'),
        }))
      });
    }
  )
  
  // Get messages for a session
  .get(
    "/:sessionId/messages",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // Get messages
      const messages = await db.select().from(sessionMessages)
        .where(eq(sessionMessages.sessionId, sessionId))
        .orderBy(sessionMessages.createdAt);
      
      return c.json({ messages });
    }
  )
  
  // Add a message to a session
  .post(
    "/:sessionId/messages",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator('json', z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const { role, content } = c.req.valid('json');
      
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
      });
      
      // Update session updated timestamp
      await db.update(automationSessions)
        .set({ updatedAt: sql`(unixepoch())` })
        .where(eq(automationSessions.id, sessionId));
      
      return c.json({ messageId });
    }
  )
  
  // POST /api/sessions/:sessionId/extract-context - Extract context from messages
  .post(
    '/:sessionId/extract-context',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // Get all messages
      const messages = await db.select().from(sessionMessages)
        .where(eq(sessionMessages.sessionId, sessionId))
        .orderBy(sessionMessages.createdAt);
      
      // Extract context using AI
      const openRouterKey = c.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        return c.json({ error: 'OpenRouter not configured' }, 500);
      }
      
      const extracted = await extractContextFromMessages(
        messages.map(m => ({ role: m.role as any, content: m.content, id: m.id })),
        session[0].agentType,
        openRouterKey
      );
      
      // Create integrations that don't exist yet
      const existingIntegrations = await db.select().from(sessionIntegrations)
        .where(eq(sessionIntegrations.sessionId, sessionId));
      
      const existingNames = new Set(existingIntegrations.map(i => i.name));
      
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
      
      // Update session metadata with requirements and tech stack
      const currentMetadata = session[0].metadata ? JSON.parse(session[0].metadata) : {};
      await db.update(automationSessions)
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
        integrationsCreated: extracted.integrations.filter(i => !existingNames.has(i.name)).length
      });
    }
  )
  
  // POST /api/sessions/:sessionId/integrations - Manually add integration
  .post(
    '/:sessionId/integrations',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator('json', z.object({
      type: z.enum(['email', 'github', 'calendar', 'api', 'database']),
      name: z.string(),
      config: z.record(z.any()).optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      const { type, name, config } = c.req.valid('json');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
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
  
  // Update integration status
  .patch(
    '/:sessionId/integrations/:integrationId',
    zValidator('param', z.object({ 
      sessionId: z.string().uuid(),
      integrationId: z.string().uuid()
    })),
    zValidator('json', z.object({
      status: z.enum(['pending', 'configured', 'connected', 'error']),
      config: z.record(z.any()).optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId, integrationId } = c.req.valid('param');
      const { status, config } = c.req.valid('json');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // Update integration
      const updateData: any = { status };
      if (config !== undefined) {
        updateData.config = JSON.stringify(config);
      }
      updateData.updatedAt = sql`(unixepoch())`;
      
      await db.update(sessionIntegrations)
        .set(updateData)
        .where(eq(sessionIntegrations.id, integrationId));
      
      return c.json({ success: true });
    }
  )
  
  // Delete integration
  .delete(
    '/:sessionId/integrations/:integrationId',
    zValidator('param', z.object({ 
      sessionId: z.string().uuid(),
      integrationId: z.string().uuid()
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId, integrationId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      await db.delete(sessionIntegrations)
        .where(eq(sessionIntegrations.id, integrationId));
      
      return c.json({ success: true });
    }
  )
  
  // Delete session
  .delete(
    '/:sessionId',
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { sessionId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // This will cascade delete messages and integrations
      await db.delete(automationSessions)
        .where(eq(automationSessions.id, sessionId));
      
      return c.json({ success: true });
    }
  );