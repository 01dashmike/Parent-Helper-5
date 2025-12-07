import { z } from "zod";

/**
 * Zod schemas for wallet API validation
 */

export const walletTransactionTypeSchema = z.enum(["credit", "debit", "adjustment"]);

export const creditWalletSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  amount_cents: z.number().int().positive("Amount must be positive"),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export const debitWalletSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  amount_cents: z.number().int().positive("Amount must be positive"),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export const adjustmentWalletSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  amount_cents: z.number().int().refine((val) => val !== 0, "Amount cannot be zero"),
  reason: z.string().min(1, "Reason is required for adjustments"),
  metadata: z.record(z.any()).optional().default({}),
});

export type CreditWalletInput = z.infer<typeof creditWalletSchema>;
export type DebitWalletInput = z.infer<typeof debitWalletSchema>;
export type AdjustmentWalletInput = z.infer<typeof adjustmentWalletSchema>;

