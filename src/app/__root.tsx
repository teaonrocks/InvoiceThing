import {
	Outlet,
	createRootRoute,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import appCss from "./globals.css?url";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { useAppData } from "@/context/app-data-provider";
import { Spinner } from "@/components/ui/spinner";

export const Route = createRootRoute({
	head: () => {
		// Get Convex URL for preconnect (client-side)
		let convexDomain: string | null = null;
		if (typeof window !== "undefined") {
			const convexUrl =
				import.meta.env.VITE_CONVEX_URL ||
				import.meta.env.VITE_PUBLIC_CONVEX_URL ||
				import.meta.env.NEXT_PUBLIC_CONVEX_URL ||
				"";
			if (convexUrl) {
				try {
					convexDomain = new URL(convexUrl).origin;
				} catch {
					// Invalid URL, skip preconnect
				}
			}
		} else {
			// Server-side: try to get from env
			const convexUrl =
				process.env.VITE_CONVEX_URL ||
				process.env.VITE_PUBLIC_CONVEX_URL ||
				process.env.NEXT_PUBLIC_CONVEX_URL ||
				"";
			if (convexUrl) {
				try {
					convexDomain = new URL(convexUrl).origin;
				} catch {
					// Invalid URL, skip preconnect
				}
			}
		}

		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{ title: "InvoiceThing" },
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
				// Favicon link
				{
					rel: "icon",
					type: "image/x-icon",
					href: "/favicon.ico",
				},
				// Preconnect to Convex for faster API calls
				...(convexDomain
					? [
							{
								rel: "preconnect",
								href: convexDomain,
							},
							{
								rel: "dns-prefetch",
								href: convexDomain,
							},
						]
					: []),
				// Preconnect to Clerk CDN
				{
					rel: "preconnect",
					href: "https://cdn.clerk.com",
				},
				{
					rel: "dns-prefetch",
					href: "https://cdn.clerk.com",
				},
			],
		};
	},
	component: RootLayout,
	notFoundComponent: () => (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold">404 - Page Not Found</h1>
				<p className="text-muted-foreground mt-2">
					The page you're looking for doesn't exist.
				</p>
			</div>
		</div>
	),
});

function RootLayout() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<Providers>
					<AuthGate>
						<Outlet />
					</AuthGate>
					<Toaster />
				</Providers>
				<Scripts />
			</body>
		</html>
	);
}

// Gate component that waits for Clerk and Convex user to be ready
// This prevents flashing before user information is available
function AuthGate({ children }: { children: React.ReactNode }) {
	const { isClerkLoaded, isReady, clerkUser } = useAppData();

	// Wait until Clerk is loaded
	if (!isClerkLoaded) {
		return <LoadingScreen />;
	}

	// If user is authenticated (has Clerk user), wait for Convex user to be ready
	// If user is not authenticated, we can proceed immediately
	if (clerkUser && !isReady) {
		return <LoadingScreen />;
	}

	return <>{children}</>;
}

// Improved loading screen with better styling
function LoadingScreen() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-6 px-4">
				<div className="flex flex-col items-center gap-3">
					<div className="relative">
						<Spinner className="size-10 text-primary" />
						<div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
					</div>
					<div className="text-center space-y-1">
						<h2 className="text-xl font-semibold tracking-tight">
							InvoiceThing
						</h2>
						<p className="text-sm text-muted-foreground animate-pulse">
							Loading...
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
