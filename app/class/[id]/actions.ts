"use server";

import { UpdateClassSchema } from "./schema";

export async function updateClass(formData: unknown) {
  const parsed = UpdateClassSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error("Invalid data");
  }

  // … existing logic …
}

