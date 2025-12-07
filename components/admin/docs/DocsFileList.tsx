"use client";

import { useState } from "react";
import DocsMarkdownView from "./DocsMarkdownView";

interface FileItem {
  name: string;
  path: string;
  content: string;
  lastModified: Date;
}

interface DocsFileListProps {
  files: FileItem[];
  title?: string;
}

export default function DocsFileList({ files, title }: DocsFileListProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(
    files.length > 0 ? files[0] : null
  );

  if (files.length === 0) {
    return (
      <div className="text-center text-slateSoft">
        <p>No files found in this directory.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h3 className="mb-3 text-small font-semibold text-charcoal">
          {title || "Files"}
        </h3>
        <div className="space-y-1">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full rounded border px-3 py-2 text-left text-small transition ${
                selectedFile?.path === file.path
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-charcoal hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">{file.name}</div>
              <div className="mt-1 text-small text-slateSoft">
                {new Date(file.lastModified).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        {selectedFile ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-title font-semibold text-charcoal">
                {selectedFile.name}
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedFile.content);
                }}
                className="rounded bg-gray-100 px-3 py-1 text-small text-charcoal hover:bg-gray-200"
              >
                Copy
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto rounded border border-gray-200 bg-gray-50 p-4">
              <DocsMarkdownView content={selectedFile.content} />
            </div>
          </div>
        ) : (
          <div className="text-center text-slateSoft">
            <p>Select a file to view</p>
          </div>
        )}
      </div>
    </div>
  );
}

