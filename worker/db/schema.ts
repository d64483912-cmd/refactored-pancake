import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth-schema";
export * from "./auth-schema";

// Automation sessions table
export const automationSessions = sqliteTable("automation_sessions", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(), // 'research', 'webapp_developer', 'web_crawler', 'general'
  title: text("title"), // User-provided or auto-generated
  status: text("status").notNull().default("active"), // 'active', 'completed', 'archived'
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Session messages table
export const sessionMessages = sqliteTable("session_messages", {
  id: text("id").primaryKey(), // UUID
  sessionId: text("session_id").notNull().references(() => automationSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for attachments, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Session integrations tracking
export const sessionIntegrations = sqliteTable("session_integrations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => automationSessions.id, { onDelete: "cascade" }),
  integrationType: text("integration_type").notNull(), // 'email', 'github', 'calendar', 'api', 'database'
  name: text("name").notNull(),
  config: text("config"), // JSON string for integration config
  status: text("status").notNull().default("pending"), // 'pending', 'connected', 'failed'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Session automations (generated code/scripts)
export const sessionAutomations = sqliteTable("session_automations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => automationSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull(), // 'python', 'javascript', 'bash', 'typescript'
  code: text("code").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'ready', 'downloaded'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
