"use client";

import { useState } from "react";
import DocsMarkdownView from "./DocsMarkdownView";

interface PromptFile {
  name: string;
  path: string;
  content: string;
  lastModified: Date;
}

interface DocsPromptLibraryProps {
  prompts: PromptFile[];
}

export default function DocsPromptLibrary({ prompts }: DocsPromptLibraryProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptFile | null>(
    prompts.length > 0 ? prompts[0] : null
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (prompts.length === 0) {
    return (
      <div className="text-center text-slateSoft">
        <p>No prompt files found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h3 className="mb-3 text-small font-semibold text-charcoal">Prompts</h3>
        <div className="space-y-1">
          {prompts.map((prompt) => (
            <button
              key={prompt.path}
              onClick={() => setSelectedPrompt(prompt)}
              className={`w-full rounded border px-3 py-2 text-left text-small transition ${
                selectedPrompt?.path === prompt.path
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-charcoal hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">{prompt.name}</div>
              <div className="mt-1 text-small text-slateSoft">
                {new Date(prompt.lastModified).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        {selectedPrompt ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-title font-semibold text-charcoal">
                {selectedPrompt.name}
              </h3>
              <button
                onClick={() => copyToClipboard(selectedPrompt.content)}
                className="rounded bg-blue-600 px-4 py-2 text-small text-white hover:bg-blue-700"
              >
                Send to Composer
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto rounded border border-gray-200 bg-gray-50 p-4">
              <DocsMarkdownView content={selectedPrompt.content} />
            </div>
          </div>
        ) : (
          <div className="text-center text-slateSoft">
            <p>Select a prompt to view</p>
          </div>
        )}
      </div>
    </div>
  );
}

