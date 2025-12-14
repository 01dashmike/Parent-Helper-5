"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmailType = "diet" | "exercise" | "supplements" | "general";
type Frequency = "weekly" | "biweekly" | "monthly";

type EmailTemplateData = {
  title: string;
  subject: string;
  body_html: string;
  body_text: string;
  email_type: EmailType;
  frequency: Frequency;
  is_active: boolean;
  scheduled_send_day?: number;
};

interface AccountabilityEmailEditorProps {
  initialData?: Partial<EmailTemplateData> & { id?: string };
  mode: "create" | "edit";
}

export default function AccountabilityEmailEditor({
  initialData,
  mode,
}: AccountabilityEmailEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmailTemplateData>({
    title: initialData?.title || "",
    subject: initialData?.subject || "",
    body_html: initialData?.body_html || "",
    body_text: initialData?.body_text || "",
    email_type: initialData?.email_type || "general",
    frequency: initialData?.frequency || "weekly",
    is_active: initialData?.is_active ?? true,
    scheduled_send_day: initialData?.scheduled_send_day,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url =
        mode === "create"
          ? "/api/admin/wellness/emails"
          : `/api/admin/wellness/emails/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save template");
      }

      router.push("/admin/wellness/emails");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="mb-6 text-xl font-semibold text-charcoal">
          Template Details
        </h3>

        <div className="space-y-6">
          <FormField label="Template Title" required id="title">
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Weekly Diet Check-in"
              required
            />
          </FormField>

          <FormField label="Email Subject" required id="subject">
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="e.g., How's your diet going this week?"
              required
            />
            <p className="mt-1 text-xs text-charcoal/60">
              Variables: {`{{email}}`}, {`{{unsubscribe_url}}`}
            </p>
          </FormField>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Email Type" required id="email_type">
              <select
                id="email_type"
                value={formData.email_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email_type: e.target.value as EmailType,
                  })
                }
                className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
                required
              >
                <option value="diet">Diet</option>
                <option value="exercise">Exercise</option>
                <option value="supplements">Supplements</option>
                <option value="general">General</option>
              </select>
            </FormField>

            <FormField label="Frequency" required id="frequency">
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: e.target.value as Frequency,
                  })
                }
                className="w-full rounded-lg border border-sage/30 px-4 py-2 focus:border-sage focus:outline-none"
                required
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </FormField>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-sage/30 text-sage focus:ring-sage"
            />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Template is active
            </Label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="mb-6 text-xl font-semibold text-charcoal">
          Email Content
        </h3>

        <div className="space-y-6">
          <FormField label="HTML Body" required id="body_html">
            <textarea
              id="body_html"
              value={formData.body_html}
              onChange={(e) =>
                setFormData({ ...formData, body_html: e.target.value })
              }
              placeholder="<p>Hi there!</p><p>How's your wellness journey going this week?</p>"
              className="min-h-[300px] w-full rounded-lg border border-sage/30 px-4 py-2 font-mono text-sm focus:border-sage focus:outline-none"
              required
            />
            <p className="mt-1 text-xs text-charcoal/60">
              HTML content for the email body. Header and footer will be added
              automatically.
            </p>
          </FormField>

          <FormField label="Text Body" required id="body_text">
            <textarea
              id="body_text"
              value={formData.body_text}
              onChange={(e) =>
                setFormData({ ...formData, body_text: e.target.value })
              }
              placeholder="Hi there!&#10;&#10;How's your wellness journey going this week?"
              className="min-h-[200px] w-full rounded-lg border border-sage/30 px-4 py-2 font-mono text-sm focus:border-sage focus:outline-none"
              required
            />
            <p className="mt-1 text-xs text-charcoal/60">
              Plain text version for email clients that don't support HTML.
            </p>
          </FormField>
        </div>
      </div>

      <div className="rounded-2xl bg-sage/10 p-6">
        <h3 className="mb-4 text-lg font-semibold text-charcoal">
          Available Variables
        </h3>
        <ul className="space-y-2 text-sm text-charcoal/80">
          <li>
            <code className="rounded bg-white px-2 py-1">{`{{email}}`}</code> -
            Recipient's email address
          </li>
          <li>
            <code className="rounded bg-white px-2 py-1">{`{{unsubscribe_url}}`}</code>{" "}
            - Unsubscribe link
          </li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-sage hover:bg-sage/90"
        >
          {loading
            ? "Saving..."
            : mode === "create"
              ? "Create Template"
              : "Update Template"}
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/admin/wellness/emails")}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
