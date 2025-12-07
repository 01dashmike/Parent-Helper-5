"use client";

import { safeWindow } from "@/lib/utils/browser";

interface NewsletterButtonProps {
  source?: string;
}

export function NewsletterButton({ source = "blog" }: NewsletterButtonProps) {
  const handleClick = () => {
    const win = safeWindow();
    if (win) {
      win.dispatchEvent(new CustomEvent("newsletter:open", { detail: { source } }));
    }
  };

  return (
    <button
      type="button"
      className="mt-4 rounded-full bg-sage px-6 py-2 text-small font-medium text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
      onClick={handleClick}
    >
      Open newsletter sign-up
    </button>
  );
}

