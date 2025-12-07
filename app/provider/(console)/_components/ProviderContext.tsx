"use client";

import { createContext, useContext, useMemo, memo } from "react";

export type ProviderSession = {
  provider: {
    id: number;
    name: string;
    slug: string | null;
  };
  membership: {
    role: string;
    status: string;
  };
  user: {
    id: string;
    email: string | null;
  };
};

const ProviderSessionContext = createContext<ProviderSession | null>(null);

export const ProviderSessionProvider = memo(({
  value,
  children,
}: {
  value: ProviderSession;
  children: React.ReactNode;
}) => {
  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [
    value.provider.id,
    value.provider.name,
    value.provider.slug,
    value.membership.role,
    value.membership.status,
    value.user.id,
    value.user.email,
  ]);

  return (
    <ProviderSessionContext.Provider value={memoizedValue}>
      {children}
    </ProviderSessionContext.Provider>
  );
});

ProviderSessionProvider.displayName = "ProviderSessionProvider";

export function useProviderSession() {
  const context = useContext(ProviderSessionContext);
  if (!context) {
    throw new Error("useProviderSession must be used within ProviderSessionProvider");
  }
  return context;
}

