import type { createAuth } from "./auth";
import type { createDb } from "./db";

type AppUser = ReturnType<typeof createAuth>["$Infer"]["Session"]["user"] & {
  role?: string;
  provider?: string;
};

export type HonoContext = {
  Variables: {
    user: AppUser | null;
    session:
      | ReturnType<typeof createAuth>["$Infer"]["Session"]["session"]
      | null;
    db: ReturnType<typeof createDb>;
  };
  Bindings: Cloudflare.Env;
};
