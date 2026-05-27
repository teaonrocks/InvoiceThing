const CLERK_PORTAL_SELECTOR = [
	"[class*='cl-userButton']",
	"[class*='cl-userProfile']",
	"[class*='cl-organizationSwitcher']",
	"[class*='cl-modal']",
	"[class*='cl-popover']",
	"[data-clerk-portal]",
].join(", ");

/** Returns true when the event target is inside a Clerk portaled UI (e.g. UserButton menu). */
export function isClerkPortalTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(target.closest(CLERK_PORTAL_SELECTOR));
}
