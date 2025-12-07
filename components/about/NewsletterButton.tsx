"use client";

import LinkComponent from "@/components/ui/link";

interface NewsletterButtonProps {
  className?: string;
}

export function NewsletterButton({ className }: NewsletterButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("newsletter:open", { detail: { source: "about" } })
      );
    }
  };

  return (
    <LinkComponent
      href="#newsletter"
      className={className}
      onClick={handleClick}
    >
      Join Newsletter
    </LinkComponent>
  );
}

