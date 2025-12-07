import fs from "fs";
import path from "path";

export type UiScanResult = {
  path: string;
  missingAlt: boolean;
  missingRoles: boolean;
  hasEslintDisable: boolean;
};

const COMPONENTS_DIR = path.join(process.cwd(), "components");

async function readFileSafe(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function scanFile(filePath: string, rootDir: string): Promise<UiScanResult | null> {
  if (!filePath.endsWith(".tsx") && !filePath.endsWith(".jsx")) {
    return null;
  }

  const content = await readFileSafe(filePath);
  if (!content) {
    return null;
  }

  const lines = content.split(/\r?\n/);

  let missingAlt = false;
  let missingRoles = false;
  let hasEslintDisable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!hasEslintDisable && /eslint-disable/i.test(trimmed)) {
      hasEslintDisable = true;
    }

    if (!missingAlt && trimmed.includes("<img")) {
      const hasAlt = /<img[^>]*\salt\s*=/.test(trimmed);
      if (!hasAlt) {
        missingAlt = true;
      }
    }

    if (!missingRoles && trimmed.includes("<div") && trimmed.includes("onClick")) {
      const hasRole = /<div[^>]*\srole\s*=/.test(trimmed);
      if (!hasRole) {
        missingRoles = true;
      }
    }

    if (missingAlt && missingRoles && hasEslintDisable) {
      break;
    }
  }

  const relPath = path.relative(rootDir, filePath);

  return {
    path: relPath,
    missingAlt,
    missingRoles,
    hasEslintDisable,
  };
}

async function walkDir(dir: string, rootDir: string, results: UiScanResult[]): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(fullPath, rootDir, results);
      } else {
        const scanned = await scanFile(fullPath, rootDir);
        if (scanned) {
          results.push(scanned);
        }
      }
    }),
  );
}

export async function scanUiComponents(): Promise<UiScanResult[]> {
  const results: UiScanResult[] = [];
  await walkDir(COMPONENTS_DIR, COMPONENTS_DIR, results);

  results.sort((a, b) => a.path.localeCompare(b.path));

  return results;
}


