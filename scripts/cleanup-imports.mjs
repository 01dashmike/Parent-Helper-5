#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import glob from 'glob';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const globAsync = promisify(glob);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Categories for import ordering
const REACT_NEXT_PATTERNS = /^(react|react-dom|next\/|@next\/)/;
const THIRD_PARTY_PATTERNS = /^[^@./]/; // Doesn't start with @, ., or /
const INTERNAL_ABSOLUTE_PATTERNS = /^@\//; // Starts with @/
const RELATIVE_PATTERNS = /^\./; // Starts with .
const STYLE_PATTERNS = /\.(css|scss|sass|less|styl)$/;

function categorizeImport(importPath) {
  if (REACT_NEXT_PATTERNS.test(importPath)) {
    return 'react-next';
  }
  if (STYLE_PATTERNS.test(importPath)) {
    return 'styles';
  }
  if (RELATIVE_PATTERNS.test(importPath)) {
    return 'relative';
  }
  if (INTERNAL_ABSOLUTE_PATTERNS.test(importPath)) {
    return 'internal';
  }
  if (THIRD_PARTY_PATTERNS.test(importPath)) {
    return 'third-party';
  }
  return 'internal'; // Default to internal
}

/**
 * Parse all imports from a file
 */
function parseImports(content) {
  const imports = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }
    
    // Match import statements
    // import type { ... } from "..."
    // import { ... } from "..."
    // import Default from "..."
    // import Default, { ... } from "..."
    const importMatch = line.match(/^import\s+(?:(type\s+)?\{([^}]+)\}|([^"']+)\s+from\s+)?["']([^"']+)["'];?$/);
    
    if (importMatch) {
      const isTypeOnly = !!importMatch[1];
      const namedImportsStr = importMatch[2];
      const defaultImport = importMatch[3] ? importMatch[3].trim() : null;
      const fromPath = importMatch[4];
      
      // Parse named imports
      const namedImports = [];
      if (namedImportsStr) {
        const parts = namedImportsStr.split(',').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          // Handle "as" aliases: "foo as bar" or "type foo as bar"
          const aliasMatch = part.match(/^(?:type\s+)?([^\s]+)(?:\s+as\s+([^\s]+))?$/);
          if (aliasMatch) {
            namedImports.push({
              original: aliasMatch[1].trim(),
              alias: aliasMatch[2] ? aliasMatch[2].trim() : null,
              name: aliasMatch[2] ? aliasMatch[2].trim() : aliasMatch[1].trim(),
              isType: part.trim().startsWith('type ') || isTypeOnly,
            });
          } else {
            namedImports.push({
              original: part.trim(),
              alias: null,
              name: part.trim(),
              isType: part.trim().startsWith('type ') || isTypeOnly,
            });
          }
        }
      }
      
      imports.push({
        line: i,
        isTypeOnly,
        namedImports,
        defaultImport,
        fromPath,
        rawLine: line,
      });
    }
  }
  
  return { imports, lines };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a symbol is used as a type only in the file
 */
function isTypeOnlyUsage(content, symbolName) {
  // Remove the import line itself and comments/strings
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");
  
  const escaped = escapeRegex(symbolName);
  
  // Check for type usage patterns
  const typePatterns = [
    new RegExp(`:\\s*${escaped}\\b`, 'g'), // type annotation
    new RegExp(`<\\s*${escaped}\\b`, 'g'), // generic type
    new RegExp(`\\b${escaped}\\s*\\[\\s*\\]`, 'g'), // array type
    new RegExp(`\\b${escaped}\\s*\\|`, 'g'), // union type
    new RegExp(`\\|\\s*${escaped}\\b`, 'g'), // union type
    new RegExp(`\\b${escaped}\\s*&`, 'g'), // intersection type
    new RegExp(`&\\s*${escaped}\\b`, 'g'), // intersection type
    new RegExp(`extends\\s+${escaped}\\b`, 'g'), // extends
    new RegExp(`implements\\s+${escaped}\\b`, 'g'), // implements
    new RegExp(`type\\s+\\w+\\s*=\\s*${escaped}\\b`, 'g'), // type alias
    new RegExp(`interface\\s+\\w+\\s+extends\\s+${escaped}\\b`, 'g'), // interface extends
  ];
  
  // Check for runtime usage patterns (if found, it's not type-only)
  const runtimePatterns = [
    new RegExp(`\\b${escaped}\\s*\\(`, 'g'), // function call
    new RegExp(`\\b${escaped}\\.`, 'g'), // property access
    new RegExp(`new\\s+${escaped}\\b`, 'g'), // constructor
    new RegExp(`\\b${escaped}\\s*\\[`, 'g'), // array access (not type)
    new RegExp(`=\\s*${escaped}\\b(?!\\s*[<:])`, 'g'), // assignment (not type)
    new RegExp(`\\b${escaped}\\s*:`, 'g'), // object property (runtime)
  ];
  
  // If runtime usage found, it's not type-only
  for (const pattern of runtimePatterns) {
    if (pattern.test(withoutComments)) {
      return false;
    }
  }
  
  // Check for type usage
  for (const pattern of typePatterns) {
    if (pattern.test(withoutComments)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a symbol is used at all in the file
 */
function isSymbolUsed(content, symbolName, importLine) {
  // Get content without the import line
  const lines = content.split('\n');
  const beforeImport = lines.slice(0, importLine).join('\n');
  const afterImport = lines.slice(importLine + 1).join('\n');
  const restOfContent = beforeImport + '\n' + afterImport;
  
  // Remove comments and strings to avoid false positives
  const withoutComments = restOfContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''")
    .replace(/`[^`]*`/g, '``');
  
  // Check for usage - be conservative
  // Look for JSX usage: <SymbolName or <SymbolName. or </SymbolName>
  const escaped = escapeRegex(symbolName);
  
  // JSX patterns
  const jsxPatterns = [
    new RegExp(`<${escaped}\\b`, 'g'), // <SymbolName
    new RegExp(`<${escaped}\\.`, 'g'), // <SymbolName.
    new RegExp(`</${escaped}>`, 'g'), // </SymbolName>
  ];
  
  // Regular usage patterns
  const usagePatterns = [
    new RegExp(`\\b${escaped}\\b`, 'g'), // General usage
  ];
  
  // Check JSX first (most common in React)
  for (const pattern of jsxPatterns) {
    if (pattern.test(withoutComments)) {
      return true;
    }
  }
  
  // Check regular usage
  for (const pattern of usagePatterns) {
    if (pattern.test(withoutComments)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Merge and deduplicate imports from the same module
 */
function mergeImportsByModule(imports) {
  const byModule = new Map();
  
  for (const imp of imports) {
    const key = imp.fromPath;
    if (!byModule.has(key)) {
      byModule.set(key, {
        fromPath: key,
        isTypeOnly: imp.isTypeOnly,
        namedImports: new Map(),
        defaultImport: imp.defaultImport,
      });
    }
    
    const module = byModule.get(key);
    
    // Merge type-only status (if any import is type-only, we'll handle it per-symbol)
    // For now, keep track of both type and runtime imports
    
    // Merge named imports
    for (const named of imp.namedImports) {
      const key = named.name;
      if (!module.namedImports.has(key)) {
        module.namedImports.set(key, {
          original: named.original,
          alias: named.alias,
          name: named.name,
          isType: named.isType,
        });
      } else {
        // If we have both type and runtime, mark as runtime (not type-only)
        const existing = module.namedImports.get(key);
        if (named.isType && !existing.isType) {
          existing.isType = false; // Runtime takes precedence
        }
      }
    }
    
    // Merge default import (take the first one)
    if (imp.defaultImport && !module.defaultImport) {
      module.defaultImport = imp.defaultImport;
    }
  }
  
  return Array.from(byModule.values());
}

/**
 * Format an import statement
 */
function formatImport(module, content) {
  // Check each named import to see if it's type-only
  const typeOnlyImports = [];
  const runtimeImports = [];
  
  for (const named of module.namedImports.values()) {
    // Check if this symbol is used as type only
    const isType = isTypeOnlyUsage(content, named.name);
    if (isType) {
      typeOnlyImports.push(named);
    } else {
      runtimeImports.push(named);
    }
  }
  
  const parts = [];
  const imports = [];
  
  // Format named imports
  const formatNamed = (namedImports) => {
    return Array.from(namedImports)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(n => {
        if (n.alias) {
          return `${n.original} as ${n.alias}`;
        }
        return n.original;
      })
      .join(', ');
  };
  
  // Handle CSS/style imports (no named or default imports)
  if (STYLE_PATTERNS.test(module.fromPath)) {
    return [`import "${module.fromPath}";`];
  }
  
  // Default import
  if (module.defaultImport) {
    parts.push(module.defaultImport);
  }
  
  // Add runtime named imports
  if (runtimeImports.length > 0) {
    parts.push(`{ ${formatNamed(runtimeImports)} }`);
  }
  
  // If no imports, skip (shouldn't happen, but be safe)
  if (parts.length === 0) {
    return [];
  }
  
  // Build import statement
  const importKeyword = 'import';
  const importSpec = parts.join(', ');
  const importStatement = `${importKeyword} ${importSpec} from "${module.fromPath}";`;
  
  // Add type import if needed
  if (typeOnlyImports.length > 0) {
    const typeImportStatement = `import type { ${formatNamed(typeOnlyImports)} } from "${module.fromPath}";`;
    if (runtimeImports.length > 0 || module.defaultImport) {
      // We have both type and runtime imports - return both
      return [typeImportStatement, importStatement];
    } else {
      // Only type imports
      return [typeImportStatement];
    }
  }
  
  return [importStatement];
}

/**
 * Clean up imports in a file
 */
function cleanupImports(content) {
  const { imports, lines } = parseImports(content);
  
  if (imports.length === 0) {
    return content; // No imports to clean up
  }
  
  // Find the first and last import line
  const firstImportLine = Math.min(...imports.map(i => i.line));
  const lastImportLine = Math.max(...imports.map(i => i.line));
  
  // Merge imports by module
  const merged = mergeImportsByModule(imports);
  
  // Filter out unused imports - BE CONSERVATIVE
  // Only remove if we're absolutely certain it's unused
  const usedImports = [];
  for (const module of merged) {
    // Check default import
    if (module.defaultImport) {
      // Be conservative - if we can't find usage, keep it (might be used in ways we can't detect)
      // Only remove if we're very confident
      const isUsed = isSymbolUsed(content, module.defaultImport, firstImportLine);
      if (!isUsed) {
        // Check if it's a common pattern we might miss
        // For now, be conservative and keep it unless we're very sure
        // Skip removal for now to avoid breaking things
      }
    }
    
    // Check named imports - keep all for now to be safe
    // The merge/deduplication and sorting is the main goal
    usedImports.push(module);
  }
  
  // Group by category and sort
  const grouped = {
    'react-next': [],
    'third-party': [],
    'internal': [],
    'relative': [],
    'styles': [],
  };
  
  for (const imp of usedImports) {
    const category = categorizeImport(imp.fromPath);
    grouped[category].push(imp);
  }
  
  // Sort within each category by path
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.fromPath.localeCompare(b.fromPath));
  }
  
  // Build new import section
  const newImports = [];
  
  // React/Next
  for (const imp of grouped['react-next']) {
    newImports.push(...formatImport(imp, content));
  }
  if (grouped['react-next'].length > 0) {
    newImports.push('');
  }
  
  // Third-party
  for (const imp of grouped['third-party']) {
    newImports.push(...formatImport(imp, content));
  }
  if (grouped['third-party'].length > 0) {
    newImports.push('');
  }
  
  // Internal
  for (const imp of grouped['internal']) {
    newImports.push(...formatImport(imp, content));
  }
  if (grouped['internal'].length > 0) {
    newImports.push('');
  }
  
  // Relative
  for (const imp of grouped['relative']) {
    newImports.push(...formatImport(imp, content));
  }
  if (grouped['relative'].length > 0) {
    newImports.push('');
  }
  
  // Styles
  for (const imp of grouped['styles']) {
    newImports.push(...formatImport(imp, content));
  }
  if (grouped['styles'].length > 0) {
    newImports.push('');
  }
  
  // Remove trailing empty line
  while (newImports.length > 0 && newImports[newImports.length - 1] === '') {
    newImports.pop();
  }
  
  // Rebuild content
  const beforeImports = lines.slice(0, firstImportLine);
  const afterImports = lines.slice(lastImportLine + 1);
  
  // Preserve "use client" directive if present
  const hasUseClient = beforeImports.some(line => line.trim() === '"use client"');
  const useClientLine = hasUseClient ? ['"use client";', ''] : [];
  
  return [
    ...beforeImports.filter(line => line.trim() !== '"use client"'),
    ...useClientLine,
    ...newImports,
    ...afterImports,
  ].join('\n');
}

async function processFiles() {
  const patterns = [
    'components/**/*.{ts,tsx}',
    'app/search/**/*.{ts,tsx}',
    'app/city/**/*.{ts,tsx}',
    'lib/utils/**/*.{ts,tsx}',
  ];
  
  // Check if lib/client exists
  const clientDir = join(rootDir, 'lib', 'client');
  try {
    const fs = await import('fs');
    const stats = fs.statSync(clientDir);
    if (stats.isDirectory()) {
      patterns.push('lib/client/**/*.{ts,tsx}');
    }
  } catch {
    // lib/client doesn't exist, skip it
  }
  
  const files = [];
  for (const pattern of patterns) {
    const matches = await globAsync(pattern, { cwd: rootDir, absolute: true });
    files.push(...matches);
  }
  
  console.log(`Found ${files.length} files to process`);
  
  let processed = 0;
  let modified = 0;
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const cleaned = cleanupImports(content);
      
      if (content !== cleaned) {
        writeFileSync(file, cleaned, 'utf8');
        modified++;
        console.log(`Modified: ${file.replace(rootDir + '/', '')}`);
      }
      processed++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\nProcessed ${processed} files, modified ${modified} files`);
}

processFiles().catch(console.error);

