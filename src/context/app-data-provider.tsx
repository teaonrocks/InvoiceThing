"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Doc } from "@/../convex/_generated/dataModel";

interface AppDataContextValue {
	clerkUser: ReturnType<typeof useUser>["user"];
	isClerkLoaded: boolean;
	currentUser: Doc<"users"> | null | undefined;
	invoices:
		| (Doc<"invoices"> & { client?: Doc<"clients"> | null })[]
		| undefined;
	clients: Doc<"clients">[] | undefined;
	isReady: boolean;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(
	undefined
);

export function AppDataProvider({ children }: { children: ReactNode }) {
	const { user, isLoaded } = useUser();

	const currentUser = useQuery(
		api.users.getCurrentUser,
		user?.id ? { clerkId: user.id } : "skip"
	);

	const invoices = useQuery(
		api.invoices.getByUser,
		currentUser?._id ? { userId: currentUser._id } : "skip"
	);

	const clients = useQuery(
		api.clients.getByUser,
		currentUser?._id ? { userId: currentUser._id } : "skip"
	);

	const value = useMemo<AppDataContextValue>(
		() => ({
			clerkUser: user ?? null,
			isClerkLoaded: isLoaded,
			currentUser: currentUser ?? undefined,
			invoices: invoices ?? undefined,
			clients: clients ?? undefined,
			isReady: Boolean(currentUser?._id),
		}),
		[clients, currentUser, invoices, isLoaded, user]
	);

	return (
		<AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
	);
}

export function useAppData() {
	const context = useContext(AppDataContext);
	if (!context) {
		throw new Error("useAppData must be used within an AppDataProvider");
	}
	return context;
}
