import { expect, test } from "@playwright/test";
import { resolveInternalLink } from "../../lib/links";
import { replaceInternalLinks } from "../../lib/links.server";

test.describe("internal link helpers", () => {
  test("resolveInternalLink returns mapped url when available", () => {
    expect(resolveInternalLink("classes/sensory")).toBe("/classes/london?category=sensory");
  });

  test("resolveInternalLink falls back to slug path", () => {
    expect(resolveInternalLink("blog/new-parenting"))
      .toBe("/blog/new-parenting");
  });

  test("replaceInternalLinks converts placeholders to markdown links", async () => {
    const source = "Try [link:classes/music] and [link:blog/sleep]";
    const output = await replaceInternalLinks(source);
    expect(output).toContain("[music](/classes/london?category=music)");
    expect(output).toContain("[sleep](/blog?category=sleep)");
  });
});
