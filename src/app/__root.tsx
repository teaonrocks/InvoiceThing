import {
	Outlet,
	createRootRoute,
	HeadContent,
	Scripts,
	Link,
} from "@tanstack/react-router";
import appCss from "./globals.css?url";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/app-data-provider";
import { ArrowUpRight } from "lucide-react";

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
				{
					rel: "icon",
					type: "image/x-icon",
					href: "/favicon.ico",
				},
				{
					rel: "preconnect",
					href: "https://fonts.googleapis.com",
				},
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossOrigin: "anonymous",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap",
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
	notFoundComponent: NotFoundPage,
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

function LoadingScreen() {
	return (
		<div className="swiss-grid flex min-h-screen flex-col items-center justify-center text-foreground">
			<div className="text-center">
				<h2 className="font-instrument mb-8 text-3xl">
					Invoice<span className="text-brand">Thing</span>
				</h2>
				<div className="mx-auto h-0.5 w-48 overflow-hidden bg-muted">
					<div
						className="h-full w-full bg-brand"
						style={{
							animation: "loading-line 1.4s ease-in-out infinite",
						}}
					/>
				</div>
				<p className="font-dm mt-5 text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
					Loading
				</p>
			</div>
		</div>
	);
}

function NotFoundPage() {
	return (
		<div className="swiss-grid flex min-h-screen flex-col items-center justify-center px-6 text-foreground">
			<div className="relative text-center">
				<div
					className="font-instrument pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-brand opacity-[0.06]"
					style={{
						fontSize: "clamp(12rem, 30vw, 20rem)",
						lineHeight: 0.85,
					}}
				>
					404
				</div>
				<div className="relative z-10">
					<p className="font-dm mb-6 text-xs font-600 tracking-[0.25em] uppercase text-brand">
						Page Not Found
					</p>
					<h1 className="font-instrument mb-6 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
						Nothing
						<br />
						<span className="italic">here</span>
						<span className="text-brand">.</span>
					</h1>
					<p className="font-dm mx-auto mb-10 max-w-sm text-sm font-300 leading-relaxed text-muted-foreground">
						The page you're looking for doesn't exist or has been moved.
					</p>
					<Link to="/">
						<Button
							variant="brand"
							size="lg"
							className="group px-8 py-6 font-dm text-sm font-600"
						>
							Back to Home
							<ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
