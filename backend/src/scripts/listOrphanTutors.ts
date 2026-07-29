/**
 * READ-ONLY. Lists staff accounts whose school no longer exists.
 *
 * These accounts can still sign in, but every screen filters by their
 * schoolId, so they land on an empty dashboard with no error shown. This
 * script only reads — no writes, updates or deletes.
 *
 *   npx tsx src/scripts/listOrphanTutors.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import Cohort from "../models/CohortModel";
import User from "../models/UserModel";

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("connected — READ ONLY\n");

  const realIds = (await School.distinct("_id")).map(
    (id: any) => new mongoose.Types.ObjectId(id)
  );

  const orphans = await User.find({
    role: { $in: ["tutor", "mentor", "volunteer"] },
    schoolId: { $nin: [...realIds, null] },
  })
    .select("name email phoneNo role schoolId isActive createdAt")
    .sort({ createdAt: 1 })
    .lean();

  console.log(`${orphans.length} staff account(s) on a deleted school\n`);
  console.log(
    "NAME".padEnd(24) +
      "EMAIL".padEnd(34) +
      "ROLE".padEnd(11) +
      "ACTIVE".padEnd(8) +
      "CREATED".padEnd(12) +
      "DEAD SCHOOL"
  );
  console.log("-".repeat(130));

  for (const u of orphans as any[]) {
    console.log(
      String(u.name ?? "").slice(0, 22).padEnd(24) +
        String(u.email ?? "").slice(0, 32).padEnd(34) +
        String(u.role ?? "").padEnd(11) +
        String(u.isActive !== false).padEnd(8) +
        new Date(u.createdAt).toISOString().slice(0, 10).padEnd(12) +
        String(u.schoolId)
    );
  }

  // Grouping by dead school shows whether an account is alone or part of a
  // whole school that was removed.
  const bySchool = new Map<string, number>();
  for (const u of orphans as any[]) {
    const k = String(u.schoolId);
    bySchool.set(k, (bySchool.get(k) ?? 0) + 1);
  }

  console.log(`\nAcross ${bySchool.size} deleted school(s):\n`);
  for (const [schoolId, staff] of bySchool) {
    const sid = new mongoose.Types.ObjectId(schoolId);
    const [students, groups] = await Promise.all([
      Student.countDocuments({ school: sid }),
      Cohort.countDocuments({ schoolId: sid }),
    ]);
    console.log(
      `  ${schoolId}   staff: ${String(staff).padEnd(3)} students: ${String(
        students
      ).padEnd(5)} groups: ${groups}`
    );
  }

  await mongoose.disconnect();
  console.log("\ndone — nothing was written or deleted.");
  process.exit(0);
})();
