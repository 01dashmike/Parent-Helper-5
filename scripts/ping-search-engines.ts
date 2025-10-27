import fetch from "node-fetch";

const BASE_URL = "https://parent-helper-app-parenthelper5.up.railway.app";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

async function pingSearchEngines() {
  const engines = [
    `https://www.google.com/ping?sitemap=${SITEMAP_URL}`,
    `https://www.bing.com/ping?sitemap=${SITEMAP_URL}`,
  ];

  for (const url of engines) {
    try {
      const res = await fetch(url);
      console.log(`✅ Pinged ${url}: ${res.status}`);
    } catch (err) {
      console.error(`❌ Failed to ping ${url}:`, err);
    }
  }
}

pingSearchEngines();
