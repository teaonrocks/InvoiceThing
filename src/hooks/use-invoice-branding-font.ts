import { useEffect, useLayoutEffect, useRef } from "react";
import { getInvoiceFont } from "@/lib/invoice-branding";

export function useInvoiceBrandingFont(fontKey?: string) {
	const font = getInvoiceFont(fontKey);
	const linkRef = useRef<HTMLLinkElement | null>(null);

	useEffect(() => {
		if (!fontKey) return;

		const linkId = `invoice-branding-font-${font.key}`;
		const existing = document.getElementById(linkId);
		if (existing instanceof HTMLLinkElement) {
			linkRef.current = existing;
			return;
		}

		const link = document.createElement("link");
		link.id = linkId;
		link.rel = "stylesheet";
		link.href = font.googleFontsUrl;
		link.disabled = true;
		document.head.appendChild(link);
		linkRef.current = link;

		return () => {
			linkRef.current?.remove();
			linkRef.current = null;
		};
	}, [font.googleFontsUrl, font.key, fontKey]);

	useLayoutEffect(() => {
		const link = linkRef.current;
		if (!link) return;
		link.disabled = false;
		return () => {
			link.disabled = true;
		};
	}, [font.googleFontsUrl, font.key, fontKey]);

	return font;
}
