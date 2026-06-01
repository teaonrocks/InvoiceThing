import { type RefObject, useEffect, useState } from "react";

/** Resolve the window that owns a DOM node (portal / iframe safe). */
export function getOwnerWindow(node: Node | null | undefined): Window | undefined {
	if (!node) return undefined;
	return node.ownerDocument?.defaultView ?? undefined;
}

export function useOwnerWindow(
	ref: RefObject<Element | null>,
): Window | undefined {
	const [ownerWindow, setOwnerWindow] = useState<Window | undefined>(
		undefined,
	);

	useEffect(() => {
		setOwnerWindow(getOwnerWindow(ref.current));
	}, [ref]);

	return ownerWindow ?? (typeof window !== "undefined" ? window : undefined);
}
