import { hc } from "hono/client";
import { AppType } from "worker/app";

export const apiClient = hc<AppType>("/api", {
  init: {
    credentials: "include",
  },
});
