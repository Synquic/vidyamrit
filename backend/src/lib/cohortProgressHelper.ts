import Cohort from "../models/CohortModel";
import { TimeframeUnit } from "../models/ProgramModel";

/**
 * Calculate weeks completed for a cohort's current level based on attendance dates
 * @param attendanceDates Array of attendance dates (only unique dates, regardless of student count)
 * @returns Number of weeks completed (can be fractional, e.g., 1.5 weeks)
 */
export function calculateWeeksFromAttendance(attendanceDates: Date[]): number {
  if (attendanceDates.length === 0) return 0;

  // Get unique dates (remove duplicates)
  const uniqueDates = Array.from(
    new Set(
      attendanceDates.map((date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  ).map((timestamp) => new Date(timestamp));

  // Sort dates
  uniqueDates.sort((a, b) => a.getTime() - b.getTime());

  if (uniqueDates.length === 0) return 0;

  // Calculate total days spanned
  const firstDate = uniqueDates[0];
  const lastDate = uniqueDates[uniqueDates.length - 1];
  
  // Count unique calendar weeks (Monday to Sunday)
  // A week is counted if there's at least one attendance day in that week
  const weeksSet = new Set<string>();
  
  uniqueDates.forEach((date) => {
    // Get week number based on year and week
    const d = new Date(date);
    const year = d.getFullYear();
    const weekNumber = getWeekNumber(d);
    weeksSet.add(`${year}-${weekNumber}`);
  });

  // Filter out Sundays (day 0) - teaching happens Mon-Sat (6 days per week)
  const teachingDays = uniqueDates.filter(date => {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0; // Exclude Sunday (0)
  });

  // Calculate fractional weeks more accurately
  // Teaching happens 6 days per week (Monday-Saturday), Sunday is off
  const totalTeachingDays = teachingDays.length;
  const weeks = totalTeachingDays / 6; // 6 teaching days per week (Mon-Sat)
  
  // Alternative: Use actual week span
  const daysDifference = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weeksBySpan = daysDifference / 7;

  // Return the more accurate measure: use actual attendance days / 6 (teaching days per week)
  // But cap at the actual calendar weeks spanned
  return Math.min(totalTeachingDays / 6, weeksBySpan + 1);
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Convert program level timeframe to weeks
 */
export function convertToWeeks(timeframe: number, unit: TimeframeUnit): number {
  switch (unit) {
    case TimeframeUnit.DAYS:
      return timeframe / 7;
    case TimeframeUnit.WEEKS:
      return timeframe;
    case TimeframeUnit.MONTHS:
      return timeframe * 4.33; // Approximate weeks per month
    default:
      return timeframe;
  }
}

/**
 * Check if a date is a holiday
 */
function isHoliday(date: Date, holidays: Date[] = []): boolean {
  if (!holidays || holidays.length === 0) return false;
  
  const dateStr = date.toDateString();
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate.toDateString() === dateStr;
  });
}

/**
 * Check if a date is Sunday
 */
function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function getCurrentLevelAttendanceDates(cohort: any): Date[] {
  if (!cohort.timeTracking?.currentLevelStartDate) {
    // If no timeTracking, use cohort start date or creation date
    const fallbackDate = cohort.startDate || cohort.createdAt || new Date();
    cohort.timeTracking = cohort.timeTracking || {};
    cohort.timeTracking.currentLevelStartDate = fallbackDate;
  }

  const currentLevelStartDate = new Date(cohort.timeTracking.currentLevelStartDate);
  currentLevelStartDate.setHours(0, 0, 0, 0);

  // Get holidays array (convert to Date objects if needed)
  const holidays: Date[] = (cohort.holidays || []).map((h: any) => {
    const holidayDate = new Date(h);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate;
  });

  // Filter attendance records that are:
  // 1. On or after current level start date
  // 2. For students who are "present"
  // 3. Not on Sunday
  // 4. Not on a holiday
  const levelAttendanceDates: Date[] = [];

  if (cohort.attendance && Array.isArray(cohort.attendance)) {
    cohort.attendance.forEach((att: any) => {
      if (!att || !att.date) return; // Skip invalid records
      
      const attDate = new Date(att.date);
      attDate.setHours(0, 0, 0, 0);

      // Skip Sundays and holidays
      if (isSunday(attDate) || isHoliday(attDate, holidays)) {
        return;
      }

      // Only count attendance dates on or after current level start
      // Use getTime() for accurate comparison
      // Also check if status is 'present' (case-insensitive)
      const isPresent = att.status && att.status.toLowerCase() === 'present';
      if (attDate.getTime() >= currentLevelStartDate.getTime() && isPresent) {
        levelAttendanceDates.push(attDate);
      }
    });
  }

  return levelAttendanceDates;
}

/**
 * Calculate level progress for a cohort
 * @param cohort Cohort document (should be populated with programId)
 * @returns Object with weeksCompleted, weeksRequired, completionPercentage, and isReadyForAssessment
 */
export async function calculateLevelProgress(cohort: any): Promise<{
  weeksCompleted: number;
  weeksRequired: number;
  completionPercentage: number;
  isReadyForAssessment: boolean;
  daysRemaining?: number;
}> {
  if (!cohort.programId) {
    return {
      weeksCompleted: 0,
      weeksRequired: 0,
      completionPercentage: 0,
      isReadyForAssessment: false,
    };
  }

  // Get program (if not already populated, fetch it)
  let program = cohort.programId;
  if (typeof program.toObject === 'function') {
    // It's already a Mongoose document
  } else {
    // Need to fetch it
    const Program = require("../models/ProgramModel").default;
    program = await Program.findById(cohort.programId);
  }

  if (!program) {
    return {
      weeksCompleted: 0,
      weeksRequired: 0,
      completionPercentage: 0,
      isReadyForAssessment: false,
    };
  }

  const currentLevel = cohort.currentLevel || 1;
  const levelInfo = program.getLevelByNumber(currentLevel);

  if (!levelInfo) {
    return {
      weeksCompleted: 0,
      weeksRequired: 0,
      completionPercentage: 0,
      isReadyForAssessment: false,
    };
  }

  // Get required weeks for current level
  const weeksRequired = convertToWeeks(levelInfo.timeframe, levelInfo.timeframeUnit);

  // Get attendance dates for current level
  const attendanceDates = getCurrentLevelAttendanceDates(cohort);
  const weeksCompleted = calculateWeeksFromAttendance(attendanceDates);

  // Calculate completion percentage
  const completionPercentage = weeksRequired > 0 
    ? Math.min(100, (weeksCompleted / weeksRequired) * 100)
    : 0;

  // Check if ready for assessment (completed required weeks)
  const isReadyForAssessment = weeksCompleted >= weeksRequired;

  // Calculate days remaining (if not ready)
  let daysRemaining: number | undefined;
  if (!isReadyForAssessment && weeksRequired > weeksCompleted) {
    const weeksRemaining = weeksRequired - weeksCompleted;
    daysRemaining = Math.ceil(weeksRemaining * 6); // 6 teaching days per week (Mon-Sat)
  }

  return {
    weeksCompleted: Math.round(weeksCompleted * 10) / 10, // Round to 1 decimal
    weeksRequired,
    completionPercentage: Math.round(completionPercentage * 10) / 10,
    isReadyForAssessment,
    daysRemaining,
  };
}

