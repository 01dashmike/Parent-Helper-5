/**
 * Shared formatting utilities for UI components
 * These are pure formatting functions with no side effects
 * 
 * Note: Date formatting is handled by lib/utils/date.ts
 * This file focuses on currency and number formatting
 */

/**
 * Format currency amount from cents to pounds
 * @param cents - Amount in pence/cents
 * @returns Formatted string like "£12.50"
 */
export function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}


