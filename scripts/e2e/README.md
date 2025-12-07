# E2E Test Scripts

End-to-end test scripts for critical user flows in Parent Helper.

## Test Scripts

1. **1-landing-search-class-book.mjs** - Landing → Search → Class → Book
2. **2-provider-login-dashboard-create-class.mjs** - Provider login → Dashboard → Create class
3. **3-user-login-wallet-transactions.mjs** - User login → Wallet → Transaction history
4. **4-user-recommendations-class-book.mjs** - User → Recommendations → Class → Book
5. **5-provider-payouts-transactions.mjs** - Provider → Payouts → Transactions
6. **6-referral-code-landing-signup.mjs** - Referral code → Landing → Signup
7. **7-blog-generate-edit-publish.mjs** - Blog → Generate → Edit → Publish
8. **8-ai-coach-ask-question.mjs** - AI Coach → Ask a question

## Running Tests

### Individual Test
```bash
node scripts/e2e/1-landing-search-class-book.mjs
```

### All Tests
```bash
for script in scripts/e2e/*.mjs; do
  echo "Running $script..."
  node "$script"
  echo ""
done
```

### With Environment Variables
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 \
TEST_USER_EMAIL=user@test.com \
TEST_USER_PASSWORD=password123 \
TEST_PROVIDER_EMAIL=provider@test.com \
TEST_PROVIDER_PASSWORD=password123 \
ADMIN_SECRET=your_admin_secret \
node scripts/e2e/1-landing-search-class-book.mjs
```

## Environment Variables

- `PLAYWRIGHT_BASE_URL` - Base URL for the application (default: `http://localhost:3000`)
- `TEST_USER_EMAIL` - Test user email for login tests
- `TEST_USER_PASSWORD` - Test user password
- `TEST_PROVIDER_EMAIL` - Test provider email
- `TEST_PROVIDER_PASSWORD` - Test provider password
- `ADMIN_SECRET` - Admin secret for blog tests
- `TEST_REFERRAL_CODE` - Referral code for referral tests

## Prerequisites

1. Application must be running (or set `PLAYWRIGHT_BASE_URL` to production URL)
2. Playwright installed (`npm install` should have installed it)
3. Test user/provider accounts created (for login tests)
4. Admin access configured (for blog tests)

## Screenshots

Failure screenshots are saved to `scripts/e2e/screenshots/` directory.

## Notes

- Tests run with `headless: false` by default for visual debugging
- Tests include error handling and continue testing even if some steps fail
- Some tests may show warnings for optional features or authentication requirements
- Tests are designed to be non-destructive (e.g., referral test doesn't actually create accounts)

