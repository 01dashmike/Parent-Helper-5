import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health & Wellness Hub | Parent Helper",
  description:
    "Personalized wellness tools for families. Get meal plans, exercise routines, supplement suggestions, and product safety checks.",
};

export default function WellnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      {children}
    </div>
  );
}
