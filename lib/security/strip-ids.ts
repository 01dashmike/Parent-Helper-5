/**
 * Utility to strip internal IDs from API responses
 * Prevents exposure of internal database IDs, UUIDs, etc.
 */

/**
 * Fields that should be stripped from responses
 */
const INTERNAL_ID_FIELDS = new Set([
  "internal_id",
  "internalId",
  "db_id",
  "dbId",
  "database_id",
  "databaseId",
  "system_id",
  "systemId",
  "admin_id",
  "adminId",
  "service_role_id",
  "serviceRoleId",
]);

/**
 * Recursively strip internal IDs from an object
 * @param obj - Object to clean
 * @param depth - Current recursion depth (max 10)
 * @returns Cleaned object
 */
export function stripInternalIds<T>(obj: T, depth: number = 0): T {
  if (depth > 10) {
    // Prevent infinite recursion
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => stripInternalIds(item, depth + 1)) as T;
  }

  const cleaned = {} as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal ID fields
    if (INTERNAL_ID_FIELDS.has(key)) {
      continue;
    }

    // Recursively clean nested objects
    if (typeof value === "object" && value !== null) {
      cleaned[key] = stripInternalIds(value, depth + 1);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}

/**
 * Strip internal IDs from API response
 * @param data - Response data
 * @returns Cleaned response data
 */
export function sanitizeResponse<T>(data: T): T {
  return stripInternalIds(data);
}

