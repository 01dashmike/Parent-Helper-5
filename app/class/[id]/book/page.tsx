"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  parent_name: z.string().min(1, "Name required"),
  parent_email: z.string().email("Valid email required"),
  parent_phone: z.string().min(6, "Phone required"),
  child_name: z.string().min(1, "Child name required"),
  child_age: z.coerce.number().nonnegative("Enter valid age"),
  special_requirements: z.string().max(500).optional(),
});

type BookingFormValues = z.infer<typeof schema>;

export default function BookingForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const classId = params?.id;

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolver = zodResolver(schema) as Resolver<BookingFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver,
    defaultValues: {
      parent_name: "",
      parent_email: "",
      parent_phone: "",
      child_name: "",
      child_age: 0,
      special_requirements: "",
    },
  });

  async function onSubmit(values: BookingFormValues) {
    if (!classId) return;
    setLoading(true);
    setError(null);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: Number(classId),
        parent_name: values.parent_name,
        parent_email: values.parent_email,
        parent_phone: values.parent_phone,
        child_name: values.child_name,
        child_age: values.child_age,
        special_requirements: values.special_requirements ?? "",
        total_amount: 0,
        commission_amount: 0,
        provider_amount: 0,
        status: "pending",
        payment_status: "pending",
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      }),
    });

    setLoading(false);
    if (response.ok) {
      setSubmitted(true);
      reset();
    } else {
      const json = await response.json().catch(() => null);
      setError(json?.error ?? "Unable to submit booking.");
    }
  }

  if (submitted) {
    return (
      <motion.div
        className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h1 className="text-2xl font-bold text-brand-teal">Booking Request Sent!</h1>
        <p className="max-w-md text-sm text-brand-textMuted">
          We’ve received your booking request. The provider will reach out soon to confirm the
          session and payment details.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-brand-coral text-white transition hover:bg-brand-teal"
        >
          Return Home
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-teal">Book This Class</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" autoComplete="off">
            <div>
              <Input placeholder="Your Name" {...register("parent_name")} />
              {errors.parent_name ? (
                <p className="mt-1 text-sm text-red-500">{errors.parent_name.message}</p>
              ) : null}
            </div>
            <div>
              <Input placeholder="Email" {...register("parent_email")} />
              {errors.parent_email ? (
                <p className="mt-1 text-sm text-red-500">{errors.parent_email.message}</p>
              ) : null}
            </div>
            <div>
              <Input placeholder="Phone" {...register("parent_phone")} />
              {errors.parent_phone ? (
                <p className="mt-1 text-sm text-red-500">{errors.parent_phone.message}</p>
              ) : null}
            </div>
            <div>
              <Input placeholder="Child’s Name" {...register("child_name")} />
              {errors.child_name ? (
                <p className="mt-1 text-sm text-red-500">{errors.child_name.message}</p>
              ) : null}
            </div>
            <div>
              <Input type="number" placeholder="Child’s Age" {...register("child_age")} />
              {errors.child_age ? (
                <p className="mt-1 text-sm text-red-500">{errors.child_age.message}</p>
              ) : null}
            </div>
            <div>
              <Textarea
                placeholder="Special Requirements (optional)"
                rows={3}
                {...register("special_requirements")}
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-teal text-white transition hover:bg-brand-coral"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Booking Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
