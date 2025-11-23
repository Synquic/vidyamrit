import mongoose from "mongoose";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import User from "../models/UserModel";
import Cohort from "../models/CohortModel";
import Assessment from "../models/AssessmentModel";
import ProgramAssessment from "../models/ProgramAssessmentModel";
import Attendance from "../models/AttendanceModel";
import { IViewConfig } from "../models/ViewModel";
import { UserRole } from "../configs/roles";
import logger from "../utils/logger";

interface FilterOptions {
  schoolId?: mongoose.Types.ObjectId[] | string[];
  block?: string[];
  state?: string[];
  type?: ("government" | "private")[];
  programId?: mongoose.Types.ObjectId[] | string[];
  dateRange?: { start: Date; end: Date };
  cohortId?: mongoose.Types.ObjectId[] | string[];
}

/**
 * Helper function to convert string IDs to ObjectIds
 */
function toObjectIds(ids: (string | mongoose.Types.ObjectId)[] | undefined): mongoose.Types.ObjectId[] {
  if (!ids || ids.length === 0) {
    return [];
  }
  
  console.log("toObjectIds input:", ids);
  console.log("toObjectIds input types:", ids.map(id => typeof id));
  
  const result = ids
    .filter((id) => id != null) // Filter out null/undefined
    .map((id) => {
      // If already an ObjectId, return as is
      if (id instanceof mongoose.Types.ObjectId) {
        console.log("Already ObjectId:", id);
        return id;
      }
      // If it's a string, try to convert
      if (typeof id === 'string') {
        // Validate that it's a valid ObjectId string
        if (mongoose.Types.ObjectId.isValid(id)) {
          const objId = new mongoose.Types.ObjectId(id);
          console.log("Converted string to ObjectId:", id, "->", objId);
          return objId;
        }
        // Log warning but don't throw - just skip invalid IDs
        console.warn(`Invalid ObjectId string: ${id}, skipping`);
        return null;
      }
      // For other types, try to convert to string first
      try {
        const idStr = String(id);
        if (mongoose.Types.ObjectId.isValid(idStr)) {
          return new mongoose.Types.ObjectId(idStr);
        }
      } catch (e) {
        console.warn(`Could not convert ID to ObjectId: ${id}`, e);
      }
      return null;
    })
    .filter((id): id is mongoose.Types.ObjectId => id !== null); // Filter out nulls
    
  console.log("toObjectIds output:", result);
  return result;
}

/**
 * Build base filter for school-based queries
 */
function buildSchoolFilter(
  access: IViewConfig["access"],
  filters?: FilterOptions
): mongoose.FilterQuery<any> {
  const query: mongoose.FilterQuery<any> = {};

  // Apply access control
  if (access?.allowedSchools && Array.isArray(access.allowedSchools) && access.allowedSchools.length > 0) {
    // Convert string IDs to ObjectIds
    const schoolIds = toObjectIds(access.allowedSchools);
    
    if (schoolIds.length > 0) {
      query._id = { $in: schoolIds };
    }
    // If schoolIds is empty after conversion, don't add the filter
  }

  if (access.allowedBlocks && access.allowedBlocks.length > 0) {
    query.block = { $in: access.allowedBlocks };
  }

  if (access.allowedStates && access.allowedStates.length > 0) {
    query.state = { $in: access.allowedStates };
  }

  // Apply section-specific filters
  if (filters?.block && filters.block.length > 0) {
    query.block = { $in: filters.block };
  }

  if (filters?.state && filters.state.length > 0) {
    query.state = { $in: filters.state };
  }

  if (filters?.type && filters.type.length > 0) {
    query.type = { $in: filters.type };
  }

  return query;
}

/**
 * Aggregate school metrics
 */
export async function aggregateSchoolMetrics(
  config: IViewConfig["sections"]["schools"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled) return null;

  try {
    const schoolFilter = buildSchoolFilter(access, config.filters);
    console.log("School filter query:", JSON.stringify(schoolFilter, null, 2));
    const schools = await School.find(schoolFilter).lean();

    const result: any = {};

    if (config.showTotal !== false) {
      result.total = schools.length;
    }

    const schoolIds = schools.map((s) => s._id);

    if (config.showActive) {
      // Schools with at least one active cohort
      const activeCohorts = await Cohort.find({
        schoolId: { $in: schoolIds },
        status: "active",
      }).distinct("schoolId");
      result.active = activeCohorts.length;
    }

    if (config.showWithAssessments) {
      // Schools with at least one assessment
      const schoolsWithAssessments = await Assessment.find({
        school: { $in: schoolIds },
      }).distinct("school");
      result.withAssessments = schoolsWithAssessments.length;
    }

    // Add detailed list of schools
    if (config.showDetails !== false) {
      const detailedSchools = await Promise.all(
        schools.map(async (school: any) => {
          // Get student count
          const studentCount = await Student.countDocuments({
            school: school._id,
            isArchived: false,
          });

          // Get cohort count
          const cohortCount = await Cohort.countDocuments({
            schoolId: school._id,
          });

          // Get active cohort count
          const activeCohortCount = await Cohort.countDocuments({
            schoolId: school._id,
            status: "active",
          });

          // Get tutor count
          const tutorCount = await Cohort.distinct("tutorId", {
            schoolId: school._id,
            status: "active",
          });

          // Get assessment count
          const assessmentCount = await Assessment.countDocuments({
            school: school._id,
          });

          return {
            schoolId: school._id.toString(),
            name: school.name,
            type: school.type,
            udise_code: school.udise_code,
            address: school.address,
            level: school.level,
            city: school.city,
            state: school.state,
            block: school.block || "N/A",
            establishedYear: school.establishedYear,
            pinCode: school.pinCode,
            pointOfContact: school.pointOfContact,
            phone: school.phone,
            studentCount,
            cohortCount,
            activeCohortCount,
            tutorCount: tutorCount.length,
            assessmentCount,
            createdAt: school.createdAt,
          };
        })
      );

      result.details = detailedSchools;
    }

    return result;
  } catch (error: any) {
    console.error("\n========== AGGREGATE SCHOOL METRICS ERROR ==========");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error kind:", error.kind);
    console.error("Error path:", error.path);
    console.error("Error value:", error.value);
    console.error("Access allowedSchools:", JSON.stringify(access?.allowedSchools, null, 2));
    console.error("====================================================\n");
    throw error;
  }
}

/**
 * Aggregate tutor metrics
 */
export async function aggregateTutorMetrics(
  config: IViewConfig["sections"]["tutors"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled) return null;

  const query: mongoose.FilterQuery<any> = {
    role: UserRole.TUTOR,
  };

  // If filters specify schools, get tutors from those schools
  if (config.filters?.schoolId && config.filters.schoolId.length > 0) {
    query.schoolId = { $in: toObjectIds(config.filters.schoolId) };
  } else if (access.allowedSchools && access.allowedSchools.length > 0) {
    query.schoolId = { $in: toObjectIds(access.allowedSchools) };
  }

  const tutors = await User.find(query).lean();

  const result: any = {};

  if (config.showTotal !== false) {
    result.total = tutors.length;
  }

  const tutorIds = tutors.map((t: any) => t._id);

  // Engaged tutors (assigned to at least one active cohort)
  const engagedTutors = await Cohort.find({
    tutorId: { $in: tutorIds },
    status: "active",
  }).distinct("tutorId");
  result.engaged = engagedTutors.length;

  // Add detailed list of tutors
  if (config.showDetails !== false) {
    const detailedTutors = await Promise.all(
      tutors.map(async (tutor: any) => {
        // Get school info if available
        let schoolInfo = null;
        if (tutor.schoolId) {
          const school = await School.findById(tutor.schoolId).lean();
          if (school) {
            schoolInfo = {
              schoolId: school._id.toString(),
              name: school.name,
              block: school.block,
              state: school.state,
            };
          }
        }

        // Get cohorts assigned to this tutor
        const cohorts = await Cohort.find({
          tutorId: tutor._id,
        }).lean();

        // Get student count across all cohorts
        const studentCount = cohorts.reduce((total: number, cohort: any) => {
          return total + (cohort.students?.length || 0);
        }, 0);

        // Get active cohorts
        const activeCohorts = cohorts.filter((c: any) => c.status === "active");

        return {
          tutorId: tutor._id.toString(),
          name: tutor.name,
          email: tutor.email,
          phoneNo: tutor.phoneNo,
          school: schoolInfo,
          cohortCount: cohorts.length,
          activeCohortCount: activeCohorts.length,
          studentCount,
          isActive: tutor.isActive !== false,
          createdAt: tutor.createdAt,
        };
      })
    );

    result.details = detailedTutors;
  }

  return result;
}

/**
 * Aggregate student metrics
 */
export async function aggregateStudentMetrics(
  config: IViewConfig["sections"]["students"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled) return null;

  // Build school filter first
  const schoolFilter = buildSchoolFilter(access, config.filters);
  const allowedSchools = await School.find(schoolFilter).distinct("_id");

  const query: mongoose.FilterQuery<any> = {};

  if (config.filters?.schoolId && config.filters.schoolId.length > 0) {
    query.school = { $in: toObjectIds(config.filters.schoolId) };
  } else if (allowedSchools.length > 0) {
    query.school = { $in: allowedSchools };
  }

  // Apply block/state filters if specified
  if (config.filters?.block || config.filters?.state) {
    const additionalSchoolFilter: mongoose.FilterQuery<any> = {};
    if (config.filters?.block) {
      additionalSchoolFilter.block = { $in: config.filters.block };
    }
    if (config.filters?.state) {
      additionalSchoolFilter.state = { $in: config.filters.state };
    }
    const additionalSchools = await School.find(additionalSchoolFilter).distinct(
      "_id"
    );
    if (query.school) {
      query.school = {
        $in: (query.school as any).$in.filter((id: mongoose.Types.ObjectId) =>
          additionalSchools.some((sid) => sid.equals(id))
        ),
      };
    } else {
      query.school = { $in: additionalSchools };
    }
  }

  const result: any = {};

  if (config.showTotal !== false) {
    result.total = await Student.countDocuments(query);
  }

  if (config.showActive) {
    result.active = await Student.countDocuments({
      ...query,
      isArchived: false,
    });
  }

  if (config.showDropped) {
    result.dropped = await Student.countDocuments({
      ...query,
      isArchived: true,
    });
  }

  // Add detailed list of students
  if (config.showDetails !== false) {
    const students = await Student.find(query)
      .populate("school", "name block state city type")
      .lean()
      .limit(1000); // Limit to prevent performance issues

    const detailedStudents = await Promise.all(
      students.map(async (student: any) => {
        // Get cohort info
        const cohortIds = student.cohort?.map((c: any) => c.cohortId) || [];
        const cohorts = await Cohort.find({
          _id: { $in: cohortIds },
        })
          .populate("programId", "name subject")
          .populate("tutorId", "name email")
          .lean();

        // Get assessment count
        const assessmentCount = await Assessment.countDocuments({
          student: student._id,
        });

        // Get latest assessment
        const latestAssessment = await Assessment.findOne({
          student: student._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          studentId: student._id.toString(),
          roll_no: student.roll_no,
          name: student.name,
          age: student.age,
          gender: student.gender,
          class: student.class,
          caste: student.caste || "N/A",
          mobileNumber: student.mobileNumber || "N/A",
          aadharNumber: student.aadharNumber || "N/A",
          school: student.school
            ? {
                schoolId: student.school._id.toString(),
                name: student.school.name,
                block: student.school.block,
                state: student.school.state,
                city: student.school.city,
                type: student.school.type,
              }
            : null,
          cohortCount: cohorts.length,
          activeCohortCount: cohorts.filter((c: any) => c.status === "active").length,
          cohorts: cohorts.map((c: any) => ({
            cohortId: c._id.toString(),
            name: c.name,
            program: c.programId
              ? {
                  programId: c.programId._id.toString(),
                  name: c.programId.name,
                  subject: c.programId.subject,
                }
              : null,
            tutor: c.tutorId
              ? {
                  tutorId: c.tutorId._id.toString(),
                  name: c.tutorId.name,
                  email: c.tutorId.email,
                }
              : null,
            status: c.status,
            currentLevel: c.currentLevel,
          })),
          assessmentCount,
          latestAssessment: latestAssessment
            ? {
                assessmentId: latestAssessment._id.toString(),
                type: latestAssessment.type,
                level: latestAssessment.level,
                date: latestAssessment.createdAt,
              }
            : null,
          knowledgeLevel: student.knowledgeLevel || [],
          // Removed currentProgressFlags field
          isArchived: student.isArchived || false,
          createdAt: student.createdAt,
        };
      })
    );

    result.details = detailedStudents;
  }

  return result;
}

/**
 * Aggregate cohort metrics
 */
export async function aggregateCohortMetrics(
  config: IViewConfig["sections"]["cohorts"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled) return null;

  const schoolFilter = buildSchoolFilter(access, config.filters);
  const allowedSchools = await School.find(schoolFilter).distinct("_id");

  const query: mongoose.FilterQuery<any> = {};

  if (config.filters?.schoolId && config.filters.schoolId.length > 0) {
    query.schoolId = { $in: toObjectIds(config.filters.schoolId) };
  } else if (allowedSchools.length > 0) {
    query.schoolId = { $in: allowedSchools };
  }

  if (config.filters?.programId && config.filters.programId.length > 0) {
    query.programId = { $in: toObjectIds(config.filters.programId) };
  }

  const result: any = {};

  if (config.showTotal !== false) {
    result.total = await Cohort.countDocuments(query);
  }

  result.active = await Cohort.countDocuments({
    ...query,
    status: "active",
  });

  // Add detailed list of cohorts
  if (config.showDetails !== false) {
    const cohorts = await Cohort.find(query)
      .populate("schoolId", "name block state city type")
      .populate("tutorId", "name email phoneNo")
      .populate("programId", "name subject description")
      .lean()
      .limit(1000);

    const detailedCohorts = await Promise.all(
      cohorts.map(async (cohort: any) => {
        // Get student count
        const studentCount = cohort.students?.length || 0;

        // Get attendance stats
        const attendanceRecords = await Attendance.find({
          cohortId: cohort._id,
        }).lean();

        const presentCount = attendanceRecords.filter(
          (a: any) => a.status === "present"
        ).length;
        const absentCount = attendanceRecords.filter(
          (a: any) => a.status === "absent"
        ).length;
        const totalAttendance = attendanceRecords.length;
        const attendanceRate =
          totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

        // Get progress stats
        const progressRecords = cohort.progress || [];
        const averageLevel =
          progressRecords.length > 0
            ? progressRecords.reduce(
                (sum: number, p: any) => sum + (p.currentLevel || 0),
                0
              ) / progressRecords.length
            : cohort.currentLevel || 0;

        return {
          cohortId: cohort._id.toString(),
          name: cohort.name,
          school: cohort.schoolId
            ? {
                schoolId: cohort.schoolId._id.toString(),
                name: cohort.schoolId.name,
                block: cohort.schoolId.block,
                state: cohort.schoolId.state,
                city: cohort.schoolId.city,
                type: cohort.schoolId.type,
              }
            : null,
          tutor: cohort.tutorId
            ? {
                tutorId: cohort.tutorId._id.toString(),
                name: cohort.tutorId.name,
                email: cohort.tutorId.email,
                phoneNo: cohort.tutorId.phoneNo,
              }
            : null,
          program: cohort.programId
            ? {
                programId: cohort.programId._id.toString(),
                name: cohort.programId.name,
                subject: cohort.programId.subject,
                description: cohort.programId.description,
              }
            : null,
          currentLevel: cohort.currentLevel || 1,
          status: cohort.status,
          studentCount,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          presentCount,
          absentCount,
          totalAttendance,
          averageLevel: Math.round(averageLevel * 10) / 10,
          startDate: cohort.startDate,
          estimatedCompletionDate: cohort.estimatedCompletionDate,
          createdAt: cohort.createdAt,
        };
      })
    );

    result.details = detailedCohorts;
  }

  return result;
}

/**
 * Aggregate assessment metrics
 */
export async function aggregateAssessmentMetrics(
  config: IViewConfig["sections"]["assessments"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled) return null;

  const schoolFilter = buildSchoolFilter(access, config.filters);
  const allowedSchools = await School.find(schoolFilter).distinct("_id");

  const query: mongoose.FilterQuery<any> = {};

  if (config.filters?.schoolId && Array.isArray(config.filters.schoolId) && config.filters.schoolId.length > 0) {
    const schoolIds = toObjectIds(config.filters.schoolId);
    if (schoolIds.length > 0) {
      query.school = { $in: schoolIds };
    }
  } else if (allowedSchools.length > 0) {
    query.school = { $in: allowedSchools };
  }

  if (config.filters?.programId && Array.isArray(config.filters.programId) && config.filters.programId.length > 0) {
    // For program assessments
    const programIds = toObjectIds(config.filters.programId);
    if (programIds.length > 0) {
      const programAssessmentQuery: mongoose.FilterQuery<any> = { ...query };
      programAssessmentQuery.program = {
        $in: programIds,
      };
      if (config.filters?.dateRange) {
        const startDate = typeof config.filters.dateRange.start === 'string' 
          ? new Date(config.filters.dateRange.start) 
          : config.filters.dateRange.start;
        const endDate = typeof config.filters.dateRange.end === 'string'
          ? new Date(config.filters.dateRange.end)
          : config.filters.dateRange.end;
        programAssessmentQuery.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }
      const programAssessments = await ProgramAssessment.countDocuments(
        programAssessmentQuery
      );

      // Also count regular assessments
      if (config.filters?.dateRange) {
        const startDate = typeof config.filters.dateRange.start === 'string' 
          ? new Date(config.filters.dateRange.start) 
          : config.filters.dateRange.start;
        const endDate = typeof config.filters.dateRange.end === 'string'
          ? new Date(config.filters.dateRange.end)
          : config.filters.dateRange.end;
        query.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }
      const regularAssessments = await Assessment.countDocuments(query);

      return {
        total: programAssessments + regularAssessments,
        programAssessments,
        regularAssessments,
      };
    }
  }

  if (config.filters?.dateRange) {
    const startDate = typeof config.filters.dateRange.start === 'string' 
      ? new Date(config.filters.dateRange.start) 
      : config.filters.dateRange.start;
    const endDate = typeof config.filters.dateRange.end === 'string'
      ? new Date(config.filters.dateRange.end)
      : config.filters.dateRange.end;
    query.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const result: any = {};

  if (config.showTotal !== false) {
    result.total = await Assessment.countDocuments(query);
  }

  // Add detailed list of assessments
  if (config.showDetails !== false) {
    const assessments = await Assessment.find(query)
      .populate("school", "name block state city")
      .populate("student", "name roll_no class age gender")
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const detailedAssessments = assessments.map((assessment: any) => ({
      assessmentId: assessment._id.toString(),
      type: assessment.type,
      level: assessment.level,
      score: assessment.score || null,
      school: assessment.school
        ? {
            schoolId: assessment.school._id.toString(),
            name: assessment.school.name,
            block: assessment.school.block,
            state: assessment.school.state,
            city: assessment.school.city,
          }
        : null,
      student: assessment.student
        ? {
            studentId: assessment.student._id.toString(),
            name: assessment.student.name,
            roll_no: assessment.student.roll_no,
            class: assessment.student.class,
            age: assessment.student.age,
            gender: assessment.student.gender,
          }
        : null,
      date: assessment.createdAt || assessment.date,
      createdAt: assessment.createdAt,
    }));

    // Also get program assessments if program filter is specified
    let programAssessments: any[] = [];
    if (config.filters?.programId && Array.isArray(config.filters.programId) && config.filters.programId.length > 0) {
      const programIds = toObjectIds(config.filters.programId);
      const programAssessmentQuery: mongoose.FilterQuery<any> = {};
      
      if (allowedSchools.length > 0) {
        // Get students from allowed schools
        const studentIds = await Student.find({
          school: { $in: allowedSchools },
        }).distinct("_id");
        programAssessmentQuery.student = { $in: studentIds };
      }
      
      programAssessmentQuery.program = { $in: programIds };
      
      if (config.filters?.dateRange) {
        const startDate = typeof config.filters.dateRange.start === 'string' 
          ? new Date(config.filters.dateRange.start) 
          : config.filters.dateRange.start;
        const endDate = typeof config.filters.dateRange.end === 'string'
          ? new Date(config.filters.dateRange.end)
          : config.filters.dateRange.end;
        programAssessmentQuery.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      const programAssessmentsData = await ProgramAssessment.find(programAssessmentQuery)
        .populate("student", "name roll_no class age gender school")
        .populate("program", "name subject description")
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();

      programAssessments = programAssessmentsData.map((pa: any) => ({
        assessmentId: pa._id.toString(),
        type: "program_assessment",
        level: pa.level,
        score: pa.score || null,
        school: pa.student?.school
          ? {
              schoolId: pa.student.school._id?.toString(),
              name: pa.student.school.name,
              block: pa.student.school.block,
              state: pa.student.school.state,
              city: pa.student.school.city,
            }
          : null,
        student: pa.student
          ? {
              studentId: pa.student._id.toString(),
              name: pa.student.name,
              roll_no: pa.student.roll_no,
              class: pa.student.class,
              age: pa.student.age,
              gender: pa.student.gender,
            }
          : null,
        program: pa.program
          ? {
              programId: pa.program._id.toString(),
              name: pa.program.name,
              subject: pa.program.subject,
              description: pa.program.description,
            }
          : null,
        date: pa.createdAt,
        createdAt: pa.createdAt,
      }));
    }

    result.details = [...detailedAssessments, ...programAssessments].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return result;
}

/**
 * Aggregate progress data
 */
export async function aggregateProgressData(
  config: IViewConfig["sections"]["progress"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled || !config.views || config.views.length === 0)
    return null;

  const schoolFilter = buildSchoolFilter(access, config.filters);
  const allowedSchools = await School.find(schoolFilter).distinct("_id");

  const result: any = {};

  for (const viewType of config.views) {
    switch (viewType) {
      case "student":
        // Individual student progress
        const studentQuery: mongoose.FilterQuery<any> = {};
        if (config.filters?.schoolId && Array.isArray(config.filters.schoolId) && config.filters.schoolId.length > 0) {
          const schoolIds = toObjectIds(config.filters.schoolId);
          if (schoolIds.length > 0) {
            studentQuery.school = { $in: schoolIds };
          }
        } else if (allowedSchools.length > 0) {
          studentQuery.school = { $in: allowedSchools };
        }
        const students = await Student.find(studentQuery)
          .select("name knowledgeLevel")
          .lean();
        result.student = students.map((s: any) => ({
          studentId: s._id,
          name: s.name,
          latestLevel:
            s.knowledgeLevel && s.knowledgeLevel.length > 0
              ? s.knowledgeLevel[s.knowledgeLevel.length - 1].level
              : 0,
          // Removed currentProgressFlags field
        }));
        break;

      case "cohort":
        const cohortQuery: mongoose.FilterQuery<any> = {};
        if (config.filters?.schoolId && config.filters.schoolId.length > 0) {
          cohortQuery.schoolId = { $in: toObjectIds(config.filters.schoolId) };
        } else if (allowedSchools.length > 0) {
          cohortQuery.schoolId = { $in: allowedSchools };
        }
        const cohorts = await Cohort.find(cohortQuery)
          .select("name currentLevel progress status")
          .lean();
        result.cohort = cohorts.map((c: any) => ({
          cohortId: c._id,
          name: c.name,
          currentLevel: c.currentLevel,
          status: c.status,
          progressCount: c.progress?.length || 0,
        }));
        break;

      case "school":
        const schools = await School.find(schoolFilter)
          .select("name block state")
          .lean();
        result.school = await Promise.all(
          schools.map(async (school: any) => {
            const students = await Student.countDocuments({
              school: school._id,
              isArchived: false,
            });
            const cohorts = await Cohort.countDocuments({
              schoolId: school._id,
              status: "active",
            });
            return {
              schoolId: school._id,
              name: school.name,
              block: school.block,
              state: school.state,
              studentCount: students,
              cohortCount: cohorts,
            };
          })
        );
        break;

      case "block":
        const blockGroups = await School.aggregate([
          { $match: schoolFilter },
          {
            $group: {
              _id: "$block",
              schools: { $push: "$$ROOT" },
            },
          },
        ]);
        result.block = await Promise.all(
          blockGroups.map(async (group) => {
            const schoolIds = group.schools.map((s: any) => s._id);
            const students = await Student.countDocuments({
              school: { $in: schoolIds },
              isArchived: false,
            });
            const cohorts = await Cohort.countDocuments({
              schoolId: { $in: schoolIds },
              status: "active",
            });
            return {
              block: group._id,
              schoolCount: group.schools.length,
              studentCount: students,
              cohortCount: cohorts,
            };
          })
        );
        break;

      case "state":
        const stateGroups = await School.aggregate([
          { $match: schoolFilter },
          {
            $group: {
              _id: "$state",
              schools: { $push: "$$ROOT" },
            },
          },
        ]);
        result.state = await Promise.all(
          stateGroups.map(async (group) => {
            const schoolIds = group.schools.map((s: any) => s._id);
            const students = await Student.countDocuments({
              school: { $in: schoolIds },
              isArchived: false,
            });
            const cohorts = await Cohort.countDocuments({
              schoolId: { $in: schoolIds },
              status: "active",
            });
            return {
              state: group._id,
              schoolCount: group.schools.length,
              studentCount: students,
              cohortCount: cohorts,
            };
          })
        );
        break;

      case "program":
        const programQuery: mongoose.FilterQuery<any> = {};
        if (config.filters?.programId && Array.isArray(config.filters.programId) && config.filters.programId.length > 0) {
          const programIds = toObjectIds(config.filters.programId);
          if (programIds.length > 0) {
            programQuery._id = { $in: programIds };
          }
        }
        const Program = mongoose.model("Program");
        const programs = await Program.find(programQuery)
          .select("name subject")
          .lean();
        result.program = await Promise.all(
          programs.map(async (program: any) => {
            const cohorts = await Cohort.countDocuments({
              programId: program._id,
            });
            const students = await Student.countDocuments({
              cohort: {
                $elemMatch: {
                  cohortId: { $in: await Cohort.find({ programId: program._id }).distinct("_id") },
                },
              },
            });
            return {
              programId: program._id,
              name: program.name,
              subject: program.subject,
              cohortCount: cohorts,
              studentCount: students,
            };
          })
        );
        break;
    }
  }

  return result;
}

/**
 * Aggregate attendance data
 */
export async function aggregateAttendanceData(
  config: IViewConfig["sections"]["attendance"],
  access: IViewConfig["access"]
) {
  if (!config?.enabled || !config.views || config.views.length === 0)
    return null;

  const schoolFilter = buildSchoolFilter(access, config.filters);
  const allowedSchools = await School.find(schoolFilter).distinct("_id");

  const dateFilter: mongoose.FilterQuery<any> = {};
  if (config.filters?.dateRange) {
    const startDate = typeof config.filters.dateRange.start === 'string' 
      ? new Date(config.filters.dateRange.start) 
      : config.filters.dateRange.start;
    const endDate = typeof config.filters.dateRange.end === 'string'
      ? new Date(config.filters.dateRange.end)
      : config.filters.dateRange.end;
    dateFilter.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const result: any = {};

  for (const viewType of config.views) {
    switch (viewType) {
      case "student":
        const studentQuery: mongoose.FilterQuery<any> = {
          ...dateFilter,
        };
        if (config.filters?.schoolId && config.filters.schoolId.length > 0) {
          studentQuery.school = { $in: toObjectIds(config.filters.schoolId) };
        } else if (allowedSchools.length > 0) {
          studentQuery.school = { $in: allowedSchools };
        }
        const studentAttendance = await Attendance.aggregate([
          { $match: studentQuery },
          {
            $group: {
              _id: "$student",
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
              },
              total: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "_id",
              foreignField: "_id",
              as: "student",
            },
          },
          { $unwind: "$student" },
          {
            $project: {
              studentId: "$_id",
              studentName: "$student.name",
              present: 1,
              absent: 1,
              total: 1,
              attendanceRate: {
                $multiply: [
                  { $divide: ["$present", "$total"] },
                  100,
                ],
              },
            },
          },
        ]);
        result.student = studentAttendance;
        break;

      case "cohort":
        const cohortQuery: mongoose.FilterQuery<any> = {};
        if (config.filters?.cohortId && Array.isArray(config.filters.cohortId) && config.filters.cohortId.length > 0) {
          const cohortIds = toObjectIds(config.filters.cohortId);
          if (cohortIds.length > 0) {
            cohortQuery._id = { $in: cohortIds };
          }
        }
        const cohorts = await Cohort.find(cohortQuery)
          .select("name students attendance")
          .lean();
        result.cohort = cohorts.map((c: any) => {
          const attendanceRecords = c.attendance || [];
          const present = attendanceRecords.filter(
            (a: any) => a.status === "present"
          ).length;
          const total = attendanceRecords.length;
          return {
            cohortId: c._id,
            name: c.name,
            studentCount: c.students?.length || 0,
            present,
            absent: total - present,
            total,
            attendanceRate: total > 0 ? (present / total) * 100 : 0,
          };
        });
        break;

      case "school":
        const schoolQuery: mongoose.FilterQuery<any> = {
          ...dateFilter,
        };
        if (config.filters?.schoolId && config.filters.schoolId.length > 0) {
          schoolQuery.school = { $in: toObjectIds(config.filters.schoolId) };
        } else if (allowedSchools.length > 0) {
          schoolQuery.school = { $in: allowedSchools };
        }
        const schoolAttendance = await Attendance.aggregate([
          { $match: schoolQuery },
          {
            $group: {
              _id: "$school",
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
              },
              total: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "_id",
              foreignField: "_id",
              as: "school",
            },
          },
          { $unwind: "$school" },
          {
            $project: {
              schoolId: "$_id",
              schoolName: "$school.name",
              present: 1,
              absent: 1,
              total: 1,
              attendanceRate: {
                $multiply: [
                  { $divide: ["$present", "$total"] },
                  100,
                ],
              },
            },
          },
        ]);
        result.school = schoolAttendance;
        break;

      case "block":
        const blockAttendance = await Attendance.aggregate([
          {
            $match: {
              ...dateFilter,
              school: { $in: allowedSchools },
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "school",
              foreignField: "_id",
              as: "school",
            },
          },
          { $unwind: "$school" },
          {
            $group: {
              _id: "$school.block",
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
              },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              block: "$_id",
              present: 1,
              absent: 1,
              total: 1,
              attendanceRate: {
                $multiply: [
                  { $divide: ["$present", "$total"] },
                  100,
                ],
              },
            },
          },
        ]);
        result.block = blockAttendance;
        break;

      case "state":
        const stateAttendance = await Attendance.aggregate([
          {
            $match: {
              ...dateFilter,
              school: { $in: allowedSchools },
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "school",
              foreignField: "_id",
              as: "school",
            },
          },
          { $unwind: "$school" },
          {
            $group: {
              _id: "$school.state",
              present: {
                $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
              },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              state: "$_id",
              present: 1,
              absent: 1,
              total: 1,
              attendanceRate: {
                $multiply: [
                  { $divide: ["$present", "$total"] },
                  100,
                ],
              },
            },
          },
        ]);
        result.state = stateAttendance;
        break;
    }
  }

  return result;
}

/**
 * Main function to aggregate all view data
 */
export async function aggregateViewData(config: IViewConfig) {
  logger.info("\n========== aggregateViewData FUNCTION CALLED ==========");
  logger.info("Step AGG-1: Function started");
  
  const result: any = {};

  try {
    logger.info("Step AGG-2: Validating config structure");
    // Ensure config has required structure
    if (!config || !config.sections || !config.access) {
      logger.error("Step AGG-2 FAILED: Invalid config structure");
      throw new Error("Invalid view configuration: missing sections or access");
    }
    logger.info("Step AGG-2 SUCCESS: Config structure valid");
    logger.info(`Config access allowedSchools: ${JSON.stringify(config.access?.allowedSchools)}`);

    if (config.sections.schools?.enabled) {
      logger.info("Step AGG-3: Aggregating school metrics");
      try {
        result.schools = await aggregateSchoolMetrics(
          config.sections.schools,
          config.access
        );
        logger.info("Step AGG-3 SUCCESS: School metrics aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-3 FAILED: Error aggregating schools - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-3 SKIPPED: Schools section not enabled");
    }

    if (config.sections.tutors?.enabled) {
      logger.info("Step AGG-4: Aggregating tutor metrics");
      try {
        result.tutors = await aggregateTutorMetrics(
          config.sections.tutors,
          config.access
        );
        logger.info("Step AGG-4 SUCCESS: Tutor metrics aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-4 FAILED: Error aggregating tutors - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-4 SKIPPED: Tutors section not enabled");
    }

    if (config.sections.students?.enabled) {
      logger.info("Step AGG-5: Aggregating student metrics");
      try {
        result.students = await aggregateStudentMetrics(
          config.sections.students,
          config.access
        );
        logger.info("Step AGG-5 SUCCESS: Student metrics aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-5 FAILED: Error aggregating students - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-5 SKIPPED: Students section not enabled");
    }

    if (config.sections.cohorts?.enabled) {
      logger.info("Step AGG-6: Aggregating cohort metrics");
      try {
        result.cohorts = await aggregateCohortMetrics(
          config.sections.cohorts,
          config.access
        );
        logger.info("Step AGG-6 SUCCESS: Cohort metrics aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-6 FAILED: Error aggregating cohorts - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-6 SKIPPED: Cohorts section not enabled");
    }

    if (config.sections.assessments?.enabled) {
      logger.info("Step AGG-7: Aggregating assessment metrics");
      try {
        result.assessments = await aggregateAssessmentMetrics(
          config.sections.assessments,
          config.access
        );
        logger.info("Step AGG-7 SUCCESS: Assessment metrics aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-7 FAILED: Error aggregating assessments - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-7 SKIPPED: Assessments section not enabled");
    }

    if (config.sections.progress?.enabled) {
      logger.info("Step AGG-8: Aggregating progress data");
      try {
        result.progress = await aggregateProgressData(
          config.sections.progress,
          config.access
        );
        logger.info("Step AGG-8 SUCCESS: Progress data aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-8 FAILED: Error aggregating progress - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-8 SKIPPED: Progress section not enabled");
    }

    if (config.sections.attendance?.enabled) {
      logger.info("Step AGG-9: Aggregating attendance data");
      try {
        result.attendance = await aggregateAttendanceData(
          config.sections.attendance,
          config.access
        );
        logger.info("Step AGG-9 SUCCESS: Attendance data aggregated");
      } catch (err: any) {
        logger.error(`Step AGG-9 FAILED: Error aggregating attendance - ${err.message}`);
        throw err;
      }
    } else {
      logger.info("Step AGG-9 SKIPPED: Attendance section not enabled");
    }

    logger.info("Step AGG-10: All aggregations completed successfully");
    logger.info("========== aggregateViewData FUNCTION COMPLETED ==========\n");
    return result;
  } catch (error: any) {
    logger.error("\n========== AGGREGATE VIEW DATA ERROR ==========");
    logger.error(`Error in aggregateViewData: ${error.message}`);
    logger.error(`Error name: ${error.name}`);
    logger.error(`Error kind: ${error.kind}`);
    logger.error(`Error value: ${error.value}`);
    logger.error(`Error path: ${error.path}`);
    if (error.stack) {
      logger.error(`Error stack: ${error.stack}`);
    }
    logger.error("===============================================\n");
    throw error; // Re-throw to be caught by controller
  }
}

