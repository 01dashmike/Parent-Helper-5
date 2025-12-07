# AI Tools - Integration Examples

## 📋 Quick Integration Guide

This document shows how to integrate AI tools into existing pages and components.

---

## 🎯 Onboarding Wizard Integration

### Step 2: Business Basics (Tagline)

```tsx
// In your onboarding step 2 component
import OnboardingAiHelpers from "@/components/provider/ai/OnboardingAiHelpers";

export default function BusinessBasicsStep() {
  const [tagline, setTagline] = useState("");

  return (
    <div>
      <Label htmlFor="tagline">Business Tagline</Label>
      <div className="flex gap-2">
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
        <OnboardingAiHelpers
          step="tagline"
          existingData={{
            businessName: formData.businessName,
            category: formData.category,
            city: formData.city,
          }}
          onGenerated={(text) => setTagline(text)}
        />
      </div>
    </div>
  );
}
```

### Step 3: Class Template (Description)

```tsx
import OnboardingAiHelpers from "@/components/provider/ai/OnboardingAiHelpers";

export default function ClassTemplateStep() {
  const [description, setDescription] = useState("");

  return (
    <div>
      <Label htmlFor="description">Class Description</Label>
      <div className="space-y-2">
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
        />
        <OnboardingAiHelpers
          step="description"
          existingData={{
            ageRange: formData.ageRange,
            category: formData.category,
            style: formData.style,
          }}
          onGenerated={(text) => setDescription(text)}
        />
      </div>
    </div>
  );
}
```

### Step 4: Media (Captions)

```tsx
import OnboardingAiHelpers from "@/components/provider/ai/OnboardingAiHelpers";

export default function MediaStep() {
  const [captions, setCaptions] = useState<string[]>([]);

  return (
    <div>
      <Label>Photo Gallery</Label>
      {/* Your photo upload component */}
      
      <div className="mt-4">
        <OnboardingAiHelpers
          step="captions"
          existingData={{
            category: formData.category,
            ageRange: formData.ageRange,
          }}
          onGenerated={(text) => {
            // Parse multiple captions if returned as list
            const captionList = text.split("\n").filter(Boolean);
            setCaptions(captionList);
          }}
        />
      </div>
    </div>
  );
}
```

---

## 📊 Provider Dashboard Integration

### Add Insight Coach Panel

```tsx
// In app/provider/page.tsx or your dashboard component
import InsightCoachPanel from "@/components/provider/ai/InsightCoachPanel";
import { getProviderEntitlements } from "@/lib/monetisation/entitlements";

export default async function ProviderDashboard() {
  const providerId = await getProviderId(); // Your auth logic
  const entitlements = await getProviderEntitlements(providerId);

  return (
    <div>
      {/* Hero metrics */}
      <HeroMetrics providerId={providerId} />

      {/* AI Insight Coach */}
      <div className="mt-6">
        <InsightCoachPanel
          providerId={providerId}
          hasPremiumAnalytics={entitlements.premiumAnalytics}
        />
      </div>

      {/* Rest of dashboard */}
    </div>
  );
}
```

---

## 📝 Class Management Page Integration

### Add AI Assistant Section

```tsx
// In your class edit page
"use client";

import { useState } from "react";
import ClassCopyAssistant from "@/components/provider/ai/ClassCopyAssistant";
import SeoAssistant from "@/components/provider/ai/SeoAssistant";
import ScheduleSuggestionPanel from "@/components/provider/ai/ScheduleSuggestionPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ClassEditPage({ classId }: { classId: number }) {
  const [classData, setClassData] = useState({
    title: "",
    description: "",
    // ... other fields
  });

  return (
    <div className="space-y-6">
      {/* Main class form */}
      <ClassForm data={classData} onChange={setClassData} />

      {/* AI Assistant Section */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
        
        <Tabs defaultValue="copy" className="w-full">
          <TabsList>
            <TabsTrigger value="copy">Class Copy</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="copy">
            <ClassCopyAssistant
              onApply={(data) => {
                setClassData((prev) => ({
                  ...prev,
                  ...data,
                }));
              }}
            />
          </TabsContent>

          <TabsContent value="seo">
            <SeoAssistant
              currentTitle={classData.title}
              currentDescription={classData.description}
              category={classData.category}
              city={classData.town}
              ageRange={classData.ageRange}
              onApply={(data) => {
                setClassData((prev) => ({
                  ...prev,
                  ...data,
                }));
              }}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleSuggestionPanel
              onApply={(suggestion) => {
                setClassData((prev) => ({
                  ...prev,
                  dayOfWeek: suggestion.day,
                  time: suggestion.time,
                  sessionDuration: `${suggestion.duration} minutes`,
                }));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

## 💬 Review Management Integration

```tsx
// In your review management component
import ReviewReplyAssistant from "@/components/provider/ai/ReviewReplyAssistant";

export default function ReviewManagement({ review }: { review: Review }) {
  const [reply, setReply] = useState("");

  return (
    <div className="space-y-4">
      {/* Review display */}
      <ReviewCard review={review} />

      {/* Reply form */}
      <div>
        <Label>Your Reply</Label>
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
        />
      </div>

      {/* AI Assistant */}
      <ReviewReplyAssistant
        reviewText={review.text}
        reviewRating={review.rating}
        onApply={(suggestedReply) => setReply(suggestedReply)}
      />
    </div>
  );
}
```

---

## 📧 Communications Integration

```tsx
// In your communications/announcements page
import ParentCommsAssistant from "@/components/provider/ai/ParentCommsAssistant";

export default function CommunicationsPage() {
  const [emailData, setEmailData] = useState({
    subject: "",
    body: "",
  });

  return (
    <div className="space-y-6">
      {/* Email form */}
      <EmailForm data={emailData} onChange={setEmailData} />

      {/* AI Assistant */}
      <ParentCommsAssistant
        onApply={(data) => {
          setEmailData((prev) => ({
            ...prev,
            subject: data.subjectLine || prev.subject,
            body: data.emailBody || prev.body,
          }));
        }}
      />
    </div>
  );
}
```

---

## 🔧 Helper: Get Provider ID

```tsx
// lib/provider/auth.ts (example)
import { getSupabaseServer } from "@/lib/supabase/server";

export async function getProviderId(): Promise<number | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: providerUser } = await supabase
    .from("providers_users")
    .select("provider_id")
    .eq("user_id", user.id)
    .single();

  return providerUser?.provider_id || null;
}
```

---

## 🎨 Styling Notes

All components use:
- Tailwind CSS classes
- shadcn/ui components
- Consistent spacing and colors
- Responsive design

No additional CSS needed - components are self-contained.

---

## ⚠️ Important Notes

1. **Server Actions Only**: All AI calls use server actions, never client-side API calls
2. **Error Handling**: Always wrap AI calls in try/catch and show user-friendly errors
3. **Loading States**: Show loading indicators during generation
4. **Apply Buttons**: Make it clear what will be applied and allow editing
5. **Rate Limiting**: Handle rate limit errors gracefully with upgrade CTAs

---

## 🚀 Next Steps

1. **Wire into onboarding wizard** - Add `OnboardingAiHelpers` to each step
2. **Add to dashboard** - Include `InsightCoachPanel` below hero metrics
3. **Add to class pages** - Create AI Assistant section with tabs
4. **Add to reviews** - Include `ReviewReplyAssistant` in review management
5. **Add to communications** - Include `ParentCommsAssistant` in email/SMS flows

All components are ready to use - just import and add to your pages!





