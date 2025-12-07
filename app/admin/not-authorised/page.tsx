import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotAuthorisedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Access Denied</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            You don&apos;t have permission to access the admin console.
          </p>
        </div>
        <div className="rounded-lg border border-sage/30 bg-white p-6">
          <p className="text-sm text-charcoal/70 mb-4">
            Admin access requires a user account with the &quot;admin&quot; role in the database.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href="/">Go to Home</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/login">Try Different Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
