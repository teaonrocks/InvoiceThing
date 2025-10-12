"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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

	return (
		<header className="border-b">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-8">
						<Link href="/dashboard" className="text-2xl font-bold">
							InvoiceThing
						</Link>
						<nav className="flex gap-6">
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
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<UserButton afterSignOutUrl="/" />
					</div>
				</div>
			</div>
		</header>
	);
}
