import { Request, Response } from "express";
import VolunteerRequest from "../models/VolunteerRequestModel";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";

// Public route - Submit volunteer request
export const submitVolunteerRequest = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      city,
      state,
      pincode,
      education,
      experience,
      motivation,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !city || !state || !pincode || !education) {
      return res.status(400).json({
        error: "Missing required fields: name, email, phoneNumber, city, state, pincode, education",
      });
    }

    // Check if email already exists in pending or approved requests
    const existingRequest = await VolunteerRequest.findOne({
      email,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        error: "A volunteer request with this email already exists",
      });
    }

    // Create new volunteer request
    const volunteerRequest = new VolunteerRequest({
      name,
      email,
      phoneNumber,
      city,
      state,
      pincode,
      education,
      experience: experience || "",
      motivation: motivation || "",
      status: "pending",
    });

    await volunteerRequest.save();

    res.status(201).json({
      success: true,
      message: "Volunteer request submitted successfully. You will be notified by email when reviewed.",
      requestId: volunteerRequest._id,
    });
  } catch (error) {
    console.error("Error submitting volunteer request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all volunteer requests (Super Admin only)
export const getAllVolunteerRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const query: any = {};
    if (status && typeof status === "string") {
      query.status = status;
    }

    const requests = await VolunteerRequest.find(query)
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests.map((req) => ({
        id: req._id,
        name: req.name,
        email: req.email,
        phoneNumber: req.phoneNumber,
        city: req.city,
        state: req.state,
        pincode: req.pincode,
        education: req.education,
        experience: req.experience,
        motivation: req.motivation,
        status: req.status,
        reviewedBy: req.reviewedBy,
        reviewedAt: req.reviewedAt,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching volunteer requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pending volunteer requests (Super Admin only)
export const getPendingVolunteerRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await VolunteerRequest.find({ status: "pending" })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests.map((req) => ({
        id: req._id,
        name: req.name,
        email: req.email,
        phoneNumber: req.phoneNumber,
        city: req.city,
        state: req.state,
        pincode: req.pincode,
        education: req.education,
        experience: req.experience,
        motivation: req.motivation,
        createdAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching pending volunteer requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Approve volunteer request (Super Admin only)
export const approveVolunteerRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const volunteerRequest = await VolunteerRequest.findById(requestId);

    if (!volunteerRequest) {
      return res.status(404).json({ error: "Volunteer request not found" });
    }

    if (volunteerRequest.status !== "pending") {
      return res.status(400).json({
        error: `Request is already ${volunteerRequest.status}`,
      });
    }

    volunteerRequest.status = "approved";
    volunteerRequest.reviewedBy = user._id as any;
    volunteerRequest.reviewedAt = new Date();
    await volunteerRequest.save();

    res.json({
      success: true,
      message: "Volunteer request approved successfully",
      request: {
        id: volunteerRequest._id,
        name: volunteerRequest.name,
        email: volunteerRequest.email,
        status: volunteerRequest.status,
        reviewedAt: volunteerRequest.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Error approving volunteer request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reject volunteer request (Super Admin only)
export const rejectVolunteerRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const volunteerRequest = await VolunteerRequest.findById(requestId);

    if (!volunteerRequest) {
      return res.status(404).json({ error: "Volunteer request not found" });
    }

    if (volunteerRequest.status !== "pending") {
      return res.status(400).json({
        error: `Request is already ${volunteerRequest.status}`,
      });
    }

    volunteerRequest.status = "rejected";
    volunteerRequest.reviewedBy = user._id as any;
    volunteerRequest.reviewedAt = new Date();
    volunteerRequest.rejectionReason = rejectionReason || "No reason provided";
    await volunteerRequest.save();

    res.json({
      success: true,
      message: "Volunteer request rejected",
      request: {
        id: volunteerRequest._id,
        name: volunteerRequest.name,
        email: volunteerRequest.email,
        status: volunteerRequest.status,
        rejectionReason: volunteerRequest.rejectionReason,
        reviewedAt: volunteerRequest.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Error rejecting volunteer request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

