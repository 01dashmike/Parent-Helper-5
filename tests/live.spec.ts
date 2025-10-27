import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "https://parent-helper-app-parenthelper5.up.railway.app";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const vp of viewports) {
  test(`Parent Helper layout - ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const header = page.locator("header");
    await expect(header).toBeVisible();

    const hero = page.locator("section:has-text('Find Amazing Classes')");
    await expect(hero).toBeVisible();

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    await page.screenshot({
      path: `screenshots/${vp.name}.png`,
      fullPage: true,
    });
  });
}
