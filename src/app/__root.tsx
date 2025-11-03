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
					<Outlet />
					<Toaster />
				</Providers>
				<Scripts />
			</body>
		</html>
	);
}
