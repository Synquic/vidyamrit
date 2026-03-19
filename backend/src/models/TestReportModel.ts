import mongoose, { Document } from "mongoose";

export interface ITestReport extends Document {
  student: mongoose.Types.ObjectId;
  school: mongoose.Types.ObjectId;
  program: mongoose.Types.ObjectId;
  subject: string;
  testType: "baseline" | "level_test";
  level: number;
  score: number;
  passed: boolean | null;
  action: "jump" | "assigned" | null;
  totalQuestions: number;
  correctAnswers: number;
  mentor: mongoose.Types.ObjectId;
  date: Date;
}

const TestReportSchema = new mongoose.Schema({
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
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: false,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  testType: {
    type: String,
    enum: ["baseline", "level_test"],
    required: true,
  },
  level: { type: Number, required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, default: null },
  action: { type: String, enum: ["jump", "assigned", null], default: null },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: { type: Date, default: Date.now },
});

TestReportSchema.index({ student: 1, date: -1 });
TestReportSchema.index({ school: 1 });
TestReportSchema.index({ student: 1, subject: 1 });

const TestReport = mongoose.model<ITestReport>("TestReport", TestReportSchema);
export default TestReport;
