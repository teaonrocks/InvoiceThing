import { SignIn } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/sign-in/$")({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div
			className="swiss-grid min-h-screen flex flex-col"
			style={{ color: "#111" }}
		>
			<header
				className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16"
				style={{ borderBottom: "2px solid #111" }}
			>
				<Link to="/" className="font-instrument text-2xl hover:opacity-70 transition-opacity">
					Invoice<span style={{ color: "#e63946" }}>Thing</span>
				</Link>
				<Link
					to="/"
					className="font-dm text-xs font-500 tracking-[0.15em] uppercase flex items-center gap-2 hover:text-[#e63946] transition-colors"
					style={{ color: "#999" }}
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Home
				</Link>
			</header>

			<div className="flex flex-1">
				<div
					className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24 relative"
					style={{ borderRight: "2px solid #111" }}
				>
					<div
						className="font-instrument select-none pointer-events-none absolute right-8 top-1/2 -translate-y-1/2"
						style={{
							fontSize: "clamp(10rem, 18vw, 14rem)",
							lineHeight: 0.85,
							color: "#e63946",
							opacity: 0.06,
						}}
					>
						&rarr;
					</div>
					<div className="relative z-10">
						<p
							className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-6"
							style={{ color: "#e63946" }}
						>
							Welcome Back
						</p>
						<h1 className="font-instrument text-5xl xl:text-6xl leading-[0.95] mb-6">
							Pick up
							<br />
							where you
							<br />
							<span className="italic">left off</span>
							<span style={{ color: "#e63946" }}>.</span>
						</h1>
						<p
							className="font-dm text-sm font-300 leading-relaxed max-w-sm"
							style={{ color: "#777" }}
						>
							Sign in to access your invoices, clients, and
							financial overview.
						</p>
					</div>
				</div>

				<div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-1/2">
					<div className="mb-8 lg:hidden text-center">
						<p
							className="font-dm text-xs font-600 tracking-[0.25em] uppercase mb-3"
							style={{ color: "#e63946" }}
						>
							Welcome Back
						</p>
						<h1 className="font-instrument text-3xl sm:text-4xl leading-[0.95]">
							Sign <span className="italic">in</span>
							<span style={{ color: "#e63946" }}>.</span>
						</h1>
					</div>
					<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
				</div>
			</div>
		</div>
	);
}
