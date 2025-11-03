# Quick Fix: Convex Authentication Error

## The Problem

Browser console shows:
```
Failed to authenticate: "No auth provider found matching the given token", check your server auth config
```

Plus WebSocket reconnection issues.

## Root Cause

`CLERK_JWT_ISSUER_DOMAIN` is missing in **Convex's environment variables**. This is separate from Vercel's environment variables - Convex needs its own configuration.

## Quick Fix

### Step 1: Get Your Clerk JWT Issuer Domain

1. Go to **Clerk Dashboard** → **API Keys**
2. Find the **JWT Issuer** field - it looks like:
   - `https://your-app-name.clerk.accounts.dev`

   OR check your Clerk publishable key - your app name is in it.

### Step 2: Set in Convex Dashboard

1. Go to **Convex Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `CLERK_JWT_ISSUER_DOMAIN`
   - **Value**: `https://your-app-name.clerk.accounts.dev` (replace with your actual domain)
3. Save

### Step 3: Redeploy/Restart Convex

**If using Convex production:**
```bash
pnpm convex deploy
```

**If using Convex dev locally:**
```bash
# Stop current Convex dev (Ctrl+C)
pnpm convex dev
```

### Step 4: Test

1. Reload your dashboard
2. Check browser console - authentication error should be gone
3. WebSocket connections should authenticate successfully

## Finding Your Clerk JWT Issuer Domain

The issuer domain format is: `https://[your-app-name].clerk.accounts.dev`

Where `[your-app-name]` is your Clerk application name (found in Clerk Dashboard → Settings → General).

## Alternative: Use Convex CLI

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-app-name.clerk.accounts.dev"
```

Then redeploy: `pnpm convex deploy`

## Verification

After setting `CLERK_JWT_ISSUER_DOMAIN`:
- ✅ No "No auth provider found" errors
- ✅ WebSocket connections authenticate successfully
- ✅ No WebSocket reconnection loops
- ✅ Convex queries work correctly

## Note

This is **different** from `CLERK_SECRET_KEY`:
- `CLERK_SECRET_KEY` → Set in **Vercel** (for SSR loader)
- `CLERK_JWT_ISSUER_DOMAIN` → Set in **Convex** (for authentication)

Both are needed for full functionality!

