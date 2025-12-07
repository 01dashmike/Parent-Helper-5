/**
 * Utility function for efficient row counting in Supabase queries
 * 
 * Performs COUNT(*) queries with minimal data transfer by using:
 * - `head: true` - Only fetch headers, no row data
 * - `count: 'exact'` - Get exact count from database
 * 
 * @param supabase - Supabase client instance
 * @param table - Table name to count rows from
 * @param filter - Optional filter function to apply to the query builder
 * @returns Promise<number> - The count of rows matching the filter
 * 
 * @example
 * ```typescript
 * const count = await supabaseRowCount(supabase, "classes", (q) => 
 *   q.eq("is_active", true)
 * );
 * ```
 * 
 * @example
 * ```typescript
 * const count = await supabaseRowCount(supabase, "rewards", (q) => 
 *   q.eq("status", "redeemed").gte("created_at", thirtyDaysAgo.toISOString())
 * );
 * ```
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function supabaseRowCount(
  supabase: SupabaseClient<any>,
  table: string,
  filter?: (q: ReturnType<ReturnType<SupabaseClient<any>["from"]>["select"]>) => any
): Promise<number> {
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (filter) {
    query = filter(query) as typeof query;
  }

  const { count, error } = await query;

  if (error) {
    console.error(`[supabaseRowCount] Error counting rows in ${table}:`, error);
    throw error;
  }

  return count ?? 0;
}

