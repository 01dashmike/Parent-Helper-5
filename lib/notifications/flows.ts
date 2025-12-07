/**
 * Automation Flow Helpers
 * 
 * Functions to find users for each automation flow
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { sendEmailNotification } from "./send";
import { getTemplate } from "./templates";

type BookingRow = {
  id: number;
  user_id: string | null;
  parent_first_name: string;
  parent_email: string;
  children: Array<{ name: string }> | null;
  status: string;
  class_sessions: ClassSessionRow | null;
};

type ClassSessionRow = {
  start_time: string;
  end_time: string;
  classes: ClassRow | null;
};

type ClassRow = {
  id: number;
  name: string;
  venue: string | null;
  address: string | null;
  town: string | null;
  providers: ProviderRow | null;
};

type ProviderRow = {
  name: string;
};

type NotificationEventRow = {
  metadata: { booking_id?: number } | null;
};

type UserRow = {
  userId: string;
  parentEmail: string;
  parentFirstName: string;
  lastClass?: string;
  city?: string;
  recommendedClasses: Array<{ name: string; url: string; distance?: string }>;
};

type ClassListItem = {
  id: number;
  name: string;
  town: string | null;
};

type SimilarClassRow = {
  id: number;
  name: string;
  category: string;
  town: string | null;
};

type ProviderWithUsers = {
  id: number;
  name: string;
  email: string | null;
  providers_users: Array<{ user_id: string }> | null;
};

type BookingWithPrice = {
  id: number;
  price_total: number | string | null;
};

type ProviderOnboardingRow = {
  provider_id: number;
  current_step: string | null;
  created_at: string;
  providers: ProviderWithUsers;
};

/**
 * Find parents needing booking reminders
 * 
 * Returns parents with confirmed bookings starting in 18-30 hours
 */
export async function findParentsNeedingBookingReminder(now: Date): Promise<
  Array<{
    userId: string;
    bookingId: number;
    parentEmail: string;
    parentFirstName: string;
    childName?: string;
    className: string;
    classTime: Date;
    classLocation: string;
    providerName: string;
    manageBookingUrl: string;
  }>
> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const hoursFromNow = 18;
  const maxHoursFromNow = 30;

  const startTime = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + maxHoursFromNow * 60 * 60 * 1000);

  // Get bookings with sessions in the reminder window
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      user_id,
      parent_first_name,
      parent_email,
      children,
      status,
      class_sessions (
        start_time,
        end_time,
        classes (
          id,
          name,
          venue,
          address,
          town,
          providers (
            name
          )
        )
      )
    `
    )
    .eq("status", "confirmed")
    .gte("class_sessions.start_time", startTime.toISOString())
    .lte("class_sessions.start_time", endTime.toISOString());

  if (error || !bookings) {
    console.error("[findParentsNeedingBookingReminder] Error:", error);
    return [];
  }

  // Check if reminder already sent (via notification_events)
  type BookingRow = {
    id: number;
    user_id?: string | null;
    parent_email?: string | null;
    parent_first_name?: string | null;
    children?: Array<{ first_name?: string | null }> | null;
    class_sessions?: {
      start_time?: string | null;
      classes?: {
        name?: string | null;
        venue?: string | null;
        town?: string | null;
        providers?: { name?: string | null } | null;
      } | null;
    } | null;
  };
  const bookingIds = bookings.map((b: BookingRow) => b.id);
  const { data: existingReminders } = await supabase
    .from("notification_events")
    .select("metadata")
    .eq("template_key", "parent_booking_reminder")
    .in(
      "metadata->booking_id",
      bookingIds.map((id: number) => id.toString())
    )
    .eq("status", "sent");

  type ReminderRow = { metadata?: { booking_id?: unknown } };
  const remindedBookingIds = new Set(
    (existingReminders as ReminderRow[] | null)?.map((e: ReminderRow) => e.metadata?.booking_id).filter(Boolean) || []
  );
  
  return bookings
    .filter((b: BookingRow) => b.user_id && !remindedBookingIds.has(b.id))
    .map((b: BookingRow) => {
      const session = b.class_sessions;
      const classData = session?.classes;
      const provider = classData?.providers;
      const children = b.children || [];
      const firstChild = children[0];

      return {
        userId: b.user_id!,
        bookingId: b.id,
        parentEmail: b.parent_email,
        parentFirstName: b.parent_first_name,
        childName: firstChild?.first_name || undefined,
        className: classData?.name || "Class",
        classTime: new Date(session?.start_time || now.toISOString()),
        classLocation: `${classData?.venue || ""}, ${classData?.town || ""}`.trim(),
        providerName: provider?.name || "Provider",
        manageBookingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/account/bookings/${b.id}`,
      };
    });
}

/**
 * Find parents to reactivate (no bookings in 45+ days)
 * Optimized to reduce N+1 queries with batch operations
 */
export async function findParentsToReactivate(now: Date): Promise<
  Array<{
    userId: string;
    parentEmail: string;
    parentFirstName: string;
    lastClass?: string;
    city?: string;
    recommendedClasses: Array<{ name: string; url: string; distance?: string }>;
  }>
> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const daysAgo = 45;
  const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get users with bookings older than cutoff, but at least one booking exists
  const { data: oldBookings } = await supabase
    .from("bookings")
    .select("user_id, parent_email, parent_first_name, created_at, class_sessions(classes(name, town))")
    .lt("created_at", cutoffDate.toISOString())
    .eq("status", "confirmed")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false });

  if (!oldBookings) return [];

  // Get unique user IDs
  const uniqueUserIds = [...new Set(oldBookings.map((b: { user_id?: string | null }) => b.user_id).filter(Boolean))];

  // Batch query: Check for recent bookings for all users at once
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("user_id")
    .in("user_id", uniqueUserIds)
    .gte("created_at", cutoffDate.toISOString())
    .limit(uniqueUserIds.length);

  const usersWithRecentBookings = new Set(
    (recentBookings || []).map((b: { user_id?: string | null }) => b.user_id).filter(Boolean)
  );

  // Batch query: Check for recent reactivation emails for all users at once
  const { data: recentEmails } = await supabase
    .from("notification_events")
    .select("user_id")
    .in("user_id", uniqueUserIds)
    .eq("template_key", "parent_lapsed_reactivation")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .limit(uniqueUserIds.length);

  const usersWithRecentEmails = new Set(
    (recentEmails || []).map((e: { user_id?: string | null }) => e.user_id).filter(Boolean)
  );

  // Build user map with filtered results
  type UserData = {
    userId: string;
    parentEmail: string;
    parentFirstName: string;
    lastClass?: string;
    city?: string;
    recommendedClasses: Array<{ name: string; url: string; distance?: string }>;
  };
  const userMap = new Map<string, UserData>();
  
  for (const booking of oldBookings) {
    if (!booking.user_id) continue;
    if (userMap.has(booking.user_id)) continue;
    if (usersWithRecentBookings.has(booking.user_id)) continue;
    if (usersWithRecentEmails.has(booking.user_id)) continue;

    type BookingSession = { classes?: { name?: string | null; town?: string | null } | null } | null;
    const session = (booking.class_sessions as BookingSession);
    const classData = session?.classes;

    userMap.set(booking.user_id, {
      userId: booking.user_id,
      parentEmail: booking.parent_email || "",
      parentFirstName: booking.parent_first_name || "",
      lastClass: classData?.name || undefined,
      city: classData?.town || undefined,
      recommendedClasses: [], // Will be populated below
    });
  }

  // Get recommended classes (one query for all users)
  const users = Array.from(userMap.values());
  if (users.length > 0) {
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, town")
      .eq("is_active", true)
      .limit(10); // Get more classes to distribute

    type ClassRow = { id: number; name: string | null; town: string | null };
    const allClasses = classes || [];

    // Distribute recommended classes to each user
    for (const user of users) {
      user.recommendedClasses = allClasses.slice(0, 3).map((c: ClassRow) => ({
        name: c.name || "",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/class/${c.id}`,
        distance: user.city === c.town ? "In your area" : undefined,
      }));
    }
  }

  return users;
}

/**
 * Find parents for similar class suggestions after cancellation
 */
export async function findParentsForCancellationSuggestions(
  bookingId: number,
  cancelledClassId: number,
  userId: string
): Promise<{
  userId: string;
  parentEmail: string;
  parentFirstName: string;
  cancelledClassName: string;
  originalTime?: string;
  suggestedClasses: Array<{ name: string; url: string; time?: string }>;
} | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  // Get booking details
  const { data: booking } = await supabase
    .from("bookings")
    .select("parent_email, parent_first_name, class_sessions(classes(name))")
    .eq("id", bookingId)
    .single();

  if (!booking) return null;

  // Get cancelled class details
  const { data: cancelledClass } = await supabase
    .from("classes")
    .select("name, category, town")
    .eq("id", cancelledClassId)
    .single();

  if (!cancelledClass) return null;

  // Find similar classes (same category, same town, different class)
  const { data: similarClasses } = await supabase
    .from("classes")
    .select("id, name, category, town")
    .eq("category", cancelledClass.category)
    .eq("town", cancelledClass.town)
    .neq("id", cancelledClassId)
    .eq("is_active", true)
    .limit(3);

  type BookingSession = { classes?: { name?: string | null } | null; start_time?: string | null } | null;
  const session = (booking.class_sessions as BookingSession);
  const classData = session?.classes;

  type SimilarClassRow = { id: number; name: string | null };
  return {
    userId,
    parentEmail: booking.parent_email,
    parentFirstName: booking.parent_first_name,
    cancelledClassName: cancelledClass.name,
    originalTime: session?.start_time
      ? new Date(session.start_time).toLocaleString()
      : undefined,
    suggestedClasses: (similarClasses || []).map((c: SimilarClassRow) => ({
      name: c.name,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/class/${c.id}`,
    })),
  };
}

/**
 * Find providers for weekly digest
 * Optimized with batch queries to reduce N+1 problems
 */
export async function findProvidersForWeeklyDigest(now: Date): Promise<
  Array<{
    providerId: number;
    providerEmail: string;
    providerName: string;
    viewsThisWeek: number;
    viewsLastWeek: number;
    bookingsThisWeek: number;
    bookingsLastWeek: number;
    revenueThisWeek: number;
    topClass?: { name: string; views: number; bookings: number };
    dashboardUrl: string;
  }>
> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get all active providers with user relation
  const { data: providers } = await supabase
    .from("providers")
    .select("id, name, email, providers_users(user_id)")
    .eq("is_active", true)
    .limit(100); // Reasonable limit

  if (!providers || providers.length === 0) return [];

  // Filter providers with valid user relations
  const validProviders = providers.filter((p: { providers_users?: Array<{ user_id?: string | null }> | null }) => {
    const users = p.providers_users;
    return Array.isArray(users) && users.length > 0 && users[0]?.user_id;
  });

  if (validProviders.length === 0) return [];

  const providerIds = validProviders.map((p: { id: number }) => p.id);

  // Batch query: Get all classes for all providers at once
  const { data: allClasses } = await supabase
    .from("classes")
    .select("id, provider_id, name")
    .in("provider_id", providerIds)
    .eq("is_active", true);

  // Group classes by provider
  const classesByProvider = new Map<number, Array<{ id: number; name: string | null }>>();
  for (const cls of allClasses || []) {
    if (!classesByProvider.has(cls.provider_id)) {
      classesByProvider.set(cls.provider_id, []);
    }
    classesByProvider.get(cls.provider_id)!.push({ id: cls.id, name: cls.name });
  }

  // Batch query: Get all bookings for this week for all providers
  const { data: bookingsThisWeek } = await supabase
    .from("bookings")
    .select("provider_id, id, price_total, class_id")
    .in("provider_id", providerIds)
    .gte("created_at", weekAgo.toISOString())
    .eq("status", "confirmed");

  // Batch query: Get all bookings for last week for all providers
  const { data: bookingsLastWeek } = await supabase
    .from("bookings")
    .select("provider_id, id")
    .in("provider_id", providerIds)
    .gte("created_at", twoWeeksAgo.toISOString())
    .lt("created_at", weekAgo.toISOString())
    .eq("status", "confirmed");

  // Group bookings by provider
  type BookingRow = { provider_id: number; id: number; price_total?: number | string | null; class_id?: number | null };
  const bookingsThisWeekByProvider = new Map<number, BookingRow[]>();
  const bookingsLastWeekByProvider = new Map<number, Array<{ provider_id: number; id: number }>>();

  for (const booking of bookingsThisWeek || []) {
    if (!bookingsThisWeekByProvider.has(booking.provider_id)) {
      bookingsThisWeekByProvider.set(booking.provider_id, []);
    }
    bookingsThisWeekByProvider.get(booking.provider_id)!.push(booking);
  }

  for (const booking of bookingsLastWeek || []) {
    if (!bookingsLastWeekByProvider.has(booking.provider_id)) {
      bookingsLastWeekByProvider.set(booking.provider_id, []);
    }
    bookingsLastWeekByProvider.get(booking.provider_id)!.push(booking);
  }

  // Build results
  const results = [];
  for (const provider of validProviders) {
    const classes = classesByProvider.get(provider.id) || [];
    if (classes.length === 0) continue;

    const thisWeekBookings = bookingsThisWeekByProvider.get(provider.id) || [];
    const lastWeekBookings = bookingsLastWeekByProvider.get(provider.id) || [];

    // Calculate revenue
    const revenueThisWeek = thisWeekBookings.reduce(
      (sum, b) => sum + parseFloat(b.price_total?.toString() || "0"),
      0
    );

    // Get top class (most bookings this week)
    const bookingsByClass = new Map<number, number>();
    for (const booking of thisWeekBookings) {
      if (booking.class_id) {
        bookingsByClass.set(booking.class_id, (bookingsByClass.get(booking.class_id) || 0) + 1);
      }
    }
    
    let topClass: { name: string; views: number; bookings: number } | undefined;
    if (bookingsByClass.size > 0) {
      const topClassId = [...bookingsByClass.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const topClassData = classes.find((c) => c.id === topClassId);
      if (topClassData) {
        topClass = {
          name: topClassData.name || "Top Class",
          views: 0, // Would come from analytics
          bookings: bookingsByClass.get(topClassId) || 0,
        };
      }
    }

    type ProviderUserRelation = { user_id?: string | null } | null;
    type ProviderWithUsers = { providers_users?: ProviderUserRelation[] | null };
    const userRelation = ((provider as ProviderWithUsers).providers_users as ProviderUserRelation[] | undefined)?.[0];

    results.push({
      providerId: provider.id,
      providerEmail: provider.email || "",
      providerName: provider.name || "Provider",
      viewsThisWeek: 0, // Would come from analytics
      viewsLastWeek: 0,
      bookingsThisWeek: thisWeekBookings.length,
      bookingsLastWeek: lastWeekBookings.length,
      revenueThisWeek,
      topClass,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider`,
    });
  }

  return results;
}

/**
 * Find providers with incomplete onboarding
 * Optimized to batch check recent nudges instead of N+1 queries
 * Uses provider_onboarding.current_step to detect incomplete wizards
 */
export async function findProvidersWithIncompleteOnboarding(now: Date): Promise<
  Array<{
    providerId: number;
    userId: string;
    providerEmail: string;
    providerName: string;
    daysSinceStart: number;
    currentStep: string;
    onboardingUrl: string;
  }>
> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  // Get providers with incomplete onboarding using the wizard current_step field
  const { data: onboardingRecords } = await supabase
    .from("provider_onboarding")
    .select(
      `
      provider_id,
      current_step,
      created_at,
      providers!inner (
        id,
        name,
        email,
        created_at,
        providers_users (
          user_id
        )
      )
    `
    )
    .neq("current_step", "complete") // Not completed
    .not("current_step", "is", null) // Has started wizard
    .eq("providers.is_active", true);

  if (!onboardingRecords || onboardingRecords.length === 0) return [];

  // Filter and prepare candidate records
  type ProviderRecord = {
    id?: number;
    name?: string | null;
    email?: string | null;
    created_at?: string | null;
    providers_users?: Array<{ user_id?: string | null }> | null;
  };

  const candidates: Array<{
    providerId: number;
    userId: string;
    providerEmail: string;
    providerName: string;
    daysSinceStart: number;
    currentStep: string;
    onboardingUrl: string;
  }> = [];

  for (const record of onboardingRecords) {
    const provider = record.providers as ProviderRecord;
    if (!provider?.id) continue;

    const createdAt = new Date(provider.created_at || record.created_at);
    const daysSinceStart = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Only include if 2+ days old
    if (daysSinceStart < 2) continue;

    type ProviderUserRelation = { user_id?: string | null } | null;
    type ProviderWithUsers = { providers_users?: ProviderUserRelation[] | null };
    const userRelation = ((provider as ProviderWithUsers).providers_users as ProviderUserRelation[] | undefined)?.[0];
    if (!userRelation?.user_id) continue;

    candidates.push({
      providerId: provider.id,
      userId: userRelation.user_id,
      providerEmail: provider.email || "",
      providerName: provider.name || "Provider",
      daysSinceStart,
      currentStep: typeof record.current_step === "string" ? record.current_step : "unknown",
      onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://parenthelper.co.uk"}/provider/onboarding`,
    });
  }

  if (candidates.length === 0) return [];

  // Batch query: Check for recent nudges for all candidates at once
  const userIds = candidates.map((c) => c.userId);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: recentNudges } = await supabase
    .from("notification_events")
    .select("user_id")
    .in("user_id", userIds)
    .like("template_key", "provider_onboarding_nudge%")
    .gte("created_at", sevenDaysAgo.toISOString());

  // Build set of users who have been nudged recently
  const usersWithRecentNudges = new Set(
    (recentNudges || []).map((n: { user_id?: string | null }) => n.user_id).filter(Boolean)
  );

  // Filter out candidates who have been nudged recently
  return candidates.filter((c) => !usersWithRecentNudges.has(c.userId));
}

