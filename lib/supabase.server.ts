import { createRequire } from "module";
import {
  getSupabaseServerKey,
  getSupabaseServerUrl,
} from "./env";
import { EmailLog } from "./types/email";
import { toError } from "./errors";

const require = createRequire(import.meta.url);

export function getSupabaseServer() {
  const url = getSupabaseServerUrl();
  const key = getSupabaseServerKey();

  if (!url || !key) return null;

  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

const sanitizeSearch = (value: string) =>
  value.replace(/[%_]/g, "\\$&").replace(/,/g, " ").trim();

type EmailLogQueryParams = {
  q?: string;
  status?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const ABSOLUTE_MAX_LIMIT = 5000;

export async function fetchEmailLogs(
  params: EmailLogQueryParams
): Promise<{ ok: boolean; rows: EmailLog[]; total: number; error?: string }> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return {
        ok: false,
        rows: [],
        total: 0,
        error: "Supabase environment variables are not configured.",
      };
    }

    const page = Math.max(Number(params.page ?? 1), 1);
    const limitParam = Number(params.limit ?? DEFAULT_LIMIT);
    const requestedMax =
      params.limit && Number(params.limit) > MAX_LIMIT
        ? Math.min(Number(params.limit), ABSOLUTE_MAX_LIMIT)
        : MAX_LIMIT;
    const limit = Math.min(Math.max(limitParam, 1), requestedMax);
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    let query = supabase
      .from("email_logs")
      .select(
        "id,to_address,subject,status,type,error,created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(rangeFrom, rangeTo);

    const q = params.q?.trim();
    if (q) {
      const escaped = sanitizeSearch(q);
      query = query.or(
        `to_address.ilike.%${escaped}%,subject.ilike.%${escaped}%`
      );
    }

    const status = params.status?.toLowerCase();
    if (status === "sent" || status === "failed") {
      query = query.eq("status", status);
    }

    const type = params.type?.trim();
    if (type) {
      query = query.eq("type", type);
    }

    const fromDate = params.from?.trim();
    if (fromDate) {
      const fromISO = new Date(fromDate).toISOString();
      if (!Number.isNaN(Date.parse(fromISO))) {
        query = query.gte("created_at", fromISO);
      }
    }

    const toDate = params.to?.trim();
    if (toDate) {
      const toISO = new Date(toDate).toISOString();
      if (!Number.isNaN(Date.parse(toISO))) {
        query = query.lte("created_at", toISO);
      }
    }

    const { data, error, count } = await query;
    if (error) {
      throw toError(error);
    }

    return {
      ok: true,
      rows: (data ?? []) as EmailLog[],
      total: count ?? 0,
    };
  } catch (error: unknown) {
    const err = toError(error);
    console.error("[fetchEmailLogs] failed:", err);
    return {
      ok: false,
      rows: [],
      total: 0,
      error:
        err.message ??
        "Unexpected error while fetching email logs.",
    };
  }
}

export async function getDistinctEmailTypes(): Promise<{
  ok: boolean;
  types: string[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return { ok: false, types: [], error: "Supabase not configured." };
    }

    const { data, error } = await supabase
      .from("email_logs")
      .select("type", { distinct: true })
      .order("type", { ascending: true });

    if (error) throw toError(error);

    const types = (data ?? [])
      .map((row: { type?: string }) => row.type ?? "")
      .filter(Boolean);

    return { ok: true, types };
  } catch (error: unknown) {
    const err = toError(error);
    console.error("[getDistinctEmailTypes] failed:", err);
    return {
      ok: false,
      types: [],
      error: err.message ?? "Unable to fetch email types.",
    };
  }
}
