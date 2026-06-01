/**
 * Request-scoped server data accessors.
 * Safe to return from TanStack route loaders — never includes auth tokens.
 */
import { cache } from "react";
import {
	callConvexHttp,
	getClerkToken,
	getServerAuth,
} from "@/lib/server-auth";

export type SafeConvexUser = {
	_id: string;
	clerkId?: string;
	[key: string]: unknown;
} | null;

export type HomeLoaderData = {
	convexUser: SafeConvexUser;
};

export type DashboardLoaderData = {
	stats: Record<string, unknown> | null;
	invoices: unknown[];
	convexUser: SafeConvexUser;
};

function getConvexUrl(): string {
	return (
		process.env.VITE_CONVEX_URL ||
		process.env.VITE_PUBLIC_CONVEX_URL ||
		process.env.NEXT_PUBLIC_CONVEX_URL ||
		""
	);
}

export function getRequestFromLoaderContext(context: unknown): Request | undefined {
	if (context && typeof context === "object" && "request" in context) {
		return (context as { request?: Request }).request;
	}

	if (context && typeof context === "object" && "event" in context) {
		const event = (context as { event?: { request?: Request } }).event;
		if (event && typeof event === "object" && "request" in event) {
			return event.request;
		}
	}

	if (typeof globalThis !== "undefined") {
		const globalRequest = (globalThis as { request?: Request }).request;
		if (globalRequest instanceof Request) {
			return globalRequest;
		}
	}

	return undefined;
}

export const getRequestClerkToken = cache(async (request: Request) => {
	return getClerkToken(request);
});

export const getRequestAuth = cache(async (request: Request) => {
	return getServerAuth(request);
});

export const getRequestConvexUser = cache(async (request: Request) => {
	const convexUrl = getConvexUrl();
	if (!convexUrl) return null;

	const clerkToken = await getRequestClerkToken(request);
	if (!clerkToken) return null;

	const auth = await getRequestAuth(request);
	if (!auth?.userId) return null;

	return callConvexHttp(
		convexUrl,
		"users/getCurrentUser",
		{ clerkId: auth.userId },
		clerkToken,
	);
});

export const getHomeLoaderData = cache(
	async (request: Request): Promise<HomeLoaderData | null> => {
		if (typeof window !== "undefined") return null;

		try {
			const convexUser = await getRequestConvexUser(request);
			if (!convexUser) return null;
			return { convexUser: convexUser || null };
		} catch (error) {
			console.debug(
				"Server-side home loader failed, using client-side hooks:",
				error,
			);
			return null;
		}
	},
);

export const getDashboardLoaderData = cache(
	async (request: Request): Promise<DashboardLoaderData | null> => {
		if (typeof window !== "undefined") return null;

		try {
			const convexUrl = getConvexUrl();
			if (!convexUrl) return null;

			const clerkToken = await getRequestClerkToken(request);
			if (!clerkToken) return null;

			const convexUser = await getRequestConvexUser(request);
			if (!convexUser?._id) return null;

			const [stats, invoices] = await Promise.all([
				callConvexHttp(
					convexUrl,
					"invoices/getStats",
					{ userId: convexUser._id },
					clerkToken,
				),
				callConvexHttp(
					convexUrl,
					"invoices/getByUser",
					{ userId: convexUser._id },
					clerkToken,
				),
			]);

			return {
				stats: stats ?? null,
				invoices: invoices || [],
				convexUser,
			};
		} catch (error) {
			console.debug(
				"Server-side dashboard loader failed, using client-side hooks:",
				error,
			);
			return null;
		}
	},
);
