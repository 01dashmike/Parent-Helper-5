import { ReactNode, Children } from "react";

interface CustomBlockquoteProps {
  children?: ReactNode;
}

/**
 * Custom blockquote component that extracts and displays quote source attribution.
 * Supports patterns like:
 * - "quote text" - Source Name
 * - **Expert Insight:** quote text
 * - **Tip:** quote text
 * - Regular blockquote without attribution
 */
export default function CustomBlockquote({ children }: CustomBlockquoteProps) {
  if (!children) return null;

  // Convert children to string for parsing patterns
  const extractTextContent = (node: ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) {
      return node.map(extractTextContent).join(" ");
    }
    if (node && typeof node === "object" && "props" in node) {
      return extractTextContent(node.props.children);
    }
    return "";
  };

  const textContent = extractTextContent(children).trim();
  let sourceText: string | null = null;
  let hasSourceAttribution = false;

  // Pattern 1: "quote" - Source Name (em dash, en dash, or hyphen)
  const dashPattern = /^["']?([^"']+)["']?\s*[-—–]\s*(.+)$/;
  const dashMatch = textContent.match(dashPattern);
  if (dashMatch) {
    sourceText = dashMatch[2].trim();
    hasSourceAttribution = true;
  }

  // Pattern 2: Check last paragraph for source pattern (common in markdown)
  // Look for patterns like "— Source" or "- Source" at the end
  const childrenArray = Children.toArray(children);
  if (childrenArray.length > 0) {
    const lastChild = childrenArray[childrenArray.length - 1];
    const lastText = extractTextContent(lastChild);
    const sourcePattern = /\s*[-—–]\s*(.+)$/;
    const sourceMatch = lastText.match(sourcePattern);
    if (sourceMatch && !hasSourceAttribution) {
      sourceText = sourceMatch[1].trim();
      hasSourceAttribution = true;
    }
  }

  return (
    <blockquote className="border-l-4 border-[#C97C5C] bg-[#F5F3F0] py-2 px-4 rounded-r-lg not-italic text-[#3A3A3A]/80">
      <div className="prose prose-neutral max-w-none prose-p:text-[#3A3A3A]/90 prose-p:leading-relaxed">
        {children}
      </div>
      {sourceText && (
        <footer className="mt-3 text-sm italic text-[#3A3A3A]/70 border-t border-[#C97C5C]/20 pt-2">
          <cite className="not-italic">— {sourceText}</cite>
        </footer>
      )}
    </blockquote>
  );
}

