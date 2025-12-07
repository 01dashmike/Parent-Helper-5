/**
 * Server-Side Logging Utility
 * 
 * Centralized logging for API routes and server-side code.
 * Provides consistent formatting and log levels.
 */

export type LogLevel = "info" | "warn" | "error";

interface LogContext {
  route?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Server-side logger with consistent formatting
 */
class ServerLogger {
  private formatMessage(level: LogLevel, route: string, message: string, context?: LogContext): string {
    const parts = [`[${route}]`, message];
    if (context) {
      const contextStr = Object.entries(context)
        .filter(([key]) => key !== "route")
        .map(([key, value]) => {
          // Never log secrets or full PII
          if (key.toLowerCase().includes("secret") || key.toLowerCase().includes("password") || key.toLowerCase().includes("token")) {
            return `${key}=[REDACTED]`;
          }
          return `${key}=${typeof value === "object" ? JSON.stringify(value) : value}`;
        })
        .join(" ");
      if (contextStr) {
        parts.push(contextStr);
      }
    }
    return parts.join(" ");
  }

  info(route: string, message: string, context?: LogContext): void {
    console.log(this.formatMessage("info", route, message, { ...context, route }));
  }

  warn(route: string, message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", route, message, { ...context, route }));
  }

  error(route: string, message: string, error?: unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? { stack: error.stack } : {};
    console.error(this.formatMessage("error", route, message, { ...context, ...errorDetails, error: errorMessage, route }));
  }
}

export const logger = new ServerLogger();

