# Legacy Classes Mock System - Deprecation Record

**Date**: November 19, 2025  
**Phase**: Post-refactor cleanup (Phase 2)

## Summary

Removed legacy mock classes system and deprecated routes that have been superseded by the production search and personalization features.

## Files Removed

### 1. `app/api/classes/route.js`
- **Purpose**: Legacy mock API endpoint that returned static class data
- **Status**: Was returning HTTP 410 Gone with deprecation message
- **Superseded by**: `/api/search` with Supabase queries and relational joins
- **Reason for removal**: No direct calls found; child routes (`/api/classes/[id]/`, `/api/classes/questions/`) function independently

### 2. `app/classes/[town]/page.jsx`
- **Purpose**: Legacy page showing classes by town using mock data
- **Status**: Was redirecting to `/search?town={town}`
- **Superseded by**: Real search page at `/search` with full filtering and personalization
- **Reason for removal**: Redirect-only page with no unique functionality; direct links updated

### 3. `scripts/legacy/mock-classes.js`
- **Purpose**: Mock data generator with static class listings for London, Manchester, Bristol
- **Status**: Not imported anywhere in the application
- **Superseded by**: Real data from Supabase `classes` table
- **Reason for removal**: No references found in app code, tests, or package.json scripts

## Migration Notes

- All links to `/classes/[town]` have been updated to point directly to `/search?town=...`
- The `/api/search` endpoint now handles all class discovery with proper filters, geospatial queries, and personalization
- Child routes under `/api/classes/` (like `/api/classes/[id]/questions/`) remain fully functional

## Verification

- ✅ No imports of `mock-classes.js` found
- ✅ No direct fetch calls to `/api/classes` root endpoint
- ✅ Child API routes continue to function
- ✅ All UI links updated to use real search

