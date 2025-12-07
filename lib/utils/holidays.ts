/**
 * UK School Holidays Utility Functions
 * 
 * Provides functions to get school holiday information for different UK regions.
 */

export type UKRegion = "england" | "scotland" | "wales" | "northern-ireland";

export interface HolidayInfo {
  region: UKRegion;
  currentHoliday: {
    name: string;
    startDate: Date;
    endDate: Date;
  } | null;
  nextHoliday: {
    name: string;
    startDate: Date;
    endDate: Date;
  } | null;
  isHoliday: boolean;
}

/**
 * Get holiday information for a given UK region
 */
export function getHolidayInfo(region: UKRegion = "england"): HolidayInfo {
  // Simplified implementation - in production, this would fetch from an API or database
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Basic holiday dates (simplified - actual dates vary by local authority)
  const holidays: Record<string, Record<string, { start: Date; end: Date }>> = {
      ["england"]: {
      "Summer": { start: new Date(currentYear, 6, 20), end: new Date(currentYear, 8, 1) },
      "Autumn": { start: new Date(currentYear, 9, 20), end: new Date(currentYear, 10, 1) },
      "Christmas": { start: new Date(currentYear, 11, 20), end: new Date(currentYear + 1, 0, 3) },
      "Easter": { start: new Date(currentYear, 2, 25), end: new Date(currentYear, 3, 8) },
    },
  };

  const regionHolidays = holidays[region] || holidays["england"];
  
  let currentHoliday: { name: string; startDate: Date; endDate: Date } | null = null;
  let nextHoliday: { name: string; startDate: Date; endDate: Date } | null = null;
  let isHoliday = false;

  for (const [name, datesObj] of Object.entries(regionHolidays)) {
    const dates = datesObj as { start: Date; end: Date };
    if (now >= dates.start && now <= dates.end) {
      currentHoliday = { name, startDate: dates.start, endDate: dates.end };
      isHoliday = true;
    } else if (now < dates.start && (!nextHoliday || dates.start < nextHoliday.startDate)) {
      nextHoliday = { name, startDate: dates.start, endDate: dates.end };
    }
  }

  return {
    region,
    currentHoliday,
    nextHoliday,
    isHoliday,
  };
}

/**
 * Format holiday date range as a readable string
 */
export function formatHolidayRange(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const end = endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return `${start} - ${end}`;
}

