# CI/CD Test Instructions

## Quick Test

### 1. Local Verification

```bash
# Install dependencies
npm ci

# Validate environment (requires .env.local)
npm run check-env

# Verify migrations
npm run migration:verify

# Build
npm run build

# Run tests
npm run test:unit
npm run test:e2e
```

### 2. Test Migration Verification

```bash
# Run migration verification script
npm run migration:verify

# Expected output:
# - Lists all migration files
# - Reports invalid filenames (if any)
# - Shows warnings for DROP statements
```

**Note:** Some migration files may have invalid naming. The CI will report these but continue (with `continue-on-error: true`).

### 3. Test CI Workflow Locally with Act

```bash
# Install act
brew install act  # macOS
# Windows: https://github.com/nektos/act/releases

# Run CI workflow
act push

# Run with environment variables
act push --env-file .env.local

# Run specific job
act -j ci
```

### 4. Test on GitHub

1. **Commit and push:**
   ```bash
   git add .github/workflows/
   git add scripts/migration-verify.mjs
   git add package.json README.md
   git commit -m "Add CI workflows"
   git push
   ```

2. **View workflow:**
   - Go to: https://github.com/01dashmike/parent-helper-app/actions
   - Click on latest workflow run
   - Review each step

3. **Check artifacts:**
   - Download build logs if build fails
   - Download migration logs if migrations fail
   - Download test reports if tests fail

## Expected Results

### ✅ Successful CI Run

All steps should complete:
- ✅ Dependencies install
- ✅ Environment validated
- ✅ Migrations verified (warnings OK)
- ✅ Build succeeds
- ✅ Tests pass (or skip gracefully)
- ✅ Artifacts uploaded

### ⚠️ Migration Warnings (Expected)

Some migration files don't match naming convention:
- `20250301001_create_provider_tables.sql` → Should be `20250301_create_provider_tables.sql`
- `add_trend_source_to_blog_posts.sql` → Should have date prefix

**Action:** These are warnings, not errors. CI continues with `continue-on-error: true`.

### ❌ Build Failures

If build fails:
1. Check build logs artifact
2. Run locally: `npm run build`
3. Check TypeScript: `npm run test:type`
4. Fix errors and push

## Verification Checklist

Before pushing:
- [ ] `npm run check-env` passes
- [ ] `npm run migration:verify` runs (warnings OK)
- [ ] `npm run build` succeeds
- [ ] `npm run test:unit` passes
- [ ] CI badge added to README

After pushing:
- [ ] GitHub Actions workflow runs
- [ ] CI badge shows correct status
- [ ] Artifacts available if needed

## Troubleshooting

### Migration Verification Fails

**Issue:** Invalid migration file names

**Fix:**
```bash
# Check which files are invalid
npm run migration:verify

# Rename files to match: YYYYMMDD_description.sql
# Example:
# mv 20250301001_create_provider_tables.sql 20250301_create_provider_tables.sql
```

### CI Fails on check-env

**Issue:** Missing .env.example or required variables

**Fix:**
1. Create `.env.example` with all required variables
2. Ensure `check-env.mjs` validates correctly
3. Test locally: `npm run check-env`

### Build Fails in CI

**Issue:** Build errors or missing dependencies

**Fix:**
```bash
# Test build locally
npm ci
npm run build

# Check for TypeScript errors
npm run test:type

# Verify all dependencies installed
npm ls
```

### Tests Fail

**Issue:** Unit or E2E tests failing

**Fix:**
```bash
# Run tests locally
npm run test:unit
npm run test:e2e

# Check test configuration
cat tests/config/playwright.config.ts

# Review test reports artifact
```

## CI Badge Status

The badge updates automatically:
- 🟢 **Green** = All checks passing
- 🔴 **Red** = One or more checks failing
- 🟡 **Yellow** = Workflow in progress

View badge at: https://github.com/01dashmike/parent-helper-app/actions/workflows/ci.yml

## Next Steps

1. ✅ Push changes to trigger CI
2. ✅ Monitor first workflow run
3. ✅ Fix any migration naming issues (optional)
4. ✅ Set up GitHub secrets (optional)
5. ✅ Add more tests as needed

---

**Ready to test!** Push your changes and watch the CI pipeline run.

