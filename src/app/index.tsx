import { Button } from "@/components/ui/button";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";

export const Route = createFileRoute("/")({
	// Enable SSR for this route
	ssr: true,
	// Loader runs on server during SSR and on client during navigation
	loader: async ({ context }) => {
		// Try to get request from context (if available in SSR)
		// Nitro passes request as event.request in some setups
		let request: Request | undefined;

		// Check context.request (standard TanStack Start)
		if (context && typeof context === "object" && "request" in context) {
			request = (context as any).request as Request | undefined;
		}

		// Check context.event.request (Nitro format)
		if (
			!request &&
			context &&
			typeof context === "object" &&
			"event" in context
		) {
			const event = (context as any).event;
			if (event && typeof event === "object" && "request" in event) {
				request = event.request as Request | undefined;
			}
		}

		// Fallback: check globalThis (for some SSR setups)
		if (!request && typeof globalThis !== "undefined") {
			const globalRequest = (globalThis as any).request;
			if (globalRequest instanceof Request) {
				request = globalRequest;
			}
		}

		// Check if we're on the server
		if (typeof window === "undefined") {
			try {
				// Import server-side utilities
				const { getClerkToken, callConvexHttp } = await import(
					"@/lib/server-auth"
				);

				// If no request, we can't authenticate - fall back to client-side
				if (!request) {
					return null;
				}

				// Get Clerk user ID and JWT token
				const clerkToken = await getClerkToken(request);
				if (!clerkToken) {
					// Not authenticated, return null to use client-side hooks
					return null;
				}

				// Get Convex URL from environment
				const convexUrl =
					process.env.VITE_CONVEX_URL ||
					process.env.VITE_PUBLIC_CONVEX_URL ||
					process.env.NEXT_PUBLIC_CONVEX_URL ||
					"";

				if (!convexUrl) {
					return null;
				}

				// Get Clerk user ID for Convex queries
				const { getServerAuth } = await import("@/lib/server-auth");
				const auth = await getServerAuth(request);
				if (!auth?.userId) {
					return null;
				}

				// Fetch Convex user by Clerk ID
				const convexUser = await callConvexHttp(
					convexUrl,
					"users/getCurrentUser",
					{ clerkId: auth.userId },
					clerkToken
				);

				// Return pre-fetched data (even if user is null, we know auth state)
				return {
					convexUser: convexUser || null,
				};
			} catch (error) {
				// Server-side auth/data fetching failed
				// Fall back to client-side hooks
				console.debug(
					"Server-side data fetching failed, using client-side hooks:",
					error
				);
			}
		}

		// Return null to let existing hooks handle data fetching
		// This ensures the component still works even without SSR
		return null;
	},
	component: Home,
});

function Home() {
	const { isSignedIn } = useAuth();

	if (isSignedIn) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-8">
			<div className="space-y-8 text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					Welcome to InvoiceThing
				</h1>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
					The simple and powerful invoice management system for freelancers.
					Create professional invoices, track payments, and manage clients all
					in one place.
				</p>
				<div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
					<Link to="/sign-up">
						<Button size="lg" className="w-48 sm:w-auto">
							Get Started
						</Button>
					</Link>
					<Link to="/sign-in">
						<Button variant="outline" size="lg" className="w-48 sm:w-auto">
							Sign In
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

