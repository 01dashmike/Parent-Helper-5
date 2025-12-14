# Root Cause Analysis: `/provider/dev` Infinite POST Loop

## Summary

The infinite POST loop to `/provider/dev` is caused by a **stale Next.js server action manifest** and cached client-side JavaScript bundles that still reference a deleted server action.

## Root Cause Explained

### 1. What Happened

When `app/provider/dev/page.tsx` was renamed to `page.broken.tsx`, the route was disabled, but:
- The server action `getDashboardDataForDev` in `actions.ts` was still registered
- Next.js generated a server action ID: `406f670c70257698565c0ddb555506e374d16d1a5f`
- This ID was cached in `.next/server/app-paths-manifest.json`
- Client JavaScript bundles were cached with references to this action ID
- `DevDashboardClient.tsx` was calling this action via `useRetryFetch` hook

### 2. Why It Loops

The `useRetryFetch` hook has retry logic (3 retries with exponential backoff). When:
1. Client tries to call server action with ID `406f670c70257698565c0ddb555506e374d16d1a5f`
2. Next.js looks it up in the manifest → **Not found** (route disabled)
3. Returns 404 error
4. `useRetryFetch` retries → loops infinitely

### 3. Next.js Server Action Manifest System

Next.js uses a manifest system to map server action IDs to actual functions:
- **Build time**: Scans all `"use server"` files and generates unique IDs
- **Runtime**: Client sends action ID, server looks it up in manifest
- **Problem**: If you delete/rename routes but keep actions, manifest gets out of sync
- **Caching**: Both `.next` build cache and browser JavaScript bundles cache these IDs

## Files That Were Causing Issues

### Deleted Files (Fixed)
- ✅ `app/provider/dev/actions.ts` - Server action file (DELETED)
- ✅ `app/provider/dev/DevDashboardClient.tsx` - Client component calling action (DELETED)

### Remaining Files (Safe - Disabled)
- ✅ `app/provider/dev/page.broken.tsx` - Disabled route (not recognized by Next.js)

## Why Clearing Caches is Critical

1. **`.next/` directory**: Contains the server action manifest with stale IDs
2. **Browser cache**: JavaScript bundles have the old action ID hardcoded
3. **Node modules cache**: May have cached build artifacts

After clearing caches and restarting, Next.js will rebuild the manifest without the deleted action, and fresh JavaScript bundles won't reference it.








