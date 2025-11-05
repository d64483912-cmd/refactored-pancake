import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const automationSessions = sqliteTable("automation_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(),
  title: text("title").notNull(),
  metadata: text("metadata", { mode: "json" }),
  status: text("status", { enum: ["active", "completed", "archived"] }).default("active").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const sessionMessages = sqliteTable("session_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => automationSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

export const sessionAutomations = sqliteTable("session_automations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => automationSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language", { enum: ["python", "javascript", "typescript", "bash"] }).notNull(),
  code: text("code").notNull(),
  dependencies: text("dependencies", { mode: "json" }),
  setupInstructions: text("setup_instructions"),
  status: text("status", { enum: ["draft", "ready", "downloaded", "executed"] }).default("draft").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type AutomationSession = typeof automationSessions.$inferSelect;
export type NewAutomationSession = typeof automationSessions.$inferInsert;
export type SessionMessage = typeof sessionMessages.$inferSelect;
export type NewSessionMessage = typeof sessionMessages.$inferInsert;
export type SessionAutomation = typeof sessionAutomations.$inferSelect;
export type NewSessionAutomation = typeof sessionAutomations.$inferInsert;