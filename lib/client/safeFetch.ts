/**
 * Safe fetch wrapper that prevents runtime crashes
 * 
 * Wraps fetch in try/catch, detects network failures, and returns a standardized response.
 * 
 * @param url - The URL to fetch from
 * @param options - Standard fetch options (RequestInit)
 * @returns Promise with { ok: boolean, data?: T, error?: string }
 * 
 * @example
 * ```ts
 * const result = await safeFetch('/api/search?q=music');
 * if (result.ok && result.data) {
 *   setResults(result.data.results);
 * } else {
 *   setError(result.error || 'Failed to load data');
 * }
 * ```
 */

type SafeFetchResult<T = unknown> =
  | { ok: true; data: T; error?: never }
  | { ok: false; data?: never; error: string };

export async function safeFetch<T = unknown>(
  url: string | URL,
  options?: RequestInit,
): Promise<SafeFetchResult<T>> {
  try {
    const response = await fetch(url, options);

    // Check if response is ok
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error || errorData?.message) {
          errorMessage = errorData.error || errorData.message;
        }
      } catch {
        // If JSON parsing fails, try text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Use default error message
        }
      }

      return {
        ok: false,
        error: errorMessage,
      };
    }

    // Parse JSON response
    try {
      const data = await response.json();
      return {
        ok: true,
        data: data as T,
      };
    } catch {
      // If JSON parsing fails, return error
      return {
        ok: false,
        error: "Invalid JSON response from server",
      };
    }
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof TypeError && error.message.includes("fetch")) {
      // Network failure (no internet, CORS, etc.)
      return {
        ok: false,
        error: "Network error: Please check your internet connection",
      };
    }

    if (error instanceof Error) {
      // Other errors (AbortError, etc.)
      if (error.name === "AbortError") {
        // Request was aborted - this is expected behavior, not an error
        return {
          ok: false,
          error: "Request was cancelled",
        };
      }
      return {
        ok: false,
        error: error.message || "An unexpected error occurred",
      };
    }

    // Unknown error type
    return {
      ok: false,
      error: "An unknown error occurred",
    };
  }
}

