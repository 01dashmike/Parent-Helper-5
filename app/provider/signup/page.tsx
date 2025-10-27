"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ProviderSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message ?? "Unable to sign up.");
      return;
    }

    const userId = data?.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Unable to create provider profile.");
      return;
    }

    const { error: dbError } = await supabase.from("providers").insert([
      {
        id: userId,
        email,
        business_name: businessName,
        contact_name: contactName,
      },
    ]);

    setLoading(false);

    if (dbError) {
      setError(dbError.message ?? "Failed to create provider profile.");
      return;
    }

    router.push("/provider/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-teal">Provider Signup</h1>
        <div className="space-y-3">
          <Input
            placeholder="Business Name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
          <Input
            placeholder="Contact Name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        <Button
          onClick={handleSignup}
          disabled={loading}
          className="mt-4 w-full bg-brand-coral text-white transition hover:bg-brand-teal"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </Button>
      </div>
    </div>
  );
}
