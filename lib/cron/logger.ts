type JobContext = Record<string, unknown>;

export function createJobLogger(jobName: string) {
  const startTime = Date.now();
  console.log(`[JOB] START ${jobName}`, { timestamp: new Date().toISOString() });

  return {
    info(message: string, context?: JobContext) {
      console.log(`[JOB] ${jobName} ${message}`, context ?? {});
    },
    error(error: unknown, context?: JobContext) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[JOB] ERROR ${jobName}`, { message, ...(context ?? {}) });
    },
    end(context?: JobContext) {
      console.log(`[JOB] END ${jobName}`, {
        durationMs: Date.now() - startTime,
        ...(context ?? {}),
      });
    },
  };
}

type AnyAsyncHandler = (...args: any[]) => Promise<any>;

export function withCronLogging<T extends AnyAsyncHandler>(jobName: string, handler: T) {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const logger = createJobLogger(jobName);
    try {
      return await handler(...args);
    } catch (error) {
      logger.error(error);
      throw error;
    } finally {
      logger.end();
    }
  }) as T;
}

