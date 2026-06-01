export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_DATA_ATTR = "sidebarState";

/** Inline script string — runs before React hydrates to sync cookie → html dataset. */
export const SIDEBAR_HYDRATION_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)/);if(m)document.documentElement.dataset.${SIDEBAR_DATA_ATTR}=m[1];}catch(e){}})();`;

export function getSidebarOpenFromDom(defaultOpen: boolean): boolean {
	if (typeof document === "undefined") return defaultOpen;

	const attr = document.documentElement.dataset[SIDEBAR_DATA_ATTR];
	if (attr === "true") return true;
	if (attr === "false") return false;

	const match = document.cookie.match(
		new RegExp(`(?:^|; )${SIDEBAR_COOKIE_NAME}=([^;]*)`),
	);
	if (match) return match[1] === "true";

	return defaultOpen;
}

export function persistSidebarOpen(open: boolean): void {
	if (typeof document === "undefined") return;
	document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${60 * 60 * 24 * 7}`;
	document.documentElement.dataset[SIDEBAR_DATA_ATTR] = String(open);
}
