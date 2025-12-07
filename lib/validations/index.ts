import { z } from "zod";

/**
 * Centralized validation schemas for all forms
 */

// ===== PROVIDER ONBOARDING =====
// Re-export from app/providers/schema.ts
export { registerLeadSchema } from "@/app/providers/schema";
export type { RegisterLeadInput } from "@/app/providers/schema";

// ===== CLASS CREATION =====
// Re-export from shared/schema.ts
export { listClassSchema } from "@/shared/schema";
export type { ListClassData } from "@/shared/schema";

// ===== REFERRALS =====
export const createReferralSchema = z.object({
  referred_email: z.string().email("Valid email address is required"),
  referred_name: z.string().min(1, "Name is required").max(200, "Name too long"),
  referral_type: z.enum(["member", "provider"], {
    errorMap: () => ({ message: "Referral type must be 'member' or 'provider'" }),
  }),
  message: z.string().max(500, "Message too long").optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;

// ===== WALLET ACTIONS =====
// Re-export from lib/validations/wallet.ts
export {
  creditWalletSchema,
  debitWalletSchema,
  adjustmentWalletSchema,
  walletTransactionTypeSchema,
} from "@/lib/validations/wallet";
export type {
  CreditWalletInput,
  DebitWalletInput,
  AdjustmentWalletInput,
} from "@/lib/validations/wallet";

// ===== BLOG GENERATE =====
export const blogGenerateSchema = z.object({
  topicId: z.number().int().positive("Topic ID must be a positive number").optional(),
  trendSource: z.string().max(100, "Trend source too long").optional(),
});

export type BlogGenerateInput = z.infer<typeof blogGenerateSchema>;

// ===== WALLET REFUND =====
export const walletRefundSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  amount_cents: z.number().int().positive("Amount must be positive"),
  user_id: z.string().uuid("Invalid user ID"),
  reason: z.string().max(500, "Reason too long").optional(),
});

export type WalletRefundInput = z.infer<typeof walletRefundSchema>;

// ===== WALLET CASHOUT =====
export const walletCashoutSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  amount_cents: z.number().int().positive("Amount must be positive"),
  reason: z.string().max(500, "Reason too long").optional(),
});

export type WalletCashoutInput = z.infer<typeof walletCashoutSchema>;

