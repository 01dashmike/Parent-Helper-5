"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/ui/formfield";

const venueInterestFormSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  type: z.enum(["provider", "owner", "both"]),
  location: z.string().min(1, "Location is required"),
  message: z.string().optional(),
});

type VenueInterestFormData = z.infer<typeof venueInterestFormSchema>;

export function VenueInterestForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<VenueInterestFormData>({
    resolver: zodResolver(venueInterestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      type: "provider",
      location: "",
      message: "",
    },
  });

  const onSubmit = async (data: VenueInterestFormData) => {
    try {
      const response = await fetch("/api/venues/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitted(true);
        form.reset();
        toast({
          title: "Thank you!",
          description: "We'll be in touch soon with updates about our venue marketplace.",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[VenueInterestForm] Unexpected error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-sage/40 bg-sage/10 p-6 text-center">
        <p className="text-title font-semibold text-charcoal">Thank you for your interest!</p>
        <p className="mt-2 text-slateSoft">We&apos;ll be in touch soon with updates about our venue marketplace.</p>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Name"
          required
          error={form.formState.errors.name?.message}
          id="name"
        >
          <Input {...form.register("name")} autoComplete="name" />
        </FormField>

        <FormField
          label="Business email"
          required
          error={form.formState.errors.email?.message}
          id="email"
        >
          <Input {...form.register("email")} type="email" autoComplete="email" />
        </FormField>

        <FormField
          label="Phone number"
          error={form.formState.errors.phone?.message}
          id="phone"
        >
          <Input {...form.register("phone")} type="tel" autoComplete="tel" />
        </FormField>

        <FormField
          label="I am a"
          required
          error={form.formState.errors.type?.message}
          id="type"
        >
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as "provider" | "owner" | "both")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="provider">Provider looking for venues</SelectItem>
              <SelectItem value="owner">Property owner with space</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Location (Town/City)"
          required
          error={form.formState.errors.location?.message}
          id="location"
        >
          <Input {...form.register("location")} placeholder="e.g., Manchester, Birmingham" />
        </FormField>

        <FormField
          label="Tell us more (optional)"
          error={form.formState.errors.message?.message}
          id="message"
        >
          <Textarea {...form.register("message")} rows={4} placeholder="Any specific requirements or questions?" />
        </FormField>

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? "Submitting..." : "Register Interest"}
        </Button>
      </form>
    </FormProvider>
  );
}

