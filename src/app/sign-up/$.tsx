import { SignUp } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/sign-up/$")({
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<div className="swiss-grid flex min-h-screen flex-col text-foreground">
			<header className="flex items-center justify-between border-b-2 border-border-strong px-6 py-5 sm:px-10 lg:px-16">
				<Link to="/" className="font-instrument text-2xl transition-opacity hover:opacity-70">
					Invoice<span className="text-brand">Thing</span>
				</Link>
				<Link
					to="/"
					className="font-dm flex items-center gap-2 text-xs font-500 tracking-[0.15em] uppercase text-muted-foreground transition-colors hover:text-brand"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Home
				</Link>
			</header>

			<div className="flex flex-1">
				<div className="relative hidden flex-col justify-center border-r-2 border-border-strong px-16 lg:flex lg:w-1/2 xl:px-24">
					<div
						className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none font-instrument text-brand opacity-[0.06]"
						style={{
							fontSize: "clamp(10rem, 18vw, 14rem)",
							lineHeight: 0.85,
						}}
					>
						01
					</div>
					<div className="relative z-10">
						<p className="font-dm mb-6 text-xs font-600 tracking-[0.25em] uppercase text-brand">
							Get Started
						</p>
						<h1 className="font-instrument mb-6 text-5xl leading-[0.95] xl:text-6xl">
							Start your
							<br />
							<span className="italic">invoicing</span>
							<br />
							journey<span className="text-brand">.</span>
						</h1>
						<p className="font-dm max-w-sm text-sm font-300 leading-relaxed text-muted-foreground">
							Create your free account and send your first
							professional invoice in under two minutes.
						</p>
						<div className="mt-10 flex gap-10 border-t border-border/50 pt-6">
							{[
								{ num: "Free", label: "Forever" },
								{ num: "< 2min", label: "First Invoice" },
							].map((stat) => (
								<div key={stat.label}>
									<div className="font-instrument mb-1 text-2xl text-foreground">
										{stat.num}
									</div>
									<div className="font-dm text-[10px] font-500 tracking-[0.15em] uppercase text-muted-foreground">
										{stat.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
					<div className="mb-8 text-center lg:hidden">
						<p className="font-dm mb-3 text-xs font-600 tracking-[0.25em] uppercase text-brand">
							Get Started
						</p>
						<h1 className="font-instrument text-3xl leading-[0.95] sm:text-4xl">
							Create <span className="italic">account</span>
							<span className="text-brand">.</span>
						</h1>
					</div>
					<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
				</div>
			</div>
		</div>
	);
}
