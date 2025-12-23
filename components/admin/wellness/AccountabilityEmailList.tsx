"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EmailTemplate = {
  id: string;
  title: string;
  subject: string;
  email_type: "diet" | "exercise" | "supplements" | "general";
  frequency: "weekly" | "biweekly" | "monthly";
  is_active: boolean;
  created_at: string;
};

export default function AccountabilityEmailList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/wellness/emails");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this email template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/wellness/emails/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/wellness/emails/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update template");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
        <p className="text-charcoal/70">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-800">{error}</p>
        <Button onClick={fetchTemplates} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => router.push("/admin/wellness/emails/create")}
          className="bg-sage hover:bg-sage/90"
        >
          + Create New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-soft">
          <p className="mb-4 text-lg text-charcoal/70">
            No accountability email templates yet
          </p>
          <Button
            onClick={() => router.push("/admin/wellness/emails/create")}
            className="bg-sage hover:bg-sage/90"
          >
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl bg-white p-6 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-charcoal">
                      {template.title}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        template.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-sage/10 px-3 py-1 text-xs font-medium text-sage">
                      {template.email_type}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {template.frequency}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-charcoal/70">
                    <strong>Subject:</strong> {template.subject}
                  </p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleToggleActive(template.id, template.is_active)}
                    variant="outline"
                    size="sm"
                  >
                    {template.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    onClick={() => router.push(`/admin/wellness/emails/${template.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(template.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
