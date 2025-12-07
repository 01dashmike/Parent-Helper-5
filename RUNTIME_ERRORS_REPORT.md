# Runtime Errors Report
**Generated:** 2025-01-16  
**Environment:** Local development (pnpm dev)  
**Browser:** Chrome DevTools

## Critical Build Errors (Preventing App from Running)

### 1. Syntax Error in `lib/hooks/useToast.ts`
**File:** `lib/hooks/useToast.ts:33`  
**Error:** `Expected '>', got 'message'`  
**Stack Trace:**
```
Error:   x Expected '>', got 'message'
    ,-[/Users/mike/Documents/Parent-Helper-5/lib/hooks/useToast.ts:33:1]
 30 | 
 31 |   const ToastComponent: ReactElement | null = toast ? (
 32 |     <Toast
 33 |       message={toast.message}
    :       ^^^^^^^
 34 |       variant={toast.variant}
 35 |       duration={toast.duration}
 36 |       onClose={hideToast}
```
**Steps to Reproduce:**
1. Start dev server (`pnpm dev`)
2. Navigate to any page that imports `useToast` hook
3. Error appears in build output

**Impact:** Prevents entire app from compiling/running

---

### 2. Missing Import in `components/ui/Link.tsx`
**File:** `components/ui/Link.tsx:10`  
**Error:** `ReferenceError: forwardRef is not defined`  
**Stack Trace:**
```
ReferenceError: forwardRef is not defined
    at eval (webpack-internal:///(app-pages-browser)/./components/ui/Link.tsx:10:23)
    at (app-pages-browser)/./components/ui/Link.tsx
    at eval (webpack-internal:///(app-pages-browser)/./components/Header.tsx:7:77)
```
**Steps to Reproduce:**
1. Start dev server
2. Navigate to any page (homepage, search, etc.)
3. Error appears in console

**Impact:** Breaks all pages that use Link component (most pages)

---

### 3. Next.js 15 Async searchParams Issue in `app/page.tsx`
**File:** `app/page.tsx:26`  
**Error:** `Route "/" used searchParams.section. searchParams should be awaited before using its properties`  
**Stack Trace:**
```
Error: Route "/" used `searchParams.section`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at HomePage (rsc://React/Server/webpack-internal:///(rsc)/./app/page.tsx?0:27:33)
```
**Steps to Reproduce:**
1. Start dev server
2. Navigate to homepage (`/`)
3. Error appears in console

**Impact:** Breaks homepage functionality

---

### 4. HTML Structure Error in `app/error.tsx`
**File:** `app/error.tsx:8`  
**Error:** `In HTML, <html> cannot be a child of <body>. This will cause a hydration error.`  
**Stack Trace:**
```
In HTML, <html> cannot be a child of <body>. This will cause a hydration error.
  <body className="min-h-screen bg-cream text-charcoal antialiased">
    <Lazy>
    ...
      <ErrorBoundary errorComponent={function GlobalError} errorStyles={[...]} errorScripts={[...]}>
        <ErrorBoundaryHandler pathname="/" errorComponent={function GlobalError} ...>
          <HandleISRError>
          <GlobalError error={Error} reset={function}>
>           <html>
```
**Steps to Reproduce:**
1. Start dev server
2. Trigger an error that causes GlobalError to render
3. Hydration error appears

**Impact:** Causes hydration mismatches when error boundary renders

---

## Server Errors

### 5. 500 Internal Server Error on Homepage
**URL:** `http://localhost:3000/`  
**Error:** `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`  
**Steps to Reproduce:**
1. Start dev server
2. Navigate to `/`
3. Server returns 500 error

**Impact:** Homepage fails to load

---

### 6. 500 Internal Server Error on Search Page
**URL:** `http://localhost:3000/search`  
**Error:** `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`  
**Steps to Reproduce:**
1. Start dev server
2. Navigate to `/search`
3. Server returns 500 error

**Impact:** Search page fails to load

---

## Warnings (Non-Blocking)

### 7. Resource Preload Warnings
**URL:** Multiple pages  
**Warning:** `The resource [URL] was preloaded using link preload but not used within a few seconds from the window's load event`  
**Affected Resources:**
- `/_next/static/media/48b06d5330ded355-s.p.woff2`
- `/_next/static/css/app/layout.css`
- `/_next/static/media/deefe96905473cce-s.p.woff2`
- `/_next/static/media/77f91e25bf1d3915-s.p.woff2`
- `/_next/static/media/560dec559e6105dd-s.p.woff2`

**Steps to Reproduce:**
1. Navigate to any page
2. Check console warnings

**Impact:** Performance warning, doesn't break functionality

---

### 8. Fast Refresh Warning
**Warning:** `[Fast Refresh] performing full reload because your application had an unrecoverable error`  
**Steps to Reproduce:**
1. Make a code change that causes build error
2. Fast Refresh attempts to reload but fails

**Impact:** Development experience degradation

---

## Pages Not Tested (Due to Build Errors)

The following pages could not be tested due to critical build errors preventing the app from running:

- `/class/<any>` - Cannot navigate (app won't compile)
- `/provider/dashboard` - Cannot navigate (app won't compile)
- `/wallet` - Cannot navigate (app won't compile)
- `/book/<classId>` - Cannot navigate (app won't compile)
- `/blog/editor` or `/blog/new` - Cannot navigate (app won't compile)
- `/onboarding` - Cannot navigate (app won't compile)

---

## Summary

**Total Errors Found:** 8  
**Critical (Blocking):** 4  
**Server Errors:** 2  
**Warnings:** 2  

**Priority Fix Order:**
1. Fix `components/ui/Link.tsx` - Missing `forwardRef` import (blocks all pages)
2. Fix `lib/hooks/useToast.ts` - Syntax error (blocks compilation)
3. Fix `app/page.tsx` - Async searchParams (blocks homepage)
4. Fix `app/error.tsx` - HTML structure (causes hydration errors)

Once these are fixed, retest all pages to collect additional runtime errors.

