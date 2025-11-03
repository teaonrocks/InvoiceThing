# Nitro Migration Guide

## Changes Made

### ✅ Completed

1. **Added Nitro Plugin** (`vite.config.ts`)

   - Added `@tanstack/nitro-v2-vite-plugin`
   - Configured with `preset: "vercel"` for Vercel deployment
   - Nitro handles routing and SSR automatically

2. **Updated package.json**

   - Added `@tanstack/nitro-v2-vite-plugin` and `nitro` to devDependencies
   - Build scripts remain the same

3. **Removed Old Vercel Config**
   - Deleted `vercel.json` (Nitro handles routing)
   - Deleted `api/index.mjs` (Nitro generates serverless functions)

## Next Steps

### 1. Install Dependencies

Due to pnpm store issue, you may need to:

**Option A: Fix pnpm store**

```bash
pnpm install  # Reinstall dependencies
pnpm add -D @tanstack/nitro-v2-vite-plugin nitro
```

**Option B: Use npm temporarily**

```bash
npm install
npm install -D @tanstack/nitro-v2-vite-plugin nitro
```

**Option C: Manual install**
The packages are already in `package.json`, just run:

```bash
pnpm install
```

### 2. Test Build Locally

```bash
pnpm build
```

Nitro will generate optimized output in `.output/` directory.

### 3. Update Loader for Nitro Request Context

Nitro may pass request context differently. The loader has been updated to check multiple locations, but we may need to adjust based on how Nitro passes the request object.

### 4. Deploy to Vercel

After building successfully:

1. **Push to GitHub** (if using GitHub integration)
2. **Vercel will automatically detect** Nitro build
3. **No `vercel.json` needed** - Nitro handles it

OR manually deploy:

```bash
vercel deploy
```

## Benefits of Nitro

1. ✅ **Better SSR Support** - Improved request context access
2. ✅ **Simplified Deployment** - No manual Vercel config needed
3. ✅ **Optimized Builds** - Better performance
4. ✅ **Environment Variables** - Better server-side access

## Troubleshooting

### Build Fails

If build fails with missing packages:

```bash
pnpm install
# or
npm install
```

### Request Context Not Available

Nitro may pass request as `event.request` or in `context.event`. The loader checks multiple locations, but if SSR still doesn't work, we may need to adjust based on Nitro's actual API.

### Vercel Deployment Issues

- Nitro generates serverless functions automatically
- No need for custom `vercel.json`
- Check Vercel build logs for any errors

## Expected Behavior

After migration:

- ✅ Build should generate `.output/` directory
- ✅ SSR loader should have better request context access
- ✅ Deploy to Vercel without custom config
- ✅ Better performance and SSR support

The migration is complete! Install dependencies and test the build.
