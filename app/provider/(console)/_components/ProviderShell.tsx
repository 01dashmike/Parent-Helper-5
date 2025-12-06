"use client";
import Link from "next/link";
import { ReactNode, useMemo, memo } from "react";
import { usePathname } from "next/navigation";
import { signOutAction } from "../../(auth)/actions";
import { ProviderSession, ProviderSessionProvider } from "./ProviderContext";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/provider", label: "Overview" },
  { href: "/provider/classes", label: "Classes" },
  { href: "/provider/venues", label: "Venues" },
  ...(process.env.NEXT_PUBLIC_PROVIDER_REFERRALS_ENABLED === "true"
    ? [{ href: "/provider/referrals", label: "Referrals" }]
    : []),
  ...(process.env.NEXT_PUBLIC_PROVIDER_ANALYTICS_ENABLED === "true"
    ? [{ href: "/provider/analytics", label: "Analytics" }]
    : []),
  { href: "/provider/marketing", label: "Marketing Booster" },
  { href: "/provider/verification", label: "Verification" },
];

const ProviderHeader = memo(({ session }: { session: ProviderSession }) => (
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    <div>
      <p className="text-small uppercase tracking-wide text-sage/70">Provider console</p>
      <h1 className="text-lg font-semibold text-charcoal">{session.provider.name}</h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right text-small text-charcoal/70">
        <p className="font-medium text-sm text-charcoal">{session.user.email ?? "—"}</p>
        <p className="capitalize">{session.membership.role}</p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-md border border-sage/50 px-3 py-1.5 text-sm font-medium text-charcoal transition hover:border-sage hover:bg-sage/10"
        >
          Sign out
        </button>
      </form>
    </div>
  </div>
));

ProviderHeader.displayName = "ProviderHeader";

const ProviderNav = memo(({ pathname }: { pathname: string }) => {
  const navItems = useMemo(() => {
    return NAV_ITEMS.map((item) => {
      const isActive = pathname === item.href;
      return { ...item, isActive };
    });
  }, [pathname]);

  return (
    <nav aria-label="Provider console navigation" className="border-t border-sage/20 bg-white/70">
      <ul className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3 text-sm font-medium text-charcoal/70">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`rounded-md px-2 py-1 transition ${item.isActive
                  ? "bg-sage/20 text-charcoal"
                  : "hover:bg-sage/10 hover:text-charcoal"
                }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
});

ProviderNav.displayName = "ProviderNav";

export function ProviderShell({
  session,
  children,
}: {
  session: ProviderSession;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProviderSessionProvider value={session}>
      <div className="min-h-screen bg-cream/30">
        <header className="border-b border-sage/30 bg-white/80 backdrop-blur">
          <ProviderHeader session={session} />
          <ProviderNav pathname={pathname ?? ""} />
        </header>
        <div className="mx-auto w-full max-w-7xl px-6 py-10">{children}</div>
      </div>
    </ProviderSessionProvider>
  );
}

