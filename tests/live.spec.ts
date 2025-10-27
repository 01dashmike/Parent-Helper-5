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

    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("PAGE ERROR:", err));

    const header = page.locator("header");
    await expect(header).toBeVisible();

    const hero = page.locator(
      "section:has-text('Plan unforgettable days'), section:has-text('Curated experiences'), main"
    );
    try {
      await expect(hero.first()).toBeVisible({ timeout: 8000 });
    } catch (err) {
      console.error(`Hero section not visible on ${vp.name}`, err);
      await page.screenshot({ path: `screenshots/${vp.name}-error.png`, fullPage: true });
      throw err;
    }

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    await page.screenshot({
      path: `screenshots/${vp.name}.png`,
      fullPage: true,
    });
  });
}
