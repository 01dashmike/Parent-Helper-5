"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createProfile } from "@/components/personalisation/actions";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  onClose?: () => void;
}

const INTEREST_OPTIONS = [
  "Music",
  "Dance",
  "Swimming",
  "Sensory Play",
  "Arts & Crafts",
  "Yoga",
  "Sports",
  "Language",
  "Nature",
  "Cooking",
];

const ALLERGY_OPTIONS = [
  "None",
  "Nuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Other",
];

export default function QuickStartProfile({ userId, onClose }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState('');
  const [maxDate, setMaxDate] = useState<string>("");
  const [formData, setFormData] = useState({
    householdName: "",
    postcode: "",
    marketingOptIn: false,
    childName: "",
    birthdate: "",
    interests: [] as string[],
    allergies: [] as string[],
  });

  // Set max date on client side to avoid hydration mismatches
  useEffect(() => {
    setMaxDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleSubmit = async () => {
    if (step === 1) {
      if (!formData.householdName) {
        toast({
          title: "Required Field",
          description: "Please enter a household name",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.birthdate) {
        toast({
          title: "Required Field",
          description: "Please enter a birthdate",
          variant: "destructive",
        });
        return;
      }

      setAnnouncement('Submitting…');
      startTransition(async () => {
        const result = await createProfile({
          userId,
          householdName: formData.householdName,
          postcode: formData.postcode || undefined,
          marketingOptIn: formData.marketingOptIn,
          child: {
            firstName: formData.childName || undefined,
            birthdate: formData.birthdate,
            interests: formData.interests,
            allergies: formData.allergies,
          },
        });

        if (result.error) {
          setAnnouncement('Error saving changes');
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
          return;
        }

        setAnnouncement('Saved');
        toast({
          title: "Profile Created",
          description: "Your family profile has been set up successfully!",
          variant: "success",
        });

        if (onClose) {
          onClose();
        } else {
          router.push("/home");
          router.refresh();
        }
      });
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-sage/20 bg-white p-6 shadow-elevated">
        <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
          {announcement}
        </VisuallyHidden>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title font-semibold">
            {step === 1 ? "Set Up Your Family" : "Add Your First Child"}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slateSoft transition-standard hover:text-charcoal"
            >
              ✕
            </button>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-small font-medium text-charcoal">
                Household Name *
              </label>
              <Input
                type="text"
                value={formData.householdName}
                onChange={(e) =>
                  setFormData({ ...formData, householdName: e.target.value })
                }
                className="mt-1 w-full"
                placeholder="e.g., The Smith Family"
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">
                Postcode (optional)
              </label>
              <Input
                type="text"
                value={formData.postcode}
                onChange={(e) =>
                  setFormData({ ...formData, postcode: e.target.value.toUpperCase() })
                }
                className="mt-1 w-full"
                placeholder="SW1A 1AA"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="marketing"
                checked={formData.marketingOptIn}
                onChange={(e) =>
                  setFormData({ ...formData, marketingOptIn: e.target.checked })
                }
                className="h-4 w-4 rounded border-sage/30 text-sage focus:ring-sage"
              />
              <label htmlFor="marketing" className="text-small text-charcoal">
                I&apos;d like to receive personalized recommendations and updates
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-small font-medium text-charcoal">
                Child&apos;s Name (optional)
              </label>
              <Input
                type="text"
                value={formData.childName}
                onChange={(e) =>
                  setFormData({ ...formData, childName: e.target.value })
                }
                className="mt-1 w-full"
                placeholder="e.g., Emma"
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">
                Birthdate *
              </label>
              <Input
                type="date"
                value={formData.birthdate}
                onChange={(e) =>
                  setFormData({ ...formData, birthdate: e.target.value })
                }
                className="mt-1 w-full"
                max={maxDate}
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">
                Interests (optional)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-3 py-1 text-small motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
                      formData.interests.includes(interest)
                        ? "bg-sage text-white"
                        : "bg-sage/10 text-sage hover:bg-sage/20"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">
                Allergies (optional)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((allergy) => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`rounded-full px-3 py-1 text-small motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
                      formData.allergies.includes(allergy)
                        ? "bg-red-500 text-white"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {step > 1 && (
            <Button
              type="button"
              onClick={() => setStep(1)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            variant="default"
            size="sm"
            className="flex-1"
          >
            {isPending ? "Saving..." : step === 1 ? "Continue" : "Save & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

