import { Response } from "express";
import Student from "../models/StudentModel";
import { UserRole } from "../configs/roles";
import { AuthRequest } from "../types/auth";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserParams,
} from "../types/requests";

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      roll_no,
      name,
      age,
      gender,
      class: className,
      caste,
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
    // Check if student already exists in this school
    const existingStudent = await Student.findOne({
      roll_no,
      schoolId: finalSchoolId,
    });
    if (existingStudent) {
      return res.status(400).json({
        error: "Student with this roll number already exists in this school",
      });
    }
    // Create student in MongoDB
    const student = new Student({
      roll_no,
      name,
      age,
      gender,
      class: className,
      caste,
      schoolId: finalSchoolId,
      contactInfo,
      knowledgeLevel,
      cohort,
    });
    await student.save();
    const populatedStudent = await student.populate("schoolId", "name");
    res.status(201).json(populatedStudent);
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
      filter.schoolId = req.user.schoolId;
      console.log(
        `User ${req.user._id} (${req.user.role}) requesting students from school ${req.user.schoolId}`
      );
    } else if (schoolId) {
      // If super admin and schoolId is provided in query, filter by that school
      filter.schoolId = schoolId;
      console.log(`Super admin requesting students from school ${schoolId}`);
    } else {
      // Super admin requesting all students (no school filter)
      console.log("Super admin requesting all students");
    }

    // Fetch students from database with applied filters
    const students = await Student.find(filter)
      .select("-__v") // Exclude __v field
      // .populate("schoolId", "name"); // Populate school name

    // Log the number of students found
    console.log(
      `Found ${students.length} students for filter:`,
      JSON.stringify(filter)
    );

    // Respond with the list of students
    res.json(students);
  } catch (error) {
    // Log error details for debugging
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id };
    // If not super admin, only allow fetching students from same school
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.schoolId = req.user.schoolId;
    }
    const student = await Student.findOne(query)
      .select("-__v")
      .populate("schoolId", "name");
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
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
      query.schoolId = req.user.schoolId;
    }
    // Only allow updating fields that exist in StudentModel
    const allowedFields = [
      "roll_no",
      "name",
      "age",
      "gender",
      "class",
      "caste",
      "schoolId",
      "contactInfo",
      "knowledgeLevel",
      "cohort",
    ];
    const filteredUpdate: any = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        filteredUpdate[key] = updateFields[key];
      }
    }
    // Update the student record
    const updatedStudent = await Student.findOneAndUpdate(
      query,
      { ...filteredUpdate },
      { new: true }
    ).populate("schoolId", "name");
    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query: any = { _id: id };
    if (req.user && req.user.role !== UserRole.SUPER_ADMIN) {
      query.schoolId = req.user.schoolId;
    }
    const deletedStudent = await Student.findOneAndDelete(query);
    if (!deletedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
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
      totalAssessments: student.knowledgeLevel.length,
      levelHistory: student.knowledgeLevel,
    });
  } catch (error) {
    console.error("Error fetching student level:", error);
    res.status(500).json({ error: "Failed to fetch student level" });
  }
};
