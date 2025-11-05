import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { authenticatedOnly, requireAdmin } from "../middleware/auth";
import type { HonoContext } from "../types";

export const adminRoutes = new Hono<HonoContext>().get(
  "/usage/:userId",
  authenticatedOnly,
  requireAdmin,
  zValidator(
    "param",
    z.object({
      userId: z.string().min(1),
    })
  ),
  async (c) => {
    const { userId } = c.req.valid("param");

    // TODO: Integrate Autumn usage lookup per userId.
    // Placeholder structure keeps frontend stable while remaining type-safe.
    const usage = { messages: 0, apiCalls: 0 };
    const limits = null as unknown as {
      messages?: number;
      apiCalls?: number;
    } | null;

    return c.json({ userId, usage, limits });
  }
);
