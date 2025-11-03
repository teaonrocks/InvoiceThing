# Convex Authentication Error Fix

## Problem

Browser console shows:
```
Failed to authenticate: "No auth provider found matching the given token", check your server auth config
```

This error indicates that Convex cannot validate the Clerk JWT token because the `CLERK_JWT_ISSUER_DOMAIN` is not configured in Convex's environment.

## Root Cause

The `convex/auth.config.ts` file expects `CLERK_JWT_ISSUER_DOMAIN` to be set, but this environment variable needs to be configured in **Convex's environment**, not Vercel's environment.

## Solution

### Step 1: Get Your Clerk JWT Issuer Domain

1. Go to Clerk Dashboard → **API Keys**
2. Look for the **JWT Issuer** field - it should look like:
   - `https://your-app-name.clerk.accounts.dev` (for dev/test)
   - `https://your-app-name.clerk.accounts.dev` (for production)

Or check your Clerk publishable key - the issuer domain is embedded in it.

### Step 2: Set Environment Variable in Convex

**Option A: Using Convex Dashboard**
1. Go to Convex Dashboard → Your Project → Settings → Environment Variables
2. Add: `CLERK_JWT_ISSUER_DOMAIN` = `https://your-app-name.clerk.accounts.dev`
3. Replace `your-app-name` with your actual Clerk app name

**Option B: Using Convex CLI**
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-app-name.clerk.accounts.dev"
```

**Option C: Using `.env.local` for Convex**
If you're using Convex locally, add to `.env.local`:
```env
CLERK_JWT_ISSUER_DOMAIN=https://your-app-name.clerk.accounts.dev
```

### Step 3: Verify Configuration

After setting the environment variable:

1. **Redeploy Convex** (if using production):
   ```bash
   pnpm convex deploy
   ```

2. **Restart Convex dev** (if using locally):
   ```bash
   # Stop current Convex dev
   # Then restart:
   pnpm convex dev
   ```

3. **Test authentication**:
   - Reload your dashboard
   - Check browser console - the error should be gone
   - WebSocket connections should authenticate successfully

## How to Find Your Clerk JWT Issuer Domain

### Method 1: From Clerk Dashboard
1. Clerk Dashboard → **API Keys**
2. Look for **JWT Issuer** field
3. Copy the full URL (e.g., `https://your-app.clerk.accounts.dev`)

### Method 2: From Clerk Publishable Key
Your Clerk publishable key format is: `pk_test_...` or `pk_live_...`

The issuer domain is typically:
- `https://[your-app-name].clerk.accounts.dev` (for test/dev)
- `https://[your-app-name].clerk.accounts.dev` (for production)

You can find your app name in the Clerk Dashboard → Settings → General.

### Method 3: From JWT Token (Advanced)
Decode a Clerk JWT token and check the `iss` claim - this is your issuer domain.

## Verification

After setting `CLERK_JWT_ISSUER_DOMAIN`:

✅ Browser console should show no authentication errors
✅ WebSocket connections should authenticate successfully  
✅ Convex queries should work without authentication errors
✅ Dashboard should load data correctly

## Additional Notes

- `CLERK_JWT_ISSUER_DOMAIN` is needed in **Convex's environment**, not Vercel's
- This is different from `CLERK_SECRET_KEY` which is needed in Vercel for SSR
- The issuer domain format should be the full URL (e.g., `https://...`)
- Make sure the domain matches exactly what Clerk uses in your JWT tokens

## Troubleshooting

If still seeing errors after setting `CLERK_JWT_ISSUER_DOMAIN`:

1. **Check the domain format**: Should be full URL like `https://your-app.clerk.accounts.dev`
2. **Verify in Convex Dashboard**: Settings → Environment Variables
3. **Check Convex logs**: Look for authentication errors
4. **Verify Clerk JWT template**: Ensure template named "convex" exists and is active
5. **Test locally**: Set in `.env.local` and restart `pnpm convex dev`

