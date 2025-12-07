/**
 * Class Sessions Management
 * 
 * Functions for managing class sessions (calendar instances)
 */

import { getSupabaseServer } from "@/lib/supabase/server";
import { addDays, addWeeks, startOfWeek, format, parseISO, isAfter, isBefore } from "date-fns";

export type SessionAvailability = {
  sessionId: number;
  startTime: string;
  endTime: string;
  capacity: number;
  seatsTaken: number;
  seatsAvailable: number;
  isAvailable: boolean;
};

/**
 * Generate sessions for a class based on schedule
 */
export async function generateClassSessions(params: {
  classId: number;
  startDate: Date;
  endDate: Date;
  dayOfWeek: string; // e.g., "Monday", "Tuesday"
  time: string; // e.g., "10:00"
  durationMinutes: number;
  capacity: number;
  exceptions?: Array<{ date: string; reason: string }>; // Dates to skip
}): Promise<number[]> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { classId, startDate, endDate, dayOfWeek, time, durationMinutes, capacity, exceptions = [] } = params;

  const sessions: Array<{
    class_id: number;
    start_time: string;
    end_time: string;
    capacity: number;
    seats_taken: number;
  }> = [];

  const exceptionDates = new Set(exceptions.map((e) => e.date));

  // Get day of week number (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDay = dayMap[dayOfWeek.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error(`Invalid day of week: ${dayOfWeek}`);
  }

  // Start from the first occurrence of the target day
  let currentDate = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday as start
  while (currentDate.getDay() !== targetDay) {
    currentDate = addDays(currentDate, 1);
  }

  // Generate sessions for each week
  while (isBefore(currentDate, endDate) || currentDate.toDateString() === endDate.toDateString()) {
    const dateStr = format(currentDate, "yyyy-MM-dd");

    // Skip if in exceptions
    if (!exceptionDates.has(dateStr)) {
      const [hours, minutes] = time.split(":").map(Number);
      const startTime = new Date(currentDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);

      sessions.push({
        class_id: classId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        capacity,
        seats_taken: 0,
      });
    }

    currentDate = addWeeks(currentDate, 1);
  }

  if (sessions.length === 0) {
    return [];
  }

  // Insert sessions (use upsert to avoid duplicates)
  const { data: inserted, error } = await supabase
    .from("class_sessions")
    .upsert(sessions, {
      onConflict: "class_id,start_time",
      ignoreDuplicates: false,
    })
    .select("id");

  if (error) {
    throw new Error(`Failed to generate sessions: ${error.message}`);
  }

  return inserted?.map((s: { id: number }) => s.id) || [];
}

/**
 * Get available sessions for a class
 */
export async function getAvailableSessions(
  classId: number,
  startDate?: Date,
  endDate?: Date
): Promise<SessionAvailability[]> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const now = new Date();
  const queryStart = startDate || now;
  const queryEnd = endDate || addDays(now, 90); // Default: next 90 days

  const { data: sessions, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .eq("is_cancelled", false)
    .gte("start_time", queryStart.toISOString())
    .lte("start_time", queryEnd.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  return (sessions || []).map((session: any) => ({
    sessionId: session.id,
    startTime: session.start_time,
    endTime: session.end_time,
    capacity: session.capacity,
    seatsTaken: session.seats_taken || 0,
    seatsAvailable: Math.max(0, session.capacity - (session.seats_taken || 0)),
    isAvailable: (session.seats_taken || 0) < session.capacity,
  }));
}

/**
 * Check if session has available capacity
 */
export async function checkSessionAvailability(
  sessionId: number,
  requestedSeats: number
): Promise<{ available: boolean; seatsAvailable: number; reason?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { available: false, seatsAvailable: 0, reason: "Database not configured" };
  }

  const { data: session, error } = await supabase
    .from("class_sessions")
    .select("capacity, seats_taken, is_cancelled, start_time")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return { available: false, seatsAvailable: 0, reason: "Session not found" };
  }

  if (session.is_cancelled) {
    return { available: false, seatsAvailable: 0, reason: "Session is cancelled" };
  }

  // Check if session is in the past
  const sessionStart = parseISO(session.start_time);
  if (isBefore(sessionStart, new Date())) {
    return { available: false, seatsAvailable: 0, reason: "Session has already started" };
  }

  const seatsTaken = session.seats_taken || 0;
  const seatsAvailable = Math.max(0, session.capacity - seatsTaken);

  if (requestedSeats > seatsAvailable) {
    return {
      available: false,
      seatsAvailable,
      reason: `Only ${seatsAvailable} seat${seatsAvailable !== 1 ? "s" : ""} available`,
    };
  }

  return { available: true, seatsAvailable };
}

/**
 * Reserve seats for a session (atomic operation)
 */
export async function reserveSessionSeats(
  sessionId: number,
  seats: number
): Promise<{ success: boolean; seatsReserved: number; reason?: string }> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return { success: false, seatsReserved: 0, reason: "Database not configured" };
  }

  // Check availability first
  const availability = await checkSessionAvailability(sessionId, seats);
  if (!availability.available) {
    return { success: false, seatsReserved: 0, reason: availability.reason };
  }

  // Atomic update: increment seats_taken only if capacity allows
  const { data, error } = await supabase.rpc("increment_session_seats", {
    p_session_id: sessionId,
    p_seats: seats,
  });

  if (error) {
    // Fallback: manual update with check
    const { data: session } = await supabase
      .from("class_sessions")
      .select("capacity, seats_taken")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return { success: false, seatsReserved: 0, reason: "Session not found" };
    }

    const newSeatsTaken = (session.seats_taken || 0) + seats;
    if (newSeatsTaken > session.capacity) {
      return { success: false, seatsReserved: 0, reason: "Capacity exceeded" };
    }

    await supabase
      .from("class_sessions")
      .update({ seats_taken: newSeatsTaken })
      .eq("id", sessionId);

    return { success: true, seatsReserved: seats };
  }

  return { success: true, seatsReserved: seats };
}

/**
 * Release seats (for cancellations)
 */
export async function releaseSessionSeats(sessionId: number, seats: number): Promise<void> {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  const { data: session } = await supabase
    .from("class_sessions")
    .select("seats_taken")
    .eq("id", sessionId)
    .single();

  if (session) {
    const newSeatsTaken = Math.max(0, (session.seats_taken || 0) - seats);
    await supabase
      .from("class_sessions")
      .update({ seats_taken: newSeatsTaken })
      .eq("id", sessionId);
  }
}

