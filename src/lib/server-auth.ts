/**
 * Server-side authentication utilities for TanStack Start SSR
 * 
 * Requires:
 * - @clerk/backend package installed (optional, will gracefully degrade if not available)
 * - CLERK_SECRET_KEY environment variable set for server-side auth
 * 
 * Note: This file uses dynamic imports to avoid requiring @clerk/backend on client
 */

let clerkInstance: any = null;
let ClerkBackend: any = null;

async function getClerkBackend() {
	if (typeof window !== "undefined") {
		return null;
	}

	if (ClerkBackend === null) {
		try {
			const clerkModule = await import("@clerk/backend");
			ClerkBackend = clerkModule.Clerk;
		} catch (error) {
			ClerkBackend = false; // Mark as unavailable
			return null;
		}
	}

	if (ClerkBackend === false || !ClerkBackend) {
		return null;
	}

	if (!clerkInstance) {
		const secretKey =
			process.env.CLERK_SECRET_KEY ||
			process.env.VITE_CLERK_SECRET_KEY ||
			"";
		
		if (!secretKey) {
			return null;
		}

		clerkInstance = new ClerkBackend({ secretKey });
	}

	return clerkInstance;
}

export async function getServerAuth(request?: Request) {
	if (!request) {
		return null;
	}

	const clerk = await getClerkBackend();
	if (!clerk) {
		return null;
	}

	try {
		const authState = await clerk.authenticateRequest(request);
		if (authState.isSignedIn && authState.toAuth().userId) {
			return {
				userId: authState.toAuth().userId,
			};
		}
	} catch (error) {
		console.error("Error authenticating request:", error);
	}

	return null;
}

// Note: Convex HTTP API usage requires proper setup
// For now, this is a placeholder that can be implemented when needed
export async function callConvexHttp(
	convexUrl: string,
	query: string,
	args: Record<string, unknown>,
	authToken?: string
) {
	// TODO: Implement Convex HTTP API calls
	// This requires understanding Convex's HTTP API structure
	throw new Error("Convex HTTP API not yet implemented");
}

