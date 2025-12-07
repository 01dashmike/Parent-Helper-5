# Runtime Error Reproduction Scripts

This directory contains scripts to reproduce common runtime errors in the application.

## Scripts

### 1. `search-api-error.ts`
**Error**: Search API fetch failure  
**Scenario**: When `/api/search` returns an error (500, network failure)  
**Expected**: Error message displayed to user

### 2. `search-abort-error.ts`
**Error**: Search request abort  
**Scenario**: When search is aborted due to rapid filter changes  
**Expected**: AbortError handled gracefully, no error shown

### 3. `save-search-error.ts`
**Error**: Save search API failure  
**Scenario**: When `/api/search/save` fails (auth error, 500)  
**Expected**: Error message displayed to user

### 4. `url-sync-loop.ts`
**Error**: Infinite URL update loop  
**Scenario**: When filter changes cause repeated URL updates  
**Expected**: URL should update once, not repeatedly

### 5. `map-marker-error.ts`
**Error**: Map marker rendering failure  
**Scenario**: When Leaflet map fails to render markers  
**Expected**: Map handles errors gracefully

### 6. `browser-back-forward.ts`
**Error**: Browser navigation sync issues  
**Scenario**: When user clicks back/forward, filters don't sync  
**Expected**: Filters should reflect URL state correctly

## Running Scripts

### Prerequisites
- Node.js installed
- Playwright installed: `npm install -D @playwright/test playwright`
- Development server running: `npm run dev`

### Run Individual Script
```bash
npx tsx scripts/reproduce/<script-name>.ts
```

### Run All Scripts
```bash
for script in scripts/reproduce/*.ts; do
  if [ "$script" != "scripts/reproduce/README.md" ]; then
    echo "Running $script..."
    npx tsx "$script"
    echo ""
  fi
done
```

### With Custom Base URL
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000 npx tsx scripts/reproduce/search-api-error.ts
```

## Output

Each script outputs:
- `✅ REPRODUCED`: Error was successfully reproduced
- `❌ NOT REPRODUCED`: Error was not found (might be fixed)
- `⚠️ NOT REPRODUCED`: Edge case or expected behavior

## Adding New Scripts

1. Create a new `.ts` file in `scripts/reproduce/`
2. Use Playwright to navigate and interact with the page
3. Check for error conditions
4. Log "REPRODUCED" or "NOT REPRODUCED"
5. Update this README

## Notes

- Scripts run in headless mode by default
- All scripts use Playwright for browser automation
- Scripts are designed to be simple and focused on specific errors
- No E2E framework required - just Playwright navigation and assertions

