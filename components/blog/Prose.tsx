import { ReactNode } from "react";

export default function Prose({ children }: { children: ReactNode }) {
  return (
    <article className="prose prose-neutral prose-headings:text-charcoal prose-a:text-sage prose-strong:text-charcoal max-w-none">
      {children}
    </article>
  );
}
