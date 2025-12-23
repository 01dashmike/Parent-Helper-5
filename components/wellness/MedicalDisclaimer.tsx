interface MedicalDisclaimerProps {
  variant?: "banner" | "inline" | "modal";
  customMessage?: string;
}

export default function MedicalDisclaimer({
  variant = "banner",
  customMessage,
}: MedicalDisclaimerProps) {
  const defaultMessage = `This tool provides general wellness information only and is not a substitute for professional medical advice. Always consult your GP or a qualified healthcare professional before starting any supplement regimen, especially if you are pregnant, breastfeeding, taking medication, or have any health conditions. Parent Helper accepts no liability for decisions made based on this information.`;

  const message = customMessage || defaultMessage;

  if (variant === "inline") {
    return (
      <div className="rounded-lg bg-terracotta/10 p-4 text-sm leading-relaxed text-charcoal/90">
        <span className="mr-1 font-medium">Medical Disclaimer:</span>
        {message}
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="rounded-xl border-2 border-terracotta/40 bg-white p-6 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-lg font-semibold text-charcoal">
            Important Medical Information
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-charcoal/90">{message}</p>
      </div>
    );
  }

  // Default: banner
  return (
    <div className="rounded-2xl border-2 border-terracotta/40 bg-terracotta/10 p-6">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-lg font-semibold text-charcoal">
          Important: Medical Disclaimer
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-charcoal/90">{message}</p>
    </div>
  );
}

