"use client";

interface DocsHealthBlockProps {
  status: "healthy" | "warning" | "broken";
  message: string;
  details?: Record<string, unknown>;
}

export default function DocsHealthBlock({
  status,
  message,
  details,
}: DocsHealthBlockProps) {
  const statusColors = {
    healthy: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    broken: "bg-red-100 text-red-800 border-red-300",
  };

  const statusIcons = {
    healthy: "✓",
    warning: "⚠",
    broken: "✗",
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className="flex items-center gap-2">
        <span className="text-title">{statusIcons[status]}</span>
        <div>
          <div className="font-semibold capitalize">{status}</div>
          <div className="text-small">{message}</div>
        </div>
      </div>
      {details && (
        <div className="mt-3 rounded bg-white/50 p-3 text-small">
          <pre className="whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

