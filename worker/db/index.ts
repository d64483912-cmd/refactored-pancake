import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const createDb = (d1: D1Database) => drizzle(d1, { schema });

// Type exports
export type { AutomationSession, NewAutomationSession, SessionMessage, NewSessionMessage, SessionAutomation, NewSessionAutomation } from "./session-schema";