'use client';

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { Crown, AlertTriangle } from 'lucide-react';
import { iconSize } from '@/lib/icons/tokens';
import { Modal } from '@/components/ui/modal';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { LoadingSpinner } from '@/components/spinners/LoadingSpinner';
import { FormField } from '@/components/ui/formfield';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { announce, announceFormSuccess, announceFormError } from '@/lib/a11y/announce';

type ClaimListingDialogProps = {
  classItem: {
    id: string | number;
    name?: string;
  };
};

type SubmissionStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | { type: 'loading' };

const claimListingFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
});

type ClaimListingFormData = z.infer<typeof claimListingFormSchema>;

export function ClaimListingDialog({ classItem }: ClaimListingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>({ type: 'idle' });

  const form = useForm<ClaimListingFormData>({
    resolver: zodResolver(claimListingFormSchema),
    defaultValues: {
      businessName: '',
      email: '',
      phone: '',
    },
  });

  const resetForm = () => {
    form.reset();
    setStatus({ type: 'idle' });
  };

  const onSubmit = async (data: ClaimListingFormData) => {
    setStatus({ type: 'loading' });
    announce('Submitting claim request…');

    try {
      const response = await fetch('/api/claim-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classItem.id,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      setStatus({
        type: 'success',
        message: "Thanks! We'll verify your details and be in touch within 24 hours.",
      });
      announceFormSuccess("Claim request submitted successfully. We'll verify your details and be in touch within 24 hours.");
      form.reset();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'We were unable to submit your claim. Please try again shortly.';
      announceFormError(errorMessage);
      setStatus({
        type: 'error',
        message: errorMessage,
      });
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        variant="outline"
        size="default"
        aria-label="Claim this business listing"
      >
        <Crown size={iconSize.sm} aria-hidden="true" />
        Claim This Listing
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Claim your business listing"
        description={classItem.name ? `Listing: ${classItem.name}` : 'Provide your business details below.'}
        size="md"
      >

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-busy={status.type === 'loading'}>
            <div className="rounded-card bg-indigo-50 p-4 text-small text-indigo-700">
              <p className="font-medium">What you&apos;ll unlock:</p>
              <ul className="mt-2 space-y-1">
                <li>✓ Update your class information instantly</li>
                <li>✓ Add photos, social links, and booking details</li>
                <li>✓ Access engagement analytics</li>
                <li>✓ Respond to parent reviews</li>
              </ul>
            </div>

            <FormField
              label="Business name"
              required
              error={form.formState.errors.businessName?.message}
              id="business-name"
            >
              <Input
                {...form.register("businessName")}
                placeholder="Your business name"
                autoComplete="organization"
              />
            </FormField>

            <FormField
              label="Business email"
              required
              error={form.formState.errors.email?.message}
              id="business-email"
            >
              <Input
                {...form.register("email")}
                type="email"
                placeholder="you@business.com"
                autoComplete="email"
              />
            </FormField>

            <FormField
              label="Phone number"
              required
              error={form.formState.errors.phone?.message}
              id="business-phone"
            >
              <Input
                {...form.register("phone")}
                type="tel"
                inputMode="tel"
                placeholder="07xxx xxx xxx"
                autoComplete="tel"
              />
            </FormField>

            <Button
              type="submit"
              disabled={status.type === 'loading'}
              className="w-full"
              aria-label={status.type === 'loading' ? 'Submitting claim request' : 'Submit claim request'}
            >
              {status.type === 'loading' ? (
                <>
                  <LoadingSpinner size="sm" label="Submitting claim request" />
                  <span>Submitting…</span>
                </>
              ) : (
                'Submit claim request'
              )}
            </Button>

              {status.type === 'success' && (
                <p 
                  className="rounded-md bg-green-50 px-3 py-2 text-small text-green-700"
                  role="status"
                  aria-live="polite"
                >
                  {status.message}
                </p>
              )}
              {status.type === 'error' && (
                <div className="form-error" role="alert">
                  <AlertTriangle size={iconSize.sm} aria-hidden="true" className="form-error-icon" />
                  <p className="form-error-text">{status.message}</p>
                </div>
              )}

            <p className="text-center text-small text-slateSoft">
              We will verify your details and send secure login credentials within 24 hours.
            </p>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
}
