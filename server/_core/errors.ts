import { TRPCError } from "@trpc/server";

/**
 * Custom error classes for better error handling
 */

export class DatabaseError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: `Database error: ${message}`,
      cause,
    });
  }
}

export class NotFoundError extends TRPCError {
  constructor(resource: string, identifier?: string | number) {
    super({
      code: "NOT_FOUND",
      message: identifier 
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`,
    });
  }
}

export class ValidationError extends TRPCError {
  constructor(message: string, field?: string) {
    super({
      code: "BAD_REQUEST",
      message: field ? `Validation error for ${field}: ${message}` : message,
    });
  }
}

export class UnauthorizedError extends TRPCError {
  constructor(message = "Unauthorized access") {
    super({
      code: "UNAUTHORIZED",
      message,
    });
  }
}

export class ForbiddenError extends TRPCError {
  constructor(message = "Access forbidden") {
    super({
      code: "FORBIDDEN",
      message,
    });
  }
}

export class ConflictError extends TRPCError {
  constructor(message: string) {
    super({
      code: "CONFLICT",
      message,
    });
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown, fallbackMessage = "An error occurred"): never {
  if (error instanceof TRPCError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || fallbackMessage,
      cause: error,
    });
  }
  
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: fallbackMessage,
  });
}
