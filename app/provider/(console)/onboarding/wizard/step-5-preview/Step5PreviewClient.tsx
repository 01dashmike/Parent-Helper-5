"use client";

import { useFormState } from "react-dom";
import { useEffect } from "react";
import Image from "next/image";
import { saveStep5Preview } from "../actions";
import type { OnboardingFormState } from "../../_lib/types";
import { WizardShell } from "../../components/WizardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFormStatus } from "react-dom";
import { CheckCircle2, MapPin, Clock, PoundSterling, Users } from "lucide-react";

interface Step5PreviewClientProps {
  providerId: number;
  providerData: {
    name: string;
    contactEmail: string;
    contactPhone: string;
    addressLine1: string;
    town: string;
    postcode: string;
    logoUrl?: string;
  };
  classData: {
    name: string;
    description: string;
    category: string;
    ageGroupMin: number;
    ageGroupMax: number;
    venue: string;
    dayOfWeek: string;
    time: string;
    price: string;
    town: string;
    imageUrls?: string[];
  };
}

export function Step5PreviewClient({ providerId, providerData, classData }: Step5PreviewClientProps) {
  const initialState: OnboardingFormState = {
    success: false,
    error: null,
    nextStep: null,
  };
  const [state, formAction] = useFormState(saveStep5Preview, initialState);

  const ageRangeText = classData.ageGroupMin === 0 && classData.ageGroupMax === 24
    ? "0-24 months"
    : `${classData.ageGroupMin}-${classData.ageGroupMax} months`;

  const dayLabel = classData.dayOfWeek.charAt(0).toUpperCase() + classData.dayOfWeek.slice(1);

  return (
    <WizardShell
      title="Step 5 — Preview Your Listing"
      description="Here's how your listing will appear to parents. Everything looks good?"
      currentStep={5}
      backHref="/provider/onboarding/wizard/step-4-media"
    >
      <div className="space-y-6">
        {/* Provider Info Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providerData.logoUrl && (
              <div className="mb-4">
                <Image
                  src={providerData.logoUrl}
                  alt={`${providerData.name} logo`}
                  width={64}
                  height={64}
                  className="h-16 w-auto object-contain"
                  unoptimized
                />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-charcoal/60">Business Name</p>
              <p className="text-base text-charcoal">{providerData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal/60">Location</p>
              <p className="text-base text-charcoal">
                {providerData.addressLine1}, {providerData.town}, {providerData.postcode}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-charcoal/60">Email</p>
                <p className="text-base text-charcoal">{providerData.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal/60">Phone</p>
                <p className="text-base text-charcoal">{providerData.contactPhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">{classData.name}</h3>
              <p className="text-sm text-charcoal/70 leading-relaxed">{classData.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-sage/10 text-forest border-sage/30">
                {classData.category}
              </Badge>
              <Badge variant="outline" className="bg-sage/10 text-forest border-sage/30">
                <Users className="h-3 w-3 mr-1" />
                {ageRangeText}
              </Badge>
              {classData.town && (
                <Badge variant="outline" className="bg-sage/10 text-forest border-sage/30">
                  <MapPin className="h-3 w-3 mr-1" />
                  {classData.town}
                </Badge>
              )}
            </div>

            {classData.imageUrls && classData.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {classData.imageUrls.slice(0, 6).map((url, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-sage/20 relative">
                    <Image
                      src={url}
                      alt={`Class photo ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-sage/20 space-y-3">
              <div className="flex items-center gap-2 text-sm text-charcoal">
                <MapPin className="h-4 w-4 text-sage" />
                <span><strong>Venue:</strong> {classData.venue}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal">
                <Clock className="h-4 w-4 text-sage" />
                <span><strong>When:</strong> {dayLabel} at {classData.time}</span>
              </div>
              {classData.price && (
                <div className="flex items-center gap-2 text-sm text-charcoal">
                  <PoundSterling className="h-4 w-4 text-sage" />
                  <span><strong>Price:</strong> {classData.price}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-sage/20">
          <Button
            type="button"
            variant="outline"
            asChild
          >
            <a href="/provider/onboarding/wizard/step-3-class">
              Edit Step 3 (Class Details)
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
          >
            <a href="/provider/onboarding/wizard/step-4-media">
              Edit Step 4 (Photos)
            </a>
          </Button>
        </div>

        <div className="rounded-md bg-sage/10 border border-sage/30 p-4">
          <p className="text-sm text-charcoal/80">
            <strong>Remember:</strong> You can edit any of this information later from your provider dashboard.
          </p>
        </div>

        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex justify-end gap-3 pt-4 border-t border-sage/20">
          <SubmitButton />
        </form>
      </div>
    </WizardShell>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="min-w-[180px]">
      {pending ? "Loading..." : (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Looks Good! Continue →
        </>
      )}
    </Button>
  );
}
