import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://parent-helper-app-parenthelper5.up.railway.app";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase credentials are not configured. Skipping logging.");
}

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function logResult(payload: {
  engine: string;
  status?: number;
  success: boolean;
  message?: string;
}) {
  if (!supabase) return;

  try {
    const { error } = await supabase.from("sitemap_pings").insert(payload);
    if (error) {
      console.error(`⚠️ Failed to log ${payload.engine} ping:`, error.message);
    }
  } catch (err) {
    console.error(`⚠️ Unexpected error logging ${payload.engine} ping:`, err);
  }
}

async function pingSearchEngines() {
  const engines = [
    { name: "Google", url: `https://www.google.com/ping?sitemap=${SITEMAP_URL}` },
    { name: "Bing", url: `https://www.bing.com/ping?sitemap=${SITEMAP_URL}` },
  ];

  for (const engine of engines) {
    try {
      const res = await fetch(engine.url);
      const success = res.ok;
      console.log(`✅ ${engine.name} responded with ${res.status}`);

      await logResult({
        engine: engine.name,
        status: res.status,
        success,
        message: success ? "Ping acknowledged" : "Unexpected response",
      });
    } catch (err: any) {
      console.error(`❌ Failed to ping ${engine.name}:`, err?.message ?? err);
      await logResult({
        engine: engine.name,
        success: false,
        message: err?.message ?? String(err),
      });
    }
  }
}

pingSearchEngines();
