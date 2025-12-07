/**
 * Replace Handlebars-style template variables
 * PERF: Optimized with early returns and compiled regex cache
 */

// PERF: Cache compiled regexes
const regexCache = new Map<string, RegExp>();

function getRegex(key: string): RegExp {
  let regex = regexCache.get(key);
  if (!regex) {
    regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    regexCache.set(key, regex);
  }
  return regex;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, unknown>
): string {
  if (!template) return "";
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk";

  // Add default variables
  const allVariables = {
    app_url: appUrl,
    ...variables,
  };

  let result = template;

  // PERF: Only replace variables that exist in template
  for (const [key, value] of Object.entries(allVariables)) {
    if (result.includes(`{{${key}}}`)) {
      const regex = getRegex(key);
      result = result.replace(regex, String(value ?? ""));
    }
  }

  // Handle simple conditionals (basic support)
  // {{#if variable}}...{{/if}}
  // PERF: Only process if conditionals exist
  if (result.includes("{{#if")) {
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    result = result.replace(ifRegex, (match, varName, content) => {
      if ((allVariables as Record<string, unknown>)[varName]) {
        return content;
      }
      return "";
    });
  }

  return result;
}

/**
 * Format currency (pence to pounds)
 * PERF: Use cached Intl.NumberFormat instance
 */
const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/**
 * PERF: Clear regex cache (useful for testing)
 */
export function clearRegexCache(): void {
  regexCache.clear();
}
