"use client";

import { useState } from "react";
import SupplementWizard from "./SupplementWizard";
import SupplementResults from "./SupplementResults";
import type { Audience, SupplementResult } from "@/lib/wellness/types";

interface SupplementClientProps {
  audience: Audience;
}

export default function SupplementClient({ audience }: SupplementClientProps) {
  const [supplementResult, setSupplementResult] = useState<SupplementResult | null>(null);

  return (
    <div className="space-y-8">
      {!supplementResult ? (
        <SupplementWizard
          audience={audience}
          onComplete={(result) => setSupplementResult(result)}
        />
      ) : (
        <SupplementResults
          supplementResult={supplementResult}
          audience={audience}
          onStartOver={() => setSupplementResult(null)}
        />
      )}
    </div>
  );
}
