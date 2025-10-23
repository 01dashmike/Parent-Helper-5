"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const placeholderAnswer =
  "I'm Parent Helper's AI guide. Ask me about baby classes, toddler clubs, or parent support.";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: placeholderAnswer },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble finding an answer. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="w-80 rounded-3xl bg-white shadow-2xl ring-1 ring-brand-sage/40 sm:w-96">
          <header className="rounded-t-3xl bg-brand-teal px-4 py-3 text-white">
            <h3 className="text-sm font-semibold">Parent Helper Assistant</h3>
            <p className="text-xs text-white/80">Ask me about classes, clubs, or support.</p>
          </header>
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto px-4 py-4 text-sm text-brand-midnight">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-2xl px-3 py-2 ${
                  message.role === "assistant"
                    ? "bg-brand-sage/40 text-brand-midnight"
                    : "ml-auto bg-brand-coral text-white"
                }`}
              >
                {message.content.split("\n").map((line, lineIndex) => (
                  <p key={lineIndex} className="whitespace-pre-line">
                    {line}
                  </p>
                ))}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-2xl bg-brand-sage/30 px-3 py-2 text-brand-midnight/80">
                Searching for the best options…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-brand-sage/30 px-4 py-3"
          >
            <label htmlFor="chatbot-question" className="sr-only">
              Ask a question
            </label>
            <input
              id="chatbot-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about classes…"
              className="flex-1 rounded-full border border-brand-sage/50 px-3 py-2 text-sm text-brand-midnight shadow-sm focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-teal px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white ring-brand-sage hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-full bg-brand-teal px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors duration-300 hover:bg-brand-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        {isOpen ? "Close" : "Ask Parent Helper"}
      </motion.button>
    </div>
  );
}
