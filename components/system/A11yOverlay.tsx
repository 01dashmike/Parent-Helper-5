"use client";

import { useEffect } from "react";

/**
 * Development overlay that automatically fixes and warns about accessibility issues
 * Only runs in development mode
 */
export default function A11yOverlay() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        const issues: string[] = [];

        // Fix missing alt attributes on images
        const imgs = document.querySelectorAll("img:not([alt])");
        imgs.forEach((img) => {
            const src = img.getAttribute("src") || "";
            const isDecorative =
                src.includes("decoration") ||
                src.includes("spacer") ||
                src.includes("divider") ||
                img.getAttribute("role") === "presentation";
            const altText = isDecorative ? "" : "Image description";
            img.setAttribute("alt", altText);
            issues.push(`Missing alt on image: ${src}`);
        });

        // Fix inputs without labels
        const inputs = document.querySelectorAll(
            "input:not([aria-label]):not([aria-labelledby]):not([id])"
        );
        inputs.forEach((input) => {
            const type = input.getAttribute("type") || "text";
            const name = input.getAttribute("name") || "input";
            const placeholder = input.getAttribute("placeholder") || "";
            const inferredLabel = placeholder || name.charAt(0).toUpperCase() + name.slice(1);
            input.setAttribute("aria-label", inferredLabel);
            issues.push(`Input missing accessible name: ${type} input`);
        });

        // Fix textareas without labels
        const textareas = document.querySelectorAll(
            "textarea:not([aria-label]):not([aria-labelledby]):not([id])"
        );
        textareas.forEach((textarea) => {
            const placeholder = textarea.getAttribute("placeholder") || "";
            const inferredLabel = placeholder || "Text area";
            textarea.setAttribute("aria-label", inferredLabel);
            issues.push("Textarea missing accessible name");
        });

        // Fix buttons with icons but no text
        const buttons = document.querySelectorAll("button:not([aria-label])");
        buttons.forEach((button) => {
            const text = button.textContent?.trim() || "";
            const hasIcon = button.querySelector("svg, img");
            if (!text && hasIcon) {
                const iconAlt =
                    button.querySelector("img[alt]")?.getAttribute("alt") ||
                    button.querySelector("svg[aria-label]")?.getAttribute("aria-label") ||
                    "Button";
                button.setAttribute("aria-label", iconAlt);
                issues.push("Button with icon missing accessible name");
            }
        });

        // Fix links with icons but no text
        const links = document.querySelectorAll("a:not([aria-label]):not([aria-labelledby])");
        links.forEach((link) => {
            const text = link.textContent?.trim() || "";
            const href = link.getAttribute("href") || "";
            const hasIcon = link.querySelector("svg, img");
            if (!text && hasIcon) {
                const iconAlt =
                    link.querySelector("img[alt]")?.getAttribute("alt") ||
                    link.querySelector("svg[aria-label]")?.getAttribute("aria-label") ||
                    href.split("/").pop() ||
                    "Link";
                link.setAttribute("aria-label", iconAlt);
                issues.push(`Link missing accessible text: ${href}`);
            }
        });

        // Check for missing lang attribute
        if (!document.documentElement.getAttribute("lang")) {
            document.documentElement.setAttribute("lang", "en");
            issues.push("Missing lang attribute on html element");
        }

        // Log warnings if issues were found
        if (issues.length > 0) {
            console.warn(
                `A11y Overlay: Auto-fixed ${issues.length} accessibility issue(s):`,
                issues
            );
        }

        // Check heading order
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        let lastLevel = 0;
        headings.forEach((heading) => {
            const level = parseInt(heading.tagName[1], 10);
            if (lastLevel > 0 && level - lastLevel > 1) {
                console.warn(
                    `A11y: Skipped heading level: ${heading.tagName} after h${lastLevel}`
                );
            }
            lastLevel = level;
        });

        // Check for duplicate IDs
        const ids = new Map<string, number>();
        document.querySelectorAll("[id]").forEach((el) => {
            const id = el.getAttribute("id");
            if (id) {
                ids.set(id, (ids.get(id) || 0) + 1);
            }
        });
        ids.forEach((count, id) => {
            if (count > 1) {
                console.warn(`A11y: Duplicate ID found: ${id} (${count} times)`);
            }
        });
    }, []);

    return null;
}

