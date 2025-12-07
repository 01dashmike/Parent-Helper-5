"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Copy, Check } from "lucide-react";
import { aiGenerateParentEmailCopy } from "@/app/provider/ai-actions";
import { useToast } from "@/lib/hooks/useToast";

type ParentCommsAssistantProps = {
  onApply?: (data: {
    subjectLine?: string;
    emailBody?: string;
    smsVariant?: string;
  }) => void;
};

export default function ParentCommsAssistant({ onApply }: ParentCommsAssistantProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);
  type CommsResult = {
    subjectLines?: string[];
    emailBody?: string;
    smsVariant?: string;
  };
  const [result, setResult] = useState<CommsResult | null>(null);
  const [eventType, setEventType] = useState<
    "class_update" | "schedule_change" | "term_announcement" | "holiday_special" | "new_class"
  >("class_update");
  const [tone, setTone] = useState<"friendly" | "professional" | "casual">("friendly");
  const [targetAge, setTargetAge] = useState("");
  const [city, setCity] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [holidayType, setHolidayType] = useState<"easter" | "summer" | "christmas" | "half_term" | "">("");

  const handleGenerate = async () => {
    if (!keyPoints.trim()) {
      showError("Please enter at least one key point");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("eventType", eventType);
      formData.append("tone", tone);
      formData.append("keyPoints", keyPoints);
      if (targetAge) formData.append("targetAge", targetAge);
      if (city) formData.append("city", city);
      if (holidayType && eventType === "holiday_special") {
        formData.append("holidayType", holidayType);
      }

      const response = await aiGenerateParentEmailCopy(formData);

      if (response.error) {
        showError(response.error);
        return;
      }

      setResult(response.data);
      showSuccess("Email copy generated!");
    } catch {
      showError("Failed to generate email copy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-sage" />
          <CardTitle>AI Parent Communication Assistant</CardTitle>
        </div>
        <p className="text-sm text-slateSoft mt-2">
          Generate email and SMS copy for parent communications
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={(v: "class_update" | "schedule_change" | "term_announcement" | "holiday_special" | "new_class") => setEventType(v)}>
              <SelectTrigger id="eventType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class_update">Class Update</SelectItem>
                <SelectItem value="schedule_change">Schedule Change</SelectItem>
                <SelectItem value="term_announcement">Term Announcement</SelectItem>
                <SelectItem value="holiday_special">Holiday Special</SelectItem>
                <SelectItem value="new_class">New Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="commsTone">Tone</Label>
            <Select value={tone} onValueChange={(v: "friendly" | "professional" | "casual") => setTone(v)}>
              <SelectTrigger id="commsTone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {eventType === "holiday_special" && (
          <div>
            <Label htmlFor="holidayType">Holiday Type</Label>
            <Select value={holidayType} onValueChange={(v: "easter" | "summer" | "christmas" | "half_term" | "") => setHolidayType(v)}>
              <SelectTrigger id="holidayType">
                <SelectValue placeholder="Select holiday" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easter">Easter</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="christmas">Christmas</SelectItem>
                <SelectItem value="half_term">Half Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="commsTargetAge">Target Age (Optional)</Label>
            <Input
              id="commsTargetAge"
              placeholder="e.g., 0-12 months"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="commsCity">City (Optional)</Label>
            <Input
              id="commsCity"
              placeholder="e.g., London"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="keyPoints">Key Points to Include</Label>
          <Textarea
            id="keyPoints"
            placeholder="Enter key points, one per line:&#10;- Point 1&#10;- Point 2&#10;- Point 3"
            rows={4}
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
          />
          <p className="text-xs text-slateSoft mt-1">
            Enter one key point per line. These will be included in the email.
          </p>
        </div>

        <Button onClick={handleGenerate} disabled={loading || !keyPoints.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Generate Email Copy
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 mt-6">
            {/* Subject Lines */}
            {result.subjectLines && result.subjectLines.length > 0 && (
              <div className="rounded-lg border border-sage/20 bg-white p-4">
                <Label className="text-sm font-semibold mb-2 block">Subject Line Options</Label>
                <div className="space-y-2">
                  {result.subjectLines.map((subject: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-sage/20 p-2"
                    >
                      <p className="text-sm flex-1">{subject}</p>
                      {onApply && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApply({ subjectLine: subject })}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Use
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Body */}
            {result.emailBody && (
              <div className="rounded-lg border border-sage/20 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Email Body</Label>
                  {onApply && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApply({ emailBody: result.emailBody })}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Apply
                    </Button>
                  )}
                </div>
                <Textarea
                  value={result.emailBody}
                  readOnly
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* SMS Variant */}
            {result.smsVariant && (
              <div className="rounded-lg border border-sage/20 bg-blue-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">SMS-Friendly Short Version</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(result.smsVariant);
                      showSuccess("SMS copy copied!");
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{result.smsVariant}</p>
                <p className="text-xs text-slateSoft mt-2">
                  {result.smsVariant.length} characters
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    {ToastComponent}
    </>
  );
}

