"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { usePostHog } from "@posthog/react";

/**
 * Hook to sync the current Clerk user with Convex
 * This will create or update the user in the Convex database
 */
export function useStoreUser() {
	const { user } = useUser();
	const storeUser = useMutation(api.users.store);
	const posthog = usePostHog();

	useEffect(() => {
		if (!user) return;

		const syncUser = async () => {
			try {
				await storeUser({
					clerkId: user.id,
					email: user.emailAddresses[0]?.emailAddress ?? "",
					name: user.fullName ?? undefined,
					imageUrl: user.imageUrl ?? undefined,
				});

				posthog.identify(user.id, {
					email: user.emailAddresses[0]?.emailAddress,
					name: user.fullName ?? undefined,
				});
			} catch (error) {
				console.error("Error syncing user:", error);
			}
		};

		syncUser();
	}, [user, storeUser, posthog]);
}
