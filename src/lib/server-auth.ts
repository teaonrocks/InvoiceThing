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

/**
 * Get Clerk JWT token for Convex authentication
 */
export async function getClerkToken(request?: Request): Promise<string | null> {
	if (!request) {
		return null;
	}

	const clerk = await getClerkBackend();
	if (!clerk) {
		return null;
	}

	try {
		const authState = await clerk.authenticateRequest(request);
		if (authState.isSignedIn) {
			// Get the session token from Clerk using the "convex" template
			const sessionToken = await authState.toAuth().getToken({
				template: "convex",
			});
			return sessionToken;
		}
	} catch (error) {
		console.error("Error getting Clerk token:", error);
	}

	return null;
}

/**
 * Call Convex HTTP API to execute a query
 */
export async function callConvexHttp(
	convexUrl: string,
	queryPath: string,
	args: Record<string, unknown>,
	authToken?: string | null
): Promise<any> {
	if (!authToken) {
		throw new Error("Authentication token required for Convex HTTP calls");
	}

	try {
		// Convex HTTP API endpoint format: {convexUrl}/api/query
		const url = `${convexUrl.replace(/\/$/, "")}/api/query`;
		
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({
				path: queryPath,
				args,
				format: "json",
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Convex query failed: ${response.status} ${response.statusText} - ${errorText}`
			);
		}

		const result = await response.json();
		// Convex returns { value: ... } for queries
		return result.value;
	} catch (error) {
		console.error("Error calling Convex HTTP:", error);
		throw error;
	}
}
