"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { isAIPerformanceCoachEnabled } from "@/lib/env";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface Props {
    role?: "admin" | "provider";
}

export default function PerformanceCoach({ role = "provider" }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-detect role from pathname if not provided
    const pathname = usePathname();
    const detectedRole = role || (pathname?.startsWith("/admin") ? "admin" : "provider");

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const sendMessage = useCallback(async (query: string) => {
        if (!query.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: query,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/ai/coach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    role: detectedRole,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I couldn't process your request. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    }, [detectedRole, loading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        // Clear existing timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Set new timer for debouncing (1.5s delay)
        const timer = setTimeout(() => {
            // Auto-send if user stops typing (optional feature)
            // For now, we'll just debounce the input
        }, 1500);

        setDebounceTimer(timer);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            setDebounceTimer(null);
        }
        sendMessage(input);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (!isAIPerformanceCoachEnabled()) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white shadow-lg transition hover:bg-sage/90 hover:scale-110"
                aria-label="Ask the Coach"
            >
                <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 md:items-center md:justify-end">
                    <div className="flex h-[600px] w-full flex-col rounded-t-2xl bg-white shadow-xl md:h-[500px] md:w-[400px] md:rounded-2xl md:mr-6 md:mb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-sage/20 px-4 py-3">
                            <div>
                                <h3 className="text-title font-semibold text-charcoal">💬 Performance Coach</h3>
                                <p className="text-small text-slateSoft">
                                    Ask about your {detectedRole === "admin" ? "metrics" : "bookings, revenue, or referrals"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="min-h-11 min-w-11 flex items-center justify-center rounded-full p-1 text-slateSoft transition hover:bg-cream md:min-h-0 md:min-w-0"
                                aria-label="Close performance coach"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-center text-charcoal/70">
                                        <p className="mb-2 text-small font-medium">Welcome! 👋</p>
                                        <p className="text-small">
                                            Ask me anything about your {detectedRole === "admin" ? "platform metrics" : "performance"}
                                        </p>
                                        <p className="mt-4 text-small text-slateSoft">
                                            Try: &quot;How can I increase bookings next week?&quot;
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                                    message.role === "user"
                                                        ? "bg-sage text-white"
                                                        : "bg-cream text-charcoal"
                                                }`}
                                            >
                                                <p className="text-small whitespace-pre-wrap">{message.content}</p>
                                                <p className="mt-1 text-small opacity-70">
                                                    {message.timestamp.toLocaleTimeString("en-GB", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start" role="status" aria-live="polite">
                                            <div className="rounded-2xl bg-cream px-4 py-2">
                                                <Loader2 className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-none text-sage" aria-hidden="true" />
                                                <VisuallyHidden>Loading performance coach response...</VisuallyHidden>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="border-t border-sage/20 p-4">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about your bookings, revenue, or referrals..."
                                    className="flex-1 rounded-full border border-sage/20 px-4 py-2 text-small text-charcoal placeholder:text-slateSoft focus:border-sage focus:outline-none"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    aria-busy={loading ? "true" : "false"}
                                    className="rounded-full bg-sage p-2 text-white transition hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Send"
                                >
                                    {loading ? (
                                        <span role="status" aria-live="polite" className="inline-flex items-center">
                                            <Loader2 className="h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                            <VisuallyHidden>Sending message...</VisuallyHidden>
                                        </span>
                                    ) : (
                                        <Send className="h-5 w-5" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

