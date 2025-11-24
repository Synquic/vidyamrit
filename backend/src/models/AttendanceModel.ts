import mongoose, { Document } from "mongoose";

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  school: mongoose.Types.ObjectId;
  mentor: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "exam";
  subject?: "hindi" | "math" | "english";
  sessionType?: "regular" | "assessment" | "review";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "exam"],
    required: true,
  },
  subject: {
    type: String,
    enum: ["hindi", "math", "english"],
    required: false,
  },
  sessionType: {
    type: String,
    enum: ["regular", "assessment", "review"],
    default: "regular",
  },
  notes: {
    type: String,
    required: false,
    maxlength: 500,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index to prevent duplicate attendance records
AttendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

// Index for efficient queries
AttendanceSchema.index({ school: 1, date: 1 });
AttendanceSchema.index({ mentor: 1, date: 1 });

const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
export default Attendance;
