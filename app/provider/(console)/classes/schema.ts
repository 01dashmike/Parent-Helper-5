import { z } from "zod";

export const classFormSchema = z.object({
  title: z.string().trim().min(3, "Class title is required"),
  summary: z.string().trim().max(200, "Summary is too long").optional().or(z.literal("")),
  price: z.string().trim().max(120).optional().or(z.literal("")),
  bookingUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null))
    .pipe(z.string().url("Enter a valid URL").nullable()),
  venueId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  tags: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []
    ),
  isPublished: z.coerce.boolean().optional(),
});

export const occurrenceFormSchema = z.object({
  classId: z.string().uuid("Invalid class id."),
  startsAt: z
    .string()
    .min(1, "Start time required")
    .transform((value) => new Date(value))
    .refine((date) => !Number.isNaN(date.getTime()), "Invalid start time.")
    .transform((date) => date.toISOString()),
  endsAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : null))
    .refine((date) => (date ? !Number.isNaN(date.getTime()) : true), {
      message: "Invalid end time.",
    })
    .transform((date) => date?.toISOString() ?? null),
  venueId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  status: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .default("scheduled"),
  price: z.string().trim().max(120).optional().or(z.literal("")),
  bookingUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null))
    .pipe(z.string().url().nullable()),
});

