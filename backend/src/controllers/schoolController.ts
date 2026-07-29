import { Response } from "express";
import School from "../models/SchoolModel";
import Student from "../models/StudentModel";
import Cohort from "../models/CohortModel";
import User from "../models/UserModel";
import { UserRole } from "../configs/roles";
import { AuthRequest } from "../types/auth";

export const getSchools = async (req: AuthRequest, res: Response) => {
  try {
    let schools;

    // Super admin can see all schools
    if (req.user?.role === UserRole.SUPER_ADMIN) {
      schools = await School.find().sort({ createdAt: -1 });
    }
    // Tutors can only see their assigned school
    else if (req.user?.role === UserRole.TUTOR && req.user.schoolId) {
      schools = await School.find({ _id: req.user.schoolId }).sort({
        createdAt: -1,
      });
    } else {
      return res.status(403).json({ error: "No school assigned to user" });
    }

    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: "Failed to load schools. Please try again." });
  }
};

export const getSchoolById = async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    res.json(school);
  } catch (error) {
    res.status(500).json({ error: "Failed to load school details. Please try again." });
  }
};

export const createSchool = async (req: AuthRequest, res: Response) => {
  try {
    // Only super admin can create schools
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const school = new School(req.body);
    await school.save();
    res.status(201).json(school);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: errors[0] || "Invalid school data. Please check all fields." });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: "A school with this email or name already exists." });
    }
    res.status(500).json({ error: "Failed to create school. Please try again." });
  }
};

export const updateSchool = async (req: AuthRequest, res: Response) => {
  try {
    // Only super admin can update schools
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const school = await School.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json(school);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ error: errors[0] || "Invalid school data. Please check all fields." });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: "A school with this email already exists." });
    }
    res.status(500).json({ error: "Failed to update school. Please try again." });
  }
};

export const deleteSchool = async (req: AuthRequest, res: Response) => {
  try {
    // Only super admin can delete schools
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Students, groups, tutors, assessments, attendance and view configs all
    // reference a school by id and none of them are cleaned up here. Deleting a
    // school that still has records leaves them pointing at an id that no
    // longer resolves: they stop appearing anywhere in the app while still
    // being counted, and a tutor left on a deleted school sees an empty
    // dashboard with no error. So refuse, and say what is in the way.
    const [studentCount, cohortCount, staffCount] = await Promise.all([
      Student.countDocuments({ school: req.params.id }),
      Cohort.countDocuments({ schoolId: req.params.id }),
      User.countDocuments({ schoolId: req.params.id }),
    ]);

    if (studentCount || cohortCount || staffCount) {
      const parts = [
        studentCount && `${studentCount} student(s)`,
        cohortCount && `${cohortCount} group(s)`,
        staffCount && `${staffCount} staff account(s)`,
      ].filter(Boolean);

      return res.status(400).json({
        error:
          `This school still has ${parts.join(", ")}. ` +
          `Move or archive them first, then delete the school.`,
      });
    }

    const school = await School.findByIdAndDelete(req.params.id);

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json({ message: "School deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete school. Please try again." });
  }
};
