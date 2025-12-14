import { ReactNode } from "react";

const PROSE_CLASSES = `prose prose-neutral max-w-none prose-headings:text-[#3A3A3A] prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#9CAF88]/30 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-[#3A3A3A]/90 prose-a:text-[#9CAF88] prose-a:no-underline hover:prose-a:text-[#C97C5C] hover:prose-a:underline prose-strong:text-[#3A3A3A] prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-[#C97C5C] prose-blockquote:bg-[#F5F3F0] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-[#3A3A3A]/80 prose-ul:marker:text-[#9CAF88] prose-ol:marker:text-[#9CAF88] prose-li:my-1 prose-p:text-[#3A3A3A]/90 prose-p:leading-relaxed prose-img:rounded-lg prose-img:shadow-md`;

export default function Prose({ children }: { children: ReactNode }) {
  return (
    <article className={PROSE_CLASSES}>
      {children}
    </article>
  );
}
