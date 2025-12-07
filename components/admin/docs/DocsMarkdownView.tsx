"use client";

import { useRef } from "react";
import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

interface DocsMarkdownViewProps {
  content: string;
  className?: string;
}

export default function DocsMarkdownView({
  content,
  className = "",
}: DocsMarkdownViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 text-title font-bold text-charcoal">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 text-title font-semibold text-charcoal">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-title font-medium text-charcoal">{children}</h3>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-small font-mono text-charcoal">
                {children}
              </code>
            ) : (
              <code className="block rounded bg-gray-900 p-4 text-small text-gray-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded bg-gray-900 p-4">{children}</pre>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc space-y-1 text-charcoal">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-1 text-charcoal">{children}</ol>
          ),
          p: ({ children }) => <p className="mb-3 text-charcoal">{children}</p>,
          a: ({ href, children }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-blue-600 hover:underline"
                {...(isExternal ? { "aria-label": `${children} (opens in new tab)` } : {})}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

