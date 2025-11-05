import { createMiddleware } from "hono/factory";
import { createAuth } from "../auth";
import { createDb } from "../db";
import type { HonoContext } from "../types";

export const authMiddleware = createMiddleware(async (c, next) => {
  const auth = createAuth(c.env);
  const db = createDb(c.env.D1);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  c.set("user", session.user);
  c.set("session", session.session);
  c.set("db", db);
  return next();
});

export const authenticatedOnly = createMiddleware<HonoContext>(
  async (c, next) => {
    const session = c.get("session");
    if (!session) {
      return c.json(
        {
          message: "You are not authenticated",
        },
        401
      );
    } else {
      return next();
    }
  }
);

// Require a specific role (basic RBAC)
export const requireRole = (role: string) =>
  createMiddleware<HonoContext>(async (c, next) => {
    const session = c.get("session");
    const user = c.get("user");

    if (!session) {
      return c.json({ message: "You are not authenticated" }, 401);
    }

    if (!user || user.role !== role) {
      return c.json({ message: "Forbidden: insufficient role" }, 403);
    }

    return next();
  });

// Convenience guard for admin-only routes
export const requireAdmin = requireRole("admin");
