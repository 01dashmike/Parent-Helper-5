import { z } from "zod";
import { slugify } from "@/lib/slug";

export const venueFormSchema = z.object({
  name: z.string().trim().min(3, "Venue name is required"),
  slug: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? slugify(value) : "")),
  description: z.string().trim().optional().or(z.literal("")),
  addressLine1: z.string().trim().optional().or(z.literal("")),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  county: z.string().trim().optional().or(z.literal("")),
  postcode: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null))
    .pipe(
      z
        .string()
        .email("Enter a valid email address.")
        .nullable()
    ),
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null))
    .pipe(
      z
        .string()
        .url("Enter a valid URL.")
        .nullable()
    ),
});

