import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/wellness/auth";
import WellnessLoginForm from "./_components/WellnessLoginForm";

export const metadata: Metadata = {
  title: "Login | Wellness | Parent Helper",
  description: "Sign in to access your saved wellness preferences and plans",
};

export default async function WellnessLoginPage() {
  // Redirect if already logged in
  const authenticated = await isAuthenticated();
  if (authenticated) {
    redirect("/wellness");
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Welcome Back
          </h1>
          <p className="text-charcoal/70">
            Sign in to access your saved wellness preferences and plans
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-soft">
          <WellnessLoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-charcoal/60">
          Don&apos;t have an account?{" "}
          <a href="/wellness/register" className="font-medium text-sage hover:underline">
            Create one now
          </a>
        </p>
      </div>
    </div>
  );
}
