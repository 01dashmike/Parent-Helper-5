import { z } from "zod";
import { WIZARD_STEPS as WIZARD_STEPS_FROM_LIB } from "@/lib/provider/onboarding";

// Re-export WIZARD_STEPS for use in components
export const WIZARD_STEPS = WIZARD_STEPS_FROM_LIB;

// Validation schemas for each step
export const step1AccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export const step2BusinessSchema = z.object({
  providerName: z.string().min(1, "Provider name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  town: z.string().min(1, "Town is required"),
  county: z.string().optional(),
  postcode: z.string().min(1, "Postcode is required"),
  category: z.string().optional(),
});

export const step3ClassSchema = z.object({
  className: z.string().min(1, "Class name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  ageGroupMin: z.coerce.number().min(0).max(216),
  ageGroupMax: z.coerce.number().min(0).max(216),
  category: z.string().min(1, "Category is required"),
  venue: z.string().min(1, "Venue is required"),
  dayOfWeek: z.string().min(1, "Day of week is required"),
  time: z.string().min(1, "Time is required"),
  price: z.string().optional(),
});

export const step4MediaSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  imageUrls: z.array(z.string().url()).optional(),
});

