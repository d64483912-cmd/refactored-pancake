import { Hono } from "hono";
import { cors } from "hono/cors";
import { authenticatedOnly, authMiddleware } from "./middleware/auth";
import { apiRoutes } from "./routes";
import type { HonoContext } from "./types";

const app = new Hono<HonoContext>()
  .use("*", cors())
  .onError((err, c) => {
    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        details: err.message,
      },
      500
    );
  })
  .use("*", authMiddleware)
  .get("/ping", (c) => c.json({ message: "ok", timestamp: Date.now() }))
  .get("/protected", authenticatedOnly, (c) =>
    c.json({ message: "ok", timestamp: Date.now() })
  )
  .get("/me", authenticatedOnly, (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "You are not authenticated" }, 401);
    }
    return c.json(user);
  })
  // Mount routers
  .route("/api", apiRoutes)
  .all("*", async (c) => {
    const url = new URL(c.req.url);
    const isHtmlRoute =
      c.req.method === "GET" &&
      (!url.pathname.includes(".") || url.pathname.endsWith("/"));

    if (isHtmlRoute) {
      const indexUrl = new URL("/index.html", url.origin);
      const req = new Request(indexUrl.toString(), c.req.raw);
      const resp = await c.env.ASSETS.fetch(req);
      const out = new Response(resp.body, resp);
      out.headers.set("Content-Type", "text/html; charset=utf-8");
      out.headers.delete("Content-Disposition");
      return out;
    }
    return c.env.ASSETS.fetch(c.req.raw);
  });

export type AppType = typeof apiRoutes;
export default app;
