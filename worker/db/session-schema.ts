import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth-schema";

// Automation sessions for tracking conversations and context
export const automationSessions = sqliteTable("automation_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  agentType: text("agent_type").notNull().default("general"),
  status: text("status").notNull().default("active"),
  metadata: text("metadata", { mode: "json" }), // JSON for requirements, constraints, techStack, databases
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Messages within automation sessions
export const sessionMessages = sqliteTable("session_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => automationSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});

// Integrations for automation sessions
export const sessionIntegrations = sqliteTable("session_integrations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => automationSessions.id, { onDelete: "cascade" }),
  integrationType: text("integration_type", { 
    enum: ["email", "github", "calendar", "api", "database"] 
  }).notNull(),
  name: text("name").notNull(),
  config: text("config", { mode: "json" }), // JSON configuration for the integration
  status: text("status", { enum: ["pending", "configured", "connected", "error"] })
    .default("pending")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});