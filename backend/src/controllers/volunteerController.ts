import { Request, Response } from "express";
import { auth } from "../configs/firebaseAdmin";
import User from "../models/UserModel";
import { UserRole } from "../configs/roles";
import { AuthRequest } from "../types/auth";

// Create a new volunteer account for a school
export const createVolunteer = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId, durationHours = 24, volunteerName = "Volunteer" } = req.body;
    
    if (!schoolId) {
      return res.status(400).json({ error: "School ID is required" });
    }

    // Generate unique email for this volunteer account
    const timestamp = Date.now();
    const volunteerEmail = `volunteer-${schoolId}-${timestamp}@vidyamrit.volunteer`;
    const volunteerPassword = "volunteer123"; // Default password (can be customized)

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    // Create Firebase user
    const firebaseUser = await auth.createUser({
      email: volunteerEmail,
      password: volunteerPassword,
      displayName: `${volunteerName} - School ${schoolId}`,
    });

    // Create user in MongoDB
    const volunteer = new User({
      uid: firebaseUser.uid,
      name: `${volunteerName} - School ${schoolId}`,
      email: volunteerEmail,
      phoneNo: "0000000000", // Placeholder
      role: UserRole.VOLUNTEER,
      schoolId: schoolId,
      expiresAt: expiresAt,
      isActive: true,
    });

    await volunteer.save();

    res.status(201).json({
      success: true,
      volunteer: {
        id: volunteer._id,
        email: volunteerEmail,
        password: volunteerPassword,
        expiresAt: expiresAt,
        schoolId: schoolId,
        name: volunteer.name,
      },
      message: `Volunteer account created successfully. Expires at ${expiresAt.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Error creating volunteer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all volunteers for a school
export const getVolunteersBySchool = async (req: AuthRequest, res: Response) => {
  try {
    const { schoolId } = req.params;
    
    const volunteers = await User.find({
      role: UserRole.VOLUNTEER,
      schoolId: schoolId,
    }).populate("schoolId", "name type");

    res.json({
      success: true,
      volunteers: volunteers.map(vol => ({
        id: vol._id,
        name: vol.name,
        email: vol.email,
        expiresAt: vol.expiresAt,
        isActive: vol.isActive,
        schoolId: vol.schoolId,
        createdAt: vol.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all volunteers (for super admin)
export const getAllVolunteers = async (req: AuthRequest, res: Response) => {
  try {
    const volunteers = await User.find({
      role: UserRole.VOLUNTEER,
    }).populate("schoolId", "name type");

    res.json({
      success: true,
      volunteers: volunteers.map(vol => ({
        id: vol._id,
        name: vol.name,
        email: vol.email,
        expiresAt: vol.expiresAt,
        isActive: vol.isActive,
        schoolId: vol.schoolId,
        createdAt: vol.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching all volunteers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update volunteer status (activate/deactivate)
export const updateVolunteerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { volunteerId } = req.params;
    const { isActive } = req.body;

    const volunteer = await User.findOneAndUpdate(
      { _id: volunteerId, role: UserRole.VOLUNTEER },
      { isActive: isActive, updatedAt: new Date() },
      { new: true }
    ).populate("schoolId", "name type");

    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    res.json({
      success: true,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        expiresAt: volunteer.expiresAt,
        isActive: volunteer.isActive,
        schoolId: volunteer.schoolId,
      },
      message: `Volunteer ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error("Error updating volunteer status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Extend volunteer expiration
export const extendVolunteerAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { volunteerId } = req.params;
    const { additionalHours = 24 } = req.body;

    const volunteer = await User.findOne({ _id: volunteerId, role: UserRole.VOLUNTEER });
    
    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    // Extend from current expiry or now (whichever is later)
    const currentTime = new Date();
    const currentExpiry = volunteer.expiresAt || currentTime;
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), currentTime.getTime()));
    newExpiry.setHours(newExpiry.getHours() + additionalHours);

    volunteer.expiresAt = newExpiry;
    volunteer.updatedAt = new Date();
    await volunteer.save();

    res.json({
      success: true,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        expiresAt: volunteer.expiresAt,
        isActive: volunteer.isActive,
        schoolId: volunteer.schoolId,
      },
      message: `Volunteer access extended by ${additionalHours} hours. New expiry: ${newExpiry.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Error extending volunteer access:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete volunteer account
export const deleteVolunteer = async (req: AuthRequest, res: Response) => {
  try {
    const { volunteerId } = req.params;

    const volunteer = await User.findOne({ _id: volunteerId, role: UserRole.VOLUNTEER });
    
    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    // Delete from Firebase
    try {
      await auth.deleteUser(volunteer.uid);
    } catch (firebaseError) {
      console.warn("Error deleting Firebase user:", firebaseError);
      // Continue with MongoDB deletion even if Firebase fails
    }

    // Delete from MongoDB
    await User.deleteOne({ _id: volunteerId });

    res.json({
      success: true,
      message: "Volunteer account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting volunteer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Check if volunteer access is still valid
export const checkVolunteerAccess = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    if (user.role !== UserRole.VOLUNTEER) {
      return res.status(403).json({ error: "Not a volunteer account" });
    }

    const currentTime = new Date();
    const isExpired = user.expiresAt && currentTime > user.expiresAt;
    const isInactive = !user.isActive;

    res.json({
      success: true,
      access: {
        isValid: !isExpired && !isInactive,
        isExpired,
        isInactive,
        expiresAt: user.expiresAt,
        timeRemaining: user.expiresAt 
          ? Math.max(0, user.expiresAt.getTime() - currentTime.getTime())
          : null,
      },
    });
  } catch (error) {
    console.error("Error checking volunteer access:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};