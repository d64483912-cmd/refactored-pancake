import { autumn } from "autumn-js/better-auth";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export const createAuth = (
  env?: Cloudflare.Env,
  cf?: IncomingRequestCfProperties
) => {
  // Use actual DB for runtime, empty object for CLI
  const db = env ? drizzle(env.D1, { schema, logger: false }) : ({} as any);

  // Get service configuration
  const betterAuthUrl = env?.VITE_BETTER_AUTH_URL!;

  return betterAuth({
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: cf || {},
        d1:
          env ?
            {
              db,
              options: {
                usePlural: true,
                debugLogs: false,
              },
            }
          : undefined,
      },
      {
        trustedOrigins: [
          betterAuthUrl,
          "https://runable.cloud",
          "https://runable.com",
        ],
        emailAndPassword: {
          enabled: true,
        },
        rateLimit: {
          enabled: true,
        },
        baseURL: betterAuthUrl,
        secret: env?.BETTER_AUTH_SECRET || "dev-secret-change-me",
        plugins: [autumn(), admin()],
      }
    ),
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            console.log(
              `Before hook for ${user.email} ${user.name} ADMIN_EMAIL: ${env?.ADMIN_EMAIL}`
            );

            if (user.email === env?.ADMIN_EMAIL) {
              return {
                data: {
                  // Ensure to return Better-Auth named fields, not the original field names in your database.
                  ...user,
                  firstName: user.name.split(" ")[0],
                  lastName: user.name.split(" ")[1],
                  role: "admin",
                },
              };
            }
            return {
              data: {
                // Ensure to return Better-Auth named fields, not the original field names in your database.
                ...user,
                firstName: user.name.split(" ")[0],
                lastName: user.name.split(" ")[1],
              },
            };
          },
        },
      },
    },
  });
};
