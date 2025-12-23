import { Metadata } from "next";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
import AccountabilityEmailEditor from "@/components/admin/wellness/AccountabilityEmailEditor";

export const metadata: Metadata = {
  title: "Create Accountability Email | Wellness Admin | Parent Helper",
  description: "Create a new accountability email template",
  robots: "noindex, nofollow",
};

export default async function CreateAccountabilityEmailPage() {
  await requireAdminServerComponent();

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Create Accountability Email</h1>
          <p className="text-slateSoft text-sm">
            Create a new email template for wellness accountability emails
          </p>
        </header>
        
        <AccountabilityEmailEditor mode="create" />
      </div>
    </div>
  );
}
