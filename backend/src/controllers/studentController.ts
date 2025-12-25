import { Response } from "express";
import Student from "../models/StudentModel";
import { UserRole } from "../configs/roles";
import { AuthRequest } from "../types/auth";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserParams,
} from "../types/requests";
import Assessment from "../models/AssessmentModel";
import Attendance from "../models/AttendanceModel";
import Cohort from "../models/CohortModel";
import logger from "../utils/logger";

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      age,
      gender,
      class: className,
      caste,
      mobileNumber,
      aadharNumber,
      apaarId,
      schoolId,
      contactInfo = [],
      knowledgeLevel = [],
      cohort = [],
    } = req.body;
    // School assignment logic (match UserModel)
    let finalSchoolId = schoolId;
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      finalSchoolId = req.user.schoolId;
    }
    if (!finalSchoolId) {
      return res.status(400).json({ error: "School ID is required" });
    }
    // Always auto-generate unique roll number
    const schoolShort = finalSchoolId.toString().slice(-6);
    
    // Ensure uniqueness by checking if it exists
    let isUnique = false;
    let finalRollNo = "";
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalRollNo = `STU-${schoolShort}-${timestamp}-${random}`;
      
      const existingStudent = await Student.findOne({
        roll_no: finalRollNo,
        school: finalSchoolId,
      });
      if (!existingStudent) {
        isUnique = true;
      } else {
        // Wait a bit and try again with new timestamp
        await new Promise(resolve => setTimeout(resolve, 1));
        attempts++;
      }
    }
    
    if (!isUnique) {
      return res.status(500).json({
        error: "Failed to generate unique roll number. Please try again.",
      });
    }
    
    // Create student in MongoDB
    const student = new Student({
      roll_no: finalRollNo,
      aadharNumber: aadharNumber || undefined,
      apaarId: apaarId || undefined,
      name,
      age,
      gender,
      class: className,
      caste: caste || undefined,
      mobileNumber: mobileNumber || undefined,
      school: finalSchoolId, // Use 'school' field as expected by the model
      contactInfo,
      knowledgeLevel,
      cohort,
    });
    await student.save();
    const populatedStudent = await student.populate("school", "name");

    // Transform the response to match frontend expectations (schoolId instead of school)
    const response = populatedStudent.toObject() as any;
    response.schoolId = response.school;
    delete response.school;

    res.status(201).json(response);
  } catch (error) {
    console.error("Error in student creation:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
};

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    console.log("➡️ Fetching students");
    const { schoolId } = req.query;
    const filter: any = {};

    // Determine which students to fetch based on user role and query params
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      // If the user is not a super admin, restrict to their school
      filter.school = req.user.schoolId; // Use 'school' field as expected by the model
      console.log(
        `User ${req.user._id} (${req.user.role}) requesting students from school ${req.user.schoolId}`
      );
    } else if (schoolId) {
      // If super admin and schoolId is provided in query, filter by that school
      filter.school = schoolId; // Use 'school' field as expected by the model
      console.log(`Super admin requesting students from school ${schoolId}`);
    } else {
      // Super admin requesting all students (no school filter)
      console.log("Super admin requesting all students");
    }

    // Fetch students from database with applied filters
    // Exclude archived students from the main list
    filter.isArchived = { $ne: true };
    const students = await Student.find(filter)
      .select("-__v") // Exclude __v field
      .populate("school", "name"); // Populate school name

    // Transform the response to match frontend expectations (schoolId instead of school)
    const transformedStudents = students.map((student) => {
      const studentObj = student.toObject() as any;
      studentObj.schoolId = studentObj.school;
      delete studentObj.school;
      return studentObj;
    });

    // Log the number of students found
    console.log(
      `Found ${students.length} students for filter:`,
      JSON.stringify(filter)
    );

    // Respond with the list of students
    res.json(transformedStudents);
  } catch (error) {
    // Log error details for debugging
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id, isArchived: { $ne: true } };
    // If not super admin, only allow fetching students from same school
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.school = req.user.schoolId; // Use 'school' field as expected by the model
    }
    const student = await Student.findOne(query)
      .select("-__v")
      .populate("school", "name"); // Populate school name
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Transform the response to match frontend expectations (schoolId instead of school)
    const response = student.toObject() as any;
    response.schoolId = response.school;
    delete response.school;

    res.json(response);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    const query: any = { _id: id };
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.school = req.user.schoolId; // Use 'school' field as expected by the model
    }
    // Only allow updating fields that exist in StudentModel
    // Note: roll_no is auto-generated and cannot be updated
    const allowedFields = [
      "name",
      "age",
      "gender",
      "class",
      "caste",
      "mobileNumber",
      "aadharNumber",
      "apaarId",
      "school", // Use 'school' field as expected by the model
      "contactInfo",
      "knowledgeLevel",
      "cohort",
    ];
    const filteredUpdate: any = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        // If frontend sends schoolId, map it to school field
        if (key === "school" && updateFields.schoolId !== undefined) {
          filteredUpdate[key] = updateFields.schoolId;
        } else if (updateFields[key] !== undefined) {
          // Handle optional fields - set to undefined if empty string
          if ((key === "caste" || key === "mobileNumber" || key === "aadharNumber" || key === "apaarId") && updateFields[key] === "") {
            filteredUpdate[key] = undefined;
          } else {
            filteredUpdate[key] = updateFields[key];
          }
        }
      }
    }
    // Update the student record
    const updatedStudent = await Student.findOneAndUpdate(
      query,
      { ...filteredUpdate },
      { new: true }
    ).populate("school", "name"); // Populate school name
    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Transform the response to match frontend expectations (schoolId instead of school)
    const response = updatedStudent.toObject() as any;
    response.schoolId = response.school;
    delete response.school;

    res.json(response);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
};

// Archive student (soft delete)
export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id };
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.school = req.user.schoolId; // Use 'school' field as expected by the model
    }
    // Archive the student instead of deleting
    const archivedStudent = await Student.findOneAndUpdate(
      query,
      { 
        isArchived: true,
        archivedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("school", "name");
    
    if (!archivedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // Transform the response to match frontend expectations
    const response = archivedStudent.toObject() as any;
    response.schoolId = response.school;
    delete response.school;
    
    res.json({ 
      message: "Student archived successfully",
      student: response
    });
  } catch (error) {
    console.error("Error archiving student:", error);
    res.status(500).json({ error: "Failed to archive student" });
  }
};

// Get archived students
export const getArchivedStudents = async (req: AuthRequest, res: Response) => {
  try {
    console.log("➡️ Fetching archived students");
    const { schoolId } = req.query;
    const filter: any = { isArchived: true };

    // Determine which archived students to fetch based on user role and query params
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      // If the user is not a super admin, restrict to their school
      filter.school = req.user.schoolId;
      console.log(
        `User ${req.user._id} (${req.user.role}) requesting archived students from school ${req.user.schoolId}`
      );
    } else if (schoolId) {
      // If super admin and schoolId is provided in query, filter by that school
      filter.school = schoolId;
      console.log(`Super admin requesting archived students from school ${schoolId}`);
    } else {
      // Super admin requesting all archived students (no school filter)
      console.log("Super admin requesting all archived students");
    }

    // Fetch archived students from database
    const students = await Student.find(filter)
      .select("-__v")
      .populate("school", "name")
      .sort({ archivedAt: -1 }); // Sort by most recently archived first

    // Transform the response to match frontend expectations
    const transformedStudents = students.map((student) => {
      const studentObj = student.toObject() as any;
      studentObj.schoolId = studentObj.school;
      delete studentObj.school;
      return studentObj;
    });

    console.log(
      `Found ${students.length} archived students for filter:`,
      JSON.stringify(filter)
    );

    res.json(transformedStudents);
  } catch (error) {
    console.error("Error fetching archived students:", error);
    res.status(500).json({ error: "Failed to fetch archived students" });
  }
};

// Restore archived student
export const restoreStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id, isArchived: true };
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.school = req.user.schoolId;
    }
    
    const restoredStudent = await Student.findOneAndUpdate(
      query,
      { 
        isArchived: false,
        archivedAt: undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).populate("school", "name");
    
    if (!restoredStudent) {
      return res.status(404).json({ error: "Archived student not found" });
    }
    
    // Transform the response to match frontend expectations
    const response = restoredStudent.toObject() as any;
    response.schoolId = response.school;
    delete response.school;
    
    res.json({ 
      message: "Student restored successfully",
      student: response
    });
  } catch (error) {
    console.error("Error restoring student:", error);
    res.status(500).json({ error: "Failed to restore student" });
  }
};

// Get student's current level (latest knowledge level)
export const getStudentLevel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id };

    // If not super admin, only allow fetching students from same school
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.schoolId = req.user.schoolId;
    }

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Get the most recent knowledge level
    const currentLevel =
      student.knowledgeLevel.length > 0
        ? student.knowledgeLevel[student.knowledgeLevel.length - 1]
        : null;

    res.json({
      studentId: student._id,
      studentName: student.name,
      currentLevel: currentLevel ? currentLevel.level : 0,
      lastAssessmentDate: currentLevel ? currentLevel.date : null,
      // Removed totalAssessments field - use knowledgeLevel.length if needed
      levelHistory: student.knowledgeLevel,
    });
  } catch (error) {
    console.error("Error fetching student level:", error);
    res.status(500).json({ error: "Failed to fetch student level" });
  }
};

// Get cohort assignment status for students in a school
export const getStudentCohortStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { schoolId } = req.params;

    if (!schoolId) {
      return res.status(400).json({ error: "School ID is required" });
    }

    // Check if user has permission to view this school's data
    if (req.user?.role === UserRole.TUTOR) {
      const userSchoolId = req.user.schoolId?.toString();
      const requestedSchoolId = schoolId?.toString();
      
      if (userSchoolId !== requestedSchoolId) {
        return res
          .status(403)
          .json({ error: "You can only view data for your assigned school" });
      }
    }

    // Get all students from the school (exclude archived students)
    const allStudents = await Student.find({ 
      school: schoolId,
      isArchived: { $ne: true },
    });

    // Filter students who have completed assessments
    const studentsWithAssessments = allStudents.filter(
      (student) => student.knowledgeLevel && student.knowledgeLevel.length > 0
    );

    // Get all active cohorts for this school to verify cohort existence
    const Cohort = require("../models/CohortModel").default;
    const activeCohorts = await Cohort.find({ 
      schoolId: schoolId,
      status: 'active'
    }).select('_id');

    const activeCohortIds = new Set(activeCohorts.map((c: any) => c._id.toString()));

    // Filter students who are in cohorts (have active cohort membership AND cohort exists and is active)
    const studentsInCohorts = studentsWithAssessments.filter(
      (student) =>
        student.cohort &&
        student.cohort.length > 0 &&
        student.cohort.some((c) => {
          // Check if cohort membership is active (no dateLeaved) AND cohort exists and is active
          const hasActiveMembership = !c.dateLeaved;
          const cohortExists = c.cohortId && activeCohortIds.has(c.cohortId.toString());
          return hasActiveMembership && cohortExists;
        })
    );

    // Students awaiting assignment (have assessments but not in active cohorts)
    const studentsAwaitingAssignment = studentsWithAssessments.filter(
      (student) =>
        !student.cohort ||
        student.cohort.length === 0 ||
        !student.cohort.some((c) => {
          // Check if cohort membership is active AND cohort exists and is active
          const hasActiveMembership = !c.dateLeaved;
          const cohortExists = c.cohortId && activeCohortIds.has(c.cohortId.toString());
          return hasActiveMembership && cohortExists;
        })
    );

    res.json({
      totalStudents: allStudents.length,
      studentsWithAssessments: studentsWithAssessments.length,
      studentsInCohorts: studentsInCohorts.length,
      studentsAwaitingAssignment: studentsAwaitingAssignment.length,
      unassignedStudents: studentsAwaitingAssignment.map((student) => ({
        _id: student._id,
        name: student.name,
        roll_no: student.roll_no,
        currentLevel:
          student.knowledgeLevel && student.knowledgeLevel.length > 0
            ? student.knowledgeLevel[student.knowledgeLevel.length - 1].level
            : 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching student cohort status:", error);
    res.status(500).json({ error: "Failed to fetch student cohort status" });
  }
};

// Get comprehensive report for a student
export const getStudentComprehensiveReport = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id, isArchived: { $ne: true } };

    // If not super admin, only allow fetching students from same school
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.school = req.user.schoolId;
    }

    // Get student with populated school
    const student = await Student.findOne(query)
      .populate("school", "name type")
      .populate("knowledgeLevel.program", "name subject");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const studentId = student._id;
    const schoolId = student.school;

    // Get all assessments for this student
    const assessments = await Assessment.find({ student: studentId })
      .populate("mentor", "name")
      .populate("school", "name")
      .sort({ date: -1 });

    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate("mentor", "name")
      .populate("school", "name")
      .sort({ date: -1 });

    // Calculate current levels per subject
    const currentLevels: { [key: string]: number } = {};
    const knowledgeLevelHistory = (student.knowledgeLevel || [])
      .filter((kl) => kl && kl.subject && typeof kl.subject === "string") // Filter out entries without valid subject
      .map((kl) => ({
        program: kl.program,
        programName: kl.programName || kl.subject || "Unknown",
        subject: kl.subject,
        level: kl.level,
        date: kl.date,
      }));

    // Group knowledge levels by subject and get latest
    const subjectLevels = new Map<string, { level: number; date: Date }>();
    (student.knowledgeLevel || []).forEach((kl) => {
      if (!kl || !kl.subject || typeof kl.subject !== "string") return; // Skip if subject is undefined or not a string
      try {
        const subject = kl.subject.toLowerCase();
        const existing = subjectLevels.get(subject);
        if (!existing || new Date(kl.date) > new Date(existing.date)) {
          subjectLevels.set(subject, { level: kl.level, date: kl.date });
        }
      } catch (err) {
        logger.warn(`Skipping knowledge level entry due to error: ${err}`);
      }
    });
    subjectLevels.forEach((value, key) => {
      currentLevels[key] = value.level;
    });

    // Process cohort memberships
    const cohortIds = student.cohort
      .filter((c) => !c.dateLeaved)
      .map((c) => c.cohortId);

    const cohorts = await Cohort.find({ _id: { $in: cohortIds } })
      .populate("schoolId", "name")
      .populate("tutorId", "name")
      .select("name schoolId tutorId status startDate");

    const cohortDetails = student.cohort.map((c) => {
      const cohort = cohorts.find(
        (co) => (co._id as any)?.toString() === c.cohortId.toString()
      );
      return {
        cohortId: c.cohortId,
        cohortName: cohort?.name || "Unknown",
        school: cohort?.schoolId || null,
        tutor: cohort?.tutorId || null,
        dateJoined: c.dateJoined,
        dateLeaved: c.dateLeaved || null,
        isActive: !c.dateLeaved,
      };
    });

    // Get cohort progress if student is in active cohort
    let cohortProgress = null;
    const activeCohortMembership = student.cohort.find((c) => !c.dateLeaved);
    if (activeCohortMembership) {
      const activeCohort = await Cohort.findById(activeCohortMembership.cohortId)
        .populate("schoolId", "name")
        .populate("tutorId", "name");

      if (activeCohort) {
        const progress = activeCohort.progress.find(
          (p) => (p.studentId as any)?.toString() === (studentId as any)?.toString()
        );

        if (progress) {
          cohortProgress = {
            cohortId: activeCohort._id,
            cohortName: activeCohort.name,
            currentLevel: progress.currentLevel,
            status: progress.status,
            failureCount: progress.failureCount || 0,
            lastAssessmentDate: progress.lastAssessmentDate || null,
            assessmentHistory: (progress.assessmentHistory || []).map((ah) => ({
              date: ah.date,
              level: ah.level,
              passed: ah.passed,
              status: ah.status,
              score: ah.score || null,
            })),
          };
        }
      }
    }

    // Calculate attendance statistics
    const attendanceStats = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter((a) => a.status === "present").length,
      absent: attendanceRecords.filter((a) => a.status === "absent").length,
      exam: attendanceRecords.filter((a) => a.status === "exam").length,
      percentage:
        attendanceRecords.length > 0
          ? Math.round(
              (attendanceRecords.filter((a) => a.status === "present").length /
                attendanceRecords.length) *
                100
            )
          : 0,
    };

    // Group attendance by month
    const attendanceByMonth = new Map<
      string,
      { present: number; absent: number; exam: number }
    >();
    attendanceRecords.forEach((record) => {
      const date = new Date(record.date);
      const month = date.getMonth() + 1;
      const monthKey = `${date.getFullYear()}-${month.toString().padStart(2, "0")}`;
      const existing = attendanceByMonth.get(monthKey) || {
        present: 0,
        absent: 0,
        exam: 0,
      };
      if (record.status === "present") existing.present++;
      else if (record.status === "absent") existing.absent++;
      else if (record.status === "exam") existing.exam++;
      attendanceByMonth.set(monthKey, existing);
    });

    const attendanceByMonthArray = Array.from(attendanceByMonth.entries()).map(
      ([month, stats]) => ({
        month,
        ...stats,
      })
    );

    // Group attendance by subject
    const attendanceBySubject: {
      [key: string]: { present: number; absent: number; exam: number };
    } = {};
    attendanceRecords.forEach((record) => {
      const subject = record.subject || "general";
      if (!attendanceBySubject[subject]) {
        attendanceBySubject[subject] = { present: 0, absent: 0, exam: 0 };
      }
      if (record.status === "present") attendanceBySubject[subject].present++;
      else if (record.status === "absent")
        attendanceBySubject[subject].absent++;
      else if (record.status === "exam") attendanceBySubject[subject].exam++;
    });

    // Calculate summary statistics
    const allLevels = student.knowledgeLevel.map((kl) => kl.level);
    const summary = {
      totalAssessments: assessments.length + student.knowledgeLevel.length,
      averageLevel:
        allLevels.length > 0
          ? Math.round(
              (allLevels.reduce((a, b) => a + b, 0) / allLevels.length) * 10
            ) / 10
          : 0,
      highestLevel: allLevels.length > 0 ? Math.max(...allLevels) : 0,
      attendancePercentage: attendanceStats.percentage,
    };

    // Transform student object
    const studentObj = student.toObject() as any;
    const response = {
      student: {
        _id: studentObj._id,
        name: studentObj.name,
        roll_no: studentObj.roll_no,
        age: studentObj.age,
        gender: studentObj.gender,
        class: studentObj.class,
        caste: studentObj.caste,
        mobileNumber: studentObj.mobileNumber,
        aadharNumber: studentObj.aadharNumber,
        apaarId: studentObj.apaarId,
        school: studentObj.school,
        contactInfo: studentObj.contactInfo,
        createdAt: studentObj.createdAt,
        updatedAt: studentObj.updatedAt,
        lastAssessmentDate: studentObj.lastAssessmentDate,
      },
      currentLevels,
      knowledgeLevelHistory,
      assessments: assessments
        .filter((a) => a && a.subject) // Filter out assessments without subject
        .map((a) => ({
          _id: a._id,
          subject: a.subject,
          level: a.level,
          date: a.date,
          mentor: a.mentor,
          school: a.school,
        })),
      attendance: {
        records: attendanceRecords.map((a) => ({
          _id: a._id,
          date: a.date,
          status: a.status,
          subject: a.subject,
          sessionType: a.sessionType,
          mentor: a.mentor,
          school: a.school,
          notes: a.notes,
        })),
        stats: attendanceStats,
        byMonth: attendanceByMonthArray,
        bySubject: attendanceBySubject,
      },
      cohorts: cohortDetails,
      cohortProgress,
      progressHistory: studentObj.progressHistory || [],
      summary,
    };

    logger.info(`Comprehensive report generated for student ${studentId}`);
    res.json(response);
  } catch (error: any) {
    logger.error("Error fetching comprehensive student report:", error);
    logger.error("Error stack:", error?.stack);
    logger.error("Error details:", {
      message: error?.message,
      name: error?.name,
    });
    res.status(500).json({
      error: "Failed to fetch comprehensive report",
      details: process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
};
