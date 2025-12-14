import { Metadata } from "next";
import { requireAdminServerComponent } from "@/lib/admin/auth-improved";
import AccountabilityEmailList from "@/components/admin/wellness/AccountabilityEmailList";

export const metadata: Metadata = {
  title: "Accountability Emails | Wellness Admin | Parent Helper",
  description: "Manage accountability email templates",
  robots: "noindex, nofollow",
};

export default async function AccountabilityEmailsPage() {
  await requireAdminServerComponent();

  return (
    <div className="min-h-screen bg-cream px-4 py-10 text-charcoal">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Accountability Emails</h1>
          <p className="text-slateSoft text-sm">
            Create and manage accountability email templates for wellness users
          </p>
        </header>
        
        <AccountabilityEmailList />
      </div>
    </div>
  );
}
