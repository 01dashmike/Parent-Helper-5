import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
import { createClient } from "@supabase/supabase-js";
import AccountabilityEmailEditor from "@/components/admin/wellness/AccountabilityEmailEditor";

export const metadata: Metadata = {
  title: "Edit Accountability Email | Wellness Admin | Parent Helper",
  description: "Edit an accountability email template",
  robots: "noindex, nofollow",
};

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function EditAccountabilityEmailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminServerComponent();
  
  const { id } = await params;

  // Fetch template
  const { data: template, error } = await supabase
    .from("wellness_accountability_emails")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Edit Accountability Email</h1>
          <p className="text-slateSoft text-sm">
            Update the email template for wellness accountability emails
          </p>
        </header>
        
        <AccountabilityEmailEditor 
          mode="edit" 
          initialData={{
            id: template.id,
            title: template.title,
            subject: template.subject,
            body_html: template.body_html,
            body_text: template.body_text,
            email_type: template.email_type,
            frequency: template.frequency,
            is_active: template.is_active,
            scheduled_send_day: template.scheduled_send_day,
          }}
        />
      </div>
    </div>
  );
}
