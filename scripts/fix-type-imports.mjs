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

/**
 * Check if an imported symbol is used as a type only in the file
 * This is a heuristic - we check if it's used in type positions
 */
function isTypeOnlyUsage(content, symbolName) {
  // Remove comments and strings to avoid false positives
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");
  
  // Check for type usage patterns
  const typePatterns = [
    new RegExp(`:\\s*${symbolName}\\b`, 'g'), // type annotation
    new RegExp(`<\\s*${symbolName}\\b`, 'g'), // generic type
    new RegExp(`\\b${symbolName}\\s*\\[\\s*\\]`, 'g'), // array type
    new RegExp(`\\b${symbolName}\\s*\\|`, 'g'), // union type
    new RegExp(`\\|\\s*${symbolName}\\b`, 'g'), // union type
    new RegExp(`\\b${symbolName}\\s*&`, 'g'), // intersection type
    new RegExp(`&\\s*${symbolName}\\b`, 'g'), // intersection type
    new RegExp(`extends\\s+${symbolName}\\b`, 'g'), // extends
    new RegExp(`implements\\s+${symbolName}\\b`, 'g'), // implements
    new RegExp(`type\\s+\\w+\\s*=\\s*${symbolName}\\b`, 'g'), // type alias
    new RegExp(`interface\\s+\\w+\\s+extends\\s+${symbolName}\\b`, 'g'), // interface extends
  ];
  
  // Check for runtime usage patterns (if found, it's not type-only)
  const runtimePatterns = [
    new RegExp(`\\b${symbolName}\\s*\\(`, 'g'), // function call
    new RegExp(`\\b${symbolName}\\.`, 'g'), // property access
    new RegExp(`new\\s+${symbolName}\\b`, 'g'), // constructor
    new RegExp(`\\b${symbolName}\\s*\\[`, 'g'), // array access
    new RegExp(`=\\s*${symbolName}\\b(?!\\s*[<:])`, 'g'), // assignment (not type)
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
 * Parse imports and identify which are type-only
 */
function parseImports(content) {
  const imports = [];
  const importRegex = /^import\s+(?:(type\s+)?\{([^}]+)\}|([^"']+)\s+from\s+)?["']([^"']+)["'];?$/gm;
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^import\s+(?:(type\s+)?\{([^}]+)\}|([^"']+)\s+from\s+)?["']([^"']+)["'];?$/);
    
    if (match) {
      const isTypeOnlyKeyword = !!match[1];
      const namedImportsStr = match[2];
      const defaultImport = match[3] ? match[3].trim() : null;
      const fromPath = match[4];
      
      const namedImports = namedImportsStr
        ? namedImportsStr.split(',').map(s => {
            const trimmed = s.trim();
            // Handle "as" aliases
            const parts = trimmed.split(/\s+as\s+/);
            return {
              original: parts[0].trim(),
              alias: parts[1] ? parts[1].trim() : null,
              name: parts[1] ? parts[1].trim() : parts[0].trim(),
            };
          })
        : [];
      
      imports.push({
        line: i,
        isTypeOnlyKeyword,
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
 * Check if all imports from a module are type-only
 */
function areAllImportsTypeOnly(content, imports, fromPath) {
  const moduleImports = imports.filter(imp => imp.fromPath === fromPath);
  
  for (const imp of moduleImports) {
    // Check default import
    if (imp.defaultImport) {
      if (!isTypeOnlyUsage(content, imp.defaultImport)) {
        return false;
      }
    }
    
    // Check named imports
    for (const named of imp.namedImports) {
      if (!isTypeOnlyUsage(content, named.name)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Convert imports to type-only where appropriate
 */
function convertToTypeImports(content) {
  const { imports, lines } = parseImports(content);
  
  if (imports.length === 0) {
    return content;
  }
  
  // Group imports by module path
  const byModule = new Map();
  for (const imp of imports) {
    if (!byModule.has(imp.fromPath)) {
      byModule.set(imp.fromPath, []);
    }
    byModule.get(imp.fromPath).push(imp);
  }
  
  // Check each module
  const modifiedLines = [...lines];
  let offset = 0;
  
  for (const [fromPath, moduleImports] of byModule) {
    // Check if all imports from this module are type-only
    if (areAllImportsTypeOnly(content, imports, fromPath)) {
      // Convert all imports from this module to type imports
      for (const imp of moduleImports) {
        if (!imp.isTypeOnlyKeyword) {
          const lineIndex = imp.line + offset;
          let newLine = modifiedLines[lineIndex];
          
          // Convert to type import
          if (newLine.includes('import type')) {
            // Already type import
            continue;
          }
          
          // Replace "import {" with "import type {"
          newLine = newLine.replace(/^import\s+(\{)/, 'import type $1');
          // Replace "import Symbol from" with "import type Symbol from"
          newLine = newLine.replace(/^import\s+([^{]+)\s+from/, 'import type $1 from');
          
          modifiedLines[lineIndex] = newLine;
        }
      }
    } else {
      // Check individual named imports
      for (const imp of moduleImports) {
        if (imp.namedImports.length > 0) {
          const lineIndex = imp.line + offset;
          let newLine = modifiedLines[lineIndex];
          
          // Separate type-only and runtime imports
          const typeOnlyImports = [];
          const runtimeImports = [];
          
          for (const named of imp.namedImports) {
            if (isTypeOnlyUsage(content, named.name)) {
              typeOnlyImports.push(named);
            } else {
              runtimeImports.push(named);
            }
          }
          
          // If we have both types and runtime, we need to split into two imports
          if (typeOnlyImports.length > 0 && runtimeImports.length > 0) {
            // Create type import line
            const typeImportsStr = typeOnlyImports
              .map(n => n.alias ? `${n.original} as ${n.alias}` : n.original)
              .join(', ');
            const typeImportLine = `import type { ${typeImportsStr} } from "${fromPath}";`;
            
            // Create runtime import line
            const runtimeImportsStr = runtimeImports
              .map(n => n.alias ? `${n.original} as ${n.alias}` : n.original)
              .join(', ');
            const runtimeImportLine = `import { ${runtimeImportsStr} } from "${fromPath}";`;
            
            // Replace the original line with both imports
            modifiedLines[lineIndex] = typeImportLine;
            modifiedLines.splice(lineIndex + 1, 0, runtimeImportLine);
            offset += 1;
          } else if (typeOnlyImports.length > 0 && runtimeImports.length === 0) {
            // All are type-only, convert the whole import
            if (!imp.isTypeOnlyKeyword) {
              newLine = newLine.replace(/^import\s+(\{)/, 'import type $1');
              modifiedLines[lineIndex] = newLine;
            }
          }
        }
      }
    }
  }
  
  return modifiedLines.join('\n');
}

/**
 * Remove unused type imports
 */
function removeUnusedImports(content) {
  const { imports, lines } = parseImports(content);
  
  if (imports.length === 0) {
    return content;
  }
  
  const modifiedLines = [...lines];
  const linesToRemove = new Set();
  
  for (const imp of imports) {
    let hasUsage = false;
    
    // Check default import
    if (imp.defaultImport) {
      const symbolName = imp.defaultImport;
      // Simple check: if the symbol name appears in the content (outside of the import line)
      const beforeImport = lines.slice(0, imp.line).join('\n');
      const afterImport = lines.slice(imp.line + 1).join('\n');
      const restOfContent = beforeImport + '\n' + afterImport;
      
      // Check for usage (simple heuristic)
      if (restOfContent.includes(symbolName)) {
        hasUsage = true;
      }
    }
    
    // Check named imports
    for (const named of imp.namedImports) {
      const symbolName = named.name;
      const beforeImport = lines.slice(0, imp.line).join('\n');
      const afterImport = lines.slice(imp.line + 1).join('\n');
      const restOfContent = beforeImport + '\n' + afterImport;
      
      if (restOfContent.includes(symbolName)) {
        hasUsage = true;
        break;
      }
    }
    
    if (!hasUsage && imp.namedImports.length === 0 && !imp.defaultImport) {
      // Empty import, remove it
      linesToRemove.add(imp.line);
    } else if (!hasUsage) {
      // No usage found, but be conservative - only remove if it's clearly unused
      // For now, we'll skip this to avoid false positives
    }
  }
  
  // Remove unused import lines (in reverse order to maintain indices)
  const sortedLines = Array.from(linesToRemove).sort((a, b) => b - a);
  for (const lineNum of sortedLines) {
    modifiedLines.splice(lineNum, 1);
  }
  
  return modifiedLines.join('\n');
}

/**
 * Add explicit return types where trivially inferable
 */
function addExplicitReturnTypes(content) {
  // This is a complex task that requires AST parsing
  // For now, we'll skip this and focus on import type conversion
  // The user can add return types manually where needed
  return content;
}

async function processFiles() {
  const patterns = [
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
      
      // Step 1: Convert to type imports
      let modifiedContent = convertToTypeImports(content);
      
      // Step 2: Remove unused imports (conservative)
      // modifiedContent = removeUnusedImports(modifiedContent);
      
      if (content !== modifiedContent) {
        writeFileSync(file, modifiedContent, 'utf8');
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

