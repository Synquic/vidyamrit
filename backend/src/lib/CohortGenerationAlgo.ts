/**
 * Cohort Planner Utility
 * ------------------------------------------------------------
 * Purpose:
 *   Generate teaching cohorts (student groups) based on student
 *   strength per level (post-assessment), keeping groups near
 *   an ideal size while allowing flexibility.
 *
 * Algorithm Rules:
 *   - Cohorts are strictly separated by level.
 *   - Ideal cohort size ≈ 20 students.
 *   - Minimum cohort size = 5 students.
 *   - Maximum cohort size = 30 students.
 *   - Avoid single/small cohorts (< 5).
 *   - Try to minimize total number of cohorts.
 *
 * ------------------------------------------------------------
 * 🧩 INPUT FORMAT
 *
 * Array of level objects, each containing:
 *
 * interface LevelInput {
 *   level: number | string;   // e.g., 4, 5, 6, "Beginner"
 *   students: number;         // total students in that level
 * }
 *
 * Example:
 * const inputLevels: LevelInput[] = [
 *   { level: 4, students: 18 },
 *   { level: 5, students: 25 },
 *   { level: 6, students: 37 },
 * ];
 *
 * ------------------------------------------------------------
 * 🧾 OUTPUT FORMAT
 *
 * Array of cohort plans, each containing:
 *
 * interface CohortPlan {
 *   level: number | string;  // same as input
 *   cohorts: number[];       // list of cohort sizes
 * }
 *
 * Example Output:
 * [
 *   { level: 4, cohorts: [18] },
 *   { level: 5, cohorts: [25] },
 *   { level: 6, cohorts: [20, 17] }
 * ]
 *
 * Meaning:
 *   - Level 4: one cohort of 18 students
 *   - Level 5: one cohort of 25 students
 *   - Level 6: two cohorts (20 & 17 students)
 * ------------------------------------------------------------
 */

export interface LevelInput {
  level: number | string;
  students: number;
}

export interface CohortPlan {
  level: number | string;
  cohorts: number[];
}

/**
 * Create cohorts for a single level of students.
 *
 * @param studentCount - total number of students in that level
 * @param ideal - ideal cohort size (default = 20)
 * @param minSize - minimum cohort size (default = 5)
 * @param maxSize - maximum cohort size (default = 30)
 * @returns array of cohort sizes for that level
 */
export function createCohorts(
  studentCount: number,
  ideal: number = 20,
  minSize: number = 5,
  maxSize: number = 30
): number[] {
  const cohorts: number[] = [];

  // 1️⃣ Fill with as many ideal-size cohorts as possible
  let full = Math.floor(studentCount / ideal);
  let remainder = studentCount % ideal;

  for (let i = 0; i < full; i++) {
    cohorts.push(ideal);
  }

  // 2️⃣ Perfectly divisible case
  if (remainder === 0) return cohorts;

  // 3️⃣ Handle leftover students
  if (remainder < minSize) {
    // Too few students left — distribute into existing cohorts
    let i = 0;
    while (remainder > 0 && i < cohorts.length) {
      if (cohorts[i] < maxSize) {
        cohorts[i]++;
        remainder--;
      }
      i = (i + 1) % cohorts.length;
    }

    // If still remaining (e.g., no cohorts yet), create one small one
    if (remainder > 0) {
      cohorts.push(remainder);
    }
  } else {
    // Enough students to form a new valid cohort
    cohorts.push(remainder);
  }

  // 4️⃣ Rebalance if any cohort < minSize
  if (cohorts.some((size) => size < minSize)) {
    const total = cohorts.reduce((a, b) => a + b, 0);
    const n = cohorts.length;
    const base = Math.floor(total / n);
    const extra = total % n;

    // Distribute evenly
    for (let i = 0; i < n; i++) {
      cohorts[i] = base + (i < extra ? 1 : 0);
    }
  }

  return cohorts;
}

/**
 * Generate cohort plans for multiple levels.
 *
 * @param levels - list of levels with student counts
 * @returns array of cohort plans for each level
 */
export function generateCohortPlan(levels: LevelInput[]): CohortPlan[] {
  return levels.map(({ level, students }) => ({
    level,
    cohorts: createCohorts(students),
  }));
}

/**
 * ------------------------------------------------------------
 * 🧪 Example Usage (TEST CASES)
 * ------------------------------------------------------------
 * Uncomment below to test in Node or a TS playground.
 */

// const inputLevels: LevelInput[] = [
//   { level: 4, students: 18 },
//   { level: 5, students: 25 },
//   { level: 6, students: 37 },
//   { level: 7, students: 53 },
//   { level: 8, students: 75 },
//   { level: 9, students: 5 },
//   { level: 10, students: 3 },
//   { level: 11, students: 120 },
// ];

// const plans = generateCohortPlan(inputLevels);
// console.log(JSON.stringify(plans, null, 2));

/**
 * Expected Output:
 * [
 *   { "level": 4, "cohorts": [18] },
 *   { "level": 5, "cohorts": [25] },
 *   { "level": 6, "cohorts": [20, 17] },
 *   { "level": 7, "cohorts": [20, 20, 13] },
 *   { "level": 8, "cohorts": [20, 20, 20, 15] },
 *   { "level": 9, "cohorts": [5] },
 *   { "level": 10, "cohorts": [3] },
 *   { "level": 11, "cohorts": [20, 20, 20, 20, 20, 20] }
 * ]
 */
