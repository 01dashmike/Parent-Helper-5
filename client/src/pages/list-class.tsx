"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider } from "react-hook-form";
import { listClassSchema, type ListClassData } from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function ListClass() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ListClassData>({
    resolver: zodResolver(listClassSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      className: "",
      description: "",
      category: "",
      ageGroupMin: 0,
      ageGroupMax: 12,
      venue: "",
      address: "",
      postcode: "",
      dayOfWeek: "",
      time: "",
      price: "",
      additionalInfo: "",
    },
  });

  const onSubmit = async (data: ListClassData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/list-class", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setIsSubmitted(true);
      toast({
        title: "Class submitted successfully!",
        description: "Thank you for your submission. We'll review it and get back to you soon.",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardContent className="pt-12 pb-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Thank You!
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Your class has been submitted successfully. We&apos;ll review the details and get back to you within 2 business days.
                </p>
                <Link href="/">
                  <Button size="lg" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              List Your Class for FREE
            </h1>
            <p className="text-xl text-gray-600">
              Join thousands of baby and toddler classes already helping families across the UK
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
              <CardDescription>
                Tell us about your baby or toddler class and we&apos;ll add it to our directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Business Name"
                      required
                      error={form.formState.errors.businessName?.message}
                    >
                      <Input
                        {...form.register("businessName")}
                        placeholder="Your business name"
                      />
                    </FormField>

                    <FormField
                      label="Contact Name"
                      required
                      error={form.formState.errors.contactName?.message}
                    >
                      <Input
                        {...form.register("contactName")}
                        placeholder="Your full name"
                      />
                    </FormField>

                    <FormField
                      label="Email Address"
                      required
                      error={form.formState.errors.email?.message}
                    >
                      <Input
                        {...form.register("email")}
                        type="email"
                        placeholder="your@email.com"
                      />
                    </FormField>

                    <FormField
                      label="Phone Number"
                      required
                      error={form.formState.errors.phone?.message}
                    >
                      <Input
                        {...form.register("phone")}
                        placeholder="07123 456789"
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Website"
                    error={form.formState.errors.website?.message}
                  >
                    <Input
                      {...form.register("website")}
                      placeholder="https://yourwebsite.com"
                    />
                  </FormField>

                  {/* Class Information */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Class Information</h3>
                    
                    <FormField
                      label="Class Name"
                      required
                      error={form.formState.errors.className?.message}
                    >
                      <Input
                        {...form.register("className")}
                        placeholder="e.g. Baby Sensory, Little Movers"
                      />
                    </FormField>

                    <FormField
                      label="Class Description"
                      required
                      error={form.formState.errors.description?.message}
                    >
                      <Textarea
                        {...form.register("description")}
                        placeholder="Describe what happens in your class, what makes it special, and what parents can expect..."
                        className="min-h-[100px]"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        label="Category"
                        required
                        error={form.formState.errors.category?.message}
                      >
                        <Select
                          value={form.watch("category")}
                          onValueChange={(value) => form.setValue("category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sensory">Sensory</SelectItem>
                            <SelectItem value="music">Music</SelectItem>
                            <SelectItem value="swimming">Swimming</SelectItem>
                            <SelectItem value="yoga">Yoga</SelectItem>
                            <SelectItem value="massage">Massage</SelectItem>
                            <SelectItem value="play">Play</SelectItem>
                            <SelectItem value="gymnastics">Gymnastics</SelectItem>
                            <SelectItem value="art">Arts & Crafts</SelectItem>
                            <SelectItem value="language">Language</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="dance">Dance</SelectItem>
                            <SelectItem value="signing">Baby Signing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        label="Min Age (months)"
                        required
                        error={form.formState.errors.ageGroupMin?.message}
                      >
                        <Input
                          {...form.register("ageGroupMin", { valueAsNumber: true })}
                          type="number"
                          placeholder="0"
                        />
                      </FormField>

                      <FormField
                        label="Max Age (months)"
                        required
                        error={form.formState.errors.ageGroupMax?.message}
                      >
                        <Input
                          {...form.register("ageGroupMax", { valueAsNumber: true })}
                          type="number"
                          placeholder="60"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Location & Schedule */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Location & Schedule</h3>
                    
                    <FormField
                      label="Venue Name"
                      required
                      error={form.formState.errors.venue?.message}
                    >
                      <Input
                        {...form.register("venue")}
                        placeholder="e.g. Community Centre, Church Hall"
                      />
                    </FormField>

                    <FormField
                      label="Full Address"
                      required
                      error={form.formState.errors.address?.message}
                    >
                      <Input
                        {...form.register("address")}
                        placeholder="Street address, City"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        label="Postcode"
                        required
                        error={form.formState.errors.postcode?.message}
                      >
                        <Input
                          {...form.register("postcode")}
                          placeholder="SW1A 1AA"
                        />
                      </FormField>

                      <FormField
                        label="Day of Week"
                        required
                        error={form.formState.errors.dayOfWeek?.message}
                      >
                        <Select
                          value={form.watch("dayOfWeek")}
                          onValueChange={(value) => form.setValue("dayOfWeek", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                            <SelectItem value="Saturday">Saturday</SelectItem>
                            <SelectItem value="Sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        label="Time"
                        required
                        error={form.formState.errors.time?.message}
                      >
                        <Input
                          {...form.register("time")}
                          placeholder="10:30am"
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Price"
                      error={form.formState.errors.price?.message}
                    >
                      <Input
                        {...form.register("price")}
                        placeholder="£12.00 per session"
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Additional Information"
                    error={form.formState.errors.additionalInfo?.message}
                  >
                    <Textarea
                      {...form.register("additionalInfo")}
                      placeholder="Any additional details, special requirements, or booking information..."
                    />
                  </FormField>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Class for FREE"}
                  </Button>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
