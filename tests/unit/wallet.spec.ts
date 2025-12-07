import { describe, it, expect } from "vitest";

describe("Family Wallet", () => {
  describe("Wallet Balance Calculation", () => {
    it("should calculate balance correctly from transactions", () => {
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

    it("should handle empty transactions", () => {
      const transactions: Array<{ type: string; amountCents: number }> = [];
      const balance = transactions.reduce((sum, t) => {
        if (t.type === "credit" || t.type === "gift" || t.type === "bonus") {
          return sum + t.amountCents;
        } else {
          return sum - t.amountCents;
        }
      }, 0);

      expect(balance).toBe(0);
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

