import { Request, Response } from "express";
import Group, { IGroup, GroupLevel, Subject } from "../models/GroupModel";
import Student from "../models/StudentModel";
import User from "../models/UserModel";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";
import mongoose from "mongoose";

export const createGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      level,
      subject,
      schoolId,
      mentorId,
      description,
      minLevel,
      maxLevel,
      capacity,
      autoAssignment,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !level ||
      !subject ||
      !schoolId ||
      minLevel === undefined ||
      maxLevel === undefined
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate mentor if provided
    if (mentorId) {
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== UserRole.MENTOR) {
        res.status(400).json({ message: "Invalid mentor" });
        return;
      }
    }

    // Check if group with same name, level, and subject already exists in school
    const existingGroup = await Group.findOne({
      name,
      level,
      subject,
      school: schoolId,
    });

    if (existingGroup) {
      res
        .status(400)
        .json({
          message:
            "Group with this name, level, and subject already exists in this school",
        });
      return;
    }

    const group = new Group({
      name,
      level,
      subject,
      school: schoolId,
      mentor: mentorId,
      description,
      minLevel,
      maxLevel,
      capacity: capacity || 30,
      autoAssignment: autoAssignment !== undefined ? autoAssignment : true,
      students: [],
    });

    await group.save();

    // Populate the group with related data
    const populatedGroup = await Group.findById(group._id)
      .populate("school", "name")
      .populate("mentor", "name email")
      .populate("students", "name roll_no class");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroups = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId, subject, level, mentorId } = req.query;

    // Build filter based on user role and query parameters
    const filter: any = {};

    if (schoolId) {
      filter.school = schoolId;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (level) {
      filter.level = level;
    }

    if (mentorId) {
      filter.mentor = mentorId;
    }

    // If user is a mentor, only show their groups
    if (req.user?.role === UserRole.MENTOR) {
      filter.mentor = req.user._id;
    }

    const groups = await Group.find(filter)
      .populate("school", "name")
      .populate("mentor", "name email")
      .populate(
        "students",
        "name roll_no class hindi_level math_level english_level"
      )
      .sort({ level: 1, name: 1 });

    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate("school", "name")
      .populate("mentor", "name email")
      .populate(
        "students",
        "name roll_no class hindi_level math_level english_level"
      );

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Check permissions
    if (
      req.user?.role === UserRole.MENTOR &&
      group.mentor?.toString() !== req.user._id?.toString()
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      level,
      subject,
      mentorId,
      description,
      minLevel,
      maxLevel,
      capacity,
      autoAssignment,
    } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Validate mentor if provided
    if (mentorId) {
      const mentor = await User.findById(mentorId);
      if (!mentor || mentor.role !== UserRole.MENTOR) {
        res.status(400).json({ message: "Invalid mentor" });
        return;
      }
    }

    // Update fields
    if (name) group.name = name;
    if (level) group.level = level;
    if (subject) group.subject = subject;
    if (mentorId !== undefined) group.mentor = mentorId || undefined;
    if (description !== undefined) group.description = description;
    if (minLevel !== undefined) group.minLevel = minLevel;
    if (maxLevel !== undefined) group.maxLevel = maxLevel;
    if (capacity !== undefined) group.capacity = capacity;
    if (autoAssignment !== undefined) group.autoAssignment = autoAssignment;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("school", "name")
      .populate("mentor", "name email")
      .populate("students", "name roll_no class");

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const group = await Group.findByIdAndDelete(id);
    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addStudentToGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      res.status(400).json({ message: "Student ID is required" });
      return;
    }

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // Check if group is at capacity
    if (group.students.length >= group.capacity) {
      res.status(400).json({ message: "Group is at full capacity" });
      return;
    }

    // Check if student is already in the group
    if (group.students.includes(new mongoose.Types.ObjectId(studentId))) {
      res.status(400).json({ message: "Student is already in this group" });
      return;
    }

    // Add student to group
    group.students.push(new mongoose.Types.ObjectId(studentId));
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("school", "name")
      .populate("mentor", "name email")
      .populate("students", "name roll_no class");

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error adding student to group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeStudentFromGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id, studentId } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    // Remove student from group
    group.students = group.students.filter(
      (student) => student.toString() !== studentId
    );
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("school", "name")
      .populate("mentor", "name email")
      .populate("students", "name roll_no class");

    res.json(updatedGroup);
  } catch (error) {
    console.error("Error removing student from group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const autoAssignStudentsToGroups = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId, subject } = req.body;

    if (!schoolId || !subject) {
      res.status(400).json({ message: "School ID and subject are required" });
      return;
    }

    // Get all groups for this school and subject with auto-assignment enabled
    const groups = await Group.find({
      school: schoolId,
      subject,
      autoAssignment: true,
    }).sort({ level: 1 });

    if (groups.length === 0) {
      res
        .status(400)
        .json({
          message:
            "No auto-assignment groups found for this school and subject",
        });
      return;
    }

    // Get all students in this school
    const students = await Student.find({ school: schoolId });

    const assignmentResults = {
      assigned: 0,
      alreadyAssigned: 0,
      noSuitableGroup: 0,
      errors: 0,
    };

    for (const student of students) {
      try {
        // Get student's level for this subject
        let studentLevel: number;
        switch (subject) {
          case "hindi":
            studentLevel = student.hindi_level || 1;
            break;
          case "math":
            studentLevel = student.math_level || 1;
            break;
          case "english":
            studentLevel = student.english_level || 1;
            break;
          default:
            studentLevel = 1;
        }

        // Check if student is already in a group for this subject
        const existingGroup = await Group.findOne({
          school: schoolId,
          subject,
          students: student._id,
        });

        if (existingGroup) {
          assignmentResults.alreadyAssigned++;
          continue;
        }

        // Find suitable group based on student level
        const suitableGroup = groups.find(
          (group) =>
            studentLevel >= group.minLevel &&
            studentLevel <= group.maxLevel &&
            group.students.length < group.capacity
        );

        if (!suitableGroup) {
          assignmentResults.noSuitableGroup++;
          continue;
        }

        // Add student to group
        suitableGroup.students.push(student._id);
        await suitableGroup.save();
        assignmentResults.assigned++;
      } catch (error) {
        console.error(`Error assigning student ${student._id}:`, error);
        assignmentResults.errors++;
      }
    }

    res.json({
      message: "Auto-assignment completed",
      results: assignmentResults,
    });
  } catch (error) {
    console.error("Error in auto-assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { schoolId, subject } = req.query;

    const filter: any = {};
    if (schoolId) filter.school = schoolId;
    if (subject) filter.subject = subject;

    // Get groups with student counts
    const groups = await Group.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "students",
          localField: "students",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      {
        $addFields: {
          studentCount: { $size: "$students" },
          availableSpots: { $subtract: ["$capacity", { $size: "$students" }] },
        },
      },
      {
        $group: {
          _id: {
            level: "$level",
            subject: "$subject",
          },
          totalGroups: { $sum: 1 },
          totalStudents: { $sum: "$studentCount" },
          totalCapacity: { $sum: "$capacity" },
          avgStudentsPerGroup: { $avg: "$studentCount" },
        },
      },
      { $sort: { "_id.level": 1 } },
    ]);

    res.json(groups);
  } catch (error) {
    console.error("Error fetching group statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
