import { SignIn } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
		</div>
	);
}
