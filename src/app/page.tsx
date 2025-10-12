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
		<div className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="max-w-4xl text-center space-y-8">
				<h1 className="text-5xl font-bold tracking-tight">
					Welcome to InvoiceThing
				</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					The simple and powerful invoice management system for freelancers.
					Create professional invoices, track payments, and manage clients all
					in one place.
				</p>
				<div className="flex gap-4 justify-center items-center pt-4">
					<Link href="/sign-up">
						<Button size="lg">Get Started</Button>
					</Link>
					<Link href="/sign-in">
						<Button variant="outline" size="lg">
							Sign In
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
