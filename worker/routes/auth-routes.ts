import { Hono } from "hono";
import type { HonoContext } from "../types";
import { createAuth } from "../auth";

export const authRoutes = new Hono<HonoContext>();

authRoutes.all("/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});