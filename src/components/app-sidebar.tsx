import { Link, useLocation } from "@tanstack/react-router";
import { UserButton } from "@clerk/clerk-react";
import {
	LayoutDashboard,
	Users,
	FileText,
	Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
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
					<span className="font-instrument text-lg">
						Invoice<span style={{ color: "#e63946" }}>Thing</span>
					</span>
				</header>
				{children}
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
					<div
						className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none text-xs font-bold text-white"
						style={{ backgroundColor: "#e63946" }}
					>
						IT
					</div>
					<span className="font-instrument text-lg truncate group-data-[collapsible=icon]:hidden">
						Invoice<span style={{ color: "#e63946" }}>Thing</span>
					</span>
				</Link>
			</SidebarHeader>

			<SidebarSeparator />

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="font-dm text-[10px] tracking-[0.2em] uppercase">
						Navigation
					</SidebarGroupLabel>
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
											className="font-dm rounded-none"
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
													className="shrink-0"
													style={
														isActive
															? { color: "#e63946" }
															: undefined
													}
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

			<SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
				<div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
					<UserButton afterSignOutUrl="/" />
					<div className="group-data-[collapsible=icon]:hidden">
						<ThemeToggle />
					</div>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
