import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribeToMobileQuery(
	onStoreChange: () => void,
	ownerWindow: Window | undefined,
) {
	if (!ownerWindow) return () => {};
	const mql = ownerWindow.matchMedia(MOBILE_MEDIA_QUERY);
	mql.addEventListener("change", onStoreChange);
	return () => mql.removeEventListener("change", onStoreChange);
}

function getMobileSnapshot(ownerWindow: Window | undefined) {
	if (!ownerWindow) return false;
	return ownerWindow.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getServerMobileSnapshot() {
	return false;
}

export function useIsMobile(ownerWindow?: Window) {
	const win =
		ownerWindow ?? (typeof window !== "undefined" ? window : undefined);

	return React.useSyncExternalStore(
		(onStoreChange) => subscribeToMobileQuery(onStoreChange, win),
		() => getMobileSnapshot(win),
		getServerMobileSnapshot,
	);
}
