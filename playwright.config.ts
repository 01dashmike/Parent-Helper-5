import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "tests",
  reporter: [["list"]],
  use: {
    screenshot: "off",
    video: "off",
  },
};

export default config;
