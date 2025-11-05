# AGENTS.md

## Purpose

Entry point for agents/LLMs working in this repo. Use this as the single source of truth for how to extend the template safely and consistently.

Quick start for agents:
1. Update site metadata in `website.config.json` and `index.html`.
2. Build UI in `src/components/*`; compose pages in `src/pages/*` and register in `src/app.tsx`.
3. Add backend routes under `worker/routes/*` using `HonoContext` + validators.
4. Call backend from the frontend via the type-safe `apiClient` + React Query.
5. Run typechecks for both app and worker; fix all errors and unused imports.

## Non-Negotiable Policies

Persistence: Do not use browser storage (localStorage/sessionStorage/indexedDB) or long-lived in-memory singletons for app data. Use backend routes + Drizzle (D1).

Type safety: The repo is strict. Run typechecks for both app and worker before finishing any task and resolve all errors/warnings. Remove unused imports.

Commands:
```bash
bun x tsc --noEmit -p ./tsconfig.app.json      # Frontend
bun x tsc --noEmit -p ./tsconfig.worker.json   # Worker
```

Routing: After adding a page, register the route in src/app.tsx and verify navigation.

Authentication: All protected routes require middleware. Database is always seeded with admin user.

Billing: Use Autumn only.

Assets: All static files go in /public/ directory. Reference with absolute paths starting with /.

Front-end API wiring: Use the type-safe `apiClient` (Hono client) from `src/lib/api-client.ts` together with React Query for all backend calls. This ensures type safety, proper credential handling, caching, and retries by default.

Note on UI preferences: Using browser storage for ephemeral UI-only preferences (e.g., theme) is allowed. Do not store application data or auth state in browser storage.

## Conventions That Prevent Common Errors

- Worker imports: Do not use `@/*` inside `worker/*`. Use relative paths (e.g., `../middleware/auth`, `../db/schema`). The `@/*` alias is reserved for `src/*` (frontend) only.
- Hono context typing: Always instantiate routers with `new Hono<HonoContext>()` so `c.get('user')` and `c.get('db')` are typed. Add `authMiddleware` or `authenticatedOnly` before accessing `c.get('user')`.
- Navigation typing: When adding header/nav links, use a single `NavItem` type with optional flags. Do not create disjoint literal unions with different shapes.
- Autumn SDK: There is no `client` export from `@/lib/autumn`. Use `AutumnProvider` and hooks from `autumn-js/react` (`useCustomer`, `usePricingTable`, `attach`, `openBillingPortal`, `track`). Helpers in `src/lib/autumn.ts` are thin stubs; avoid importing `client` from there.
- Unused imports: The TS config enables `noUnusedLocals`. Remove icons and variables you don’t use.

### Navigation Type (single shape)

```ts
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
  adminOnly?: boolean;
};

export const navItems: NavItem[] = [
  { path: '/todos', label: 'My Todos', icon: /* Icon */, requiresAuth: true },
  { path: '/admin', label: 'Admin Dashboard', icon: /* Icon */, adminOnly: true },
];

// Usage
if (item.adminOnly && user?.role !== 'admin') return null;
if (item.requiresAuth && !user) return null;
```

### Header/Nav Guards (Auth + Admin)

This template does not ship a Header component. When you build a header or navigation, implement simple visibility guards using session state from Better Auth and per-route flags.

Key points:
- Session is loaded once on mount via `authClient.getSession()`.
- `isAdmin` is derived from `session.user.role === 'admin'`.
- Nav visibility is filtered using `adminOnly`.
- The user menu shows Sign In/Get Started when unauthenticated and a Sign Out action when authenticated.

Example (pattern you can reuse anywhere):
```tsx
const NAV_CONFIG = {
  routes: [
    { path: '/admin', label: 'Admin Dashboard', icon: User, adminOnly: true },
  ],
  hashLinks: [ { href: '#about', label: 'About' } ],
} as const;

const [user, setUser] = useState<{ name?: string; email: string; role?: string } | null>(null);
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  (async () => {
    const { data } = await authClient.getSession();
    const raw = data?.user;
    setUser(raw ? { name: raw.name, email: raw.email, role: raw.role || undefined } : null);
    setIsAdmin(raw?.role === 'admin');
  })();
}, []);

const visibleRoutes = NAV_CONFIG.routes.filter((r) => (r.adminOnly ? isAdmin : true));

// Render
<nav>
  {visibleRoutes.map((r) => (
    <NavLink key={r.path} href={r.path} label={r.label} icon={r.icon} />
  ))}
</nav>

// User menu (unauthenticated): show Sign In / Get Started
// User menu (authenticated): show Sign Out
```

#### Where To Render A Header

- Add a Header/Nav only if the project needs site-wide navigation. Do not add by default.
- If you implement a Header/Nav, render it on pages that benefit from navigation (e.g., `billing`, `dashboard`, homepage). Omit it on focused flows (e.g., `sign-in`, `sign-up`).
- Keep links minimal and relevant:
  - Billing: show only when the user is signed in and your feature set actually uses billing (Autumn).
  - Dashboard (admin): show only for admins (`user.role === 'admin'`).
  - Other internal pages: link only if they exist and are part of the current scope.
- After adding a Header/Nav, scan existing pages (e.g., `src/pages/billing.tsx`, `src/pages/dashboard.tsx`) and include it where appropriate.

Note: Use relative imports (`../middleware/auth`). Do not import from `@/worker/...`.

### Aliases (when absolutely needed)

Default: Keep `@/*` for frontend only and use relative imports in `worker/*` for clarity and to avoid cross-bundle confusion.

If you must use an alias in the worker, define a distinct one (do not reuse `@/*`). Example config:

`tsconfig.worker.json`
```jsonc
{
  "extends": "./tsconfig.node.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~worker/*": ["worker/*"]
    }
  }
}
```

Then import inside `worker/*` as:
```ts
import { authenticatedOnly } from '~worker/middleware/auth';
```

Important: Do not import frontend modules into the worker using aliases. Keep worker and app boundaries clear.

## Worker Route Checklist

- Define router with `new Hono<HonoContext>()`. If you omit `<HonoContext>`, `c.get('db')`/`c.get('user')` will be typed as `never/unknown` and cause TS errors.
- Use guards appropriately: `authenticatedOnly` for protected routes, `requireAdmin` for admin-only. `authMiddleware` is mounted globally in `worker/app.ts`, so `db`, `user`, `session` are set on the context.
- Use relative imports inside `worker/*` (e.g., `../middleware/auth`, `../db/schema`). Do not use `@/*`.
- Validate input with `@hono/zod-validator` so both server and client get types. Prefer `c.req.valid('json'|'param'|'query')` over `c.req.json()` when using validators.
- Register your router in `worker/routes/index.ts` via `.route('/your-path', yourRouter)` so it becomes part of `apiRoutes`.
- Frontend types: `AppType = typeof apiRoutes` is exported from `worker/app.ts`. The frontend `apiClient` uses `AppType` automatically — no changes needed in `src/lib/api-client.ts` after adding routes.
- Run typechecks for both app and worker before finishing your task.

### Minimal To‑Do Route Example

```ts
// worker/routes/todos.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';

export const todoRoutes = new Hono<HonoContext>()
  .use('*', authenticatedOnly)
  .get('/', async (c) => {
    const db = c.get('db');
    const user = c.get('user');
    return c.json({ items: [], userId: user?.id });
  })
  .post(
    '/',
    zValidator('json', z.object({ title: z.string().min(1) })),
    async (c) => {
      const db = c.get('db');
      const user = c.get('user');
      const { title } = c.req.valid('json');
      // await db.insert(todos).values({ userId: user!.id, title });
      return c.json({ ok: true });
    }
  );

// worker/routes/index.ts
import { todoRoutes } from './todos';
export const apiRoutes = new Hono<HonoContext>()
  // ...existing
  .route('/todos', todoRoutes);
```

Common failure causes this avoids:
- `Cannot find module '@/worker/...':` using frontend alias in worker. Use relative imports.
- `c.get('db')` typed as `never/unknown`: router not typed as `HonoContext`.
- Parameter/body typing: use `zValidator` + `c.req.valid(...)` for safe types.

## Authentication

Library: Better Auth + Cloudflare adapter
Base path: /api/auth/* (mounted in the Worker router)
Session resolution: authMiddleware attaches user and session to the Hono context
Protected routes: wrap with authenticatedOnly middleware
Client SDK: `src/lib/auth.ts` exports `authClient` (Better Auth React client). Do not use `apiClient` for authentication.

### Frontend Auth: DOs and DON'Ts

- Do: use `authClient` for session, sign-in, sign-out, password reset.
- Do: gate UI based on `authClient.getSession()` and the `user.role` field.
- Don't: call `apiClient.auth.*` — auth routes are handled by Better Auth; `apiClient` does not expose them.
- Don't: make raw fetch calls for auth; use `authClient` APIs.

Common mistake: `apiClient.auth...` causes TS errors because `auth` is not a property on the typed client (e.g., “Property 'auth' does not exist on type '...'). Always import `authClient` from `@/lib/auth`.

Example: resolve session and derive admin flag
```tsx
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth';

export function useSessionState() {
  const [user, setUser] = useState<{ name?: string; email: string; role?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await authClient.getSession();
        const rawUser = data?.user;
        setUser(
          rawUser
            ? { name: rawUser.name, email: rawUser.email, role: rawUser.role || undefined }
            : null
        );
        setIsAdmin(rawUser?.role === 'admin');
      } catch (error) {
        console.error('Failed to get session:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setUserLoading(false);
      }
    };
    checkAuth();
  }, []);

  return { user, isAdmin, userLoading };
}
```

Example: sign-in/out
```ts
// Sign in
await authClient.signIn.email({ email, password });

// Sign out
await authClient.signOut();
```

### API Methods

Sign Up
- Client: authClient.signUp.email({ email, password, name })
- Server: auth.api.signUpEmail({ body: { email, password, name } })

Sign In
- Client: authClient.signIn.email({ email, password })
- Server: auth.api.signInEmail({ body: { email, password }, headers })

Password Reset
- Send link: authClient.requestPasswordReset({ email, redirectTo })
- Complete reset: authClient.resetPassword({ newPassword, token })

### Admin Operations

Schema Fields (added by admin plugin):
- role (string): User's role, defaults to "user"
- banned (boolean): Whether the user is banned
- banReason (string): Reason for the ban
- banExpires (date): When the ban expires
- impersonatedBy (string): ID of the admin impersonating this session

Set User Role:
```typescript
await authClient.admin.setRole({ userId: "user-id", role: "admin" })
```

Update User:
```typescript
await authClient.admin.updateUser({
  userId: "user-id",
  data: { name: "John Doe", role: "admin" }
})
```

Ban User:
```typescript
await authClient.admin.banUser({
  userId: "user-id",
  banReason: "Spamming",
  banExpiresIn: 60 * 60 * 24 * 7 // 7 days in seconds
})
```

Unban User:
```typescript
await authClient.admin.unbanUser({ userId: "user-id" })
```

List Users (with pagination):
```typescript
const users = await authClient.admin.listUsers({
  query: { limit: 10, offset: 0 }
})
// Returns: { users: User[], total: number }
```

Impersonate User:
```typescript
await authClient.admin.impersonateUser({ userId: "user-id" })
await authClient.admin.stopImpersonating()
```

Session Management:
```typescript
await authClient.admin.listUserSessions({ userId: "user-id" })
await authClient.admin.revokeUserSession({ sessionToken: "token" })
await authClient.admin.revokeUserSessions({ userId: "user-id" })
```

Remove User (hard delete):
```typescript
await authClient.admin.removeUser({ userId: "user-id" })
```

### Middleware

Available middleware:
- authMiddleware - Attaches user and session to request context
- authenticatedOnly - Returns 401 when session is missing
- requireAdmin - Returns 403 when user's role !== "admin"

### API Routes
Create route files under `worker/routes/*` (e.g., `worker/routes/orders.ts`) and register them in `worker/routes/index.ts`. Do not attach routes in `worker/app.ts`; it only mounts the aggregated router once.

```typescript
import { Hono } from "hono";
import { authenticatedOnly, requireAdmin } from "../middleware/auth";
import type { HonoContext } from "../types";

export const ordersRoutes = new Hono<HonoContext>()
  .get("/", authenticatedOnly, async (c) => {
    return c.json({ message: "Orders route protected by auth" });
  })
  .post("/", authenticatedOnly, requireAdmin, async (c) => {
    return c.json({ message: "Create order endpoint" });
  });
```

Register in routes index (single source of truth for API):
```typescript
import { ordersRoutes } from './orders';

export const apiRoutes = new Hono<HonoContext>()
//...existing routes
.route("/orders", ordersRoutes)
```

How the client gets types

`worker/app.ts` mounts the aggregated router and exports its type:
```ts
// worker/app.ts
// ...
.route('/api', apiRoutes)

export type AppType = typeof apiRoutes;
```

The frontend `apiClient` uses this type to stay in sync with any routes registered in `worker/routes/index.ts`:
```ts
// src/lib/api-client.ts
export const apiClient = hc<AppType>("/api", { init: { credentials: "include" } });
```

Frontend usage (React Query + Hono client):
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { InferResponseType } from 'hono/client';
import type { AppType } from 'worker/app';

type OrdersList = InferResponseType<AppType['orders']['$get']>;
type CreateOrder = InferResponseType<AppType['orders']['$post']>;

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await apiClient.orders.$get();
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json() as Promise<OrdersList>;
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationKey: ['create-order'],
    mutationFn: async (body?: unknown) => {
      const res = await apiClient.orders.$post({ json: body as any });
      if (!res.ok) throw new Error('Failed to create order');
      return res.json() as Promise<CreateOrder>;
    },
  });
}
```

### RBAC (Role-Based Access Control)

Backend uses simple RBAC via role field on users table (default "user").
Database is always seeded with user's email as admin.

Guard admin APIs with authenticatedOnly + requireAdmin:
- API: /api/admin/* guarded in worker/app.ts
- SPA: /admin/* guarded in worker/app.ts (redirects unauthenticated to /sign-in, returns 403 for non-admin)

Protect admin SPA pages:
```typescript
app.use('/admin/*', async (c, next) => {
  const user = c.get('user');
  if (!user) return c.redirect('/sign-in');
  if (user.role !== 'admin') return c.json({ message: 'Forbidden' }, 403);
  return next();
});
```

Create admin user:
```sql
UPDATE users SET role='admin' WHERE email='you@example.com';
```

## Database & Persistence

Uses Drizzle ORM with Cloudflare D1 database.

Schema files:
- worker/db/schema.ts - Table definitions
- worker/db/index.ts - Database connection and exports

Core tables:
- users - User accounts
- sessions - User sessions
- accounts - OAuth providers
- verifications - Email verification codes

### Persistence Pattern

For application data, use backend routes + database. Do not store app data in browser storage or in-memory singletons.

Implementation steps:
1. Define schema in worker/db/schema.ts and access through worker/db/index.ts
2. Add Hono routes under worker/routes/* to handle CRUD
3. Call those routes from the frontend using the Hono `apiClient` with React Query (prefer `useQuery` and `useMutation`).

Example (notes):
```typescript
// worker/routes/notes.ts
import { Hono } from 'hono';
import { notes } from '../db/schema';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authenticatedOnly } from '../middleware/auth';
import type { HonoContext } from '../types';

export const notesRouter = new Hono<HonoContext>();
notesRouter.use('*', authenticatedOnly);

notesRouter.post(
  '/',
  zValidator('json', z.object({ title: z.string().min(1), body: z.string().optional() })),
  async (c) => {
    const user = c.get('user');
    const db = c.get('db');
    const { title, body } = c.req.valid('json');
    await db.insert(notes).values({ userId: user!.id, title, body });
    return c.json({ ok: true });
  }
);

// src/hooks/useNotes.ts (React Query + Hono client)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['create-note'],
    mutationFn: async (input: { title: string; body: string }) => {
      const res = await apiClient.notes.$post({ json: input });
      if (!res.ok) throw new Error('Failed to create note');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
```

React Query setup: `QueryClientProvider` is already configured in `src/main.tsx`. Use `useQuery` for GETs and `useMutation` for POST/PUT/PATCH/DELETE. The `apiClient` in `src/lib/api-client.ts` is preconfigured to send credentials for authenticated routes.

### Migrations

Generate migrations before deploying:
```bash
bun run pre-deploy  # Creates migration files
```

### D1 Limitations

- Avoid complex JOIN queries - prefer separate queries
- No subqueries in D1
- No transactions

## AI

Configure the gateway via environment variables (see `.env.example`):
- RUNABLE_GATEWAY_URL: AI Gateway URL
- RUNABLE_GATEWAY_SECRET: Gateway secret key

### API Routes

Backend in worker/routes/ai-routes.ts:

POST /api/ai/chat - Streaming chat completions
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "gpt-5"
}
```

GET /api/ai/models - Available AI models
```json
{
  "models": [
    { "id": "gpt-5", "name": "GPT-5", "provider": "openai" }
  ]
}
```

### Supported Models

- gpt-5, gpt-5-codex, gpt-5-mini, gpt-5-nano
- claude-4, claude-4.5-sonnet

### Frontend Integration

Use AI SDK 5 with `useChat`:
```typescript
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
});

await sendMessage({ text: "Hello!" });
```

All endpoints require authentication via authenticatedOnly middleware.

## Routing

This project uses React Router in src/app.tsx.

Add a page and route:
1. Create the page component: src/pages/YourPage.tsx
2. Update the router in src/app.tsx:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/home';
import YourPage from '@/pages/YourPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/your-page" element={<YourPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

3. Routing guidance

Common mistakes:
- Created a page but forgot to add the route
- Incorrect import path in app.tsx
- Missing leading slash in path: use /your-page, not your-page
- Conflicting route paths: ensure each path is unique

Admin routes require backend-enforced protection:
- API: guard /api/admin/* with authenticatedOnly + requireAdmin middleware
- SPA: worker/app.ts guards '/admin/*' to redirect unauthenticated users to /sign-in and return 403 for non-admins

## Billing with Autumn

Autumn manages billing and payments, a minimal billing page component is included in the template (billing.tsx)

### Setup

Define products in autumn.config.ts (prices in USD dollars):
```typescript
import { feature, product, featureItem, pricedFeatureItem, priceItem } from "atmn";

// Feature types:
// - "continuous_use": Usage-based, trackable (e.g., API calls, messages)
// - "boolean": Included or not (e.g., premium support)

export const messages = feature({
  id: "messages",
  type: "continuous_use",
});

export const priority_support = feature({
  id: "priority_support",
  type: "boolean",
});

export const freePlan = product({
  id: "free",
  name: "Free",
  is_default: true,
  items: [
    featureItem({
      feature_id: messages.id,
      included_usage: 100,
      interval: "month",
    }),
  ],
});

export const proPlan = product({
  id: "pro",
  name: "Pro",
  items: [
    priceItem({ price: 2000, interval: "month" }), // $2000/month
    featureItem({
      feature_id: messages.id,
      included_usage: 1000,
      interval: "month",
    }),
    featureItem({
      feature_id: priority_support.id, // Boolean features don't need included_usage
    }),
    // With overage pricing (pay-per-use after included usage)
    pricedFeatureItem({
      feature_id: messages.id,
      price: 500,              // $500 per 100 messages overage
      billing_units: 100,
      included_usage: 1000,
      interval: "month",
      usage_model: "pay_per_use",
    }),
  ],
});

export default {
  products: [freePlan, proPlan],
  features: [messages, priority_support],
};
```

### Frontend Usage

Display plans:
```tsx
import { useCustomer, usePricingTable } from "autumn-js/react";

const { products } = usePricingTable();
const { customer, attach } = useCustomer();

// Subscribe to a plan
await attach({ productId: "pro", successUrl: window.location.href });

// Check current plan
const isCurrentPlan = customer?.products?.some(p => p.id === "pro" && p.status === "active");
```

Check feature access:
```tsx
const { allowed } = useCustomer();

// Check usage-based feature
if (allowed({ featureId: "messages" })) {
  // User has messages remaining
}

// Check boolean feature
if (allowed({ featureId: "priority_support" })) {
  // User has priority support
}
```

Track usage:
```tsx
const { track, refetch } = useCustomer();

await track({ featureId: "messages" });
await refetch(); // Update UI with new usage
```

### Backend Usage

```typescript
import { Autumn } from "autumn-js";

const autumn = new Autumn({ secretKey: process.env.AUTUMN_SECRET_KEY });

// Track usage in API routes (for continuous_use features only)
autumn.track({ customer_id: user.id, feature_id: "messages", value: 1 });
```

Pre-built components:
- /billing - Full billing page with plan selection, usage metrics, and subscription management
- AvailablePlans - Dynamically loads products from autumn.config.ts
- CurrentPlan - Shows active subscription with cancel option

### Chatbot Components

Reuse the existing components. Do not rebuild from scratch.

- Components: `src/components/chat/` (SimpleChat)
- Page example: `src/pages/chat.tsx`
- Backend: `worker/routes/ai-routes.ts`
- SDK: Vercel AI SDK 5 (`@ai-sdk/react`) + Runable AI Gateway

Add route to src/app.tsx:
```tsx
<Route path="/chat" element={<ChatPage />} />
```

Use SimpleChat anywhere:
```tsx
import { SimpleChat } from '@/components/chat';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

function MyWidget() {
  const { messages, sendMessage, stop, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  });

  const uiMessages = useMemo(() => /* map to {id, role, content}[] */ [], [messages]);

  return (
    <SimpleChat
      messages={uiMessages}
      onSend={(text) => sendMessage({ text })}
      isLoading={status === 'streaming' || status === 'submitted'}
      onStop={stop}
      title="Assistant"
    />
  );
}
```

### Customization

Change model in src/pages/chat.tsx:
```typescript
useChat({
  body: {
    model: 'claude-4', // or 'gpt-5', 'gpt-5-mini'
  },
});
```

Add system prompt in worker/routes/ai-routes.ts:
```typescript
const systemMessage = {
  role: 'system',
  content: 'You are a helpful assistant...'
};
const allMessages = [systemMessage, ...messages];
```

Customize UI with SimpleChat props:
- title: Header text
- compact: Tighter paddings for embedding
- maxHeight: Constrain messages panel
- emptyState: Custom node when no messages
- showThinking: Toggle thinking indicator
- thinkingIndicator: Provide custom indicator

Message format: { id: string; role: 'user' | 'assistant' | 'system'; content: string }[]

## Usage Tracking with Autumn

Pre-baked usage tracking powered by Autumn. Integrated with customer features.

### Setup

Define usage features in autumn.config.ts:
```typescript
import { feature, pricedFeatureItem } from "atmn";

export const messages = feature({
  id: "messages",
  name: "Messages",
  type: "continuous_use",
});

export const api_calls = feature({
  id: "api_calls",
  name: "API Calls",
  type: "continuous_use",
});

// Add to product items
pricedFeatureItem({
  feature_id: messages.id,
  price: 5,
  interval: "month",
  included_usage: 1000,
  billing_units: 100,
  usage_model: "pay_per_use",
})
```

### Pre-Baked Components

Backend: Admin usage endpoint placeholder in worker/routes/admin-routes.ts
- Endpoint: GET `/api/admin/usage/:userId` (returns { userId, usage, limits })

Frontend: `useUsageData` hook in `src/hooks/useUsageData.ts` (Autumn React SDK)
```typescript
import { useUsageData } from '@/hooks/useUsageData';

const { usage, loading, error, refetch } = useUsageData(userId);
// usage = { messages: number, apiCalls: number }
```

How it works:
1. Autumn tracks usage via customer features
2. Frontend hook (useUsageData) uses Autumn React SDK for live usage
3. Optional backend usage endpoints can be added for admin views

Usage limits are defined in autumn.config.ts via included_usage. Autumn automatically tracks usage against these limits.

## Assets

All static assets go in /public/ directory at project root.

Usage:
- Location: /public/ directory
- Reference: Absolute paths starting with / (e.g., /logo.svg, /images/hero.jpg)
- Build: Files copied as-is to /dist/ during build

Examples:
```tsx
// Images
<img src="/logo.svg" alt="Logo" />
<img src="/images/hero-bg.jpg" alt="Hero" />

// Background images
<div style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }} />

// CSS
.hero {
  background-image: url(/images/hero-bg.jpg);
}

// Dynamic paths
const imageName = 'logo.svg';
<img src={`/${imageName}`} alt="Logo" />
```

Best practices:
- Place all static assets in /public/
- Use absolute paths starting with /
- Use SVG for logos and icons

### Configure Site Metadata

Edit website.config.json at root level:
```json
{
  "site": {
    "name": "Minimal Starter",
    "tagline": "Your Creative Canvas",
    "description": "A clean, minimal starter template providing the perfect foundation for your next project. Built with modern tools and ready for your creativity.",
    "ogImage": "/og-image.png",
    "twitterHandle": "",
    "contact": {
      "email": "contact@example.com",
      "company": "Your Company",
      "address": ""
    },
    "legal": {
      "privacyPolicy": "/privacy",
      "termsOfService": "/terms"
    }
  },
  "theme": {
    "defaultTheme": "dark"
  }
}
```

## Mandatory First Step

Before doing anything else, rewrite the placeholder page:
- `src/pages/home.tsx` (use config-driven name/tagline)
- `index.html` (update the static title/description to match your site)
- Update site metadata in `website.config.json`

Note: There is no default Header. If you add one, follow the auth guard pattern above.

## Development Workflow

```bash
bun install           # Install dependencies
bun run dev           # Start dev server
bun run preview       # Preview production build
bun run pre-deploy    # Generate migrations
bun x shadcn@latest add <component>  # Add UI components
bun x tsc --noEmit -p ./tsconfig.app.json # Typecheck app
bun x tsc --noEmit -p ./tsconfig.worker.json # Typecheck worker
bun x tsc --noEmit -p ./tsconfig.node.json # Typecheck node
```
