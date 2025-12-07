"use client";

import { z } from "zod";

/**
 * Shared schema for updating class information.
 */
export const UpdateClassSchema = z.object({
  title: z.string(),
  description: z.string(),
  ageRange: z.string(),
});


