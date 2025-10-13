import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
	const { userId } = await auth();

	if (userId) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-8">
			<div className="space-y-8 text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					Welcome to InvoiceThing
				</h1>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
					The simple and powerful invoice management system for freelancers.
					Create professional invoices, track payments, and manage clients all
					in one place.
				</p>
				<div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
					<Link href="/sign-up">
						<Button size="lg" className="w-48 sm:w-auto">
							Get Started
						</Button>
					</Link>
					<Link href="/sign-in">
						<Button variant="outline" size="lg" className="w-48 sm:w-auto">
							Sign In
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
