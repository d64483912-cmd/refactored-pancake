import { Hono } from "hono";
import type { HonoContext } from "../types";
import { adminRoutes } from "./admin-routes";
import { aiRoutes } from "./ai-routes";
import { agentRoutes } from "./agent-routes";
import { authRoutes } from "./auth-routes";
import { sessionsRoutes } from "./sessions";

export const apiRoutes = new Hono<HonoContext>()
  .route("/admin", adminRoutes)
  .route("/ai", aiRoutes)
  .route("/auth", authRoutes)
  .route("/sessions", sessionsRoutes)
  .route("/agents", agentRoutes)
