"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/formfield";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const childDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(18, "Age must be between 0 and 18"),
  notes: z.string().optional(),
  allergies: z.string().optional(),
});

const createBookingFormSchema = (requirePhone: boolean) => z.object({
  parentFirstName: z.string().min(1, "First name is required"),
  parentLastName: z.string().min(1, "Last name is required"),
  parentEmail: z.string().email("Please enter a valid email address"),
  parentPhone: requirePhone 
    ? z.string().min(1, "Phone number is required")
    : z.string().optional(),
  children: z.array(childDetailsSchema).min(1, "At least one child is required"),
  notes: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must confirm consent",
  }),
});

type ChildDetails = z.infer<typeof childDetailsSchema>;

type BookingFormProps = {
  onNext: (data: {
    parentFirstName: string;
    parentLastName: string;
    parentEmail: string;
    parentPhone?: string;
    children: ChildDetails[];
    notes?: string;
  }) => void;
  initialData?: Partial<{
    parentFirstName: string;
    parentLastName: string;
    parentEmail: string;
    parentPhone: string;
    children: ChildDetails[];
    notes: string;
  }>;
  requirePhone?: boolean;
};

export default function BookingForm({ onNext, initialData, requirePhone = false }: BookingFormProps) {
  const form = useForm({
    resolver: zodResolver(createBookingFormSchema(requirePhone)),
    defaultValues: {
      parentFirstName: initialData?.parentFirstName || "",
      parentLastName: initialData?.parentLastName || "",
      parentEmail: initialData?.parentEmail || "",
      parentPhone: initialData?.parentPhone || "",
      children: initialData?.children && initialData.children.length > 0
        ? initialData.children
        : [{ name: "", age: 0, notes: "", allergies: "" }],
      notes: initialData?.notes || "",
      consent: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
  });

  const onSubmit = (data: z.infer<ReturnType<typeof createBookingFormSchema>>) => {
    onNext({
      parentFirstName: data.parentFirstName,
      parentLastName: data.parentLastName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone || undefined,
      children: data.children.map((c) => ({
        name: c.name,
        age: c.age,
        notes: c.notes,
        allergies: c.allergies,
      })),
      notes: data.notes || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Details</CardTitle>
        <p className="text-sm text-slateSoft mt-1">
          We&apos;ll use this information to confirm your booking
        </p>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Parent Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Parent/Guardian Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="First Name"
                required
                error={form.formState.errors.parentFirstName?.message}
                id="parentFirstName"
              >
                <Input {...form.register("parentFirstName")} />
              </FormField>
              <FormField
                label="Last Name"
                required
                error={form.formState.errors.parentLastName?.message}
                id="parentLastName"
              >
                <Input {...form.register("parentLastName")} />
              </FormField>
            </div>
            <FormField
              label="Email"
              required
              error={form.formState.errors.parentEmail?.message}
              id="parentEmail"
            >
              <Input {...form.register("parentEmail")} type="email" />
            </FormField>
            {requirePhone && (
              <FormField
                label="Phone Number"
                required
                error={form.formState.errors.parentPhone?.message}
                id="parentPhone"
              >
                <Input {...form.register("parentPhone")} type="tel" />
              </FormField>
            )}
          </div>

          {/* Children */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Children Attending</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", age: 0, notes: "", allergies: "" })}>
                <Plus className="mr-1 h-3 w-3" />
                Add Child
              </Button>
            </div>
            {fields.map((field, index) => (
              <Card key={field.id} className="border-sage/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium">Child {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Name"
                      required
                      error={form.formState.errors.children?.[index]?.name?.message}
                      id={`child-${index}-name`}
                    >
                      <Input {...form.register(`children.${index}.name`)} />
                    </FormField>
                    <FormField
                      label="Age (years)"
                      required
                      error={form.formState.errors.children?.[index]?.age?.message}
                      id={`child-${index}-age`}
                    >
                      <Input
                        {...form.register(`children.${index}.age`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="18"
                      />
                    </FormField>
                  </div>
                  <div className="mt-3">
                    <FormField
                      label="Allergies or Special Requirements"
                      id={`child-${index}-allergies`}
                    >
                      <Input {...form.register(`children.${index}.allergies`)} placeholder="Optional" />
                    </FormField>
                  </div>
                  <div className="mt-3">
                    <FormField
                      label="Additional Notes"
                      id={`child-${index}-notes`}
                    >
                      <Textarea {...form.register(`children.${index}.notes`)} rows={2} placeholder="Optional" />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Notes */}
          <FormField
            label="Additional Notes (Optional)"
            id="notes"
          >
            <Textarea {...form.register("notes")} rows={3} placeholder="Any special requests or information for the provider..." />
          </FormField>

          {/* Consent Checkbox */}
          <FormField
            label=""
            required
            error={form.formState.errors.consent?.message}
            id="consent"
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                {...form.register("consent")}
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-sm">
                I confirm that I am the parent/guardian of the children listed above and consent to their
                participation in this class. I understand that this is not medical or health advice.
              </Label>
            </div>
          </FormField>

          <Button type="submit" className="w-full" size="lg">
            Continue to Review
          </Button>
        </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

