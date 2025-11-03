/**
 * SSR Implementation Guide for Dashboard Loader
 * 
 * To fully enable SSR data fetching for the dashboard:
 * 
 * 1. Install @clerk/backend:
 *    pnpm add @clerk/backend
 * 
 * 2. Set environment variable:
 *    CLERK_SECRET_KEY=sk_test_... (or CLERK_SECRET_KEY in production)
 * 
 * 3. Ensure Convex HTTP API is accessible (Convex queries can be called via HTTP)
 * 
 * Current Implementation:
 * - Loader structure is in place
 * - Falls back gracefully to client-side hooks if SSR is not available
 * - Server-side auth utilities are prepared in src/lib/server-auth.ts
 * 
 * Next Steps for Full SSR:
 * - Implement Convex HTTP API calls in the loader
 * - Get Clerk JWT token from request cookies
 * - Pass token to Convex HTTP API for authenticated queries
 * - Return pre-fetched data to reduce initial loading time
 */

export const SSR_IMPLEMENTATION_NOTES = {
	status: "Partial - Structure ready, needs @clerk/backend and Convex HTTP API",
	requiredPackages: ["@clerk/backend"],
	requiredEnvVars: ["CLERK_SECRET_KEY"],
	nextSteps: [
		"Install @clerk/backend: pnpm add @clerk/backend",
		"Set CLERK_SECRET_KEY environment variable",
		"Implement Convex HTTP API calls in loader",
		"Test SSR data fetching",
	],
};

