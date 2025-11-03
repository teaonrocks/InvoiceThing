import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AppDataProvider } from "@/context/app-data-provider";

// Get Convex URL from environment variables
// Vite uses VITE_ prefix, but we support multiple naming conventions
const convexUrl =
	import.meta.env.VITE_CONVEX_URL ||
	import.meta.env.VITE_PUBLIC_CONVEX_URL ||
	import.meta.env.NEXT_PUBLIC_CONVEX_URL ||
	"";

if (!convexUrl) {
	throw new Error(
		"Missing Convex URL. Please set VITE_CONVEX_URL, VITE_PUBLIC_CONVEX_URL, or NEXT_PUBLIC_CONVEX_URL in your environment variables."
	);
}

const convex = new ConvexReactClient(convexUrl);

// Get Clerk publishable key from environment variables
const clerkPubKey =
	import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
	import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY ||
	import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
	"";

if (!clerkPubKey) {
	throw new Error(
		"Missing Clerk publishable key. Please set VITE_CLERK_PUBLISHABLE_KEY, VITE_PUBLIC_CLERK_PUBLISHABLE_KEY, or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment variables."
	);
}

// Get Clerk domain from environment variables (optional, for custom domains)
// If not set, Clerk will use the default CDN from the publishable key
// Domain should be just the domain name (e.g., "clerk.invoicething.archerchua.com")
// not a full URL
const clerkDomainRaw =
	import.meta.env.VITE_PUBLIC_CLERK_DOMAIN ||
	import.meta.env.VITE_CLERK_DOMAIN ||
	undefined;

// Extract domain from URL if a full URL was provided
const clerkDomain = clerkDomainRaw
	? clerkDomainRaw.replace(/^https?:\/\//, "").split("/")[0]
	: undefined;

// Get Clerk URLs from environment variables (optional, defaults provided)
const signInUrl =
	import.meta.env.VITE_PUBLIC_CLERK_SIGN_IN_URL ||
	import.meta.env.VITE_CLERK_SIGN_IN_URL ||
	"/sign-in";
const signUpUrl =
	import.meta.env.VITE_PUBLIC_CLERK_SIGN_UP_URL ||
	import.meta.env.VITE_CLERK_SIGN_UP_URL ||
	"/sign-up";
const afterSignInUrl =
	import.meta.env.VITE_PUBLIC_CLERK_AFTER_SIGN_IN_URL ||
	import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL ||
	"/dashboard";
const afterSignUpUrl =
	import.meta.env.VITE_PUBLIC_CLERK_AFTER_SIGN_UP_URL ||
	import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL ||
	"/dashboard";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider
			publishableKey={clerkPubKey}
			{...(clerkDomain && { domain: clerkDomain })}
			signInUrl={signInUrl}
			signUpUrl={signUpUrl}
			afterSignInUrl={afterSignInUrl}
			afterSignUpUrl={afterSignUpUrl}
		>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				<AppDataProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
						suppressHydrationWarning
					>
						{children}
					</ThemeProvider>
				</AppDataProvider>
			</ConvexProviderWithClerk>
		</ClerkProvider>
	);
}
