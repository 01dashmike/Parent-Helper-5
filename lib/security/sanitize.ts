/**
 * Input sanitization utilities
 * Removes potentially dangerous content from user inputs
 */

/**
 * Sanitize text input by removing HTML tags and dangerous characters
 * @param input - Raw input string
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized string
 */
export function sanitizeText(input: string | null | undefined, maxLength: number = 10000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove null bytes and control characters (except newlines and tabs)
  // Use character code filtering instead of regex to avoid no-control-regex
  let sanitized = input
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Allow printable characters, newlines (0x0A), and tabs (0x09)
      return code === 0x09 || code === 0x0A || (code >= 0x20 && code < 0x7F) || code >= 0x80;
    })
    .join("");

  // Remove HTML tags (basic protection)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize search query (more permissive than general text)
 * @param input - Raw search query
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(input: string | null | undefined, maxLength: number = 200): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove null bytes and control characters
  // Use character code filtering instead of regex to avoid no-control-regex
  let sanitized = input
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Allow printable characters, newlines (0x0A), and tabs (0x09)
      return code === 0x09 || code === 0x0A || (code >= 0x20 && code < 0x7F) || code >= 0x80;
    })
    .join("");

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize provider name or class name
 * @param input - Raw name
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized name
 */
export function sanitizeName(input: string | null | undefined, maxLength: number = 200): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove null bytes and control characters
  // Use character code filtering instead of regex to avoid no-control-regex
  let sanitized = input
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Allow printable characters, newlines (0x0A), and tabs (0x09)
      return code === 0x09 || code === 0x0A || (code >= 0x20 && code < 0x7F) || code >= 0x80;
    })
    .join("");

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Remove SQL injection patterns (basic protection)
  sanitized = sanitized
    .replace(/['";\\]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize description text (allows more characters than name)
 * @param input - Raw description
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Sanitized description
 */
export function sanitizeDescription(input: string | null | undefined, maxLength: number = 5000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove null bytes and control characters (except newlines and tabs)
  // Use character code filtering instead of regex to avoid no-control-regex
  let sanitized = input
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Allow printable characters, newlines (0x0A), and tabs (0x09)
      return code === 0x09 || code === 0x0A || (code >= 0x20 && code < 0x7F) || code >= 0x80;
    })
    .join("");

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize blog content (markdown allowed, but strip dangerous HTML)
 * @param input - Raw blog content
 * @param maxLength - Maximum allowed length (default: 50000)
 * @returns Sanitized content
 */
export function sanitizeBlogContent(input: string | null | undefined, maxLength: number = 50000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove null bytes
  // Use character code filtering instead of regex to avoid no-control-regex
  let sanitized = input
    .split("")
    .filter((char) => char.charCodeAt(0) !== 0)
    .join("");

  // Remove script tags and event handlers (dangerous)
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");

  // Remove iframe and object tags
  sanitized = sanitized
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<object[^>]*>.*?<\/object>/gi, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

