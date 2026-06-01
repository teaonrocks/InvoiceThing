import { useCallback, useState } from "react";

/** Resolve the window that owns a DOM node (portal / iframe safe). */
export function getOwnerWindow(
	node: Node | null | undefined,
): Window | undefined {
	if (!node) return undefined;
	return node.ownerDocument?.defaultView ?? undefined;
}

export function useOwnerWindowRef(): {
	ref: (node: Element | null) => void;
	ownerWindow: Window | undefined;
} {
	const [ownerWindow, setOwnerWindow] = useState<Window | undefined>(
		undefined,
	);

	const ref = useCallback((node: Element | null) => {
		setOwnerWindow(getOwnerWindow(node));
	}, []);

	return {
		ref,
		ownerWindow:
			ownerWindow ?? (typeof window !== "undefined" ? window : undefined),
	};
}
