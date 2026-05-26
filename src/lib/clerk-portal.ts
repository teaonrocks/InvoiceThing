/** Returns true when the event target is inside a Clerk portaled UI (e.g. UserButton menu). */
export function isClerkPortalTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(
		target.closest(
			"[class*='cl-userButtonPopover'], [class*='cl-modal'], [class*='cl-popover'], [data-clerk-portal]",
		),
	);
}
