"use client";

import { useState } from "react";
import type { Audience, SupplementResult } from "@/lib/wellness/types";
import MedicalDisclaimer from "@/components/wellness/MedicalDisclaimer";

interface SupplementResultsProps {
  supplementResult: SupplementResult;
  audience: Audience;
  onStartOver: () => void;
}

export default function SupplementResults({
  supplementResult,
  audience,
  onStartOver,
}: SupplementResultsProps) {
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailInput, setEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleEmailPlan = async () => {
    setShowEmailInput(true);
  };

  const sendEmail = async (email: string) => {
    setEmailStatus("sending");
    
    try {
      const response = await fetch("/api/wellness/email-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          planType: "supplement",
          audience,
          planData: supplementResult,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setEmailStatus("success");
      setTimeout(() => {
        setEmailStatus("idle");
        setShowEmailInput(false);
      }, 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput) return;
    await sendEmail(emailInput);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft">
        <div>
          <h3 className="text-2xl font-semibold text-charcoal">
            Your Personalised Supplement Suggestions
          </h3>
          <p className="mt-1 text-sm text-charcoal/70">
            {supplementResult.suggestions.length} suggestions based on your goals
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEmailPlan}
            disabled={emailStatus === "sending"}
            className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-sage/90 disabled:opacity-50"
          >
            {emailStatus === "sending" ? "Sending..." : emailStatus === "success" ? "✓ Sent!" : "📧 Email Guide"}
          </button>
          <button
            onClick={handlePrint}
            className="rounded-full bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20"
          >
            🖨️ Print
          </button>
          <button
            onClick={onStartOver}
            className="rounded-full bg-charcoal/10 px-4 py-2 text-sm font-medium text-charcoal hover:bg-charcoal/20"
          >
            ↻ Start Over
          </button>
        </div>
      </div>

      {/* Email Input Modal */}
      {showEmailInput && emailStatus !== "success" && (
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            Email Your Supplement Guide
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
            />
            <button
              onClick={handleSendEmail}
              disabled={!emailInput || emailStatus === "sending"}
              className="rounded-lg bg-sage px-6 py-2 font-medium text-white hover:bg-sage/90 disabled:opacity-50"
            >
              {emailStatus === "sending" ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setShowEmailInput(false)}
              className="rounded-lg bg-charcoal/10 px-4 py-2 font-medium text-charcoal hover:bg-charcoal/20"
            >
              Cancel
            </button>
          </div>
          {emailStatus === "error" && (
            <p className="mt-2 text-sm text-red-600">
              Failed to send email. Please try again.
            </p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <MedicalDisclaimer variant="banner" customMessage={supplementResult.disclaimer} />

      {/* Suggestions */}
      <div className="space-y-6">
        {supplementResult.suggestions.map((suggestion, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-soft">
            <h4 className="mb-4 text-xl font-semibold text-charcoal">
              💊 {suggestion.name}
            </h4>

            <div className="space-y-4">
              {/* Reason */}
              <div>
                <h5 className="mb-1 text-sm font-medium text-charcoal">
                  Why This Supplement?
                </h5>
                <p className="text-sm text-charcoal/80">{suggestion.reason}</p>
              </div>

              {/* Dosage */}
              <div>
                <h5 className="mb-1 text-sm font-medium text-charcoal">
                  Dosage Guidance
                </h5>
                <p className="text-sm text-charcoal/80">
                  {suggestion.dosageGuidance}
                </p>
              </div>

              {/* Quality Markers */}
              {suggestion.qualityMarkers.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-charcoal">
                    Quality Markers to Look For:
                  </h5>
                  <ul className="space-y-1 text-sm text-charcoal/80">
                    {suggestion.qualityMarkers.map((marker, j) => (
                      <li key={j}>✓ {marker}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* UK Brands */}
              {suggestion.ukBrands.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-medium text-charcoal">
                    UK Brands (examples):
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.ukBrands.map((brand, j) => (
                      <span
                        key={j}
                        className="rounded-full bg-sage/10 px-3 py-1 text-xs font-medium text-sage"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {suggestion.warnings.length > 0 && (
                <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-4">
                  <h5 className="mb-2 text-sm font-medium text-charcoal">
                    ⚠️ Important Warnings:
                  </h5>
                  <ul className="space-y-1 text-sm text-charcoal/80">
                    {suggestion.warnings.map((warning, j) => (
                      <li key={j}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best Taken With */}
              {suggestion.bestTakenWith && (
                <div className="text-sm text-charcoal/70">
                  <strong>Best taken with:</strong> {suggestion.bestTakenWith}
                </div>
              )}

              {/* Interactions */}
              {suggestion.interactions && suggestion.interactions.length > 0 && (
                <div className="rounded-lg bg-red-50 p-3">
                  <h5 className="mb-1 text-sm font-medium text-red-900">
                    Potential Interactions:
                  </h5>
                  <ul className="space-y-1 text-sm text-red-800">
                    {suggestion.interactions.map((interaction, j) => (
                      <li key={j}>• {interaction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {suggestion.notes && suggestion.notes.length > 0 && (
                <div>
                  <h5 className="mb-1 text-sm font-medium text-charcoal">Notes:</h5>
                  <ul className="space-y-1 text-sm text-charcoal/80">
                    {suggestion.notes.map((note, j) => (
                      <li key={j}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* General Advice */}
      {supplementResult.generalAdvice && supplementResult.generalAdvice.length > 0 && (
        <div className="rounded-2xl bg-sage/10 p-6">
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            💡 General Supplement Advice
          </h4>
          <ul className="space-y-2 text-sm text-charcoal/80">
            {supplementResult.generalAdvice.map((advice, i) => (
              <li key={i}>• {advice}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Consultation Reminder */}
      <div className="rounded-2xl border-2 border-terracotta/40 bg-white p-6 shadow-soft">
        <h4 className="mb-3 text-lg font-semibold text-charcoal">
          📅 Next Steps
        </h4>
        <p className="text-sm leading-relaxed text-charcoal/90">
          {supplementResult.consultationReminder}
        </p>
      </div>
    </div>
  );
}
