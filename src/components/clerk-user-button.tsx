import { UserButton } from "@clerk/clerk-react";

const userButtonAppearance = {
	elements: {
		userButtonPopoverRootBox: {
			pointerEvents: "auto" as const,
		},
		userButtonPopoverCard: {
			pointerEvents: "auto" as const,
		},
		organizationSwitcherPopoverRootBox: {
			pointerEvents: "auto" as const,
		},
	},
};

export function ClerkUserButton() {
	return (
		<UserButton
			afterSignOutUrl="/"
			appearance={userButtonAppearance}
		/>
	);
}
