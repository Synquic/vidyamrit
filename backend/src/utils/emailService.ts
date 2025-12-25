import nodemailer from "nodemailer";
import logger from "./logger";

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
    },
  });
};

export interface EmailOptions {
  to: string | string[]; // Single email or array of emails
  subject: string;
  text?: string; // Plain text version
  html?: string; // HTML version
}

/**
 * Send an email using Gmail SMTP
 * @param options Email options including to, subject, and body
 * @returns Promise<boolean> - true if email sent successfully
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      logger.error("Email configuration missing. Please set EMAIL_USER and EMAIL_APP_PASSWORD in .env");
      throw new Error("Email service not configured. Please contact administrator.");
    }

    const transporter = createTransporter();

    // Normalize 'to' field - convert single email to array
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Send email to all recipients
    const mailOptions = {
      from: `"Vidyamrit" <${process.env.EMAIL_USER}>`,
      to: recipients.join(", "), // Join multiple emails with comma
      subject: options.subject,
      text: options.text || "",
      html: options.html || options.text?.replace(/\n/g, "<br>") || "",
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${recipients.length} recipient(s). Message ID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error("Error sending email:", error);
    
    // Provide user-friendly error messages
    if (error.code === "EAUTH") {
      throw new Error("Email authentication failed. Please check EMAIL_USER and EMAIL_APP_PASSWORD configuration.");
    } else if (error.code === "ECONNECTION") {
      throw new Error("Failed to connect to email server. Please check your internet connection.");
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

/**
 * Send volunteer credentials via email
 * @param emails Array of email addresses to send to
 * @param credentials Volunteer credentials object
 * @param customSubject Optional custom subject line
 * @param customBody Optional custom body text
 * @returns Promise<boolean>
 */
export const sendVolunteerCredentials = async (
  emails: string | string[],
  credentials: {
    email: string;
    password: string;
    name: string;
    schoolName: string;
    expiresAt: string;
  },
  customSubject?: string,
  customBody?: string
): Promise<boolean> => {
  const defaultSubject = `Volunteer Account Credentials - ${credentials.name}`;
  const subject = customSubject || defaultSubject;

  // Default email body with credentials
  const defaultBody = `
Dear Volunteer,

Your volunteer account has been created for ${credentials.schoolName}. Please find your login credentials below:

Account Details:
- Account Name: ${credentials.name}
- Email: ${credentials.email}
- Password: ${credentials.password}
- School: ${credentials.schoolName}
- Expires At: ${new Date(credentials.expiresAt).toLocaleString()}

Important Notes:
- Multiple volunteers can use the same login credentials simultaneously
- You will only have access to student management and baseline assessments
- This account will expire on ${new Date(credentials.expiresAt).toLocaleString()}
- Please keep these credentials secure and do not share them publicly

If you have any questions, please contact the administrator.

Best regards,
Vidyamrit Team
  `.trim();

  const body = customBody || defaultBody;

  // Create HTML version for better formatting
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Volunteer Account Credentials</h2>
      <p>Dear Volunteer,</p>
      <p>Your volunteer account has been created for <strong>${credentials.schoolName}</strong>. Please find your login credentials below:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #555;">Account Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;"><strong>Account Name:</strong> ${credentials.name}</li>
          <li style="margin: 8px 0;"><strong>Email:</strong> <code style="background-color: #fff; padding: 2px 6px; border-radius: 3px;">${credentials.email}</code></li>
          <li style="margin: 8px 0;"><strong>Password:</strong> <code style="background-color: #fff; padding: 2px 6px; border-radius: 3px;">${credentials.password}</code></li>
          <li style="margin: 8px 0;"><strong>School:</strong> ${credentials.schoolName}</li>
          <li style="margin: 8px 0;"><strong>Expires At:</strong> ${new Date(credentials.expiresAt).toLocaleString()}</li>
        </ul>
      </div>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Important Notes:</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Multiple volunteers can use the same login credentials simultaneously</li>
          <li>You will only have access to student management and baseline assessments</li>
          <li>This account will expire on <strong>${new Date(credentials.expiresAt).toLocaleString()}</strong></li>
          <li>Please keep these credentials secure and do not share them publicly</li>
        </ul>
      </div>
      
      <p>If you have any questions, please contact the administrator.</p>
      <p>Best regards,<br><strong>Vidyamrit Team</strong></p>
    </div>
  `;

  return await sendEmail({
    to: emails,
    subject,
    text: body,
    html: htmlBody,
  });
};

