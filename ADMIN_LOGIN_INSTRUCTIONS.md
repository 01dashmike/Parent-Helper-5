# Admin Login Instructions - For Mike

## How to Log In as Admin in Development

### Step-by-Step Process

1. **Set up your dev email in `.env.local`:**
   ```
   DEV_ADMIN_EMAIL=your@email.com
   ```

2. **Start your dev server:**
   ```bash
   pnpm dev
   ```

3. **Visit the account login page:**
   ```
   http://localhost:3000/account/login
   ```

4. **Enter your email** (the one matching `DEV_ADMIN_EMAIL`)

5. **Complete the authentication:**
   - If using OTP: Enter the 6-digit code from your email
   - If using magic link: Click the link in your email

6. **Visit the admin dashboard:**
   ```
   http://localhost:3000/admin
   ```
   - You should automatically have admin access (dev override)
   - You'll see the Admin Overview page with navigation links

## How Access Works

### Development Mode
- **Dev Override**: If `NODE_ENV=development` AND your logged-in email matches `DEV_ADMIN_EMAIL`, you automatically get admin access
- **No database role needed**: You don't need `users.role = 'admin'` in development
- **Just log in**: Use normal `/account/login` flow with your dev email

### Production Mode
- **Database role required**: Your Supabase user must have `users.role = 'admin'` in the database
- **No dev override**: `DEV_ADMIN_EMAIL` is ignored in production
- **Standard flow**: Log in via `/account/login`, then visit `/admin`

## What's Protected

All of these now use Supabase-based admin auth:

- **Pages**: All `/admin/*` pages
- **API Routes**: All `/api/admin/*` routes

## If You Get "Not Authorized"

- **In development**: Check that `DEV_ADMIN_EMAIL` matches your logged-in email exactly
- **In production**: Verify your user has `role = 'admin'` in the `users` table

## Removed Legacy System

- ❌ No more `ADMIN_SECRET` environment variable
- ❌ No more `ph_admin` cookie
- ❌ No more secret-based authentication
- ✅ All admin auth now uses Supabase sessions + role checks








