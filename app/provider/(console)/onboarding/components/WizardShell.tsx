"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { WIZARD_STEPS } from "../wizard/actions";

interface WizardShellProps {
  title: string;
  description?: string;
  currentStep: number; // 1-6
  children: ReactNode;
  backHref?: string;
}

const STEP_LABELS = [
  "Account",
  "Business",
  "Class",
  "Media",
  "Preview",
  "Publish",
];

export function WizardShell({
  title,
  description,
  currentStep,
  children,
  backHref,
}: WizardShellProps) {
  const totalSteps = WIZARD_STEPS.length;
  // Calculate progress based on completed steps (more accurate)
  // For now, use step number, but can be enhanced with actual completion data
  const progress = (currentStep / totalSteps) * 100;

  // Calculate back href if not provided
  const getBackHref = () => {
    if (backHref) return backHref;
    if (currentStep === 1) return "/provider";
    const prevStep = WIZARD_STEPS[currentStep - 2];
    return `/provider/onboarding/wizard/${prevStep}`;
  };

  return (
    <div className="min-h-screen bg-cream/30">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-charcoal mb-2">{title}</h1>
            {description && (
              <p className="text-base text-charcoal/70">{description}</p>
            )}
          </div>

          {/* Animated Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm text-charcoal/60">
              <span className="font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="hidden sm:flex items-center justify-between mb-8">
            {WIZARD_STEPS.map((step, index) => {
              const stepNum = index + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? "border-sage bg-sage text-white"
                          : isCurrent
                            ? "border-sage bg-white text-sage shadow-md"
                            : "border-charcoal/20 bg-white text-charcoal/40"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{stepNum}</span>
                      )}
                    </motion.div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isCurrent ? "text-charcoal" : "text-charcoal/60"
                      }`}
                    >
                      {STEP_LABELS[index]}
                    </span>
                  </div>
                  {stepNum < totalSteps && (
                    <div
                      className={`mx-2 h-0.5 flex-1 transition-colors ${
                        isCompleted ? "bg-sage" : "bg-charcoal/20"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-6 sm:p-8">{children}</CardContent>
          </Card>
        </motion.div>

        {/* Bottom Navigation Bar - Sticky on mobile */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-sage/20 px-4 py-4 mt-8 -mx-4 sm:-mx-6 lg:-mx-8 sm:px-6 lg:px-8 shadow-lg sm:shadow-none sm:border-0 sm:bg-transparent sm:static sm:mt-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href={getBackHref()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
            )}

            {/* Spacer for mobile */}
            {currentStep === 1 && <div />}

            {/* Finish Later Link */}
            <Link
              href="/provider"
              className="text-sm text-charcoal/60 hover:text-charcoal transition text-center sm:text-left py-2"
            >
              Finish later
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
