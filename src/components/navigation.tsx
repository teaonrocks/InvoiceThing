"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const routes = [
	{
		label: "Dashboard",
		href: "/dashboard",
	},
	{
		label: "Clients",
		href: "/clients",
	},
	{
		label: "Invoices",
		href: "/invoices",
	},
	{
		label: "Settings",
		href: "/settings",
	},
];

export function Navigation() {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		setIsMenuOpen(false);
	}, [pathname]);

	const handleToggleMenu = () => {
		setIsMenuOpen((open) => !open);
	};

	return (
		<header className="border-b">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-1 items-center gap-6">
						<Link href="/dashboard" className="text-2xl font-bold">
							InvoiceThing
						</Link>
						<nav className="hidden items-center gap-6 md:flex">
							{routes.map((route) => (
								<Link
									key={route.href}
									href={route.href}
									className={cn(
										"text-sm font-medium transition-colors hover:text-primary",
										pathname === route.href
											? "text-foreground"
											: "text-muted-foreground"
									)}
								>
									{route.label}
								</Link>
							))}
						</nav>
					</div>
					<div className="flex items-center gap-3 md:gap-4">
						<div className="hidden items-center gap-3 md:flex">
							<ThemeToggle />
							<UserButton afterSignOutUrl="/" />
						</div>
						<button
							type="button"
							className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
							onClick={handleToggleMenu}
							aria-expanded={isMenuOpen}
							aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
						>
							{isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</button>
					</div>
				</div>
			</div>
			{isMenuOpen ? (
				<div className="border-t bg-background md:hidden">
					<div className="container mx-auto px-4 py-4">
						<nav className="flex flex-col gap-2">
							{routes.map((route) => (
								<Link
									key={route.href}
									href={route.href}
									className={cn(
										"rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
										pathname === route.href
											? "bg-muted text-foreground"
											: "text-muted-foreground"
									)}
								>
									{route.label}
								</Link>
							))}
						</nav>
						<div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
							<ThemeToggle />
							<UserButton afterSignOutUrl="/" />
						</div>
					</div>
				</div>
			) : null}
		</header>
	);
}
