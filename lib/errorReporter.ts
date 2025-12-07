/**
 * Client-side error reporter
 * Captures unhandled errors and promise rejections and sends them to the server
 */

// Extend Window interface for error reporter flag
declare global {
  interface Window {
    __errorReporterInitialized?: boolean;
  }
}

interface ErrorPayload {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  url: string;
  userAgent: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  severity: "error" | "unhandledrejection";
}

// Queue errors to batch send
const errorQueue: ErrorPayload[] = [];
const QUEUE_FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 50;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Generate or retrieve session ID
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  const key = "ph_session_id";
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    try {
      sessionStorage.setItem(key, sessionId);
    } catch {
      // Session storage might not be available
    }
  }
  
  return sessionId;
}

/**
 * Get current user ID if available (from Supabase session or other auth)
 */
async function getUserId(): Promise<string | undefined> {
  try {
    // Check if we have a user ID in localStorage or cookies
    // This is a placeholder - adjust based on your auth implementation
    if (typeof window !== "undefined") {
      // You might want to check for Supabase session here
      // For now, return undefined
    }
  } catch {
    // Ignore errors getting user ID
  }
  return undefined;
}

/**
 * Flush error queue to server
 */
async function flushErrors() {
  if (errorQueue.length === 0) return;
  
  const errorsToSend = [...errorQueue];
  errorQueue.length = 0; // Clear queue
  
  try {
    const response = await fetch("/api/log-client-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ errors: errorsToSend }),
    });
    
    if (!response.ok) {
      // If sending fails, put errors back in queue (up to max size)
      errorQueue.unshift(...errorsToSend.slice(0, MAX_QUEUE_SIZE));
    }
  } catch {
    // If network error, put errors back in queue (up to max size)
    errorQueue.unshift(...errorsToSend.slice(0, MAX_QUEUE_SIZE));
  }
}

/**
 * Schedule error queue flush
 */
function scheduleFlush() {
  if (flushTimer) return;
  
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushErrors();
  }, QUEUE_FLUSH_INTERVAL);
}

/**
 * Queue an error to be sent to the server
 */
function queueError(payload: ErrorPayload) {
  // Prevent infinite loops - don't log errors from error logging itself
  if (payload.source?.includes("/api/log-client-error")) {
    return;
  }
  
  errorQueue.push(payload);
  
  // Flush immediately if queue is getting large
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    flushErrors();
  } else {
    scheduleFlush();
  }
}

/**
 * Handle window.onerror events
 */
function handleError(
  message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean {
  // Convert event to message if needed
  let errorMessage = "";
  let errorObj: Error | undefined;
  
  if (typeof message === "string") {
    errorMessage = message;
    errorObj = error;
  } else if (message instanceof ErrorEvent) {
    errorMessage = message.message || "Unknown error";
    errorObj = message.error;
    source = source || message.filename;
    lineno = lineno || message.lineno;
    colno = colno || message.colno;
  } else {
    errorMessage = "Unknown error event";
  }
  
  const payload: ErrorPayload = {
    message: errorMessage,
    source: source || window.location.href,
    lineno,
    colno,
    error: errorObj
      ? {
          name: errorObj.name,
          message: errorObj.message,
          stack: errorObj.stack,
        }
      : undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    severity: "error",
  };
  
  getUserId().then((userId) => {
    if (userId) payload.userId = userId;
    queueError(payload);
  });
  
  // Return false to allow default error handling (console, etc.)
  return false;
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const error = event.reason;
  
  let errorMessage = "Unhandled promise rejection";
  let errorName = "Error";
  let errorStack: string | undefined;
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorName = error.name;
    errorStack = error.stack;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object") {
    errorMessage = JSON.stringify(error);
  }
  
  const payload: ErrorPayload = {
    message: errorMessage,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    error: {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
    },
    severity: "unhandledrejection",
  };
  
  getUserId().then((userId) => {
    if (userId) payload.userId = userId;
    queueError(payload);
  });
}

/**
 * Initialize error reporting
 * Call this once when the app loads
 */
export function initErrorReporter() {
  if (typeof window === "undefined") return;
  
  // Don't initialize twice
  if (window.__errorReporterInitialized) {
    return;
  }
  window.__errorReporterInitialized = true;
  
  // Set up error handlers
  window.addEventListener("error", (event) => {
    handleError(event.message, event.filename, event.lineno, event.colno, event.error);
  });
  
  window.addEventListener("unhandledrejection", handleUnhandledRejection);
  
  // Flush errors on page unload
  window.addEventListener("beforeunload", () => {
    if (errorQueue.length > 0) {
      // Use sendBeacon for reliable delivery on page unload
      const errorsJson = JSON.stringify({ errors: errorQueue });
      const blob = new Blob([errorsJson], { type: "application/json" });
      navigator.sendBeacon("/api/log-client-error", blob);
    }
  });
  
  // Also flush periodically
  setInterval(() => {
    if (errorQueue.length > 0) {
      flushErrors();
    }
  }, QUEUE_FLUSH_INTERVAL);
}

/**
 * Manually report an error (useful for try/catch blocks)
 */
export function reportError(error: Error, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  
  const payload: ErrorPayload = {
    message: error.message,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    severity: "error",
    ...(context && { context }),
  };
  
  getUserId().then((userId) => {
    if (userId) payload.userId = userId;
    queueError(payload);
  });
}

