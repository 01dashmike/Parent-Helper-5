"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveStep3ClassTemplate } from "../actions";
import { step3ClassSchema } from "../schema";
import { WizardShell } from "../../components/WizardShell";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CLASS_CATEGORIES } from "@/lib/constants/categories";
import { DAYS_OF_WEEK } from "@/lib/constants/categories";

interface Step3ClassClientProps {
  providerId: number;
  initialData: Partial<{
    className: string;
    description: string;
    ageGroupMin: number;
    ageGroupMax: number;
    category: string;
    venue: string;
    dayOfWeek: string;
    time: string;
    price: string;
  }>;
}

const formSchema = step3ClassSchema;

type FormData = z.infer<typeof formSchema>;

export function Step3ClassClient({ providerId, initialData }: Step3ClassClientProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      ageGroupMin: initialData.ageGroupMin || 0,
      ageGroupMax: initialData.ageGroupMax || 24,
    },
  });

  const category = watch("category");
  const dayOfWeek = watch("dayOfWeek");

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("className", data.className);
      formData.append("description", data.description);
      formData.append("ageGroupMin", String(data.ageGroupMin));
      formData.append("ageGroupMax", String(data.ageGroupMax));
      formData.append("category", data.category);
      formData.append("venue", data.venue);
      formData.append("dayOfWeek", data.dayOfWeek);
      formData.append("time", data.time);
      if (data.price) {
        formData.append("price", data.price);
      }
      
      const result = await saveStep3ClassTemplate(null, formData);
      
      if (result.success) {
        toast({
          title: "Saved!",
          description: "Your class details have been saved.",
        });
      } else {
        setError("root", { message: result.error || "Failed to save" });
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save";
      setError("root", { message: errorMessage });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <WizardShell
      title="Step 3 — Create Your First Class"
      description="Let's set up your first class listing. You can add more classes later."
      currentStep={3}
      backHref="/provider/onboarding/wizard/step-2-business"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          label="Class Name"
          required
          error={errors.className?.message}
          helpText="Choose a clear, descriptive name that parents will search for"
        >
          <Input
            type="text"
            placeholder="Baby Music & Movement"
            {...register("className")}
          />
        </FormField>

        <FormField
          label="Description"
          required
          error={errors.description?.message}
          helpText="Describe what makes your class special. At least 10 characters."
        >
          <Textarea
            rows={4}
            placeholder="A fun and engaging music class for babies and toddlers..."
            {...register("description")}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Category"
            required
            error={errors.category?.message}
          >
            <Select
              value={category || ""}
              onValueChange={(value) => setValue("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Min Age (months)"
            required
            error={errors.ageGroupMin?.message}
          >
            <Input
              type="number"
              min="0"
              max="216"
              placeholder="0"
              {...register("ageGroupMin", { valueAsNumber: true })}
            />
          </FormField>

          <FormField
            label="Max Age (months)"
            required
            error={errors.ageGroupMax?.message}
          >
            <Input
              type="number"
              min="0"
              max="216"
              placeholder="24"
              {...register("ageGroupMax", { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField
          label="Venue Name"
          required
          error={errors.venue?.message}
        >
          <Input
            type="text"
            placeholder="Community Centre"
            {...register("venue")}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Day of Week"
            required
            error={errors.dayOfWeek?.message}
          >
            <Select
              value={dayOfWeek || ""}
              onValueChange={(value) => setValue("dayOfWeek", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Time"
            required
            error={errors.time?.message}
          >
            <Input
              type="time"
              {...register("time")}
            />
          </FormField>
        </div>

        <FormField
          label="Price"
          error={errors.price?.message}
          helpText="You can leave this blank if pricing varies or is free"
        >
          <Input
            type="text"
            placeholder="£8 per session or Free"
            {...register("price")}
          />
        </FormField>

        {errors.root && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-sage/20">
          <Button type="submit" disabled={isSubmitting} className="min-w-[180px]">
            {isSubmitting ? "Saving..." : "Continue to Media →"}
          </Button>
        </div>
      </form>
    </WizardShell>
  );
}
