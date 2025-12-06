"use client";

import { useState } from "react";
import Image from "next/image";
import { safeImage } from "@/lib/images";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { IconButton } from "@/components/ui/buttons";
import { Button } from "@/components/ui/button";

interface ChatWindowProps {
  onClose: () => void;
}

function ChatWindow({ onClose }: ChatWindowProps) {
  return (
    <div className="mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-accent/30 bg-surface p-section text-small text-primary shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(() => {
            const { src, alt } = safeImage({ src: "/images/logo.png", alt: "Parent Helper" });
            return <Image src={src} alt={alt} width={24} height={24} className="h-6 w-auto rounded-md" />;
          })()}
          <p className="font-semibold text-primary">Need a hand?</p>
        </div>
        <IconButton
          icon={<span aria-hidden="true">✕</span>}
          aria-label="Close chat"
          variant="ghost"
          onClick={onClose}
        />
      </div>
      <p className="text-text-tertiary">
        Ask the Parent Helper assistant about classes, categories, or how to get started. We&apos;ll guide you
        to the right resources in a warm, friendly tone.
      </p>
      <VisuallyHidden as="label">
        Ask a question
      </VisuallyHidden>
      <textarea
        className="mt-3 h-24 resize-none rounded-xl border border-sage/30 bg-white px-3 py-2 text-small placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        placeholder="Type a question..."
        aria-label="Ask the Parent Helper assistant a question"
      />
      <Button
        className="mt-3"
        aria-label="Send message"
      >
        Send
      </Button>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && <ChatWindow onClose={() => setOpen(false)} />}
      <Button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        size="default"
        variant="outline"
        className="gap-2 border-sage/30 bg-white/90 text-charcoal shadow-soft hover:bg-white"
        aria-label={open ? "Close chat window" : "Open chat window"}
        aria-expanded={open}
      >
        {(() => {
          const { src } = safeImage({ src: "/images/logo.png", alt: "Parent Helper" });
          return <Image src={src} alt="" width={20} height={20} className="h-5 w-auto" aria-hidden="true" role="presentation" />;
        })()}
        <span>{open ? "Close chat" : "Ask Parent Helper"}</span>
      </Button>
    </div>
  );
}
