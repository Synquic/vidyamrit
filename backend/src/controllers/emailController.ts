import { Response } from "express";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";
import { sendVolunteerCredentials } from "../utils/emailService";
import logger from "../utils/logger";
import User from "../models/UserModel";

/**
 * Send volunteer credentials via email
 * POST /api/volunteers/:volunteerId/send-credentials
 * Body: { emails: string | string[], subject?: string, body?: string }
 */
export const sendVolunteerCredentialsEmail = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { volunteerId } = req.params;
    const { emails, subject, body } = req.body;

    // Validate required fields
    if (!emails) {
      return res.status(400).json({
        error: "Email addresses are required",
      });
    }

    // Normalize emails - convert string to array if needed
    const emailList = Array.isArray(emails) ? emails : [emails];

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(
      (email: string) => !emailRegex.test(email.trim())
    );

    if (invalidEmails.length > 0) {
      return res.status(400).json({
        error: `Invalid email addresses: ${invalidEmails.join(", ")}`,
      });
    }

    // Get volunteer details from database
    const volunteer = await User.findOne({
      _id: volunteerId,
      role: UserRole.VOLUNTEER,
    }).populate("schoolId", "name");

    if (!volunteer) {
      return res.status(404).json({
        error: "Volunteer not found",
      });
    }

    // Get school name
    const schoolIdObj = volunteer.schoolId as any;
    const schoolName =
      typeof schoolIdObj === "object" && schoolIdObj?.name
        ? schoolIdObj.name
        : "Unknown School";

    // Get password from request (it should be passed from frontend)
    // Note: Password is only available when creating, so we need to pass it from frontend
    const password = req.body.password;

    if (!password) {
      return res.status(400).json({
        error: "Password is required to send credentials",
      });
    }

    // Send email
    await sendVolunteerCredentials(
      emailList.map((email: string) => email.trim()),
      {
        email: volunteer.email,
        password: password,
        name: volunteer.name,
        schoolName: schoolName,
        expiresAt:
          volunteer.expiresAt?.toISOString() || new Date().toISOString(),
      },
      subject,
      body
    );

    logger.info(
      `Volunteer credentials sent via email to ${emailList.length} recipient(s) for volunteer ${volunteerId}`
    );

    res.json({
      success: true,
      message: `Credentials sent successfully to ${emailList.length} recipient(s)`,
      recipients: emailList,
    });
  } catch (error: any) {
    logger.error("Error sending volunteer credentials email:", error);
    res.status(500).json({
      error: error.message || "Failed to send email",
    });
  }
};
