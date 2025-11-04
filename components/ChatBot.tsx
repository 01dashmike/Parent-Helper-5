"use client";

import Image from "next/image";
import { useState } from "react";

function ChatWindow({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-sage/30 bg-cream p-4 text-sm text-charcoal shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Parent Helper" width={24} height={24} className="h-6 w-auto rounded-md" />
          <p className="font-semibold text-charcoal">Need a hand?</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-charcoal/60 transition hover:text-charcoal"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>
      <p className="text-charcoal/70">
        Ask the Parent Helper assistant about classes, categories, or how to get started. We&apos;ll guide you
        to the right resources in a warm, friendly tone.
      </p>
      <textarea
        className="mt-3 h-24 w-full resize-none rounded-xl border border-sage/30 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-sage/60 focus:outline-none"
        placeholder="Type a question..."
      />
      <button
        type="button"
        className="mt-3 inline-flex items-center justify-center rounded-full bg-sage px-4 py-2 text-sm font-medium text-white transition hover:bg-sage/90 hover:text-[#C97C5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
      >
        Send
      </button>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && <ChatWindow onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-sage/30 bg-white/90 px-4 py-2 text-sm font-medium text-charcoal shadow-soft transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
      >
        <Image src="/images/logo.png" alt="Parent Helper" width={20} height={20} className="h-5 w-auto" />
        {open ? "Close chat" : "Ask Parent Helper"}
      </button>
    </div>
  );
}
