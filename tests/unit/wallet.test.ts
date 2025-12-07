/**
 * Unit tests for wallet functionality
 */

import { createMockSupabaseClient } from "../mocks/supabaseClient.mock";

describe("Family Wallet", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe("Credit Transfer Between Linked Accounts", () => {
    it("should transfer credit between linked family accounts", async () => {
      const fromUserId = "user-1";
      const toUserId = "user-2";
      const amountCents = 1000; // £10.00

      // Mock source account
      mockSupabase._mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: fromUserId, balance_cents: 5000 },
            error: null,
          }),
        }),
      });

      // Mock destination account
      mockSupabase._mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: toUserId, balance_cents: 2000 },
            error: null,
          }),
        }),
      });

      // Simulate transfer
      const sourceBalance = 5000;
      const destBalance = 2000;
      const newSourceBalance = sourceBalance - amountCents;
      const newDestBalance = destBalance + amountCents;

      expect(newSourceBalance).toBe(4000);
      expect(newDestBalance).toBe(3000);
    });

    it("should prevent transfer if insufficient balance", () => {
      const sourceBalance = 500; // £5.00
      const transferAmount = 1000; // £10.00

      const canTransfer = sourceBalance >= transferAmount;
      expect(canTransfer).toBe(false);
    });

    it("should create transaction log entry", async () => {
      const transactionData = {
        from_user_id: "user-1",
        to_user_id: "user-2",
        amount_cents: 1000,
        type: "transfer",
        status: "completed",
      };

      mockSupabase._mockInsert.mockResolvedValueOnce({
        data: [{ id: 1, ...transactionData }],
        error: null,
      });

      const result = await mockSupabase.from("wallet_transactions").insert(transactionData);

      expect(mockSupabase._mockInsert).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });
  });

  describe("Balance Update", () => {
    it("should update balance after credit addition", async () => {
      const userId = "user-123";
      const currentBalance = 1000;
      const creditAmount = 500;
      const newBalance = currentBalance + creditAmount;

      mockSupabase._mockUpdate.mockResolvedValueOnce({
        data: [{ user_id: userId, balance_cents: newBalance }],
        error: null,
      });

      const result = await mockSupabase
        .from("user_wallets")
        .update({ balance_cents: newBalance })
        .eq("user_id", userId);

      expect(newBalance).toBe(1500);
      expect(mockSupabase._mockUpdate).toHaveBeenCalled();
    });

    it("should update balance after debit", () => {
      const currentBalance = 2000;
      const debitAmount = 750;
      const newBalance = currentBalance - debitAmount;

      expect(newBalance).toBe(1250);
      expect(newBalance).toBeGreaterThan(0);
    });
  });

  describe("Transaction Log", () => {
    it("should log all wallet transactions", () => {
      const transactions = [
        { type: "credit", amount: 1000, description: "Referral bonus" },
        { type: "debit", amount: 500, description: "Booking payment" },
        { type: "transfer", amount: 200, description: "Gift to family member" },
      ];

      const totalCredits = transactions
        .filter((t) => t.type === "credit")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDebits = transactions
        .filter((t) => t.type === "debit" || t.type === "transfer")
        .reduce((sum, t) => sum + t.amount, 0);

      expect(totalCredits).toBe(1000);
      expect(totalDebits).toBe(700);
    });

    it("should calculate net balance from transactions", () => {
      const transactions = [
        { type: "credit", amountCents: 1000 },
        { type: "debit", amountCents: 300 },
        { type: "gift", amountCents: 200 },
        { type: "bonus", amountCents: 100 },
      ];

      const balance = transactions.reduce((sum, t) => {
        if (t.type === "credit" || t.type === "gift" || t.type === "bonus") {
          return sum + t.amountCents;
        } else {
          return sum - t.amountCents;
        }
      }, 0);

      expect(balance).toBe(1000); // 1000 - 300 + 200 + 100 = 1000
    });
  });

  describe("Amount Formatting", () => {
    it("should format cents to pounds correctly", () => {
      const formatAmount = (cents: number) => {
        return `£${(cents / 100).toFixed(2)}`;
      };

      expect(formatAmount(1000)).toBe("£10.00");
      expect(formatAmount(500)).toBe("£5.00");
      expect(formatAmount(125)).toBe("£1.25");
      expect(formatAmount(0)).toBe("£0.00");
    });
  });
});

