import { MiddlewareHandler } from "hono";

/**
 * Request logging middleware.
 * Logs method, path, status, and response time for every request.
 */
export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    console.log(`→ ${method} ${path}`);

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;
    const statusIcon = status >= 400 ? "✗" : "✓";

    console.log(`${statusIcon} ${method} ${path} ${status} (${duration}ms)`);
  };
}
