import { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Application-level error types for clean error categorization.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} '${id}' not found` : `${resource} not found`, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
  }
}

/**
 * Global error handler middleware for Hono.
 * Converts all errors into a consistent JSON response format.
 */
export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code ?? "APP_ERROR",
          message: err.message,
        },
      },
      err.statusCode as any
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: "HTTP_ERROR",
          message: err.message,
        },
      },
      err.status
    );
  }

  // Unexpected errors
  console.error(err.stack);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message,
      },
    },
    500
  );
}
