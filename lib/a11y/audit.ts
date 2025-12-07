import * as cheerio from "cheerio";

export type A11yIssue = {
    type: string;
    element: string;
    message: string;
    fix?: string;
};

export type A11yAuditResult = {
    html: string;
    issues: A11yIssue[];
    fixed: number;
};

/**
 * Runs accessibility audit on HTML and automatically fixes common issues
 */
export async function runA11yAudit(html: string): Promise<A11yAuditResult> {
  const $ = cheerio.load(html);

    const issues: A11yIssue[] = [];
    let fixed = 0;

    // 1. Missing alt text on images
    $("img:not([alt])").each((_, el) => {
        const src = $(el).attr("src") || "unknown";
        const isDecorative = src.includes("decoration") || src.includes("spacer") || src.includes("divider");
        const altText = isDecorative ? "" : "Image description";

        $(el).attr("alt", altText);
        issues.push({
            type: "missing-alt",
            element: "img",
            message: `Missing alt on image: ${src}`,
            fix: `Added alt="${altText}"`,
        });
        fixed++;
    });

    // 2. Empty alt text on images (should be "" for decorative, or have description)
    $('img[alt=""]').each((_, el) => {
        const src = $(el).attr("src") || "";
        // If it's not clearly decorative, suggest adding description
        if (!src.includes("decoration") && !src.includes("spacer") && !src.includes("divider")) {
            issues.push({
                type: "empty-alt",
                element: "img",
                message: `Empty alt on potentially informative image: ${src}`,
                fix: "Consider adding descriptive alt text",
            });
        }
    });

    // 3. Inputs without labels or aria-label
    $("input:not([aria-label]):not([aria-labelledby]):not([id])").each((_, el) => {
        const type = $(el).attr("type") || "text";
        const name = $(el).attr("name") || "input";
        const placeholder = $(el).attr("placeholder") || "";

        // Try to infer label from placeholder or name
        const inferredLabel = placeholder || name.charAt(0).toUpperCase() + name.slice(1);
        $(el).attr("aria-label", inferredLabel);

        issues.push({
            type: "missing-label",
            element: "input",
            message: `Input missing accessible name: ${type} input`,
            fix: `Added aria-label="${inferredLabel}"`,
        });
        fixed++;
    });

    // 4. Textareas without labels
    $("textarea:not([aria-label]):not([aria-labelledby]):not([id])").each((_, el) => {
        const placeholder = $(el).attr("placeholder") || "";
        const inferredLabel = placeholder || "Text area";
        $(el).attr("aria-label", inferredLabel);

        issues.push({
            type: "missing-label",
            element: "textarea",
            message: "Textarea missing accessible name",
            fix: `Added aria-label="${inferredLabel}"`,
        });
        fixed++;
    });

    // 5. Buttons without accessible text
    $("button:not([aria-label])").each((_, el) => {
        const text = $(el).text().trim();
        const hasIcon = $(el).find("svg, img").length > 0;

        if (!text && hasIcon) {
            const iconAlt = $(el).find("img[alt]").attr("alt") ||
                $(el).find("svg[aria-label]").attr("aria-label") ||
                "Button";
            $(el).attr("aria-label", iconAlt);

            issues.push({
                type: "missing-button-label",
                element: "button",
                message: "Button with icon missing accessible name",
                fix: `Added aria-label="${iconAlt}"`,
            });
            fixed++;
        }
    });

    // 6. Links without accessible text
    $("a:not([aria-label]):not([aria-labelledby])").each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr("href") || "";
        const hasIcon = $(el).find("svg, img").length > 0;

        if (!text && hasIcon) {
            const iconAlt = $(el).find("img[alt]").attr("alt") ||
                $(el).find("svg[aria-label]").attr("aria-label") ||
                href.split("/").pop() || "Link";
            $(el).attr("aria-label", iconAlt);

            issues.push({
                type: "missing-link-label",
                element: "a",
                message: `Link missing accessible text: ${href}`,
                fix: `Added aria-label="${iconAlt}"`,
            });
            fixed++;
        }
    });

    // 7. Heading order validation
    let lastLevel = 0;
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
        const level = parseInt(el.tagName[1], 10);
        if (lastLevel > 0 && level - lastLevel > 1) {
            issues.push({
                type: "heading-order",
                element: el.tagName,
                message: `Skipped heading level: ${el.tagName} after h${lastLevel}`,
                fix: `Consider using h${lastLevel + 1} instead`,
            });
        }
        lastLevel = level;
    });

    // 8. Missing form labels (check if input has associated label)
    $("input[id], textarea[id]").each((_, el) => {
        const id = $(el).attr("id");
        if (id && !$(`label[for="${id}"]`).length && !$(el).attr("aria-label") && !$(el).attr("aria-labelledby")) {
            const name = $(el).attr("name") || id;
            const placeholder = $(el).attr("placeholder") || "";
            const inferredLabel = placeholder || name.charAt(0).toUpperCase() + name.slice(1);

            // Create a label element before the input
            $(el).before(`<label for="${id}" class="sr-only">${inferredLabel}</label>`);

            issues.push({
                type: "missing-form-label",
                element: "input/textarea",
                message: `Input with id="${id}" missing label`,
                fix: `Added label element`,
            });
            fixed++;
        }
    });

    // 9. Images with role="presentation" should have empty alt
    $('img[role="presentation"]:not([alt=""])').each((_, el) => {
        $(el).attr("alt", "");
        issues.push({
            type: "presentation-alt",
            element: "img",
            message: "Image with role='presentation' should have empty alt",
            fix: "Set alt to empty string",
        });
        fixed++;
    });

    // 10. Check for missing lang attribute on html element
    if (!$("html").attr("lang")) {
        $("html").attr("lang", "en");
        issues.push({
            type: "missing-lang",
            element: "html",
            message: "Missing lang attribute on html element",
            fix: 'Added lang="en"',
        });
        fixed++;
    }

    // 11. Check for interactive elements without keyboard access
    $("[onclick]:not([role='button']):not(button):not(a)").each((_, el) => {
        const tagName = el.tagName.toLowerCase();
        if (tagName !== "button" && tagName !== "a") {
            $(el).attr("role", "button");
            $(el).attr("tabindex", "0");

            issues.push({
                type: "interactive-element",
                element: tagName,
                message: `Element with onclick missing proper role: ${tagName}`,
                fix: "Added role='button' and tabindex='0'",
            });
            fixed++;
        }
    });

    // 12. Check for missing main landmark
    if (!$("main, [role='main']").length && !$("body").find("main, [role='main']").length) {
        issues.push({
            type: "missing-main",
            element: "body",
            message: "Page missing main landmark",
            fix: "Consider adding <main> or role='main'",
        });
    }

    // 13. Check for duplicate IDs
    const ids = new Map<string, number>();
    $("[id]").each((_, el) => {
        const id = $(el).attr("id");
        if (id) {
            ids.set(id, (ids.get(id) || 0) + 1);
        }
    });

    ids.forEach((count, id) => {
        if (count > 1) {
            issues.push({
                type: "duplicate-id",
                element: `[id="${id}"]`,
                message: `Duplicate ID found: ${id} (${count} times)`,
                fix: "Ensure IDs are unique",
            });
        }
    });

    return {
        html: $.html(),
        issues,
        fixed,
    };
}

/**
 * Check contrast ratio (simplified heuristic)
 * Note: For accurate contrast checking, use axe-core or similar tools
 */
export function checkContrast(
    _color: string,
    _backgroundColor: string,
): boolean {
    // Placeholder - real implementation would parse colors and calculate contrast ratio
    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    return true; // Always pass for now - use axe-core for real checks
}

