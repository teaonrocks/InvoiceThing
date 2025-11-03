# Testing SSR Loader Implementation

## Current Status

The SSR loader implementation is complete and ready to test. However, there are a few setup steps needed:

## Setup Steps

### 1. Install @clerk/backend

There's currently a pnpm store issue. Try one of these approaches:

**Option A: Fix pnpm store**
```bash
pnpm install  # Reinstall dependencies with current pnpm version
pnpm add @clerk/backend
```

**Option B: Use npm instead**
```bash
npm install @clerk/backend
```

**Option C: Add to package.json manually**
Add `"@clerk/backend": "^2.x.x"` to dependencies, then run `pnpm install`

### 2. Set CLERK_SECRET_KEY Environment Variable

The secret key is needed for server-side authentication. You can:

**Option A: Create .env file** (not committed to git)
```env
CLERK_SECRET_KEY=sk_test_... # Your Clerk secret key
```

**Option B: Set in deployment environment**
- Vercel/Netlify: Add in dashboard settings
- Other platforms: Set as environment variable

**Note**: This is different from `VITE_CLERK_PUBLISHABLE_KEY`. The secret key is server-only.

### 3. Ensure Clerk JWT Template

1. Go to Clerk Dashboard → JWT Templates
2. Ensure template named `convex` exists
3. Template should include: `{ "userId": "{{user.id}}" }`

## Testing

### Test 1: Fallback Behavior (Works Now)

Even without `@clerk/backend`, the loader should gracefully fall back:

1. Start dev server: `pnpm dev`
2. Navigate to `/dashboard`
3. Check browser console - should see debug message: "Server-side data fetching failed, using client-side hooks"
4. Dashboard should work normally with client-side hooks

**Expected**: Dashboard loads with client-side hooks (current behavior)

### Test 2: Full SSR (After Setup)

Once `@clerk/backend` is installed and `CLERK_SECRET_KEY` is set:

1. Start dev server: `pnpm dev`
2. Navigate to `/dashboard`
3. Check Network tab:
   - ✅ Should see NO client-side Convex fetch requests (or fewer)
   - ✅ Data should appear immediately in HTML
4. Check server logs:
   - ✅ Should see successful Convex HTTP API calls
   - ✅ No error messages about auth

**Expected**: 
- Dashboard loads with data immediately
- No client-side fetch delays
- Faster initial render

### Test 3: Verify SSR Data

1. Open browser DevTools → Network tab
2. Reload dashboard page
3. Check the initial HTML response:
   - View page source
   - Search for dashboard data (stats, invoices)
   - Should see data pre-rendered in HTML

**Expected**: Dashboard data is in initial HTML response

## Troubleshooting

### SSR Not Working?

1. **Check @clerk/backend is installed:**
   ```bash
   # Check package.json or node_modules
   ls node_modules/@clerk/backend
   ```

2. **Check CLERK_SECRET_KEY is set:**
   ```bash
   # In server environment
   echo $CLERK_SECRET_KEY
   ```

3. **Check browser console for errors:**
   - Look for "Server-side data fetching failed" messages
   - Check for authentication errors

4. **Check server logs:**
   - Look for Convex HTTP API errors
   - Check for authentication failures

### Common Issues

**Issue**: "Server-side auth not available"
- **Solution**: Install `@clerk/backend` and set `CLERK_SECRET_KEY`

**Issue**: "Convex query failed"
- **Solution**: Check Convex URL is correct, verify Clerk JWT template

**Issue**: "Authentication token required"
- **Solution**: Ensure Clerk session is valid, check JWT template

**Issue**: Data still loading from client
- **Solution**: Check if SSR is actually running (server-side vs client-side)
- Verify TanStack Start SSR is enabled (should be by default)

## Next Steps

1. ✅ Code implementation complete
2. ⏳ Install `@clerk/backend`
3. ⏳ Set `CLERK_SECRET_KEY` environment variable
4. ⏳ Test with SSR enabled
5. ⏳ Monitor performance improvements

## Performance Monitoring

After SSR is working, monitor:

- **Network Tab**: Should see fewer/no Convex fetch requests
- **Lighthouse**: Improved TTI, LCP, FCP scores
- **Time to Interactive**: Should be significantly faster
- **Initial Load**: Data should appear immediately

The implementation is complete and ready for testing once the dependencies are installed!

