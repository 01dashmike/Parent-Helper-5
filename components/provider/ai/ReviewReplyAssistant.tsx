"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Copy, Check } from "lucide-react";
import { aiSuggestReviewReply } from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";

type ReviewReplyAssistantProps = {
  reviewText: string;
  reviewRating?: number;
  onApply?: (reply: string) => void;
};

export default function ReviewReplyAssistant({
  reviewText,
  reviewRating,
  onApply,
}: ReviewReplyAssistantProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<"grateful" | "neutral" | "professional" | "apologetic">("professional");
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setReply("");

    try {
      const formData = new FormData();
      formData.append("reviewText", reviewText);
      formData.append("tone", tone);
      if (reviewRating) formData.append("reviewRating", reviewRating.toString());

      const response = await aiSuggestReviewReply(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setReply(response.data?.reply ?? "");
      showSuccess("Reply generated!");
    } catch {
      showError("Failed to generate reply");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-sage" />
          <CardTitle>AI Review Reply Assistant</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Display */}
        <div className="rounded-lg border border-sage/20 bg-cream/30 p-4">
          <Label className="text-sm font-semibold mb-2 block">Review</Label>
          {reviewRating && (
            <div className="mb-2">
              <span className="text-sm font-medium">Rating: {reviewRating}/5</span>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{reviewText}</p>
        </div>

        {/* Tone Selection */}
        <div>
          <Label htmlFor="replyTone">Reply Tone</Label>
          <Select value={tone} onValueChange={(v: "grateful" | "neutral" | "professional" | "apologetic") => setTone(v)}>
            <SelectTrigger id="replyTone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grateful">Grateful (for positive reviews)</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="apologetic">Apologetic (for negative reviews)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={loading || !reviewText.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Reply...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Generate Reply
            </>
          )}
        </Button>

        {reply && (
          <div className="rounded-lg border border-sage/20 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Suggested Reply</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
                {onApply && (
                  <Button size="sm" onClick={() => onApply(reply)}>
                    Apply to Reply
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slateSoft">
              You can edit the reply before applying. Always review AI-generated content for accuracy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    {ToastComponent}
    </>
  );
}

