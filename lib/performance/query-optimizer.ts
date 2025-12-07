"use server";

/**
 * Query optimization utilities
 * Helps prevent N+1 queries and optimize database access patterns
 */

/**
 * Batch fetch related data to avoid N+1 queries
 * Example: Fetch all provider data for a list of classes in one query
 */
export async function batchFetch<T, K extends string | number>(
  supabase: any,
  table: string,
  foreignKey: string,
  ids: K[],
  select: string = "*"
): Promise<Map<K, T[]>> {
  if (ids.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in(foreignKey, ids);

  if (error || !data) {
    return new Map();
  }

  // Group by foreign key
  const map = new Map<K, T[]>();
  for (const item of data) {
    const key = item[foreignKey] as K;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item as T);
  }

  return map;
}

/**
 * Parallelize independent database queries
 */
export async function parallelQueries<T extends readonly unknown[]>(
  queries: { [K in keyof T]: () => Promise<T[K]> }
): Promise<T> {
  return Promise.all(queries.map((q) => q())) as Promise<T>;
}

/**
 * Optimize select statement to only fetch needed columns
 * Prevents over-fetching from Supabase
 */
export function optimizeSelect(
  columns: string[],
  defaultSelect: string = "*"
): string {
  if (columns.length === 0) {
    return defaultSelect;
  }
  return columns.join(", ");
}

/**
 * Create a batched query executor
 * Splits large ID lists into smaller batches to avoid query size limits
 */
export async function batchedQuery<T>(
  supabase: any,
  table: string,
  ids: (string | number)[],
  batchSize: number = 1000,
  select: string = "*",
  idColumn: string = "id"
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }

  const results: T[] = [];

  // Process in batches
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .in(idColumn, batch);

    if (!error && data) {
      results.push(...(data as T[]));
    }
  }

  return results;
}

