import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { requestLogger } from "./middleware/logger.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { errorHandler } from "./middleware/error-handler.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { agentRoutes } from "./routes/agent.routes.js";
import { healthRoutes } from "./routes/health.routes.js";

// ─── App Definition (chained for RPC type inference) ───────────────────────

const app = new Hono()
  .use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }))
  .use("*", requestLogger())
  .use("/api/*", rateLimiter({ windowMs: 60_000, max: 100 }))
  .route("/api/chat", chatRoutes)
  .route("/api/agents", agentRoutes)
  .route("/api/health", healthRoutes);

// ─── Global Error Handler ──────────────────────────────────────────────────

app.onError(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3000);

console.log(`\n🚀 Swadesh AI Chat Backend`);
console.log(`   Server running on http://localhost:${port}`);
console.log(`   Health: http://localhost:${port}/api/health\n`);

serve({ fetch: app.fetch, port });

/**
 * Export the app type for Hono RPC client.
 * The frontend can import this type for end-to-end type safety.
 */
export type AppType = typeof app;
export default app;
