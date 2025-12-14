import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/wellness/auth";
import WellnessRegisterForm from "./_components/WellnessRegisterForm";

export const metadata: Metadata = {
  title: "Create Account | Wellness | Parent Helper",
  description: "Create an account to save your wellness preferences and track your progress",
};

export default async function WellnessRegisterPage() {
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
            Create Your Account
          </h1>
          <p className="text-charcoal/70">
            Save your preferences and get personalized wellness support
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-soft">
          <WellnessRegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-charcoal/60">
          Already have an account?{" "}
          <a href="/wellness/login" className="font-medium text-sage hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
