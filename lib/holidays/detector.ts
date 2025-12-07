/**
 * School Holiday Detection Module
 * Maps UK regions to school holiday calendars
 */

import ukHolidaysData from "./uk-holidays.json";

export type UKRegion =
  | "england"
  | "scotland"
  | "wales"
  | "northern-ireland"
  | "london"
  | "north-east"
  | "north-west"
  | "yorkshire"
  | "east-midlands"
  | "west-midlands"
  | "east"
  | "south-east"
  | "south-west";

export interface SchoolHoliday {
  name: string;
  start: string; // ISO date string
  end: string; // ISO date string
  region: UKRegion;
  year: number;
}

export interface HolidayInfo {
  nextBreak: SchoolHoliday | null;
  currentBreak: SchoolHoliday | null;
  allUpcoming: SchoolHoliday[];
}

/**
 * Get school holidays for a specific region
 */
export function getHolidaysForRegion(region: UKRegion, year?: number): SchoolHoliday[] {
  const targetYear = year || new Date().getFullYear();
  const holidays = ukHolidaysData as SchoolHoliday[];
  
  return holidays.filter(
    (h) => h.region === region && new Date(h.start).getFullYear() === targetYear
  );
}

/**
 * Get the next school break for a region
 */
export function getNextSchoolBreak(region: UKRegion): SchoolHoliday | null {
  const now = new Date();
  const holidays = getHolidaysForRegion(region);
  
  const upcoming = holidays
    .filter((h) => new Date(h.end) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  
  return upcoming[0] || null;
}

/**
 * Get current school break (if any)
 */
export function getCurrentSchoolBreak(region: UKRegion): SchoolHoliday | null {
  const now = new Date();
  const holidays = getHolidaysForRegion(region);
  
  return (
    holidays.find(
      (h) => new Date(h.start) <= now && new Date(h.end) >= now
    ) || null
  );
}

/**
 * Get comprehensive holiday info for a region
 */
export function getHolidayInfo(region: UKRegion): HolidayInfo {
  const now = new Date();
  const holidays = getHolidaysForRegion(region);
  
  const upcoming = holidays
    .filter((h) => new Date(h.end) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  
  const current = holidays.find(
    (h) => new Date(h.start) <= now && new Date(h.end) >= now
  ) || null;
  
  return {
    nextBreak: upcoming[0] || null,
    currentBreak: current,
    allUpcoming: upcoming,
  };
}

/**
 * Format holiday date range for display
 */
export function formatHolidayRange(holiday: SchoolHoliday): string {
  const start = new Date(holiday.start);
  const end = new Date(holiday.end);
  
  const startStr = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const endStr = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  
  return `${startStr} - ${endStr}`;
}

/**
 * Check if a date falls within a school holiday
 */
export function isSchoolHoliday(date: Date, region: UKRegion): boolean {
  const holidays = getHolidaysForRegion(region, date.getFullYear());
  
  return holidays.some(
    (h) => date >= new Date(h.start) && date <= new Date(h.end)
  );
}

