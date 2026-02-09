import { Hono } from "hono";

/**
 * Health check route — typed for Hono RPC.
 */
const healthRoutes = new Hono().get("/", (c) => {
  return c.json({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { healthRoutes };
