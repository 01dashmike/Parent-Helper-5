import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function inspect(label: string, relPath: string) {
  const abs = path.join(__dirname, "..", relPath);
  const mod = await import(abs);
  const keys = Object.keys(mod);
  const hasDefault = "default" in mod;

  console.log(`[inspect] ${label}`, {
    relPath,
    keys,
    hasDefault,
    typeOfDefault: typeof (mod as any).default,
  });
}

await inspect("SafeBoundary", "components/system/SafeBoundary.tsx");
await inspect("ClientHeroSearch", "components/system/ClientHeroSearch.tsx");
await inspect("HeroSearch", "components/search/HeroSearch.tsx");
