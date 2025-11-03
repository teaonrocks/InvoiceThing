# Quick SSR Testing Guide

## ✅ Prerequisites Check

- ✅ `@clerk/backend` is installed (v2.19.1)
- ⏳ `CLERK_SECRET_KEY` needs to be set for full SSR

## Testing Steps

### Test 1: Verify Fallback Behavior (Works Now)

1. **Start the dev server**:

   ```bash
   pnpm dev
   ```

2. **Open browser** and navigate to `http://localhost:3000/dashboard`

3. **Check Browser Console**:

   - Open DevTools → Console tab
   - Look for: `"Server-side data fetching failed, using client-side hooks"`
   - This means SSR gracefully fell back (expected if CLERK_SECRET_KEY not set)

4. **Verify Dashboard Works**:
   - Dashboard should load normally
   - Data appears via client-side hooks
   - No errors in console

**Expected Result**: Dashboard works with client-side hooks (graceful fallback)

### Test 2: Test with Full SSR (After Setting CLERK_SECRET_KEY)

1. **Set Environment Variable**:

   **Option A: Create `.env` file** (recommended for local dev):

   ```bash
   echo "CLERK_SECRET_KEY=sk_test_..." >> .env
   ```

   Replace `sk_test_...` with your actual Clerk secret key from Clerk Dashboard.

   **Option B: Export in terminal**:

   ```bash
   export CLERK_SECRET_KEY=sk_test_...
   pnpm dev
   ```

2. **Restart Dev Server**:

   ```bash
   # Stop current server (Ctrl+C)
   pnpm dev
   ```

3. **Test Dashboard**:

   - Navigate to `http://localhost:3000/dashboard`
   - Check Network tab in DevTools

4. **Verify SSR is Working**:

   **In Network Tab**:

   - ✅ Should see FEWER or NO client-side Convex fetch requests
   - ✅ Initial HTML should contain dashboard data
   - ✅ No "Server-side data fetching failed" message in console

   **In Browser Console**:

   - ✅ No error messages about authentication
   - ✅ Dashboard data appears immediately

   **View Page Source**:

   - Right-click → View Page Source
   - Search for dashboard content (e.g., "Total Earnings")
   - Should see pre-rendered data in HTML

**Expected Result**: Dashboard loads with data immediately, no client-side fetch delays

### Test 3: Performance Comparison

**Before SSR (current fallback)**:

- Network tab shows 6 Convex fetch requests
- Each request takes 263-350ms
- Total delay: ~1.5-2 seconds

**After SSR (when configured)**:

- Network tab shows 0 client-side Convex fetch requests
- Data appears immediately
- Total delay: ~0ms (data in HTML)

## Troubleshooting

### If SSR doesn't work:

1. **Check CLERK_SECRET_KEY is set**:

   ```bash
   echo $CLERK_SECRET_KEY
   # Should output your secret key
   ```

2. **Check Clerk JWT Template**:

   - Go to Clerk Dashboard → JWT Templates
   - Ensure template named `convex` exists
   - Template should include: `{ "userId": "{{user.id}}" }`

3. **Check Browser Console**:

   - Look for specific error messages
   - Check if authentication is working

4. **Check Server Logs**:
   - Look at terminal where `pnpm dev` is running
   - Check for Convex HTTP API errors
   - Look for authentication errors

### Common Issues:

**Issue**: "CLERK_SECRET_KEY not found"

- **Solution**: Set the environment variable (see Test 2)

**Issue**: "Convex query failed: 401 Unauthorized"

- **Solution**: Check Clerk JWT template is configured correctly

**Issue**: "Error getting Clerk token"

- **Solution**: Ensure user is signed in, check Clerk session

**Issue**: Still seeing client-side fetches

- **Solution**: Verify SSR is actually running (check server logs, verify environment)

## Next Steps

1. ✅ Code implementation complete
2. ✅ `@clerk/backend` installed
3. ⏳ Set `CLERK_SECRET_KEY` (if not already set)
4. ⏳ Test with SSR enabled
5. ⏳ Monitor performance improvements

## Performance Monitoring

After SSR is working, check:

- **Network Tab**: Fewer/no Convex fetch requests
- **Lighthouse**: Improved TTI, LCP scores
- **Initial Load**: Data appears immediately
- **Console**: No "Server-side data fetching failed" messages

The implementation is complete and ready! Just need to set `CLERK_SECRET_KEY` to enable full SSR.
