/// <reference types="vite/client" />

declare module "*.css?url" {
	const content: string;
	export default content;
}

// You might also need a general declaration for other CSS imports
declare module "*.css" {
	const content: Record<string, string>;
	export default content;
}

interface ImportMetaEnv {
	readonly VITE_CONVEX_URL?: string;
	readonly VITE_PUBLIC_CONVEX_URL?: string;
	readonly NEXT_PUBLIC_CONVEX_URL?: string;
	readonly VITE_PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
	readonly VITE_PUBLIC_POSTHOG_HOST?: string;
	readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
	readonly VITE_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
	readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
	readonly VITE_PUBLIC_CLERK_DOMAIN?: string;
	readonly VITE_CLERK_DOMAIN?: string;
	readonly VITE_PUBLIC_CLERK_SIGN_IN_URL?: string;
	readonly VITE_CLERK_SIGN_IN_URL?: string;
	readonly VITE_PUBLIC_CLERK_SIGN_UP_URL?: string;
	readonly VITE_CLERK_SIGN_UP_URL?: string;
	readonly VITE_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string;
	readonly VITE_CLERK_AFTER_SIGN_IN_URL?: string;
	readonly VITE_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string;
	readonly VITE_CLERK_AFTER_SIGN_UP_URL?: string;
}
