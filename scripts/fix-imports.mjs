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
const INTERNAL_PATTERNS = /^(@|\/|\.)/; // Starts with @, /, or .
const STYLE_PATTERNS = /\.(css|scss|sass|less|styl)$/;

function categorizeImport(importPath) {
  if (REACT_NEXT_PATTERNS.test(importPath)) {
    return 'react-next';
  }
  if (STYLE_PATTERNS.test(importPath)) {
    return 'styles';
  }
  if (INTERNAL_PATTERNS.test(importPath)) {
    return 'internal';
  }
  if (THIRD_PARTY_PATTERNS.test(importPath)) {
    return 'third-party';
  }
  return 'internal'; // Default to internal
}

function parseImports(content) {
  const imports = [];
  const importRegex = /^import\s+(?:(type\s+)?\{([^}]+)\}|([^"']+)\s+from\s+)?["']([^"']+)["'];?$/gm;
  const lines = content.split('\n');
  let inImportBlock = false;
  let importStartLine = -1;
  let currentImports = [];
  let lastImportLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this is an import line
    if (trimmed.startsWith('import ')) {
      if (!inImportBlock) {
        inImportBlock = true;
        importStartLine = i;
        currentImports = [];
      }
      
      // Parse the import
      const match = line.match(/^import\s+(?:(type\s+)?\{([^}]+)\}|([^"']+)\s+from\s+)?["']([^"']+)["'];?$/);
      if (match) {
        const isTypeOnly = !!match[1];
        const namedImports = match[2] ? match[2].split(',').map(s => s.trim()).filter(Boolean) : [];
        const defaultImport = match[3] ? match[3].trim() : null;
        const fromPath = match[4];
        
        currentImports.push({
          line: i,
          isTypeOnly,
          namedImports,
          defaultImport,
          fromPath,
          rawLine: line,
        });
        lastImportLine = i;
      }
    } else if (inImportBlock && (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*'))) {
      // Continue import block if empty line or comment
      continue;
    } else if (inImportBlock && !trimmed.startsWith('import ')) {
      // End of import block
      if (currentImports.length > 0) {
        imports.push({
          startLine: importStartLine,
          endLine: lastImportLine,
          imports: currentImports,
        });
      }
      inImportBlock = false;
      currentImports = [];
    }
  }

  // Handle case where imports are at the end of file
  if (inImportBlock && currentImports.length > 0) {
    imports.push({
      startLine: importStartLine,
      endLine: lastImportLine,
      imports: currentImports,
    });
  }

  return { imports, lines };
}

function deduplicateImports(imports) {
  const byModule = new Map();
  
  for (const imp of imports) {
    const key = imp.fromPath;
    if (!byModule.has(key)) {
      byModule.set(key, {
        fromPath: key,
        isTypeOnly: imp.isTypeOnly,
        namedImports: new Set(),
        defaultImport: imp.defaultImport,
      });
    }
    
    const module = byModule.get(key);
    // Merge type-only status (if any import is type-only, mark as type-only)
    if (imp.isTypeOnly) {
      module.isTypeOnly = true;
    }
    
    // Merge named imports
    for (const named of imp.namedImports) {
      module.namedImports.add(named);
    }
    
    // Merge default import (take the first one)
    if (imp.defaultImport && !module.defaultImport) {
      module.defaultImport = imp.defaultImport;
    }
  }
  
  return Array.from(byModule.values());
}

function sortNamedImports(namedImports) {
  return Array.from(namedImports).sort((a, b) => {
    // Handle "as" aliases and default imports
    const aName = a.includes(' as ') ? a.split(' as ')[0].trim() : a.trim();
    const bName = b.includes(' as ') ? b.split(' as ')[0].trim() : b.trim();
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  });
}

function formatImport(module) {
  const parts = [];
  
  if (module.defaultImport) {
    parts.push(module.defaultImport);
  }
  
  if (module.namedImports.size > 0) {
    const sorted = sortNamedImports(module.namedImports);
    parts.push(`{ ${sorted.join(', ')} }`);
  }
  
  const importKeyword = module.isTypeOnly ? 'import type' : 'import';
  const importSpec = parts.join(', ');
  return `${importKeyword} ${importSpec} from "${module.fromPath}";`;
}

function reorganizeImports(content) {
  const { imports: importBlocks, lines } = parseImports(content);
  
  if (importBlocks.length === 0) {
    return content; // No imports to reorganize
  }
  
  // Collect all imports
  const allImports = [];
  for (const block of importBlocks) {
    allImports.push(...block.imports);
  }
  
  // Deduplicate
  const deduplicated = deduplicateImports(allImports);
  
  // Group by category
  const grouped = {
    'react-next': [],
    'third-party': [],
    'internal': [],
    'styles': [],
  };
  
  for (const imp of deduplicated) {
    const category = categorizeImport(imp.fromPath);
    grouped[category].push(imp);
  }
  
  // Sort within each category by path
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => {
      // For relative imports, sort by depth first, then alphabetically
      const aIsRelative = a.fromPath.startsWith('.');
      const bIsRelative = b.fromPath.startsWith('.');
      
      if (aIsRelative && !bIsRelative) return 1;
      if (!aIsRelative && bIsRelative) return -1;
      
      return a.fromPath.localeCompare(b.fromPath, undefined, { sensitivity: 'base' });
    });
  }
  
  // Build new import section
  const newImports = [];
  
  // React/Next
  if (grouped['react-next'].length > 0) {
    for (const imp of grouped['react-next']) {
      newImports.push(formatImport(imp));
    }
    newImports.push('');
  }
  
  // Third-party
  if (grouped['third-party'].length > 0) {
    for (const imp of grouped['third-party']) {
      newImports.push(formatImport(imp));
    }
    newImports.push('');
  }
  
  // Internal
  if (grouped['internal'].length > 0) {
    for (const imp of grouped['internal']) {
      newImports.push(formatImport(imp));
    }
    newImports.push('');
  }
  
  // Styles
  if (grouped['styles'].length > 0) {
    for (const imp of grouped['styles']) {
      newImports.push(formatImport(imp));
    }
    newImports.push('');
  }
  
  // Remove trailing empty line
  if (newImports[newImports.length - 1] === '') {
    newImports.pop();
  }
  
  // Find the first non-import line
  let firstNonImportLine = 0;
  if (importBlocks.length > 0) {
    firstNonImportLine = importBlocks[0].startLine;
  }
  
  // Rebuild content
  const beforeImports = lines.slice(0, firstNonImportLine);
  const afterImports = lines.slice(importBlocks[importBlocks.length - 1].endLine + 1);
  
  return [
    ...beforeImports,
    ...newImports,
    ...afterImports,
  ].join('\n');
}

async function processFiles() {
  const patterns = [
    'components/**/*.{ts,tsx}',
    'app/(authed)/**/*.{ts,tsx}',
    'app/search/**/*.{ts,tsx}',
    'app/city/**/*.{ts,tsx}',
    'lib/utils/**/*.{ts,tsx}',
  ];
  
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
      const reorganized = reorganizeImports(content);
      
      if (content !== reorganized) {
        writeFileSync(file, reorganized, 'utf8');
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

