/**
 * READ-ONLY audit of the numbers behind the super-admin dashboard cards.
 *
 * There is no write, update or delete anywhere in this file — only
 * countDocuments, distinct, find and aggregate. Safe to run against production.
 *
 *   npx tsx src/scripts/auditAnalytics.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import Assessment from "../models/AssessmentModel";
import Cohort from "../models/CohortModel";
import User from "../models/UserModel";
import ProgramAssessment from "../models/ProgramAssessmentModel";

dotenv.config();

const line = (t: string) => console.log(`\n===== ${t} =====`);
const row = (label: string, value: unknown) =>
  console.log(`  ${label.padEnd(46)} ${value}`);

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("connected — READ ONLY audit\n");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Every school id that actually exists. Everything below is measured against
  // this, because the dashboard currently trusts ids found on other documents.
  const realIds = new Set((await School.distinct("_id")).map(String));
  const realObjectIds = [...realIds].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  line("SCHOOLS");
  row("Total schools", realIds.size);

  const recentAssess = await Assessment.distinct("school", {
    date: { $gte: thirtyDaysAgo },
  });
  const recentKnowledge = await Student.distinct("school", {
    "knowledgeLevel.date": { $gte: thirtyDaysAgo },
  });
  const activeUnion = new Set(
    [...recentAssess, ...recentKnowledge].filter(Boolean).map(String)
  );
  row("'Active in last 30d' — current (buggy)", activeUnion.size);
  row(
    "'Active in last 30d' — CORRECTED",
    [...activeUnion].filter((id) => realIds.has(id)).length
  );

  const baselineUnion = new Set(
    [
      ...(await Student.distinct("school", {
        $or: [
          { "knowledgeLevel.0": { $exists: true } },
          { lastAssessmentDate: { $exists: true } },
        ],
      })),
      ...(await Assessment.distinct("school")),
    ]
      .filter(Boolean)
      .map(String)
  );
  row("'Schools with baseline' — current (buggy)", baselineUnion.size);
  row(
    "'Schools with baseline' — CORRECTED",
    [...baselineUnion].filter((id) => realIds.has(id)).length
  );

  line("STUDENTS");
  row("Total — current", await Student.countDocuments());
  row(
    "Total — CORRECTED (school exists)",
    await Student.countDocuments({ school: { $in: realObjectIds } })
  );
  row(
    "Not archived — current",
    await Student.countDocuments({ isArchived: { $ne: true } })
  );
  row(
    "Not archived — CORRECTED",
    await Student.countDocuments({
      school: { $in: realObjectIds },
      isArchived: { $ne: true },
    })
  );
  row(
    "Archived — CORRECTED",
    await Student.countDocuments({
      school: { $in: realObjectIds },
      isArchived: true,
    })
  );
  row(
    "ORPHANED (school no longer exists)",
    await Student.countDocuments({ school: { $nin: realObjectIds } })
  );

  line("GROUPS (cohorts)");
  row("Total — current", await Cohort.countDocuments());
  row(
    "Total — CORRECTED",
    await Cohort.countDocuments({ schoolId: { $in: realObjectIds } })
  );
  row("Active — current", await Cohort.countDocuments({ status: "active" }));
  row(
    "Active — CORRECTED",
    await Cohort.countDocuments({
      schoolId: { $in: realObjectIds },
      status: "active",
    })
  );
  row(
    "ORPHANED groups",
    await Cohort.countDocuments({ schoolId: { $nin: realObjectIds } })
  );

  line("TUTORS");
  row(
    "Total tutors — current",
    await User.countDocuments({ role: { $in: ["tutor", "mentor"] } })
  );
  row(
    "Tutors attached to a DELETED school",
    await User.countDocuments({
      role: { $in: ["tutor", "mentor"] },
      schoolId: { $nin: [...realObjectIds, null] },
    })
  );
  const engagedCurrent = await Cohort.distinct("tutorId", {
    status: "active",
    tutorId: { $ne: null },
  });
  const engagedCorrected = await Cohort.distinct("tutorId", {
    status: "active",
    tutorId: { $ne: null },
    schoolId: { $in: realObjectIds },
  });
  row("Engaged tutors — current", engagedCurrent.length);
  row("Engaged tutors — CORRECTED", engagedCorrected.length);

  line("TESTS — is Math.max() the right call?");
  const legacyCount = await Assessment.countDocuments();
  const klAgg = await Student.aggregate([
    { $project: { n: { $size: { $ifNull: ["$knowledgeLevel", []] } } } },
    { $group: { _id: null, total: { $sum: "$n" } } },
  ]);
  const klTotal = klAgg[0]?.total || 0;
  const progCount = await ProgramAssessment.countDocuments({
    status: "completed",
  });

  row("Assessment records (legacy)", legacyCount);
  row("knowledgeLevel entries (all students)", klTotal);
  row("ProgramAssessment (completed)", progCount);
  row(
    "--> current formula: max(legacy,kl)+prog",
    Math.max(legacyCount, klTotal) + progCount
  );
  row(
    "--> if separate: legacy+kl+prog",
    legacyCount + klTotal + progCount
  );

  // Overlap tells us which of the two formulas is honest.
  const studentsWithKl = await Student.countDocuments({
    "knowledgeLevel.0": { $exists: true },
  });
  const studentIdsInAssessments = await Assessment.distinct("student");
  const bothCount = await Student.countDocuments({
    _id: { $in: studentIdsInAssessments },
    "knowledgeLevel.0": { $exists: true },
  });
  row("students having knowledgeLevel", studentsWithKl);
  row("students appearing in Assessment", studentIdsInAssessments.length);
  row("students having BOTH  <-- overlap", bothCount);

  row(
    "Assessments on DELETED schools",
    await Assessment.countDocuments({ school: { $nin: realObjectIds } })
  );

  line("ORPHANED STUDENTS — first 20 (nothing is modified)");
  const orphanStudents = await Student.find({ school: { $nin: realObjectIds } })
    .select("name class roll_no school isArchived")
    .limit(20)
    .lean();
  orphanStudents.forEach((s: any) =>
    console.log(
      `  ${String(s.name).padEnd(24)} class ${String(s.class).padEnd(4)} ` +
        `archived=${!!s.isArchived}  deadSchool=${s.school}`
    )
  );

  const orphanSchoolIds = await Student.distinct("school", {
    school: { $nin: realObjectIds },
  });
  console.log(
    `\n  ...spread across ${orphanSchoolIds.length} deleted school id(s)`
  );

  await mongoose.disconnect();
  console.log("\ndone — nothing was written or deleted.");
  process.exit(0);
})();
