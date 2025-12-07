/**
 * Form Validation Utilities
 * 
 * Centralized form validation schemas and utilities for RHF + Zod integration
 */

// Re-export all validation schemas
export * from "@/lib/validations/index";
export * from "@/lib/validations/wallet";

// Re-export validation utilities
export * from "@/lib/validation/api-validation";

// Form validation helpers
export { validateApiResponse, validateArrayResponse } from "@/lib/validation/api-validation";
export type { ValidationResult } from "@/lib/validation/api-validation";





