export type AnyErr = unknown;

export function toError(e: AnyErr): Error {
  if (e instanceof Error) return e;
  try {
    const msg =
      typeof e === "string"
        ? e
        : e && typeof e === "object"
        ? JSON.stringify(e)
        : String(e);
    const err = new Error(msg);
    if (e && typeof e === "object") {
      const errorObj = e as Record<string, unknown>;
      const errWithProps = err as Error & Record<string, unknown>;
      for (const k of ["code", "status", "name"]) {
        if (k in errorObj) {
          errWithProps[k] = errorObj[k];
        }
      }
    }
    return err;
  } catch {
    return new Error("Unknown error");
  }
}
