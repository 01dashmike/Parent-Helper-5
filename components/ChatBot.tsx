"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { safeImage } from "@/lib/images";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { IconButton } from "@/components/ui/buttons";
import { Button } from "@/components/ui/button";

// Parse markdown links and render them as clickable Next.js Links
function renderMessageWithLinks(content: string): React.ReactNode {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the link
    const [, linkText, linkUrl] = match;
    parts.push(
      <Link
        key={match.index}
        href={linkUrl}
        className="font-medium text-sage underline hover:text-forest"
      >
        {linkText}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last link
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : content;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  onClose: () => void;
}

function ChatWindow({ onClose }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setError(null);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/send/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="absolute bottom-14 right-0 flex max-h-[calc(100vh-8rem)] w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-accent/30 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sage/20 p-4">
        <div className="flex items-center gap-2">
          {(() => {
            const { src, alt } = safeImage({ src: "/images/logo.png", alt: "Parent Helper" });
            return <Image src={src} alt={alt} width={24} height={24} className="h-6 w-auto rounded-md" />;
          })()}
          <p className="font-semibold text-primary">Need a hand?</p>
        </div>
        <IconButton
          icon={<span aria-hidden="true">×</span>}
          aria-label="Close chat"
          variant="ghost"
          onClick={onClose}
        />
      </div>

      {/* Messages area */}
      <div className="min-h-[120px] flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-small text-text-tertiary">
            Ask me about classes, wellness, nutrition, or anything to help your family thrive!
          </p>
        )}
        
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-small ${
                  msg.role === "user"
                    ? "bg-sage text-white"
                    : "bg-cream text-charcoal"
                }`}
              >
                {msg.role === "assistant" ? renderMessageWithLinks(msg.content) : msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl bg-cream px-3 py-2 text-small text-charcoal">
                <span className="inline-flex items-center gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="border-t border-terracotta/30 bg-terracotta/10 px-4 py-2">
          <p className="text-small text-terracotta">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-sage/20 p-4">
        <VisuallyHidden as="label" htmlFor="chat-input">
          Ask a question
        </VisuallyHidden>
        <textarea
          id="chat-input"
          className="h-16 w-full resize-none rounded-xl border border-sage/30 bg-white px-3 py-2 text-small placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          placeholder="Type a question..."
          aria-label="Ask the Parent Helper assistant a question"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Button
          className="mt-2 w-full"
          aria-label="Send message"
          onClick={sendMessage}
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && <ChatWindow onClose={() => setOpen(false)} />}
      <div className="flex justify-end">
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
    </div>
  );
}
