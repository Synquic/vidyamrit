/**
 * READ-ONLY. One report per deleted school, with everything still attached to it.
 *
 * The School document is gone, so the name can't be recovered — sample student
 * and group names are printed instead so each one can be recognised. Ordered by
 * how much data is attached, so the ones worth a decision come first.
 *
 * No writes, updates or deletes anywhere in this file.
 *
 *   npx tsx src/scripts/listDeadSchools.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import Cohort from "../models/CohortModel";
import User from "../models/UserModel";
import Assessment from "../models/AssessmentModel";
import Attendance from "../models/AttendanceModel";

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("connected — READ ONLY\n");

  const realIds = (await School.distinct("_id")).map((id: any) => String(id));
  const realSet = new Set(realIds);
  const isDead = (id: any) => id && !realSet.has(String(id));

  // Collect dead school ids from every collection that references a school.
  const deadIds = new Set<string>();
  for (const ids of [
    await Student.distinct("school"),
    await Cohort.distinct("schoolId"),
    await User.distinct("schoolId"),
    await Assessment.distinct("school"),
    await Attendance.distinct("school"),
  ]) {
    ids.filter(isDead).forEach((id: any) => deadIds.add(String(id)));
  }

  const rows = [];
  for (const id of deadIds) {
    const oid = new mongoose.Types.ObjectId(id);
    const [students, archived, cohorts, staff, assessments, attendance] =
      await Promise.all([
        Student.countDocuments({ school: oid }),
        Student.countDocuments({ school: oid, isArchived: true }),
        Cohort.countDocuments({ schoolId: oid }),
        User.countDocuments({ schoolId: oid }),
        Assessment.countDocuments({ school: oid }),
        Attendance.countDocuments({ school: oid }),
      ]);
    rows.push({
      id,
      oid,
      students,
      archived,
      cohorts,
      staff,
      assessments,
      attendance,
      weight: students + cohorts + assessments,
    });
  }

  rows.sort((a, b) => b.weight - a.weight);

  console.log(`${rows.length} deleted school(s) still referenced\n`);

  for (const r of rows) {
    const [sampleStudents, sampleCohorts, sampleStaff] = await Promise.all([
      Student.find({ school: r.oid }).select("name class isArchived").limit(6).lean(),
      Cohort.find({ schoolId: r.oid }).select("name status").limit(5).lean(),
      User.find({ schoolId: r.oid }).select("name email role").limit(6).lean(),
    ]);

    console.log("=".repeat(96));
    console.log(`SCHOOL ID  ${r.id}`);
    console.log(
      `  students ${r.students} (archived ${r.archived}) | groups ${r.cohorts} | ` +
        `staff ${r.staff} | assessments ${r.assessments} | attendance ${r.attendance}`
    );

    if (sampleStaff.length) {
      console.log("  staff:");
      (sampleStaff as any[]).forEach((u) =>
        console.log(`     ${String(u.role).padEnd(10)} ${String(u.name ?? "").padEnd(24)} ${u.email ?? ""}`)
      );
    }
    if (sampleStudents.length) {
      console.log("  students:");
      (sampleStudents as any[]).forEach((s) =>
        console.log(`     ${String(s.name ?? "").padEnd(28)} class ${String(s.class ?? "").padEnd(4)} archived=${!!s.isArchived}`)
      );
      if (r.students > sampleStudents.length)
        console.log(`     ...and ${r.students - sampleStudents.length} more`);
    }
    if (sampleCohorts.length) {
      console.log("  groups:");
      (sampleCohorts as any[]).forEach((c) =>
        console.log(`     ${String(c.name ?? "").padEnd(34)} ${c.status ?? ""}`)
      );
      if (r.cohorts > sampleCohorts.length)
        console.log(`     ...and ${r.cohorts - sampleCohorts.length} more`);
    }
    console.log("");
  }

  const totals = rows.reduce(
    (a, r) => ({
      students: a.students + r.students,
      cohorts: a.cohorts + r.cohorts,
      staff: a.staff + r.staff,
      assessments: a.assessments + r.assessments,
      attendance: a.attendance + r.attendance,
    }),
    { students: 0, cohorts: 0, staff: 0, assessments: 0, attendance: 0 }
  );

  console.log("=".repeat(96));
  console.log("TOTAL attached to deleted schools:");
  console.log(`  students ${totals.students} | groups ${totals.cohorts} | staff ${totals.staff} | ` +
    `assessments ${totals.assessments} | attendance ${totals.attendance}`);

  await mongoose.disconnect();
  console.log("\ndone — nothing was written or deleted.");
  process.exit(0);
})();
