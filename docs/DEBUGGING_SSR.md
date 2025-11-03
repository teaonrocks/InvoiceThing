# SSR Loader Debugging Guide

## Issue: Client-Side Fetches Still Occurring

Even with `CLERK_SECRET_KEY` set in Vercel, the SSR loader may not be fully active. Here's how to debug:

## Step 1: Check Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `CLERK_SECRET_KEY` is set for:
   - **Production** (if testing production)
   - **Preview** (if testing preview deployments)
   - **Development** (if testing locally)

3. **Important**: After adding/updating env vars, **redeploy** your application

## Step 2: Check Vercel Build Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the build logs for any errors related to:
   - `CLERK_SECRET_KEY`
   - Server-side authentication
   - Convex HTTP API calls

## Step 3: Check Runtime Logs

1. In Vercel Dashboard → Your Project → Functions
2. Check serverless function logs for:
   - `[SSR Loader]` debug messages
   - `[Server Auth]` error messages
   - Any authentication failures

## Step 4: Verify Request Context

TanStack Start may handle request context differently. The loader checks for:
- `context.request` (standard TanStack Start pattern)
- `globalThis.request` (fallback)

If neither is available, SSR will gracefully fall back to client-side hooks.

## Step 5: Test Locally with Vercel Environment

1. Pull Vercel environment variables:
   ```bash
   vercel env pull .env.local
   ```

2. Verify `.env.local` contains `CLERK_SECRET_KEY`

3. Restart dev server:
   ```bash
   pnpm dev
   ```

4. Check browser console for `[SSR Loader]` debug messages

## Step 6: Check Network Tab

In production/preview deployment:

1. Open browser DevTools → Network tab
2. Reload dashboard page
3. Look for:
   - **If SSR is working**: Fewer/no client-side Convex fetch requests
   - **If SSR is NOT working**: Still seeing 6 Convex fetch requests

## Common Issues

### Issue 1: Environment Variable Not Available at Runtime

**Symptoms**: `[Server Auth] CLERK_SECRET_KEY not found` in logs

**Solution**: 
- Ensure env var is set for the correct environment (Production/Preview)
- Redeploy after setting env vars
- Check Vercel's environment variable documentation

### Issue 2: Request Context Not Available

**Symptoms**: `[SSR Loader] No request available` in logs

**Solution**: 
- TanStack Start may not pass request in context by default
- May need to configure TanStack Start SSR handler
- Check TanStack Start documentation for SSR setup

### Issue 3: Clerk Authentication Failing

**Symptoms**: `[Server Auth] Authentication failed` in logs

**Solution**:
- Verify Clerk JWT template named "convex" exists
- Check user is signed in
- Verify Clerk secret key is correct

### Issue 4: Convex HTTP API Failing

**Symptoms**: `Convex query failed` errors

**Solution**:
- Check Convex URL is correct
- Verify Clerk JWT token is valid
- Check Convex deployment is accessible

## Next Steps

1. ✅ Check Vercel environment variables
2. ✅ Redeploy application
3. ✅ Check Vercel logs for debug messages
4. ✅ Verify request context is available
5. ⏳ If still not working, may need to configure TanStack Start SSR handler

## Alternative: Check TanStack Start SSR Configuration

TanStack Start may require additional configuration for SSR. Check if you need to:

1. Create `src/app/ssr.tsx` or similar SSR handler
2. Configure request context in TanStack Start plugin
3. Set up server-side entry point

See TanStack Start documentation for SSR setup.

