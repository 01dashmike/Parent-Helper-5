/**
 * Type helpers for Supabase operations
 * Provides safe casting utilities for database inserts/updates
 * where TypeScript types expect camelCase but DB uses snake_case
 */

/**
 * Cast a value to a type T for Supabase operations
 * This is safe when you know the structure matches but TS can't infer it
 */
export function castDb<T>(value: unknown): T {
  return value as T;
}
