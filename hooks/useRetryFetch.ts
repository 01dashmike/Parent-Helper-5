"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseRetryFetchOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onError?: (error: Error) => void;
}

interface UseRetryFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  retryCount: number;
}

export type AsyncError = {
  message: string;
  code?: string;
  status?: number;
};

/**
 * Hook for fetching data with automatic retry logic
 */
export function useRetryFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseRetryFetchOptions = {}
): UseRetryFetchResult<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const normalizeError = useCallback((err: unknown): Error => {
    if (err instanceof Error) {
      return err;
    }
    if (typeof err === "object" && err !== null && "message" in err) {
      return new Error(String(err.message));
    }
    return new Error(String(err) || "An unknown error occurred");
  }, []);

  const executeFetch = useCallback(async (attempt: number = 0) => {
    if (!isMountedRef.current) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      // Wrap fetchFn to support abort signal if it's a fetch call
      const result = await fetchFn();
      
      if (!isMountedRef.current || abortController.signal.aborted) return;
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
        setRetryCount(0);
      }
    } catch (err) {
      if (!isMountedRef.current || abortController.signal.aborted) return;

      const error = normalizeError(err);
      
      if (attempt < maxRetries) {
        // Retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        
        if (isMountedRef.current) {
          setRetryCount(attempt + 1);
        }
        onRetry?.(attempt + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !abortController.signal.aborted) {
            executeFetch(attempt + 1);
          }
        }, delay);
      } else {
        // Max retries reached
        if (isMountedRef.current) {
          setError(error);
          setLoading(false);
        }
        onError?.(error);
      }
    }
  }, [fetchFn, maxRetries, retryDelay, onRetry, onError, normalizeError]);

  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRetryCount(0);
    executeFetch(0);
  }, [executeFetch]);

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(0);

    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [executeFetch]);

  return { data, loading, error, retry, retryCount };
}

