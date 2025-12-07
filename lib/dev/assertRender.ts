export function assertRenderable(name: string, value: any) {
  const ok =
    typeof value === "function" ||
    (typeof value === "object" && value !== null && "$$typeof" in value);

  if (!ok) {
    // eslint-disable-next-line no-console
    console.error(`[assertRenderable] ${name} is NOT renderable:`, value);
  } else {
    // eslint-disable-next-line no-console
    console.debug(`[assertRenderable] ${name} OK:`, typeof value);
  }

  return value;
}
