import "server-only";

export type ActiveMembership = {
  plan: string | null;
  status: "active" | "inactive";
  isTrial?: boolean;
  expiresAt?: string | null;
};

export async function getActiveMembershipForUser(userId: string): Promise<ActiveMembership | null> {
  // TODO: wire up to real membership logic
  return null;
}








