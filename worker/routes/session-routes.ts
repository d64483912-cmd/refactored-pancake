import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authenticatedOnly } from "../middleware/auth";
import { automationSessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { HonoContext } from "../types";

const createSessionSchema = z.object({
  agentType: z.enum(["research", "webapp_developer", "web_crawler"]),
  title: z.string().min(1).max(100),
  initialMessage: z.string().min(1),
});

export const sessionRoutes = new Hono<HonoContext>()
  .use("*", authenticatedOnly)
  .post("/", zValidator("json", createSessionSchema), async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const { agentType, title, initialMessage } = c.req.valid("json");

    // Generate a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the session in the database
    await db.insert(automationSessions).values({
      id: sessionId,
      userId: user!.id,
      agentType,
      title,
      initialMessage,
      status: "active",
    });

    return c.json({
      sessionId,
      title,
      agentType,
      status: "active",
    });
  })
  .get("/", async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    
    // Get user's sessions
    const sessions = await db
      .select({
        id: automationSessions.id,
        title: automationSessions.title,
        agentType: automationSessions.agentType,
        status: automationSessions.status,
        createdAt: automationSessions.createdAt,
      })
      .from(automationSessions)
      .where(sql`${automationSessions.userId} = ${user!.id}`)
      .orderBy(automationSessions.createdAt, "desc");

    return c.json({ sessions });
  })
  .get("/:sessionId", async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const sessionId = c.req.param("sessionId");

    // Get specific session
    const session = await db
      .select()
      .from(automationSessions)
      .where(sql`${automationSessions.id} = ${sessionId}`)
      .limit(1);

    if (!session.length) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check if user owns the session
    if (session[0].userId !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    return c.json({ session: session[0] });
  })
  .delete("/:sessionId", async (c) => {
    const user = c.get("user");
    const db = c.get("db");
    const sessionId = c.req.param("sessionId");

    // Check if session exists and user owns it
    const existingSession = await db
      .select()
      .from(automationSessions)
      .where(sql`${automationSessions.id} = ${sessionId}`)
      .limit(1);

    if (!existingSession.length) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (existingSession[0].userId !== user!.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Delete the session
    await db.delete(automationSessions).where(sql`${automationSessions.id} = ${sessionId}`);

    return c.json({ success: true });
  });