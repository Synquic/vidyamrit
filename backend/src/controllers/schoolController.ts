import { Response } from "express";
import School from "../models/SchoolModel";
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
    res.status(500).json({ error: "Error fetching schools" });
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
    res.status(500).json({ error: "Error fetching school" });
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
    if (error.code === 11000) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error creating school" });
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
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "School with this email already exists" });
    }
    res.status(500).json({ error: "Error updating school" });
  }
};

export const deleteSchool = async (req: AuthRequest, res: Response) => {
  try {
    // Only super admin can delete schools
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const school = await School.findByIdAndDelete(req.params.id);

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json({ message: "School deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting school" });
  }
};
