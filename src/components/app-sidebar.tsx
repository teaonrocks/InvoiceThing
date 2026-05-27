import { Link, useLocation } from "@tanstack/react-router";
import { ClerkUserButton } from "@/components/clerk-user-button";
import {
	LayoutDashboard,
	Users,
	FileText,
	Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileAppShell } from "@/components/mobile-app-shell";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ label: "Clients", href: "/clients", icon: Users },
	{ label: "Invoices", href: "/invoices", icon: FileText },
	{ label: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<SidebarNav />
			<SidebarInset>
				<header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
					<SidebarTrigger />
					<span className="font-instrument flex-1 text-lg">
						Invoice<span className="text-brand">Thing</span>
					</span>
					<ClerkUserButton />
				</header>
				<MobileAppShell>{children}</MobileAppShell>
			</SidebarInset>
		</SidebarProvider>
	);
}

function SidebarNav() {
	const location = useLocation();
	const pathname = location.pathname;

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
				<Link
					to="/dashboard"
					className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
				>
					<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-brand text-xs font-bold text-brand-foreground">
						IT
					</div>
					<span className="font-instrument truncate text-lg group-data-[collapsible=icon]:hidden">
						Invoice<span className="text-brand">Thing</span>
					</span>
				</Link>
			</SidebarHeader>

			<SidebarSeparator />

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive =
									pathname === item.href ||
									(item.href !== "/dashboard" &&
										pathname.startsWith(item.href));
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											tooltip={item.label}
											className="rounded-none font-dm"
										>
											<Link
												to={item.href}
												preload={
													item.href === "/dashboard"
														? "intent"
														: undefined
												}
											>
												<item.icon
													className={isActive ? "shrink-0 text-brand" : "shrink-0"}
													strokeWidth={isActive ? 2 : 1.5}
												/>
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarSeparator />

			<SidebarFooter className="shrink-0 p-3 group-data-[collapsible=icon]:p-2">
				<div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
					<ClerkUserButton />
					<div className="group-data-[collapsible=icon]:hidden">
						<ThemeToggle />
					</div>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
