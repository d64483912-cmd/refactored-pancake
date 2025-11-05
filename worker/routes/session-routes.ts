import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authenticatedOnly } from "../middleware/auth";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { generateAutomationCode } from "../services/code-generator";
import { automationSessions, sessionMessages, sessionAutomations } from "../db/schema";
import type { HonoContext } from "../types";

export const sessionRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)

  // GET /api/sessions - List user's sessions
  .get("/", async (c) => {
    const db = c.get('db');
    const user = c.get('user')!;
    
    const sessions = await db
      .select({
        id: automationSessions.id,
        title: automationSessions.title,
        agentType: automationSessions.agentType,
        status: automationSessions.status,
        createdAt: automationSessions.createdAt,
        updatedAt: automationSessions.updatedAt,
      })
      .from(automationSessions)
      .where(eq(automationSessions.userId, user.id))
      .orderBy(sql`${automationSessions.updatedAt} desc`);
    
    return c.json({ sessions });
  })

  // POST /api/sessions - Create new session
  .post(
    "/",
    zValidator('json', z.object({
      title: z.string().min(1),
      agentType: z.string().min(1),
      requirements: z.array(z.string()).optional(),
      techStack: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { title, agentType, requirements, techStack, constraints } = c.req.valid('json');
      
      const sessionId = crypto.randomUUID();
      await db.insert(automationSessions).values({
        id: sessionId,
        userId: user.id,
        title,
        agentType,
        metadata: { requirements, techStack, constraints },
      });
      
      return c.json({ sessionId });
    }
  )

  // GET /api/sessions/:sessionId - Get session details
  .get(
    "/:sessionId",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { sessionId } = c.req.valid('param');
      
      const session = await db
        .select()
        .from(automationSessions)
        .where(and(
          eq(automationSessions.id, sessionId),
          eq(automationSessions.userId, user.id)
        ))
        .limit(1);
      
      if (!session.length) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      return c.json({ session: session[0] });
    }
  )

  // GET /api/sessions/:sessionId/messages - Get session messages
  .get(
    "/:sessionId/messages",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { sessionId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db
        .select()
        .from(automationSessions)
        .where(and(
          eq(automationSessions.id, sessionId),
          eq(automationSessions.userId, user.id)
        ))
        .limit(1);
      
      if (!session.length) {
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

  // POST /api/sessions/:sessionId/messages - Add message to session
  .post(
    "/:sessionId/messages",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator('json', z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1),
      metadata: z.record(z.unknown()).optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { sessionId } = c.req.valid('param');
      const { role, content, metadata } = c.req.valid('json');
      
      // Verify session ownership
      const session = await db
        .select()
        .from(automationSessions)
        .where(and(
          eq(automationSessions.id, sessionId),
          eq(automationSessions.userId, user.id)
        ))
        .limit(1);
      
      if (!session.length) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      const messageId = crypto.randomUUID();
      await db.insert(sessionMessages).values({
        id: messageId,
        sessionId,
        role,
        content,
        metadata: metadata || {},
      });
      
      // Update session updated timestamp
      await db.update(automationSessions)
        .set({ updatedAt: sql`(unixepoch())` })
        .where(eq(automationSessions.id, sessionId));
      
      return c.json({ messageId });
    }
  )

  // GET /api/sessions/:sessionId/automations - Get session automations
  .get(
    "/:sessionId/automations",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { sessionId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db
        .select()
        .from(automationSessions)
        .where(and(
          eq(automationSessions.id, sessionId),
          eq(automationSessions.userId, user.id)
        ))
        .limit(1);
      
      if (!session.length) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      const automations = await db
        .select()
        .from(sessionAutomations)
        .where(eq(sessionAutomations.sessionId, sessionId))
        .orderBy(sessionAutomations.createdAt);
      
      return c.json({ automations });
    }
  )

  // POST /api/sessions/:sessionId/generate-code - Generate automation code
  .post(
    "/:sessionId/generate-code",
    zValidator('param', z.object({ sessionId: z.string().uuid() })),
    zValidator('json', z.object({
      language: z.enum(['python', 'javascript', 'typescript', 'bash']).optional(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { sessionId } = c.req.valid('param');
      const { language } = c.req.valid('json');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // Get session messages for context
      const messages = await db.select().from(sessionMessages)
        .where(eq(sessionMessages.sessionId, sessionId))
        .orderBy(sessionMessages.createdAt);
      
      const conversationSummary = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n')
        .slice(0, 4000); // Limit length
      
      // Parse metadata
      const metadata = session[0].metadata ? JSON.parse(session[0].metadata) : {};
      
      const openRouterKey = c.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        return c.json({ error: 'OpenRouter not configured' }, 500);
      }
      
      // Generate code
      const generatedFiles = await generateAutomationCode(
        {
          agentType: session[0].agentType,
          requirements: metadata.requirements || [],
          techStack: metadata.techStack || [],
          constraints: metadata.constraints || [],
          conversationSummary,
          language,
        },
        openRouterKey
      );
      
      // Save generated automations to database
      const automationIds: string[] = [];
      for (const file of generatedFiles) {
        const automationId = crypto.randomUUID();
        await db.insert(sessionAutomations).values({
          id: automationId,
          sessionId,
          name: file.name,
          description: file.description,
          language: file.language,
          code: file.code,
          dependencies: file.dependencies,
          setupInstructions: file.setupInstructions,
          status: 'ready',
        });
        automationIds.push(automationId);
      }
      
      return c.json({
        generated: generatedFiles.length,
        automationIds,
      });
    }
  )

  // GET /api/sessions/:sessionId/automations/:automationId/download - Download automation code
  .get(
    "/:sessionId/automations/:automationId/download",
    zValidator('param', z.object({
      sessionId: z.string().uuid(),
      automationId: z.string().uuid(),
    })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user')!;
      const { sessionId, automationId } = c.req.valid('param');
      
      // Verify session ownership
      const session = await db.select().from(automationSessions)
        .where(eq(automationSessions.id, sessionId))
        .limit(1);
      
      if (!session.length || session[0].userId !== user!.id) {
        return c.json({ error: 'Session not found' }, 404);
      }
      
      // Get automation
      const automation = await db.select().from(sessionAutomations)
        .where(eq(sessionAutomations.id, automationId))
        .limit(1);
      
      if (!automation.length || automation[0].sessionId !== sessionId) {
        return c.json({ error: 'Automation not found' }, 404);
      }
      
      // Update status to downloaded
      await db.update(sessionAutomations)
        .set({ status: 'downloaded', updatedAt: sql`(unixepoch())` })
        .where(eq(sessionAutomations.id, automationId));
      
      // Return file as download
      const fileExtensions: Record<string, string> = {
        python: 'py',
        javascript: 'js',
        typescript: 'ts',
        bash: 'sh',
      };
      
      const ext = fileExtensions[automation[0].language] || 'txt';
      const filename = `${automation[0].name.replace(/\s+/g, '-')}.${ext}`;
      
      return new Response(automation[0].code, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  );