import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { ArrowUpRight } from "lucide-react";
import { motion, useInView } from "motion/react";

export const Route = createFileRoute("/")({
	ssr: true,
	loader: async ({ context }) => {
		let request: Request | undefined;

		if (context && typeof context === "object" && "request" in context) {
			request = (context as any).request as Request | undefined;
		}

		if (
			!request &&
			context &&
			typeof context === "object" &&
			"event" in context
		) {
			const event = (context as any).event;
			if (event && typeof event === "object" && "request" in event) {
				request = event.request as Request | undefined;
			}
		}

		if (!request && typeof globalThis !== "undefined") {
			const globalRequest = (globalThis as any).request;
			if (globalRequest instanceof Request) {
				request = globalRequest;
			}
		}

		if (typeof window === "undefined") {
			try {
				const { getClerkToken, callConvexHttp } = await import(
					"@/lib/server-auth"
				);

				if (!request) {
					return null;
				}

				const clerkToken = await getClerkToken(request);
				if (!clerkToken) {
					return null;
				}

				const convexUrl =
					process.env.VITE_CONVEX_URL ||
					process.env.VITE_PUBLIC_CONVEX_URL ||
					process.env.NEXT_PUBLIC_CONVEX_URL ||
					"";

				if (!convexUrl) {
					return null;
				}

				const { getServerAuth } = await import("@/lib/server-auth");
				const auth = await getServerAuth(request);
				if (!auth?.userId) {
					return null;
				}

				const convexUser = await callConvexHttp(
					convexUrl,
					"users/getCurrentUser",
					{ clerkId: auth.userId },
					clerkToken
				);

				return {
					convexUser: convexUser || null,
				};
			} catch (error) {
				console.debug(
					"Server-side data fetching failed, using client-side hooks:",
					error
				);
			}
		}

		return null;
	},
	component: Home,
});

const easeOut = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.08,
			duration: 0.5,
			ease: easeOut,
		},
	}),
};

const staggerContainer = {
	hidden: {},
	visible: {
		transition: { staggerChildren: 0.06 },
	},
};

const staggerChild = {
	hidden: { opacity: 0, y: 14 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.45, ease: easeOut },
	},
};

function ScrollReveal({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-60px" });

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 28 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
			transition={{ duration: 0.6, ease: easeOut }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

function Home() {
	const { isSignedIn } = useAuth();

	if (isSignedIn) {
		return <Navigate to="/dashboard" replace />;
	}

	return (
		<>
			<style>{`
				.red { color: #e63946; }
				.bg-red { background-color: #e63946; }
				.number-accent {
					font-family: 'Instrument Serif', serif;
					font-size: clamp(8rem, 20vw, 16rem);
					line-height: 0.85;
					color: #e63946;
					opacity: 0.08;
					position: absolute;
					right: -20px;
					top: 50%;
					transform: translateY(-50%);
					pointer-events: none;
					user-select: none;
				}
			`}</style>

			<div className="swiss-grid min-h-screen" style={{ color: "#111111" }}>
				<motion.header
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
					className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16"
					style={{ borderBottom: "2px solid #111" }}
				>
					<span className="font-instrument text-2xl">
						Invoice<span className="red">Thing</span>
					</span>
					<div className="flex items-center gap-4">
						<Link to="/sign-in">
							<Button
								variant="ghost"
								className="font-dm text-sm font-500 rounded-none hover:bg-transparent hover:text-[#e63946] transition-colors"
							>
								Sign In
							</Button>
						</Link>
						<Link to="/sign-up">
							<Button className="font-dm text-sm font-600 rounded-none bg-red hover:bg-red/90 text-white px-6">
								Register
							</Button>
						</Link>
					</div>
				</motion.header>

				<main>
					<section
						className="px-6 sm:px-10 lg:px-16 py-16 lg:py-24"
						style={{ borderBottom: "2px solid #111" }}
					>
						<div className="max-w-7xl mx-auto relative">
							<motion.div
								className="number-accent"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 0.08, scale: 1 }}
								transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
							>
								01
							</motion.div>
							<div className="relative z-10 max-w-3xl">
								<motion.p
									custom={0}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-8 red"
								>
									Invoice Management
								</motion.p>
								<motion.h1
									custom={1}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="font-instrument text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.95] mb-8"
								>
									Professional invoicing
									<br />
									for serious
									<br />
									<span className="italic">freelancers</span>
									<span className="red">.</span>
								</motion.h1>
								<motion.p
									custom={2}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="font-dm text-base sm:text-lg font-300 leading-relaxed max-w-lg mb-10"
									style={{ color: "#555" }}
								>
									No clutter. No bloat. A precise tool for creating invoices,
									managing clients, and tracking every payment.
								</motion.p>
								<motion.div
									custom={3}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="flex items-center gap-6"
								>
									<Link to="/sign-up">
										<Button
											size="lg"
											className="font-dm text-sm font-600 rounded-none bg-red hover:bg-red/90 text-white px-8 py-6 group"
										>
											Get Started Free
											<ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
										</Button>
									</Link>
									<Link to="/sign-in">
										<Button
											variant="link"
											className="font-dm text-sm font-500 text-[#111] underline underline-offset-4 decoration-1 hover:text-[#e63946] rounded-none px-0"
										>
											Already have an account?
										</Button>
									</Link>
								</motion.div>
							</div>
						</div>
					</section>

					<section
						className="px-6 sm:px-10 lg:px-16"
						style={{ borderBottom: "2px solid #111" }}
					>
						<ScrollReveal>
							<div className="max-w-7xl mx-auto">
								<motion.div
									className="grid lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x"
									style={{ borderColor: "#111" }}
									variants={staggerContainer}
									initial="hidden"
									whileInView="visible"
									viewport={{ once: true, margin: "-40px" }}
								>
									{[
										{ num: "2.4K+", label: "Active Users" },
										{ num: "$12M+", label: "Invoiced" },
										{ num: "98%", label: "Collection Rate" },
										{ num: "< 2min", label: "Avg. Invoice Time" },
									].map((stat, i) => (
										<motion.div
											key={i}
											variants={staggerChild}
											className="py-10 lg:py-14 lg:px-8 first:lg:pl-0 last:lg:pr-0"
										>
											<div
												className="font-instrument text-4xl sm:text-5xl mb-2"
												style={{ color: "#111" }}
											>
												{stat.num}
											</div>
											<div
												className="font-dm text-xs font-500 tracking-[0.15em] uppercase"
												style={{ color: "#999" }}
											>
												{stat.label}
											</div>
										</motion.div>
									))}
								</motion.div>
							</div>
						</ScrollReveal>
					</section>

					<section
						className="px-6 sm:px-10 lg:px-16 py-16 lg:py-24"
						style={{ borderBottom: "2px solid #111" }}
					>
						<div className="max-w-7xl mx-auto relative">
							<ScrollReveal>
								<motion.div
									className="number-accent"
									style={{ right: "-20px" }}
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 0.08 }}
									viewport={{ once: true }}
									transition={{ duration: 0.8 }}
								>
									02
								</motion.div>
								<div className="relative z-10">
									<div className="grid lg:grid-cols-2 gap-16">
										<div>
											<p className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-6 red">
												Capabilities
											</p>
											<h2 className="font-instrument text-4xl sm:text-5xl leading-[0.95] mb-4">
												Built with
												<br />
												<span className="italic">precision</span>
												<span className="red">.</span>
											</h2>
										</div>
										<motion.div
											className="space-y-0 divide-y"
											style={{ borderColor: "rgba(0,0,0,0.1)" }}
											variants={staggerContainer}
											initial="hidden"
											whileInView="visible"
											viewport={{ once: true, margin: "-40px" }}
										>
											{[
												{
													num: "01",
													title: "Invoice Creation",
													desc: "Line items, taxes, discounts, notes. Every detail accounted for in clean, professional documents.",
												},
												{
													num: "02",
													title: "Client Management",
													desc: "Organized client profiles with full invoice history, contact details, and payment records.",
												},
												{
													num: "03",
													title: "Payment Tracking",
													desc: "Real-time status updates. Know instantly when invoices are viewed, paid, or overdue.",
												},
												{
													num: "04",
													title: "Revenue Analytics",
													desc: "Clear visualizations of your earnings, outstanding amounts, and financial trends.",
												},
											].map((item) => (
												<motion.div
													key={item.num}
													variants={staggerChild}
													whileHover={{ x: 4 }}
													transition={{
														x: {
															duration: 0.25,
															ease: [0.16, 1, 0.3, 1],
														},
													}}
													className="py-6 flex items-start gap-6 cursor-default group"
												>
													<span className="font-instrument text-lg italic red shrink-0 mt-0.5">
														{item.num}
													</span>
													<div>
														<h3 className="font-dm text-base font-600 mb-1 group-hover:text-[#e63946] transition-colors">
															{item.title}
														</h3>
														<p
															className="font-dm text-sm font-300 leading-relaxed"
															style={{ color: "#777" }}
														>
															{item.desc}
														</p>
													</div>
												</motion.div>
											))}
										</motion.div>
									</div>
								</div>
							</ScrollReveal>
						</div>
					</section>

					<section
						className="px-6 sm:px-10 lg:px-16 py-16 lg:py-24"
						style={{ borderBottom: "2px solid #111" }}
					>
						<div className="max-w-7xl mx-auto relative">
							<ScrollReveal>
								<motion.div
									className="number-accent"
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 0.08 }}
									viewport={{ once: true }}
									transition={{ duration: 0.8 }}
								>
									03
								</motion.div>
								<div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
									<div>
										<p className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-6 red">
											Pricing
										</p>
										<h2 className="font-instrument text-4xl sm:text-5xl leading-[0.95]">
											Simple<span className="red">.</span>
											<br />
											<span className="italic">Free</span>
											<span className="red">.</span>
										</h2>
									</div>
									<motion.div
										className="p-8 lg:p-10"
										style={{ border: "2px solid #111" }}
										whileHover={{
											boxShadow: "8px 8px 0px #e63946",
											x: -4,
											y: -4,
										}}
										transition={{
											duration: 0.3,
											ease: [0.16, 1, 0.3, 1],
										}}
									>
										<div className="flex items-baseline gap-2 mb-4">
											<span className="font-instrument text-6xl">$0</span>
											<span
												className="font-dm text-sm font-300"
												style={{ color: "#999" }}
											>
												/month
											</span>
										</div>
										<p
											className="font-dm text-sm font-300 mb-8"
											style={{ color: "#777" }}
										>
											Full access to every feature. No limits. No catches. Free
											while in beta.
										</p>
										<Link to="/sign-up">
											<Button
												size="lg"
												className="font-dm text-sm font-600 rounded-none bg-red hover:bg-red/90 text-white w-full py-6"
											>
												Start Now
											</Button>
										</Link>
									</motion.div>
								</div>
							</ScrollReveal>
						</div>
					</section>

					<motion.footer
						className="px-6 sm:px-10 lg:px-16 py-6"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.1 }}
					>
						<div className="max-w-7xl mx-auto flex justify-between items-center">
							<span
								className="font-dm text-[11px] font-500"
								style={{ color: "#bbb" }}
							>
								&copy; 2026 InvoiceThing
							</span>
							<span
								className="font-instrument text-sm italic"
								style={{ color: "#ccc" }}
							>
								Designed with intent<span className="red">.</span>
							</span>
						</div>
					</motion.footer>
				</main>
			</div>
		</>
	);
}
