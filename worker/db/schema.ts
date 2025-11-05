import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./auth-schema";

export * from "./auth-schema";

// Automation sessions table
export const automationSessions = sqliteTable("automation_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  initialMessage: text("initial_message").notNull(),
  agentType: text("agent_type").notNull(), // 'research', 'webapp_developer', 'web_crawler'
  status: text("status").default("active").notNull(), // 'active', 'completed', 'failed', 'cancelled'
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
