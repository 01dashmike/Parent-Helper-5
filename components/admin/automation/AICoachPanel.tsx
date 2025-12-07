"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PerformanceCoach from "@/components/ai/PerformanceCoach";

export default function AICoachPanel() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const examplePrompts = [
    "Summarize last week's growth",
    "Top 3 cities by revenue",
    "Forecast next month's trends",
    "What are the biggest opportunities?",
    "Compare this month vs last month",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title font-semibold text-charcoal">AI Performance Coach</h2>
        <p className="text-small text-slateSoft mt-1">
          Ask questions about your growth metrics and get AI-powered insights
        </p>
      </div>

      {/* Example Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sage" />
            Quick Prompts
          </CardTitle>
          <CardDescription>
            Click a prompt to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                onClick={() => setSelectedPrompt(prompt)}
                className={selectedPrompt === prompt ? "bg-sage/10 border-sage" : ""}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Coach */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sage" />
            Chat with AI Coach
          </CardTitle>
          <CardDescription>
            Ask questions about your growth metrics, trends, and opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceCoach role="admin" />
        </CardContent>
      </Card>
    </div>
  );
}
