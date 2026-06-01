import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { ArrowUpRight } from "lucide-react";
import { motion, useInView } from "motion/react";

export const Route = createFileRoute("/")({
	ssr: true,
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
		<div className="swiss-grid min-h-screen overflow-x-hidden text-foreground">
			<motion.header
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
				className="flex flex-col gap-4 border-b-2 border-border-strong px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16"
			>
					<span className="font-instrument text-2xl">
						Invoice<span className="text-brand">Thing</span>
					</span>
					<div className="hidden flex-col gap-2 sm:flex sm:flex-row sm:items-center sm:gap-4">
						<Link to="/sign-in" className="sm:w-auto">
							<Button variant="plain" className="w-full text-sm font-500 sm:w-auto">
								Sign In
							</Button>
						</Link>
						<Link to="/sign-up" className="sm:w-auto">
							<Button variant="brand" className="w-full px-6 text-sm font-600 sm:w-auto">
								Register
							</Button>
						</Link>
					</div>
				</motion.header>

				<main>
					<section className="border-b-2 border-border-strong px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
						<div className="relative mx-auto max-w-7xl overflow-hidden">
							<motion.div
								className="number-accent pointer-events-none absolute right-[-20px] top-1/2 -translate-y-1/2 select-none font-instrument text-brand opacity-[0.08]"
								style={{
									fontSize: "clamp(8rem, 20vw, 16rem)",
									lineHeight: 0.85,
								}}
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
									className="font-dm mb-8 text-xs font-600 tracking-[0.25em] uppercase text-brand"
								>
									Built to solve my own problem
								</motion.p>
								<motion.h1
									custom={1}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="font-instrument text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.95] mb-8"
								>
									Lightweight invoicing
									<br />
									for your
									<br />
									<span className="italic">side gig</span>
									<span className="text-brand">.</span>
								</motion.h1>
								<motion.p
									custom={2}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="font-dm mb-10 max-w-lg text-base font-300 leading-relaxed text-muted-foreground sm:text-lg"
								>
									I freelance as a live sound engineer on weekends and needed a
									simple way to send and manage invoices. I couldn't find
									anything I liked—so I built a tool without the bloat or the
									subscription.
								</motion.p>
								<motion.div
									custom={3}
									variants={fadeUp}
									initial="hidden"
									animate="visible"
									className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6"
								>
									<Link to="/sign-up" className="sm:w-auto">
										<Button
											variant="brand"
											size="lg"
											className="group w-full px-8 py-6 text-sm font-600 sm:w-auto"
										>
											Get Started Free
											<ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
										</Button>
									</Link>
									<Link to="/sign-in">
										<Button
											variant="link"
											className="px-0 text-sm font-500 text-foreground underline decoration-1 underline-offset-4 hover:text-brand"
										>
											Already have an account?
										</Button>
									</Link>
								</motion.div>
							</div>
						</div>
					</section>

					<section className="border-b-2 border-border-strong px-6 sm:px-10 lg:px-16">
						<ScrollReveal>
							<div className="max-w-7xl mx-auto">
								<motion.div
									className="grid divide-y border-border-strong lg:grid-cols-4 lg:divide-x lg:divide-y-0"
									variants={staggerContainer}
									initial="hidden"
									whileInView="visible"
									viewport={{ once: true, margin: "-40px" }}
								>
									{[
										{ num: "Weekly", label: "Shipped & Used" },
										{ num: "$0", label: "No Subscription" },
										{ num: "Free", label: "Full Access" },
										{ num: "< 2min", label: "First Invoice" },
									].map((stat, i) => (
										<motion.div
											key={i}
											variants={staggerChild}
											className="py-10 lg:py-14 lg:px-8 first:lg:pl-0 last:lg:pr-0"
										>
											<div className="font-number mb-2 text-4xl text-foreground sm:text-5xl">
												{stat.num}
											</div>
											<div className="font-dm text-xs font-500 tracking-[0.15em] uppercase text-muted-foreground">
												{stat.label}
											</div>
										</motion.div>
									))}
								</motion.div>
							</div>
						</ScrollReveal>
					</section>

					<section className="border-b-2 border-border-strong px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
						<div className="max-w-7xl mx-auto relative overflow-hidden">
							<ScrollReveal>
								<motion.div
									className="number-accent pointer-events-none absolute right-[-20px] top-1/2 -translate-y-1/2 select-none font-instrument text-brand opacity-[0.08]"
									style={{
										fontSize: "clamp(8rem, 20vw, 16rem)",
										lineHeight: 0.85,
									}}
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
											<p className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-6 text-brand">
												Built for real use
											</p>
											<h2 className="font-instrument text-4xl sm:text-5xl leading-[0.95] mb-4">
												Features I
												<br />
												<span className="italic">actually needed</span>
												<span className="text-brand">.</span>
											</h2>
											<p className="font-dm max-w-md text-sm font-300 leading-relaxed text-muted-foreground">
												I use this every week, which keeps me shipping things
												that matter. What started as a tool for my audio work
												now helps dance instructors, production crews, and
												anyone who invoices occasionally.
											</p>
										</div>
										<motion.div
											className="space-y-0 divide-y divide-border/50"
											variants={staggerContainer}
											initial="hidden"
											whileInView="visible"
											viewport={{ once: true, margin: "-40px" }}
										>
											{[
												{
													num: "01",
													title: "Invoice Creation",
													desc: "Line items, taxes, and notes in clean, professional documents. Everything you need to get paid—nothing you don't.",
												},
												{
													num: "02",
													title: "Expense Reimbursements",
													desc: "The first version didn't have this. I built it because I needed it before I could send an invoice. Attach receipts and roll claims into your total.",
												},
												{
													num: "03",
													title: "Client Management",
													desc: "Keep client details and invoice history in one place. From production companies to students—whoever you bill.",
												},
												{
													num: "04",
													title: "Payment Tracking",
													desc: "See what's outstanding and what's been paid. Simple status tracking without dashboard overload.",
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
													<span className="font-instrument text-lg italic text-brand shrink-0 mt-0.5">
														{item.num}
													</span>
													<div>
														<h3 className="font-dm text-base font-600 mb-1 group-hover:text-brand transition-colors">
															{item.title}
														</h3>
														<p className="font-dm text-sm font-300 leading-relaxed text-muted-foreground">
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

					<section className="border-b-2 border-border-strong px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
						<div className="max-w-7xl mx-auto relative overflow-hidden">
							<ScrollReveal>
								<motion.div
									className="number-accent pointer-events-none absolute right-[-20px] top-1/2 -translate-y-1/2 select-none font-instrument text-brand opacity-[0.08]"
									style={{
										fontSize: "clamp(8rem, 20vw, 16rem)",
										lineHeight: 0.85,
									}}
									initial={{ opacity: 0 }}
									whileInView={{ opacity: 0.08 }}
									viewport={{ once: true }}
									transition={{ duration: 0.8 }}
								>
									03
								</motion.div>
								<div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
									<div>
										<p className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-6 text-brand">
											Pricing
										</p>
										<h2 className="font-instrument text-4xl sm:text-5xl leading-[0.95]">
											Simple<span className="text-brand">.</span>
											<br />
											<span className="italic">Free</span>
											<span className="text-brand">.</span>
										</h2>
									</div>
									<motion.div
										className="border-2 border-border-strong p-8 lg:p-10"
										whileHover={{
											boxShadow: "8px 8px 0px var(--brand)",
											x: -4,
											y: -4,
										}}
										transition={{
											duration: 0.3,
											ease: [0.16, 1, 0.3, 1],
										}}
									>
										<div className="flex items-baseline gap-2 mb-4">
											<span className="font-number text-6xl">$0</span>
											<span className="font-dm text-sm font-300 text-muted-foreground">
												/month
											</span>
										</div>
										<p className="font-dm mb-8 text-sm font-300 text-muted-foreground">
											I didn't want to pay for invoicing software I'd only use
											once in a while. Full access to every feature—no limits,
											no catches. Free while in beta.
										</p>
										<Link to="/sign-up">
											<Button
												variant="brand"
												size="lg"
												className="w-full py-6 text-sm font-600"
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
							<span className="font-dm text-[11px] font-500 text-muted-foreground/70">
								&copy; 2026 InvoiceThing
							</span>
							<span className="font-instrument text-sm italic text-muted-foreground/50">
								Built because I needed it<span className="text-brand">.</span>
							</span>
						</div>
					</motion.footer>
				</main>
		</div>
	);
}
