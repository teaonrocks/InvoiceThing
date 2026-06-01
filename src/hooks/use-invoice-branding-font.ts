import { useLayoutEffect, useRef } from "react";
import { getInvoiceFont } from "@/lib/invoice-branding";

export function useInvoiceBrandingFont(fontKey?: string) {
	const font = getInvoiceFont(fontKey);
	const linkRef = useRef<HTMLLinkElement | null>(null);

	useLayoutEffect(() => {
		const previousLink = linkRef.current;
		if (previousLink) {
			previousLink.remove();
			linkRef.current = null;
		}

		if (!fontKey) return;

		const linkId = `invoice-branding-font-${font.key}`;
		const existing = document.getElementById(linkId);
		const link =
			existing instanceof HTMLLinkElement
				? existing
				: (() => {
						const created = document.createElement("link");
						created.id = linkId;
						created.rel = "stylesheet";
						created.href = font.googleFontsUrl;
						document.head.appendChild(created);
						return created;
					})();

		link.disabled = false;
		linkRef.current = link;

		return () => {
			if (linkRef.current === link) {
				link.disabled = true;
				link.remove();
				linkRef.current = null;
			}
		};
	}, [font.googleFontsUrl, font.key, fontKey]);

	return font;
}
