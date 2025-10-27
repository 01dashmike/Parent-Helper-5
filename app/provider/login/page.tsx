"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function ProviderLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message ?? "Unable to log in.");
    } else {
      router.push("/provider/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-teal">Provider Login</h1>
        <div className="space-y-3">
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
          onClick={handleLogin}
          disabled={loading}
          className="mt-4 w-full bg-brand-teal text-white transition hover:bg-brand-coral"
        >
          {loading ? "Logging in…" : "Log In"}
        </Button>
        <p className="mt-4 text-center text-sm text-brand-textMuted">
          New provider?{" "}
          <a href="/provider/signup" className="text-brand-teal underline-offset-4 hover:underline">
            Create an account
          </a>
        </p>
      </motion.div>
    </div>
  );
}
